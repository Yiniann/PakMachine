import { Link } from "react-router-dom";

const DeployGuidePage = () => {
  return (
    <div className="space-y-6">      
      <div className="space-y-4">
        <p className="workspace-kicker">Deploy Docs</p>
        <h2 className="text-4xl font-bold tracking-[-0.05em] text-slate-900">部署教程</h2>
        <p className="max-w-3xl text-lg leading-8 text-slate-500">根据打包产物类型和部署方式查看部署教程。</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link to="/app/deploy-guide/bff" className="workspace-card flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">经服务端中转</p>
              <h3 className="text-xl font-bold text-slate-900">Pro 版（BFF）</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">前端先请求 BFF 服务，再由服务端统一转发和处理，适合需要后台管理和更强隔离的场景。</p>
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-xl border border-[#6d6bf4]/12 bg-white/80 px-4 py-3 text-sm text-slate-500">
              <span className="font-medium text-[#6d6bf4]">查看教程</span>
            </div>
          </div>
        </Link>

        <Link to="/app/deploy-guide/spa" className="workspace-card flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-sm text-slate-500">前端直连面板</p>
            <h3 className="text-xl font-bold text-slate-900">SPA 版（纯前端）</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">浏览器直接请求面板 API，构建时只写入最小前端 env，运行时配置单独写入 `runtime-config.json`，适合传统前端部署场景。</p>
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-xl border border-[#6d6bf4]/12 bg-white/80 px-4 py-3 text-sm text-slate-500">
              <span className="font-medium text-[#6d6bf4]">查看教程</span>
            </div>
          </div>
        </Link>
        </div>
        <p className="workspace-kicker pt-2">Request Flow</p>
        <p className="text-lg leading-8 text-slate-500">先理解 SPA 和 Pro（BFF）两种模式的请求链路，再选择对应的部署方式，后面的配置会更清楚。</p>
        <Link to="/app/deploy-guide/principle" className="workspace-card flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-sm text-slate-500">请求链路与部署逻辑</p>
            <h3 className="text-xl font-bold text-slate-900">工作原理图</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">查看 SPA 与 Pro（BFF）的请求流转、分层关系，以及部署时各组件之间的配合方式。</p>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#6d6bf4]/12 bg-white/80 px-4 py-3 text-sm text-slate-500">
            <span className="font-medium text-[#6d6bf4]">查看原理</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DeployGuidePage;
