import { Link } from "react-router-dom";

const DeployGuidePage = () => {
  return (
    <div className="space-y-6">      
      <div className="space-y-3">
        <p className="text-xl font-medium uppercase tracking-[0.2em] text-base-content/50">搭建教程</p>
        <p className="mt-1 text-base-content/70">根据打包产物类型和部署方式查看部署教程。</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link to="/app/deploy-guide/bff" className="flex h-full flex-col rounded-2xl border border-secondary bg-secondary/5 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-base-content/60">经服务端中转</p>
              <h3 className="text-xl font-bold">Pro 版（BFF）</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-base-content/70">前端先请求 BFF 服务，再由服务端统一转发和处理，适合需要后台管理和更强隔离的场景。</p>
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-xl border border-secondary/20 bg-base-100/70 px-4 py-3 text-sm text-base-content/70">
              <span className="font-medium text-secondary">查看教程</span>
            </div>
          </div>
        </Link>

        <Link to="/app/deploy-guide/spa" className="flex h-full flex-col rounded-2xl border border-primary bg-primary/5 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-sm text-base-content/60">前端直连面板</p>
            <h3 className="text-xl font-bold">SPA 版（纯前端）</h3>
          </div>
          <p className="mt-4 text-sm text-base-content/70">浏览器直接请求面板 API，构建时只写入最小前端 env，运行时配置单独写入 `runtime-config.json`，适合传统前端部署场景。</p>
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-base-100/70 px-4 py-3 text-sm text-base-content/70">
              <span className="font-medium text-primary">查看教程</span>
            </div>
          </div>
        </Link>
        </div>
        <p className="text-xl font-medium uppercase tracking-[0.2em] text-base-content/50">工作原理</p>
        <p className="text-base-content/70">先理解 SPA 和 Pro（BFF）两种模式的请求链路，再选择对应的部署方式，后面的配置会更清楚。</p>
        <Link to="/app/deploy-guide/principle" className="flex flex-col rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-sm text-base-content/60">请求链路与部署逻辑</p>
            <h3 className="text-xl font-bold">工作原理图</h3>
          </div>
          <p className="mt-4 text-sm text-base-content/70">查看 SPA 与 Pro（BFF）的请求流转、分层关系，以及部署时各组件之间的配合方式。</p>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-base-300 bg-base-200/60 px-4 py-3 text-sm text-base-content/70">
            <span className="font-medium">查看原理</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DeployGuidePage;
