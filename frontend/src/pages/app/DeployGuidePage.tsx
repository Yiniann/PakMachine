import { Link } from "react-router-dom";

const DeployGuidePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="workspace-kicker">Deployment Guides</p>
        <h2 className="mt-3 text-4xl font-bold text-slate-900">部署教程</h2>
        <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-500">
          主题网站与客户端使用不同的部署流程，请先选择要部署的产品。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Link
          to="/app/deploy-guide/theme"
          className="workspace-card group flex min-h-[250px] flex-col p-6 transition hover:border-[#6d6bf4]/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#6d6bf4]">网站主题</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">主题部署教程</h3>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Web</span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            查看 Pro 版（BFF）与 SPA 版主题的上传、站点配置、反向代理和上线验收流程。
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5 text-sm">
            <span className="text-slate-400">包含 Pro、SPA 与工作原理</span>
            <span className="font-semibold text-[#6d6bf4]">进入教程 →</span>
          </div>
        </Link>

        <Link
          to="/app/deploy-guide/client"
          className="workspace-card group flex min-h-[250px] flex-col p-6 transition hover:border-sky-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-700">桌面与移动客户端</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">客户端部署教程</h3>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Client</span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            从品牌资料、客户中台部署和面板连接开始，直到完成 macOS、Windows 与 Android 客户端构建。
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5 text-sm">
            <span className="text-slate-400">支持 XBoard 与 XiaoV2Board</span>
            <span className="font-semibold text-sky-700">进入教程 →</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DeployGuidePage;
