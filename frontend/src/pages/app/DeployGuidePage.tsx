import { Link } from "react-router-dom";

const DeployGuidePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-base-content/60">
          <ul>
            <li>部署教程</li>
          </ul>
        </div>
        <p className="mt-1 text-base-content/70">根据打包产物类型和部署方式查看部署教程。</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link to="/app/downloads/deploy-guide/bff" className="rounded-2xl border border-secondary bg-secondary/5 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">经服务端中转</p>
              <h3 className="text-xl font-bold">Pro 版（BFF）</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-base-content/70">前端先请求 BFF 服务，再由服务端统一转发和处理，适合需要后台管理和更强隔离的场景。</p>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-secondary/20 bg-base-100/70 px-4 py-3 text-sm text-base-content/70">
            <span className="font-medium text-secondary">查看教程</span>
          </div>
        </Link>

        <Link to="/app/downloads/deploy-guide/spa" className="rounded-2xl border border-primary bg-primary/5 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-sm text-base-content/60">前端直连面板</p>
            <h3 className="text-xl font-bold">SPA 版（纯前端）</h3>
          </div>
          <p className="mt-4 text-sm text-base-content/70">浏览器直接请求面板 API，构建时写入前端环境变量，适合传统前端部署场景。</p>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-primary/20 bg-base-100/70 px-4 py-3 text-sm text-base-content/70">
            <span className="font-medium text-primary">查看教程</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DeployGuidePage;
