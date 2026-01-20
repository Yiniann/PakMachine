import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-base-200 bg-[radial-gradient(120%_120%_at_10%_0%,#fef3c7_0%,#f0f9ff_35%,#ecfdf3_70%)] p-6 shadow-lg lg:p-10">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-200/70 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-orange-200/70 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Theme Builder
            </div>
            <h1
              className="text-4xl font-semibold leading-tight text-base-content lg:text-5xl"
              style={{ fontFamily: '"Fraunces", "Iowan Old Style", "Palatino", "Georgia", serif' }}
            >
              PacMachine
              <span className="block text-2xl font-medium text-base-content/80 lg:text-3xl">让主题打包从此更轻、更快、更稳定</span>
            </h1>
            <p className="max-w-2xl text-lg text-base-content/75">
              一键生成 Shuttle 主题包，集中管理品牌变量、接口与下载链接，24小时构建服务。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/app" className="btn btn-neutral">
                立刻开始
              </Link>
              <span className="text-sm text-base-content/60">2 分钟内完成完整配置</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-base-content/70">
              <span className="rounded-full border border-base-200 bg-base-100/70 px-3 py-1">变量控制</span>
              <span className="rounded-full border border-base-200 bg-base-100/70 px-3 py-1">构建隔离</span>
              <span className="rounded-full border border-base-200 bg-base-100/70 px-3 py-1">快速部署</span>
            </div>
          </div>
          <div className="rounded-2xl border border-base-200 bg-base-100/90 p-5 shadow-sm">
            <div className="text-sm font-semibold text-base-content/70">交付流程</div>
            <div className="mt-4 space-y-4">
              {[
                { title: "选择模板", desc: "最新模板自动置顶，配置可复用。" },
                { title: "填写站点信息", desc: "统一品牌与 API，避免重复配置。" },
                { title: "触发构建", desc: "构建完成后可直接下载。" },
              ].map((item, index) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-base-content">{item.title}</div>
                    <div className="text-sm text-base-content/70">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
         
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3 bg-transparent border-0 shadow-none">
        {[
          {
            title: "品牌一致性",
            body: "通过集中式配置，统一站点名称、Logo、主题色与下载入口，避免多处改动。",
          },
          {
            title: "构建更可控",
            body: "每次构建都绑定当前配置，支持历史回溯，便于排查问题与复用配置。",
          },
          {
            title: "部署更轻量",
            body: "支持静态部署 / serverless 托管。",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl bg-base-100 p-5 shadow-sm">
            <div className="text-lg font-semibold">{item.title}</div>
            <p className="mt-3 text-sm text-base-content/70">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default LandingPage;
