import { Link } from "react-router-dom";

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="workspace-code">
    <code>{code}</code>
  </pre>
);

const DeployGuideSpaPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-slate-500">
          <ul>
            <li><Link to="/app/deploy-guide">部署教程</Link></li>
            <li>SPA 版（纯前端）</li>
          </ul>
        </div>
        <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">SPA 版（纯前端）部署教程</h2>
        <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-500">适用于已经从打包机下载到 SPA 静态产物，准备直接部署到 Nginx、宝塔或其它静态站点环境的场景。</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">1. 填写构建配置</h3>
              <div className="space-y-3 text-sm text-base-content/80">
                <p>在打包机的“前端构建”里，先选择 `SPA 版（纯前端）`，再填写 SPA 对应配置。</p>
                <div className="overflow-x-auto rounded-xl border border-base-200">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th className="w-40">字段</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-medium">`站点名称`</td>
                        <td>主题前端的站点名，网站标题和品牌名，通常用于页面标题和导航栏显示。在主页设置后自动获取。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`站点 Logo`</td>
                        <td>这是 SPA 构建时保留的前端环境变量之一，支持 URL 和本地图片，本地图片放到产物的 `dist` 下即可。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`面板类型`</td>
                        <td>按你的实际面板类型选择，对应 SPA 构建时的 `VITE_BACKEND_TYPE`。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`后端 API 地址`</td>
                        <td>如果使用 Nginx 反代，默认填写 `/api/v1/`；如果想直连，就要改成你自己的面板 API 地址，例如把 `https://api.example.com/api/v1/` 换成实际的面板地址。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`已绑定前端域名`</td>
                        <td>在主页设置后自动获取，要和你最终部署的前端域名保持一致。SPA 构建会把它写到 `VITE_ALLOWED_CLIENT_ORIGINS`。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`登录页背景`</td>
                        <td>这类运行时配置不再写进前端 env，而是写进产物里的 `runtime-config.json`。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`下载卡片`</td>
                        <td>下载开关和各平台下载地址会写入 `runtime-config.json`，不再通过 `VITE_DOWNLOAD_*` 注入。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`三方客服`</td>
                        <td>客服开关和脚本内容会写入 `runtime-config.json`，前端运行时再读取。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`AppleAutoPro`</td>
                        <td>相关开关、API 地址和 API Key 也会写入 `runtime-config.json`，不再通过前端 env 注入。</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>点击 开始构建 获取构建产物。SPA 版现在会把最小前端 env 写入构建结果，同时把登录背景、下载卡片、三方客服、AppleAutoPro 写进 `runtime-config.json`。如果域名、接口地址、品牌 env 发生变化，通常仍需要重新构建。</p>
              </div>
            </div>
          </section>

          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">2. 先确认拿到的是 SPA 产物</h3>
              <div className="space-y-3 text-sm text-base-content/80">
                <p>SPA 版下载包解压后，通常主要就是一个前端静态目录，核心是 `dist/`。其中运行时配置文件会一起放在 `dist` 下。</p>
                <CodeBlock code={`打包产物（通常为站点名+时间）/\n  dist/\n    runtime-config.json`} />
                <ul className="list-disc space-y-1 pl-5">
                  <li>`dist/` 是前端静态资源目录。</li>
                  <li>`runtime-config.json` 是前端运行时配置文件，包含登录背景、下载卡片、三方客服、AppleAutoPro 等内容。</li>
                  <li>这种产物只负责前端页面。</li>
                  <li>接口仍由你的面板或现有后端提供。</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">3. 在宝塔新增站点并上传产物</h3>
              <div className="rounded-xl border border-base-200 p-4 text-sm text-base-content/80">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>登录宝塔面板，进入“网站”，点击“添加站点”。</li>
                  <li>填写要绑定的前端域名，站点目录使用宝塔自动创建的目录，例如 `/www/wwwroot/你的域名`。</li>
                  <li>站点创建完成后，进入“文件”，打开这个站点目录。</li>
                  <li>把从打包机下载到的 SPA 产物压缩包上传到这个目录。</li>
                  <li>在宝塔里选中压缩包，执行“解压”。</li>
                  <li>确认解压后站点目录下能看到 `dist` 目录。</li>
                </ol>
              </div>
              <p className="text-sm text-base-content/80">后面教程里提到的“站点目录”，都可以理解成这个目录，例如 `/www/wwwroot/你的域名`。</p>
            </div>
          </section>

          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">4. 配置宝塔站点</h3>
              <div className="space-y-4 text-sm text-base-content/80">
                <div className="space-y-3">
                  <h4 className="font-semibold">1. 配置前端静态站点</h4>
                  <p>先到宝塔站点的配置文件里，把静态站点根目录指向 `dist`，并为单页应用保留路由回退。</p>
                  <div className="rounded-xl border border-base-200 p-4">
                    <p className="font-semibold">宝塔配置入口</p>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-base-content/80">
                      <li>进入宝塔面板。</li>
                      <li>打开“网站”。</li>
                      <li>找到前端域名对应的站点，点击“设置”。</li>
                      <li>进入“配置文件”页签。</li>
                      <li>在当前 `server` 块里调整 `root` 和 `location /`；如果已有旧的 `location /`，通常要一起替换。</li>
                    </ol>
                  </div>
                  <CodeBlock
                    code={`root /www/wwwroot/你的站点目录/dist;\nindex index.html;\n\nlocation / {\n    try_files $uri $uri/ /index.html;\n}`}
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">2. 配置接口转发</h4>
                  <p>SPA 版只是前端壳，接口仍然走你的面板或独立后端，所以还要在宝塔站点里补接口反向代理。</p>
                  <CodeBlock
                    code={`location /api/v1/ {\n    proxy_pass https://api.example.com/api/v1/;\n    proxy_set_header Host api.example.com;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_ssl_server_name on;\n}\n\nlocation /idhub-api/ {\n    proxy_pass https://id.example.com/;\n    proxy_set_header Host id.example.com;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_ssl_server_name on;\n}`}
                  />
                  <p>上面示例里的 `api.example.com` 和 `id.example.com` 都只是占位写法，实际部署时必须改成你自己的面板地址或对应服务地址。</p>
                  <p>具体是否需要 `/idhub-api/`，取决于你在 `runtime-config.json` 里有没有启用 AppleAutoPro 并配置对应 API 地址。</p>
                </div>
              </div>
            </div>
          </section>

          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">5. 上线后验收</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-base-200 p-4">
                  <p className="font-semibold">上线后重点检查</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/80">
                    <li>首页和登录页是否正常访问。</li>
                    <li>前端刷新子路由是否会返回 `index.html`。</li>
                    <li>`/api/v1/` 请求是否命中预期后端。</li>
                    <li>线上域名是否与构建时配置保持一致。</li>
                    <li>`runtime-config.json` 是否随产物一起发布成功。</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-base-200 p-4">
                  <p className="font-semibold">常见问题</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/80">
                    <li>页面能打开但接口失败：优先检查 `/api/v1/` 的反代和目标地址。</li>
                    <li>刷新 404：说明 Nginx 没有加 `try_files ... /index.html`。</li>
                    <li>跨域或鉴权异常：检查面板接口域名和线上前端域名是否匹配。</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-6 space-y-4">
            <div className="workspace-card-soft">
              <div className="card-body">
                <h3 className="card-title text-lg">默认流程</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-base-content/80">
                  <li>你已经从打包机下载了 SPA 产物。</li>
                  <li>在宝塔面板里新增站点并绑定正式域名。</li>
                  <li>设置反代和证书。</li>
                  <li>对接到可用的面板接口或独立后端。</li>
                </ul>
              </div>
            </div>

            <div className="workspace-card-soft">
              <div className="card-body">
                <h3 className="card-title text-lg">部署要点</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-base-content/80">
                  <li>宝塔站点目录最终要指向 `dist`。</li>
                  <li>前端刷新路由要能回退到 `index.html`。</li>
                  <li>接口域名或反代地址必须改成面板地址。</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DeployGuideSpaPage;
