# Shuttle 部署教程

本文基于仓库当前两种打包方式编写：

- `legacy`：仅打包前端静态站点
- `bff`：同时打包前端静态站点和 Next.js BFF 服务

打包入口定义见根目录 [package.json](/Users/yinian/Code/Shuttle FullStack/package.json)：

```bash
pnpm package:legacy
pnpm package:bff
```

## 1. 部署前准备

### 1.1 环境要求

- Node.js 22 及以上
- pnpm 10
- Linux 服务器
- `rsync`、`tar`

如果使用 `bff` 的 PM2 方式，还需要：

- Node.js 22 运行环境
- PM2

如果使用 `bff` 的 Docker 方式，还需要：

- Docker
- Docker Compose

### 1.2 环境变量准备

#### `legacy` 模式

打包前需要准备前端环境文件：

文件位置：

```text
apps/mimi-airport/.env
```

可参考模板：

```text
apps/mimi-airport/.env.template
```

至少应确认以下项：

- `VITE_API_MODE=legacy`
- `VITE_PROD_API_URL`
- `VITE_ALLOWED_CLIENT_ORIGINS`
- `VITE_BACKEND_TYPE`
- `VITE_IDHUB_API_URL`
- 站点名称、Logo、下载地址等品牌配置

#### `bff` 模式

需要同时准备前端和服务端环境文件。

前端文件位置：

```text
apps/mimi-airport/.env
```

建议至少确认：

- `VITE_API_MODE=bff`
- `VITE_ALLOWED_CLIENT_ORIGINS`
- 站点展示相关变量

服务端文件位置：

```text
apps/shuttle-next/.env.local
```

建议至少包含：

- `PANEL_BASE_URL`
- `IDHUB_BASE_URL`（若启用 IDHub）
- `IDHUB_AUTH_TOKEN`（若启用 IDHub）
- `ADMIN_BASE_PATH`（可选，默认 `/admin`）

`pnpm package:bff` 会把 `apps/shuttle-next/.env.local` 自动复制到：

```text
release/bff/server/standalone/apps/shuttle-next/.env.local
```

## 2. `legacy` 部署教程

### 2.1 适用场景

适合以下情况：

- 只部署前端静态页面
- 后端 API 仍由现有面板或独立服务提供
- 使用 Nginx、宝塔、对象存储、CDN 等静态托管

### 2.2 本地打包

在仓库根目录执行：

```bash
pnpm install
pnpm package:legacy
```

打包完成后会生成：

```text
release/legacy/
release/legacy.tar.gz
```

其中真正需要部署的是：

```text
release/legacy/dist/
```

### 2.3 上传到服务器

示例：

```bash
scp release/legacy.tar.gz user@your-server:/tmp/
```

登录服务器后解压：

```bash
mkdir -p /www/wwwroot/shuttle-legacy
tar -xzf /tmp/legacy.tar.gz -C /www/wwwroot/shuttle-legacy
```

解压后目录结构类似：

```text
/www/wwwroot/shuttle-legacy/
  dist/
```

### 2.4 配置 Nginx

站点根目录指向：

```text
/www/wwwroot/shuttle-legacy/dist
```

推荐配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /www/wwwroot/shuttle-legacy/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

如果你的 API 仍走独立后端，可继续追加反向代理，例如：

```nginx
location /api/v1/ {
    proxy_pass https://api.example.com/api/v1/;
    proxy_set_header Host api.example.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_ssl_server_name on;
}

location /idhub-api/ {
    proxy_pass https://id.example.com/;
    proxy_set_header Host id.example.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_ssl_server_name on;
}
```

### 2.5 验收

上线后重点检查：

- 首页和登录页是否正常访问
- 前端刷新子路由是否返回 `index.html`
- `/api/v1/` 请求是否命中预期后端
- `VITE_ALLOWED_CLIENT_ORIGINS` 是否与线上域名匹配

## 3. `bff` 部署教程

### 3.1 适用场景

适合以下情况：

- 前端统一通过本项目 BFF 提供 `/api/*`
- 需要使用 `/admin` 管理台
- 希望前端和服务端一起交付

### 3.2 本地打包

在仓库根目录执行：

```bash
pnpm install
pnpm package:bff
```

打包完成后会生成：

```text
release/bff/
release/bff.tar.gz
```

目录结构如下：

```text
release/bff/
  frontend/
    dist/
  server/
    standalone/
    start.sh
    ecosystem.config.cjs
  docker/
  docker-compose.yml
```

说明：

- `frontend/dist` 是前端静态资源
- `server/standalone` 是 Next.js standalone 运行产物
- `server/start.sh` 是服务启动入口
- `docker-compose.yml` 是容器化部署入口

### 3.3 上传到服务器

示例：

```bash
scp release/bff.tar.gz user@your-server:/tmp/
```

登录服务器后解压：

```bash
mkdir -p /srv/shuttle-bff
tar -xzf /tmp/bff.tar.gz -C /srv/shuttle-bff
```

解压后目录结构类似：

```text
/srv/shuttle-bff/
  frontend/
  server/
  docker/
  docker-compose.yml
```

### 3.4 方式一：PM2 部署

这种方式适合服务器上已经统一使用 Node.js + PM2 管理进程。

进入服务目录：

```bash
cd /srv/shuttle-bff/server
```

首次启动：

```bash
pm2 start ecosystem.config.cjs
```

重启：

```bash
pm2 restart shuttle-bff
```

开机自启：

```bash
pm2 save
pm2 startup
```

默认监听：

- 地址：`0.0.0.0`
- 端口：`3000`

如需调整，可在启动前设置：

```bash
export PORT=3000
export BFF_HOSTNAME=0.0.0.0
```

然后再执行 PM2 启动命令。

前端静态资源可由 Nginx 直接托管，根目录指向：

```text
/srv/shuttle-bff/frontend/dist
```

Nginx 推荐配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /srv/shuttle-bff/frontend/dist;
    index index.html;

    location = /admin {
        proxy_pass http://127.0.0.1:3000/admin;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /admin/ {
        proxy_pass http://127.0.0.1:3000/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /_next/ {
        proxy_pass http://127.0.0.1:3000/_next/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

如果你在 `apps/shuttle-next/.env.local` 中设置了自定义 `ADMIN_BASE_PATH`，需要把上面的 `/admin` 同步替换成相同路径。

### 3.5 方式二：Docker Compose 部署

这种方式适合希望将网关、前端和 BFF 一起容器化部署。

进入发布目录：

```bash
cd /srv/shuttle-bff
```

启动：

```bash
docker compose up -d --build
```

停止：

```bash
docker compose down
```

默认对外端口：

```text
8081
```

如需修改端口，可在启动前设置：

```bash
export SHUTTLE_HTTP_PORT=80
docker compose up -d --build
```

Docker 方式内置三个服务：

- `gateway`：Nginx 网关，统一入口
- `frontend`：静态前端
- `bff`：Next.js BFF

请求转发逻辑：

- `/` -> `frontend`
- `/api/*` -> `bff`
- `/_next/*` -> `bff`
- `/admin*` -> `bff`

如果设置了自定义 `ADMIN_BASE_PATH`，打包脚本也会把该路径同步写入容器网关配置。

### 3.6 验收

上线后重点检查：

- `/` 首页是否正常打开
- `/api/site/config`、`/api/settings` 是否返回正常
- `/admin` 是否能访问并登录
- 前端页面请求是否已从 `legacy` 模式切到 `bff` 模式
- 服务端 `.env.local` 是否已随包发布到正确位置

## 4. 两种模式如何选择

选择 `legacy`：

- 你只需要前端站点
- 现有后端已经稳定，不需要 BFF 中转
- 希望部署最简单

选择 `bff`：

- 你需要统一 API 聚合层
- 你需要 `/admin` 管理台
- 你希望前端和服务端作为一套完整产物交付

## 5. 常见问题

### 5.1 `legacy` 页面能打开，但接口请求失败

通常是以下原因：

- `VITE_PROD_API_URL` 配置错误
- Nginx 没有转发 `/api/v1/`
- `VITE_ALLOWED_CLIENT_ORIGINS` 未包含线上域名

### 5.2 `bff` 页面能打开，但 `/api/*` 返回 500

优先检查：

- `apps/shuttle-next/.env.local` 是否正确
- `PANEL_BASE_URL` 是否可访问
- `IDHUB_BASE_URL` / `IDHUB_AUTH_TOKEN` 是否缺失

### 5.3 `bff` 的管理台路径不是 `/admin`

请在打包前设置：

```bash
ADMIN_BASE_PATH=/your-admin-path
```

并写入：

```text
apps/shuttle-next/.env.local
```

然后重新执行：

```bash
pnpm package:bff
```
