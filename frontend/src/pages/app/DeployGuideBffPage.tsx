import { Link } from "react-router-dom";

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="workspace-code">
    <code>{code}</code>
  </pre>
);

const DeployGuideBffPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-slate-500">
          <ul>
            <li><Link to="/app/deploy-guide">部署教程</Link></li>
            <li>Pro 版（BFF）</li>
          </ul>
        </div>
        <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">Pro 版（BFF）部署教程</h2>
        <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-500">适用于已经从打包机下载到 BFF 产物包，准备把前端和 BFF 一起部署到服务器的场景。</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">1. 填写构建配置</h3>
              <div className="space-y-3 text-sm text-base-content/80">
                <p>在 打包机 的“前端构建”里，先选择 `Pro 版（BFF）`，再填写 BFF 对应配置。</p>
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
                        <td className="font-medium">`站点 Logo`、`登录页背景`</td>
                        <td>支持 URL 和本地图片，本地图片放到产物的 `frontend/dist` 下即可。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`面板地址`</td>
                        <td>填写你的面板基础地址，例如 `https://proxy.xxx.com`，不要填前端域名。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`管理中台路径`</td>
                        <td>此为主题的管理中台，默认是 `/admin`。</td>
                      </tr>
                      <tr>
                        <td className="font-medium">`已绑定前端域名`</td>
                        <td>在主页设置后自动获取。</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>点击 开始构建 获取构建产物</p>
              </div>
            </div>
          </section>

          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">2. 先确认拿到的是 BFF 产物</h3>
              <div className="space-y-3 text-sm text-base-content/80">
                <p>Pro 版（BFF）下载包解压后，通常会同时包含前端静态文件、服务端运行文件和 Docker 网关配置，而不是只有一个 `dist` 目录。</p>
                <p>常见结构类似：</p>
                <CodeBlock
                  code={`打包产物（通常为站点名+时间）/\n  frontend/\n  server/\n  docker/\n    frontend/\n    gateway/\n    server/\n  docker-compose.yml`}
                />
                <ul className="list-disc space-y-1 pl-5">
                  <li>`frontend/` 是前端静态资源目录。</li>
                  <li>`server/` 是 BFF 服务运行目录。</li>
                  <li>`docker/` 是容器化部署相关文件，其中会拆分 `frontend`、`gateway`、`server` 三部分配置。</li>
                  <li>`docker-compose.yml` 会把 `gateway`、`frontend`、`bff` 这些服务一起编排起来。</li>
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
                  <li>把从打包机下载到的 BFF 产物压缩包上传到这个目录。</li>
                  <li>在宝塔里选中压缩包，执行“解压”。</li>
                  <li>确认解压后站点目录下能看到 `frontend`、`server`、`docker`、`docker-compose.yml` 这些内容。</li>
                </ol>
              </div>
              <p className="text-sm text-base-content/80">后面教程里提到的“部署目录”，都可以理解成这个站点目录，例如 `/www/wwwroot/你的域名`。</p>
            </div>
          </section>

          <section className="workspace-card">
            <div className="card-body space-y-4">
              <h3 className="card-title text-xl">4. 选择部署方式</h3>
              <div className="space-y-4 text-sm text-base-content/80">
                <div className="collapse collapse-arrow border border-secondary bg-secondary/5">
                  <input type="checkbox" />
                  <div className="collapse-title pr-10">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold">方式一：一键 Docker 部署</h4>
                      <span className="badge badge-secondary">推荐</span>
                    </div>
                    <p className="mt-2 text-sm font-normal text-base-content/80">推荐直接运行打包产物根目录下自带的一键部署脚本 `deploy.sh`，脚本会自动完成容器拉起和服务编排。这样就不需要手动输入 `docker compose`，只需要在产物目录下执行一次脚本即可。</p>
                  </div>
                  <div className="collapse-content space-y-4">
                    <div className="space-y-3">
                      <h5 className="font-semibold">1. 执行一键部署脚本</h5>
                      <p>进入部署目录后，直接运行脚本即可，脚本内部会自动处理 Docker 启动和编排：</p>
                      <CodeBlock code={`cd /www/wwwroot/你的部署目录\nbash ./deploy.sh`} />
                      <p className="text-sm text-base-content/80">选择首次安装后，会提示输入端口号，直接回车使用默认端口 `8081`，或者输入你想要的端口。</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>`gateway`：统一入口，负责转发 `/`、`/api/*`、`/_next/*` 和管理台路径。</li>
                        <li>`frontend`：提供静态前端资源。</li>
                        <li>`bff`：提供 Next.js BFF 服务。</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-semibold">2. 配置宝塔站点 Nginx</h5>
                      <p>接下来到这个站点的 Nginx 配置文件里按下面顺序调整：先删除默认缓存规则，再补把正式域名请求统一转发到 Docker `gateway` 的配置。</p>
                      <div className="rounded-xl border border-base-200 p-4">
                        <p className="font-semibold">宝塔配置入口</p>
                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-base-content/80">
                          <li>进入宝塔面板。</li>
                          <li>打开“网站”。</li>
                          <li>找到前端域名对应的站点，点击“设置”。</li>
                          <li>进入“配置文件”页签。</li>
                          <li>在站点现有配置里找到原本的 `location /` 段，直接替换成下面这段；如果没有 `location /`，就把这段加到 `server` 块内部。</li>
                        </ol>
                      </div>
                      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                        <p className="font-semibold">先删除这两段默认缓存规则</p>
                        <p className="mt-2 text-sm text-base-content/80">如果站点当前配置里已经带了下面这两段按文件后缀缓存的 `location`，先删掉，避免静态资源请求被 Nginx 提前拦截，不走 `gateway`。</p>
                        <div className="mt-3">
                          <CodeBlock
                            code={`location ~ .*\\.(gif|jpg|jpeg|png|bmp|swf)$\n{\n    expires 30d;\n    error_log /dev/null;\n    access_log /dev/null;\n}\n\nlocation ~ .*\\.(js|css)?$\n{\n    expires 12h;\n    error_log /dev/null;\n    access_log /dev/null; \n}`}
                          />
                        </div>
                      </div>
                      <div className="rounded-xl border border-base-200 p-4">
                        <p className="font-semibold">再补下面这段 Nginx 配置</p>
                        <p className="mt-2 text-sm text-base-content/80">删除完成后，再把域名请求统一转发到 Docker 暴露出来的 `gateway` 端口，例如转发到默认端口为 8081（取决于你在一键脚本里设置的对外端口）。</p>
                        <div className="mt-3">
                          <CodeBlock
                            code={`location / {\n    proxy_pass http://127.0.0.1:8081;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}`}
                          />
                        </div>
                      </div>
                      <p>路径分发由容器里的 `gateway` 继续处理，你不需要在宝塔站点的 Nginx 配置里再单独拆 `/api`、`/admin`、`/_next`，也不用去改宝塔自动生成的 `server`、SSL 等外层配置。</p>
                    </div>
                  </div>
                </div>

                <div className="collapse collapse-arrow border border-base-200 bg-base-100">
                  <input type="checkbox" />
                  <div className="collapse-title">
                    <h4 className="text-lg font-semibold">方式二：PM2 部署 BFF</h4>
                    <p className="mt-2 text-sm font-normal text-base-content/80">PM2 方案适合不能使用 Docker、或者更习惯直接跑 Node 服务的服务器环境。这个方案不会使用 Docker 的 `gateway` 容器，而是改由宝塔站点的 Nginx 负责路由分发；如果你自定义了 `ADMIN_BASE_PATH`，也需要在反代规则里同步调整。</p>
                  </div>
                  <div className="collapse-content space-y-4">
                    <div className="space-y-3">
                      <h5 className="font-semibold">1. 启动 PM2 服务</h5>
                      <p>进入 `server` 目录后启动 BFF：</p>
                      <CodeBlock code={`cd /www/wwwroot/你的部署目录/server\npm2 start ecosystem.config.cjs\npm2 restart 你的服务名\npm2 save\npm2 startup`} />
                      <p>默认通常监听 `0.0.0.0:3000`。如需调整，可在启动前设置：</p>
                      <CodeBlock code={`export PORT=3000\nexport BFF_HOSTNAME=0.0.0.0`} />
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-semibold">2. 配置宝塔站点 Nginx</h5>
                      <p>接下来在宝塔站点的 Nginx 配置文件里按下面顺序调整：先删除默认缓存规则，再补前端静态目录和 BFF 路由分发规则。</p>
                      <div className="rounded-xl border border-base-200 p-4">
                        <p className="font-semibold">宝塔配置入口</p>
                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-base-content/80">
                          <li>进入宝塔面板。</li>
                          <li>打开“网站”。</li>
                          <li>找到前端域名对应的站点，点击“设置”。</li>
                          <li>进入“配置文件”页签。</li>
                          <li>在站点当前的 `server` 块里，按下面示例调整 `root` 和各个 `location`；如果已有旧的 `location /`，通常需要一起替换，避免冲突。</li>
                        </ol>
                      </div>
                      <div className="rounded-xl border border-base-200 p-4">
                        <p className="font-semibold">补下面这段 Nginx 配置</p>
                        <p className="mt-2 text-sm text-base-content/80">把前端静态目录和 BFF 路由规则补进当前站点的 `server` 块里。</p>
                        <div className="mt-3">
                          <CodeBlock
                            code={`root /www/wwwroot/你的部署目录/frontend/dist;\nindex index.html;\n\nlocation = /admin {\n    proxy_pass http://127.0.0.1:3000/admin;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}\n\nlocation ^~ /admin/ {\n    proxy_pass http://127.0.0.1:3000/admin/;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}\n\nlocation ^~ /api/ {\n    proxy_pass http://127.0.0.1:3000/api/;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}\n\nlocation ^~ /_next/ {\n    proxy_pass http://127.0.0.1:3000/_next/;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n}\n\nlocation / {\n    try_files $uri $uri/ /index.html;\n}`}
                          />
                        </div>
                      </div>
                      <p>如果你自定义了 `ADMIN_BASE_PATH`，记得把示例里的 `/admin` 全部替换成你的实际路径。</p>
                    </div>
                  </div>
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
                    <li>`/` 首页是否正常打开。</li>
                    <li>`/api/site/config`、`/api/settings` 是否返回正常。</li>
                    <li>`/admin` 是否能访问并登录。</li>
                    <li>前端请求是否已经走 BFF，而不是直连旧接口。</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-base-200 p-4">
                  <p className="font-semibold">常见问题</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-base-content/80">
                    <li>管理台路径不是 `/admin`：检查 `ADMIN_BASE_PATH` 与 Nginx 配置是否一致。</li>
                    <li>静态资源 404：检查 `frontend/dist` 根目录是否配置正确。</li>
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
                  <li>你已经从打包机下载了 Pro 版产物，并带有位于产物根目录的一键部署脚本。</li>
                  <li>在宝塔面板里新增站点并绑定正式域名。</li>
                  <li>服务器可运行 Docker 或 Node.js + PM2。</li>
                  <li>根据不同部署方式做好反代和ssl证书。</li>
                </ul>
              </div>
            </div>

            <div className="workspace-card-soft">
              <div className="card-body">
                <h3 className="card-title text-lg">部署要点</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-base-content/80">
                  <li>推荐优先使用 Docker 方式，由 `gateway` 统一转发请求。</li>
                  <li>宝塔站点里需要绑定正式域名，并补对应的反代配置。</li>
                  <li>如果使用 PM2，自定义的 `ADMIN_BASE_PATH` 需要同步改到反代规则里。</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DeployGuideBffPage;
