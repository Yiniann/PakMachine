import { Link } from "react-router-dom";

const DeployGuideThemePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-slate-500">
          <ul>
            <li><Link to="/app/deploy-guide">部署教程</Link></li>
            <li>主题教程</li>
          </ul>
        </div>
        <p className="workspace-kicker mt-4">Theme Deployment</p>
        <h2 className="mt-3 text-4xl font-bold text-slate-900">主题部署教程</h2>
        <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-500">
          根据前端构建时选择的版本，进入对应的部署流程。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link to="/app/deploy-guide/bff" className="workspace-card flex min-h-[220px] flex-col p-6 transition hover:border-[#6d6bf4]/30 hover:shadow-md">
          <div>
            <p className="text-sm text-slate-500">经主题后端转发</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Pro 版（BFF）</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            部署前端、主题后端与统一入口，适合需要后台管理和更强隔离的场景。
          </p>
          <span className="mt-auto pt-6 text-sm font-semibold text-[#6d6bf4]">查看 Pro 版教程 →</span>
        </Link>

        <Link to="/app/deploy-guide/spa" className="workspace-card flex min-h-[220px] flex-col p-6 transition hover:border-[#6d6bf4]/30 hover:shadow-md">
          <div>
            <p className="text-sm text-slate-500">主题前端直连</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">SPA 版（纯前端）</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            将静态产物部署到 Nginx 或宝塔，并配置面板接口反向代理。
          </p>
          <span className="mt-auto pt-6 text-sm font-semibold text-[#6d6bf4]">查看 SPA 版教程 →</span>
        </Link>
      </div>

      <section className="border-t border-slate-200 pt-6">
        <p className="workspace-kicker">Request Flow</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">不确定该选择哪一种？</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              先查看请求链路与组件关系，再返回选择对应教程。
            </p>
          </div>
          <Link to="/app/deploy-guide/principle" className="landing-button-secondary w-fit rounded-lg px-5 py-3 text-sm">
            查看工作原理
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DeployGuideThemePage;
