import { Link } from "react-router-dom";
import { DeployPrincipleDiagram } from "../../components/DeployPrincipleDiagram";

const featureCards = [
  {
    title: "请求分离",
    highlight: "不仅主题面板采用前后端分离，API 请求链路也做了分离处理。",
    body: "主题侧请求先进入后端，再由后端向面板发起交互，尽可能隐藏真实调用链路，进一步降低特征暴露风险。",
  },
  {
    title: "主题自定义",
    highlight: "主题自带自定义中台，可在线实时调整配色、着陆页文案与展示内容。",
    body: "无需频繁改代码或重复打包，即可快速完成品牌风格、页面表达与内容细节的调整，让主题维护和上线流程更直接、更高效。",
  },
  {
    title: "快速构建",
    highlight: "从主题构建到正式上线，提供更顺滑的交付与落地体验。",
    body: "配合清晰的部署路径与上手流程，即使是首次接入也能更快完成配置、预览与发布，缩短从购买到可用的整体周期。",
  },
];

const LandingPage = () => {
  return (
    <div className="space-y-28 lg:space-y-32">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 pt-8 text-center sm:gap-10 sm:pt-14 lg:gap-12 lg:pt-20">
        <div className="landing-kicker">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M13 2 4.093 12.688A1 1 0 0 0 4.86 14.3H11l-1 7.7a1 1 0 0 0 1.8.71l8.107-10.687A1 1 0 0 0 19.14 10.7H13l1-7.7A1 1 0 0 0 13 2z" />
          </svg>
          Powered by Theme Build Automation
        </div>

        <h1 className="max-w-5xl text-5xl font-bold leading-[0.92] tracking-[-0.06em] text-slate-900 sm:text-6xl lg:text-8xl">
          <span className="landing-gradient-text">Shuttleits </span>
          主题交付平台
        </h1>

        <p className="max-w-4xl text-xl leading-[1.7] text-slate-500 sm:text-[2rem] sm:leading-[1.55]">
          数分钟内即可构建好你的主题应用，部署简单，前后端分离，重写API请求，为你的业务保驾护航。
        </p>

        <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-6">
          <Link to="/auth/login" className="landing-button-primary min-w-[20rem] rounded-[1.4rem] px-10 py-5 text-2xl tracking-[-0.02em] sm:min-w-[21rem]">
            开始构建
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M12.97 4.97a.75.75 0 011.06 0l6 6a.75.75 0 010 1.06l-6 6a.75.75 0 11-1.06-1.06l4.72-4.72H4.5a.75.75 0 010-1.5h13.19l-4.72-4.72a.75.75 0 010-1.06z" />
            </svg>
          </Link>
          <a
            href="#docs"
            className="landing-button-secondary min-w-[20rem] rounded-[1.4rem] px-10 py-5 text-2xl tracking-[-0.02em] sm:min-w-[21rem]"
          >
            查看工作原理
          </a>
        </div>

        <a
          id="demo"
          href="https://shuttleits.pages.dev"
          target="_blank"
          rel="noreferrer"
          className="scroll-mt-28 block w-full max-w-[68rem] rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] sm:px-8 sm:py-8 lg:mt-4"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6d6bf4] text-white shadow-[0_14px_30px_rgba(109,107,244,0.22)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-15 0v10.5a1.5 1.5 0 0 0 1.5 1.5h10.5m-12-12 2.25-2.25h10.5A1.5 1.5 0 0 1 19.5 6v10.5m-3-3 3 3m0 0 3-3m-3 3v-7.5" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-900">Shuttleits 主题预览</h2>
                <div className="mt-1 flex items-center gap-2 text-lg text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  在线预览站点
                </div>
              </div>
            </div>
            <div className="hidden rounded-full border border-[#6d6bf4]/15 bg-[#6d6bf4]/8 px-4 py-2 text-sm font-semibold text-[#5e5ce6] sm:block">
              点击打开
            </div>
          </div>

          <div className="grid gap-5 py-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[1.8rem] bg-gradient-to-r from-[#6d6bf4] via-[#7e7cf8] to-[#9795ff] px-6 py-8 text-left text-white shadow-[0_18px_36px_rgba(109,107,244,0.2)] sm:px-8 sm:py-10">
              <p className="text-sm uppercase tracking-[0.24em] text-white/75">Preview</p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em]">打开 Shuttleits 在线主题</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">
                直接查看主题首页、模块布局和整体视觉效果。
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/90">
                <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">真实主题展示</span>
                <span className="rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm">在线可访问</span>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 text-left">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#6d6bf4]">Preview URL</p>
                <p className="mt-4 text-base leading-7 text-slate-500">
                  点击卡片即可进入预览站点，直接查看主题首页、结构布局与最终视觉效果。
                </p>
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    购买前在线访问预览
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    展示主题真实效果
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-900 px-4 py-4 text-white">
                <p className="break-all text-sm text-white/80">https://shuttleits.pages.dev</p>
              </div>
            </div>
          </div>
        </a>
      </section>

      <section id="features" className="scroll-mt-28 mx-auto max-w-6xl space-y-8 lg:space-y-10">
        <div className="space-y-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Features</p>
          <h2 className="text-4xl font-bold tracking-[-0.05em] text-slate-900">主题特性展示</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {featureCards.map((item) => (
            <article key={item.title} className="landing-glass-soft rounded-[1.75rem] p-8 lg:p-9">
              <div className="mb-5 h-3 w-16 rounded-full bg-gradient-to-r from-[#6d6bf4] to-[#9a98ff]" />
              <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">{item.title}</h3>
              {item.highlight ? (
                <div className="mt-4 inline-flex rounded-2xl bg-[#6d6bf4]/10 px-4 py-2 text-base font-semibold leading-7 text-[#5e5ce6]">
                  {item.highlight}
                </div>
              ) : null}
              <p className="mt-4 text-lg leading-8 text-slate-500">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-28 mx-auto max-w-6xl rounded-[2rem] border border-slate-200 bg-white px-8 py-12 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-10 lg:px-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Pricing</p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.05em] text-slate-900">一次订阅，长期使用</h2>
            <div className="mt-6 space-y-3 text-base text-slate-600">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                <span>1 个品牌名授权</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                <span>4 个主题域名授权</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                <span>终身使用权限</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                <span>永久更新支持</span>
              </div>
            </div>
          </div>
          <div className="hidden h-20 w-px bg-slate-200 lg:block" />
          <div className="rounded-[1.75rem] border border-[#6d6bf4]/12 bg-[linear-gradient(180deg,_rgba(248,248,255,1),_rgba(242,244,255,0.88))] p-6 shadow-[0_16px_40px_rgba(109,107,244,0.08)]">
            <div className="inline-flex rounded-full bg-[#6d6bf4]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#6d6bf4]">
              Lifetime License
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-lg font-semibold text-[#6d6bf4]">$</span>
              <span className="text-5xl font-bold tracking-[-0.06em] text-slate-900">88</span>
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">usd</span>
            </div>
            <div className="mt-5 h-px bg-gradient-to-r from-[#6d6bf4]/20 via-slate-200 to-transparent" />
            <p className="mt-5 text-base leading-7 text-slate-600">
              终身订阅，永久更新。一次购买后即可持续获取后续主题更新与功能迭代，无需重复付费。
            </p>
            <a
              href="https://t.me/y1niannn"
              target="_blank"
              rel="noreferrer"
              className="landing-button-primary mt-6 rounded-2xl px-7 py-3 text-base"
            >
              联系我购买
            </a>
          </div>
        </div>
      </section>

      <section id="docs" className="scroll-mt-28 mx-auto max-w-6xl space-y-8 lg:space-y-10">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Docs</p>
          <h2 className="text-4xl font-bold tracking-[-0.05em] text-slate-900">工作原理文档</h2>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-500">
            Pro 版为订阅版本，采用前后端分离与请求分离方案；SPA 版为可选部署版本，属于单页应用，与市面上的普通主题一样主要是前后端部署分离。
          </p>
        </div>
        <DeployPrincipleDiagram />
      </section>
    </div>
  );
};

export default LandingPage;
