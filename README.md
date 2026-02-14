# PakMachine

全栈示例：Node.js + TypeScript + Express + Prisma + MySQL 后端，React + Vite + React Query + Tailwind CSS + DaisyUI 前端。提供用户认证、角色管理与管理员面板。

## 功能概览
- 认证：注册、登录、忘记/重置密码（JWT 鉴权）。
- 角色：`role` 字段区分 `user` 与 `admin`，中间件限制管理员路由。
- 管理员 API（需 admin）：
  - `GET /admin/getUsers` 获取用户列表
  - `POST /admin/addUser` 创建用户
  - `DELETE /admin/deleteUser/:id` 删除用户
  - `PATCH /admin/changeRole` 按邮箱修改角色
  - `PATCH /admin/changePwd` 按邮箱重置密码
- 前端：
  - 登录后统一跳转 `/app/home`。
  - 受保护路由，未登录跳转登录页。
  - 管理员入口在顶部“管理”按钮，管理页包含用户列表、创建、改角色、改密码、删除（确认）等操作，界面中文。
  - 使用 React Query 管理请求状态，Tailwind + DaisyUI 提供样式。

## 快速开始（Docker）
前提：已安装 Docker / Docker Compose。

1) 一键启动  
```bash
docker compose up -d --build
```
包含三个服务：
  - `frontend`：Nginx 提供静态页，暴露 8080
  - `backend`：Node/Express，暴露 3000
  - `mysql`：内置 MySQL，账号密码在 `docker-compose.yml` 中

2) 初始化数据库（等待 mysql 日志出现 “ready for connections” 后执行）：  
```bash
docker compose exec backend npx prisma migrate deploy
# 如果还没有迁移记录，可用：docker compose exec backend npx prisma db push
```

3) 访问  
- 前端：http://localhost:8080  
- 后端接口：http://localhost:3000 （或前端同域下的 `/api` 反代路径）

> 如果要改端口或数据库密码，直接编辑 `docker-compose.yml` 后重建：`docker compose up -d --build`

## GitHub 仓库对接（Secrets/Variables）
Actions 里需要配置的 Secrets/Variables：
### Secrets（GitHub → Settings → Secrets and variables → Actions）
- `ACTION_WEBHOOK_SECRET`：后端校验 webhook 签名的密钥  
- `CF_R2_ACCESS_KEY_ID` / `CF_R2_SECRET_ACCESS_KEY` / `CF_R2_ACCOUNT_ID` / `CF_R2_BUCKET` / `CF_R2_PUBLIC_BASE`：构建产物上传到 Cloudflare R2 的凭据与公开基址（不使用 R2 可不填，会自动跳过上传）

### Variables（Actions Variables）
- `BACKEND_WEBHOOK_URL`：后端 webhook 接口地址（例如 `https://你的域名/webhooks/`，已在 Nginx 配置中反代到后端）

### 说明
- `ACTION_DISPATCH_TOKEN` **不要放在 Repository Secrets**。它是后端用来触发 GitHub Actions 的 PAT，应配置在后端环境或系统设置里：
  - 后台管理页：系统设置 → `Dispatch Token（ACTION_DISPATCH_TOKEN）`
  - 或后端环境变量：`ACTION_DISPATCH_TOKEN`
- `ACTION_DISPATCH_TOKEN` 建议设置有效期（例如 30/90/180 天），到期后需重新生成并更新后端配置；如需长期运行，请建立定期轮换流程。

对接步骤（概述）：
1) 在 GitHub 仓库 Settings → Secrets and variables → Actions，把上述键值全部填好。  
2) Nginx 已有 `location /webhooks/` 反代到后端（端口 3000），确保公网可达。  
3) 后端使用 `ACTION_WEBHOOK_SECRET` 验证签名；`BACKEND_WEBHOOK_URL` 由前端/Actions 调用。  
4) 构建产物上传依赖 CF_R2_* 变量，确保桶名称和公开地址正确。  
5) 在 Actions 里查看运行日志确认成功；若有 403/签名错误，检查 `ACTION_WEBHOOK_SECRET` 与后端保持一致。

## 目录
- `backend/` Express + Prisma 服务
- `frontend/` React Vite 客户端

## Nginx 反代模板
如需自行部署，可参考以下示例（替换域名、证书路径、artifacts 目录）：
```nginx
# 80 跳转到 HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}

# 443 反代
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # 证书路径（宝塔/自行申请后替换）
    ssl_certificate     /www/server/panel/vhost/cert/example.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/example.com/privkey.pem;
    ssl_session_timeout 10m;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Let’s Encrypt 文件验证（续期用，可选）
    location ^~ /.well-known/acme-challenge/ {
        alias /www/wwwroot/acme-challenges/;
        try_files $uri =404;
    }

    # 前端（容器 8080）
    location / {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端 API（容器 3000）
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhooks（容器 3000）
    location /webhooks/ {
        proxy_pass http://127.0.0.1:3000/webhooks/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 构建产物静态文件
    location /artifacts/ {
        alias /www/wwwroot/example.com/artifacts/;
        autoindex off;
    }
}
```
