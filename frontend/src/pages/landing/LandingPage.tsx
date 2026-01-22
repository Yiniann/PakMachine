import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="space-y-12 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-base-200 bg-base-100 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-base-100 to-base-100 opacity-70" />
        <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 grid gap-12 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-12">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Theme Builder
            </div>
            <h1
              className="text-4xl font-extrabold leading-tight tracking-tight text-base-content lg:text-6xl"
            >
              PacMachine
              <span className="mt-2 block text-2xl font-medium text-base-content/60 lg:text-3xl">让主题打包从此更轻、更快、更稳定</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-base-content/80">
              一键生成 Shuttle 主题包，集中管理品牌变量、接口与下载链接，提供 24 小时自动化构建服务。
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/app" className="btn btn-primary btn-lg shadow-lg shadow-primary/30">
                立刻开始
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                2 分钟内完成配置
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-base-content/70">
              <span className="flex items-center gap-1.5 rounded-full border border-base-200 bg-base-100/50 px-3 py-1 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary"><path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                变量控制
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-base-200 bg-base-100/50 px-3 py-1 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-secondary"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                构建隔离
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-base-200 bg-base-100/50 px-3 py-1 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                快速部署
              </span>
            </div>
          </div>
          <div className="relative rounded-2xl border border-base-200 bg-base-100/80 p-6 shadow-2xl backdrop-blur-sm lg:p-8">
            <div className="mb-6 flex items-center gap-2 border-b border-base-200 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="font-bold text-lg">交付流程</div>
            </div>
            <div className="space-y-6">
              {[
                { title: "选择模板", desc: "最新模板自动置顶，配置可复用。" },
                { title: "填写站点信息", desc: "统一品牌与 API，避免重复配置。" },
                { title: "触发构建", desc: "构建完成后可直接下载。" },
              ].map((item, index) => (
                <div key={item.title} className="flex gap-4 group">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-200 text-sm font-bold text-base-content/70 transition-colors group-hover:bg-primary group-hover:text-primary-content">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-base-content group-hover:text-primary transition-colors">{item.title}</div>
                    <div className="text-sm text-base-content/60 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "品牌一致性",
            body: "通过集中式配置，统一站点名称、Logo、主题色与下载入口，避免多处改动。",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
            )
          },
          {
            title: "构建更可控",
            body: "每次构建都绑定当前配置，支持历史回溯，便于排查问题与复用配置。",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            )
          },
          {
            title: "部署更轻量",
            body: "支持静态部署 / serverless 托管。",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
            )
          },
        ].map((item) => (
          <div key={item.title} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="card-body">
              <div className="h-12 w-12 rounded-xl bg-base-200 flex items-center justify-center text-primary mb-2">
                {item.icon}
              </div>
              <h3 className="card-title text-lg">{item.title}</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default LandingPage;
