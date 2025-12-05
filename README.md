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

## 快速开始
1) 安装依赖  
```bash
npm install --prefix backend
npm install --prefix frontend
```
2) 配置环境变量：复制 `backend/.env.example` 为 `backend/.env` 并填好数据库/JWT。
3) 初始化数据库（确保 MySQL 运行中）：  
```bash
npm run prisma:migrate --prefix backend -- --name init
```
4) 开发启动（前后端并行）：  
```bash
npm run dev   # 根目录
```
前端默认端口 5173+，后端默认 3000。

## 目录
- `backend/` Express + Prisma 服务
- `frontend/` React Vite 客户端
