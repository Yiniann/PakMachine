import { ReactNode } from "react";
import { Link } from "react-router-dom";

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="workspace-code">
    <code>{code}</code>
  </pre>
);

const StepSection = ({
  id,
  step,
  title,
  description,
  children,
}: {
  id: string;
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section id={id} className="workspace-card min-w-0 scroll-mt-24 overflow-hidden">
    <div className="card-body gap-5">
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6d6bf4] text-sm font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  </section>
);

const LocationHint = ({ path }: { path: string }) => (
  <div className="border-l-4 border-[#6d6bf4] bg-violet-50/70 px-4 py-3 text-sm text-slate-700">
    <span className="font-semibold text-slate-900">页面位置：</span>{path}
  </div>
);

const ClientDeployGuidePage = () => {
  const steps = [
    ["prepare", "准备服务器"],
    ["brand", "准备品牌资料"],
    ["package", "生成部署包"],
    ["install", "安装客户中台"],
    ["proxy", "配置域名"],
    ["activate", "初始化并连接"],
    ["bridge", "连接面板"],
    ["settings", "配置客户端"],
    ["build", "构建客户端"],
    ["verify", "上线验收"],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-slate-500">
          <ul>
            <li><Link to="/app/deploy-guide">部署教程</Link></li>
            <li>客户端教程</li>
          </ul>
        </div>
        <p className="workspace-kicker mt-4">Client Deployment</p>
        <h2 className="mt-3 text-4xl font-bold text-slate-900">客户端部署教程</h2>
        <p className="mt-2 max-w-4xl text-lg leading-8 text-slate-500">
          本教程从客户中台部署开始，带你完成面板连接和 macOS、Windows、Android 客户端构建。请按顺序操作，不要跳过连接测试。
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <StepSection
            id="prepare"
            step={1}
            title="准备一台 Linux 服务器"
            description="客户中台和客户端构建服务会运行在这台服务器上。"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["操作系统", "64 位 Linux，支持 x64 或 ARM64"],
                ["运行环境", "Docker Engine 与 Docker Compose v2"],
                ["服务器资源", "至少 2 GB 内存并配置 2 GB Swap，建议 4 GB 内存、30 GB 可用磁盘"],
                ["访问地址", "一个已解析到服务器的 HTTPS 域名"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-200 px-1 py-3">
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              2 GB 服务器可以运行，但构建速度会更慢，并且必须保留足够的 Swap。1 GB 内存余量过小，macOS 处理或 Android 构建可能被系统终止，不建议使用。
            </div>
          </StepSection>

          <StepSection
            id="brand"
            step={2}
            title="准备当前品牌的客户端资料"
            description="每个品牌的应用资料和激活凭证相互独立，切换品牌后需要分别配置。"
          >
            <LocationHint path="打包机 → 客户端构建 → 品牌客户端资料" />
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
              <li>在“品牌名字”下拉栏中选择要部署的品牌。</li>
              <li>填写发布者。应用名称跟随品牌名字，应用 ID 会在保存后自动生成。</li>
              <li>应用图标 URL 可以留空；留空时使用默认图标，填写后系统会下载并校验图标。</li>
              <li>点击“保存品牌资料”，确认状态变为“已完成”。</li>
            </ol>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">品牌名字 → 发布者 → 可选图标</p>
                <p className="mt-1 text-slate-500">先保存资料，才能生成激活凭证和部署包。</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">已完成</span>
            </div>
          </StepSection>

          <StepSection
            id="package"
            step={3}
            title="生成激活凭证和部署包"
            description="首次凭证用于连接客户中台；每个追加品牌都使用自己的凭证授权。"
          >
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
              <li>在“连接客户中台”区域点击“生成激活凭证”。凭证 30 分钟内有效，请在准备部署时再生成。</li>
              <li>复制并临时保存凭证。每张凭证只能使用一次，不要发给无关人员。</li>
              <li>在“部署客户中台”中选择服务器架构：普通 Intel/AMD 服务器选 Linux x64，ARM 服务器选 Linux ARM64。</li>
              <li>点击“生成客户端”，完成后前往“构建下载”的“客户端构建”分类下载部署包。</li>
              <li>同一账号只需部署一套客户中台。后续添加其他品牌时，只需切换品牌并生成新的激活凭证，不需要重新下载或安装部署包。</li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Link to="/app/client-build" className="landing-button-primary rounded-lg px-5 py-3 text-sm">前往客户端构建</Link>
              <Link to="/app/downloads?category=client" className="landing-button-secondary rounded-lg px-5 py-3 text-sm">前往构建下载</Link>
            </div>
          </StepSection>

          <StepSection
            id="install"
            step={4}
            title="上传并安装客户中台"
            description="将部署包上传到服务器，解压后运行包内的安装脚本。"
          >
            <p className="text-sm leading-7 text-slate-700">
              通过宝塔文件管理、SFTP 或 SCP 把下载的 <code>.tar.gz</code> 文件上传到服务器。然后回到“构建下载”的对应部署记录，复制页面显示的“服务器安装命令”并执行：
            </p>
            <CodeBlock code={`mkdir -p shuttle-client\ntar -xzf <部署包文件名>.tar.gz -C shuttle-client\ncd shuttle-client\nsudo ./install.sh`} />
            <p className="text-sm leading-7 text-slate-600">
              默认管理路径是 <code>/admin</code>。只有需要自定义时才使用 <code>sudo ./install.sh --admin-path /自定义路径</code>。安装完成后，终端会显示反向代理目标和实际管理路径。
            </p>
            <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              安装脚本需要 root 权限。重复执行安装会更新当前服务，客户中台数据保存在服务器的持久化数据目录中。
            </div>
          </StepSection>

          <StepSection
            id="proxy"
            step={5}
            title="配置 HTTPS 域名"
            description="把客户端中台域名反向代理到服务器本机的 8787 端口。"
          >
            <div className="tabs tabs-bordered" role="tablist" aria-label="域名配置方式">
              <input type="radio" name="domain-guide" role="tab" className="tab" aria-label="1Panel" defaultChecked />
              <div role="tabpanel" className="tab-content py-5">
                <h4 className="font-bold text-slate-900">1Panel：创建反向代理网站</h4>
                <LocationHint path="1Panel → 网站 → 创建网站 → 反向代理" />
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
                  <li>确认客户端中台域名已经解析到当前服务器。</li>
                  <li>进入“网站”，点击“创建网站”，网站类型选择“反向代理”。</li>
                  <li>主域名填写客户端中台域名，代理地址填写 <code>http://127.0.0.1:8787</code>，然后创建网站。</li>
                  <li>打开该网站的设置，进入“HTTPS”，选择已有证书或申请 Let's Encrypt 证书。</li>
                  <li>启用 HTTPS，并打开 HTTP 自动跳转 HTTPS。</li>
                  <li>访问 <code>https://客户端中台域名/admin</code>，确认出现初始化或登录页面。</li>
                </ol>
              </div>

              <input type="radio" name="domain-guide" role="tab" className="tab" aria-label="宝塔" />
              <div role="tabpanel" className="tab-content py-5">
                <h4 className="font-bold text-slate-900">宝塔：为网站添加反向代理</h4>
                <LocationHint path="宝塔 → 网站 → 添加站点 → 设置 → 反向代理" />
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
                  <li>确认客户端中台域名已经解析到当前服务器。</li>
                  <li>进入“网站”，点击“添加站点”，填写客户端中台域名并创建站点。</li>
                  <li>打开该站点的“设置”，进入“反向代理”，点击“添加反向代理”。</li>
                  <li>代理名称可以填写“客户端中台”，目标 URL 填写 <code>http://127.0.0.1:8787</code>，发送域名保留 <code>$host</code>。</li>
                  <li>保存后进入“SSL”，申请或选择证书，并开启“强制 HTTPS”。</li>
                  <li>访问 <code>https://客户端中台域名/admin</code>，确认出现初始化或登录页面。</li>
                </ol>
              </div>

              <input type="radio" name="domain-guide" role="tab" className="tab" aria-label="手动 Nginx" />
              <div role="tabpanel" className="tab-content py-5">
                <h4 className="font-bold text-slate-900">手动 Nginx：创建 HTTPS Server 配置</h4>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  将示例域名和证书路径替换为自己的值，把配置放入 Nginx 站点配置目录：
                </p>
                <CodeBlock
                  code={`server {\n    listen 80;\n    server_name client.example.com;\n    return 301 https://$host$request_uri;\n}\n\nserver {\n    listen 443 ssl http2;\n    server_name client.example.com;\n\n    ssl_certificate /path/to/fullchain.pem;\n    ssl_certificate_key /path/to/privkey.pem;\n\n    location / {\n        proxy_pass http://127.0.0.1:8787;\n        proxy_http_version 1.1;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}`}
                />
                <p className="mt-4 text-sm leading-7 text-slate-700">保存后检查配置并重新加载 Nginx：</p>
                <CodeBlock code={`sudo nginx -t\nsudo systemctl reload nginx`} />
                <p className="text-sm leading-7 text-slate-700">
                  最后访问 <code>https://客户端中台域名/admin</code>，确认出现初始化或登录页面。
                </p>
              </div>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>为域名申请并启用 SSL 证书，强制使用 HTTPS。</li>
              <li>不要把 8787 端口直接开放给公网。</li>
              <li>访问域名根路径返回 404 是正常现象，管理页面需要带上管理路径；默认是 <code>/admin</code>。</li>
            </ul>
          </StepSection>

          <StepSection
            id="activate"
            step={6}
            title="初始化管理帐号并连接 ShuttleITS"
            description="先用任一品牌凭证完成首次连接，再按需追加其他品牌。"
          >
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
              <li>打开 <code>https://客户端中台域名/你的管理路径</code>。</li>
              <li>首次访问会进入“初始化管理帐号”，创建仅用于当前客户中台的管理员帐号和密码。</li>
              <li>登录后打开左侧“客户端构建”。</li>
              <li>在“连接 ShuttleITS”中粘贴第 3 步生成的一次性激活凭证，然后点击“连接中台”。</li>
              <li>需要构建其他品牌时，在 ShuttleITS 为对应品牌生成凭证，再回到这里的“添加构建品牌”输入；已经绑定的品牌不会被覆盖。</li>
              <li>页面显示“已连接 ShuttleITS”和“可构建”后再继续。</li>
            </ol>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              {[
                "初始化帐号",
                "→",
                "输入激活凭证",
                "→",
                "品牌连接成功",
              ].map((item, index) => (
                <span key={`${item}-${index}`} className={index % 2 === 0 ? "border border-slate-200 bg-white px-3 py-3 text-center text-sm font-semibold text-slate-700" : "hidden text-center text-slate-400 sm:block"}>
                  {item}
                </span>
              ))}
            </div>
          </StepSection>

          <StepSection
            id="bridge"
            step={7}
            title="安装连接组件并连接面板"
            description="请按实际面板类型选择一种方式，不要混用 XBoard 与 XiaoV2Board 的安装包。"
          >
            <LocationHint path="客户端管理中心 → 面板连接" />
            <div className="tabs tabs-bordered min-w-0 max-w-full" role="tablist" aria-label="面板安装方式">
              <input type="radio" name="panel-guide" role="tab" className="tab" aria-label="XBoard" defaultChecked />
              <div role="tabpanel" className="tab-content min-w-0 max-w-full py-5">
                <h4 className="font-bold text-slate-900">XBoard：直接上传插件 ZIP</h4>
                <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
                  <li>在“面板连接”中选择 XBoard，点击“下载插件”。</li>
                  <li><strong>不要解压</strong> <code>ShuttleClientBridge.zip</code>。</li>
                  <li>进入 XBoard 后台的“系统管理 → 插件管理 → 上传插件”，直接上传 ZIP 文件。</li>
                  <li>安装并启用 <code>shuttle_client_bridge</code>。</li>
                  <li>回到客户端管理中心点击“生成”连接密钥，把同一个密钥填入插件的 <code>Bridge Secret</code> 并保存。</li>
                </ol>
              </div>

              <input type="radio" name="panel-guide" role="tab" className="tab" aria-label="XiaoV2Board" />
              <div role="tabpanel" className="tab-content min-w-0 max-w-full overflow-hidden py-5">
                <h4 className="font-bold text-slate-900">XiaoV2Board：复制 4 项文件后重新构建面板</h4>
                <p className="mt-3 break-words text-sm leading-7 text-slate-700">
                  下载并解压 <code className="break-all">ShuttleClientBridge-XiaoV2Board.zip</code>，找到包含 <code>artisan</code> 和 <code>composer.json</code> 的 XiaoV2Board 项目根目录，然后逐项复制：
                </p>
                <div className="guide-horizontal-scroll mt-4" role="region" aria-label="XiaoV2Board 文件复制路径" tabIndex={0}>
                  <table className="table table-zebra w-max min-w-full text-sm">
                    <thead><tr><th>连接包内文件</th><th>复制到面板项目</th></tr></thead>
                    <tbody>
                      <tr><td><code>payload/app/Http/Controllers/V1/ShuttleClientBridge/</code></td><td><code>app/Http/Controllers/V1/ShuttleClientBridge/</code></td></tr>
                      <tr><td><code>payload/app/Http/Routes/V1/ShuttleClientBridgeRoute.php</code></td><td><code>app/Http/Routes/V1/ShuttleClientBridgeRoute.php</code></td></tr>
                      <tr><td><code>payload/app/ShuttleClientBridge/</code></td><td><code>app/ShuttleClientBridge/</code></td></tr>
                      <tr><td><code>payload/config/shuttle_client_bridge.php</code></td><td><code>config/shuttle_client_bridge.php</code></td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">把客户端管理中心生成的连接密钥写入面板项目的 <code>.env</code>：</p>
                <CodeBlock code="SHUTTLE_CLIENT_BRIDGE_SECRET=这里替换为生成的连接密钥" />
                <p className="text-sm leading-7 text-slate-700">
                  最后按照面板原来的部署方式重新构建并启动 Docker，例如 <code>docker compose up -d --build</code>。不要删除或替换数据库、Redis 数据卷。
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h4 className="font-bold text-slate-900">保存并测试连接</h4>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
                <li>面板地址只填写首页地址，例如 <code>https://panel.example.com</code>，不要拼接 API 或插件路径。</li>
                <li>确认面板和客户端管理中心使用完全相同的连接密钥。</li>
                <li>点击“保存配置”，再点击“测试连接”。只有测试通过后才进入下一步。</li>
              </ol>
            </div>
          </StepSection>

          <StepSection
            id="settings"
            step={8}
            title="配置客户端连接和运行规则"
            description="基础连接跑通后再调整这些设置；不确定时可以先保留默认值。"
          >
            <div className="overflow-x-auto">
              <table className="table table-zebra min-w-[720px] text-sm">
                <thead><tr><th>页面</th><th>用途</th><th>是否必须</th></tr></thead>
                <tbody>
                  <tr><td className="font-semibold">客户端连接</td><td>设置客户端接口路径；需要时可生成 <code>bootstrap.dat</code> 并托管到 OSS/COS。</td><td>接口路径必须，托管可选</td></tr>
                  <tr><td className="font-semibold">客户端配置</td><td>设置公告、更新地址、客服入口等运行时内容。</td><td>按需</td></tr>
                  <tr><td className="font-semibold">路由规则</td><td>以优先添加、末尾添加或接管模式复写 sing-box 路由规则。</td><td>按需</td></tr>
                  <tr><td className="font-semibold">客户端构建</td><td>设置首次连接地址和可选的内建应急线路，然后提交构建。</td><td>构建前必须检查</td></tr>
                </tbody>
              </table>
            </div>
            <div className="border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              开启对象存储托管后，如果修改“客户端接口路径”或服务地址，需要重新生成、上传并验证新的 <code>bootstrap.dat</code>；仅修改运行时配置通常不需要重新构建客户端。
            </div>
          </StepSection>

          <StepSection
            id="build"
            step={9}
            title="构建并下载客户端"
            description="品牌字段由 ShuttleITS 提供并锁定，客户只配置当前部署需要的连接信息。"
          >
            <LocationHint path="客户端管理中心 → 客户端构建 → 构建设置" />
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">
              <li>确认页面顶部显示“已连接 ShuttleITS”。</li>
              <li>选择品牌和目标平台：macOS 仅支持 Apple Silicon，Windows 为 x64，Android 为通用包。</li>
              <li>在“客户端首次连接地址”中填写客户中台的 HTTPS 地址；多个地址时每行填写一个。</li>
              <li>需要应急线路时再开启“内建应急线路”，读取订阅并选择最多 3 个专用节点。</li>
              <li>点击“创建构建任务”，等待状态变为“构建完成”，然后下载客户端。</li>
            </ol>
            <CodeBlock code={`https://api-a.example.com\nhttps://api-b.example.com`} />
            <p className="text-sm leading-7 text-slate-600">
              多地址首次会随机选择；之后优先使用上次连接成功的地址，只有连接失败时才切换到其他地址。
            </p>

            <div className="border-t border-slate-200 pt-6">
              <div className="max-w-3xl">
                <p className="text-xs font-bold text-[#6d6bf4]">内建应急线路</p>
                <h4 className="mt-2 text-lg font-bold text-slate-900">只在客户中台全部无法直连时启用</h4>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  内建应急线路用于解决客户中台域名临时无法访问、部分网络无法解析或线路受到干扰时，客户端无法完成登录和获取配置的问题。它不是提供给最终用户使用的代理节点，也不会替代客户端中的正常代理线路。
                </p>
              </div>

              <div className="mt-5 overflow-x-auto pb-2">
                <div className="grid min-w-[760px] grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3 text-center text-sm">
                  <div className="border-y border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-900">第一轮直连</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">尝试所有客户中台地址</p>
                  </div>
                  <span className="text-slate-400">→</span>
                  <div className="border-y border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-900">第二轮直连</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">排除短暂网络抖动</p>
                  </div>
                  <span className="text-slate-400">→</span>
                  <div className="border-y border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="font-semibold text-amber-900">尝试应急节点</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">仅代理前往客户中台的请求</p>
                  </div>
                  <span className="text-slate-400">→</span>
                  <div className="border-y border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-900">连接或提示失败</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">全部不可用时停止尝试</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="border-l-4 border-[#6d6bf4] pl-4">
                  <h5 className="font-bold text-slate-900">如何配置</h5>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
                    <li>打开“内建应急线路”，粘贴 XBoard 或 XiaoV2Board 订阅地址，也可以导入 Clash YAML 或 sing-box JSON。</li>
                    <li>读取配置后，从可用节点中选择最多 3 个专用于应急连接的节点。</li>
                    <li>选择节点尝试方式，保存设置后再创建客户端构建任务。</li>
                  </ol>
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    可识别 HTTP、SOCKS、Shadowsocks、VMess、VLESS、Trojan 和 Hysteria2 节点。
                  </p>
                </div>
                <div className="border-l-4 border-slate-300 pl-4">
                  <h5 className="font-bold text-slate-900">两种尝试方式</h5>
                  <dl className="mt-2 space-y-3 text-sm leading-6">
                    <div>
                      <dt className="font-semibold text-slate-800">自动选择</dt>
                      <dd className="text-slate-600">每次启动随机排列已选节点，避免所有客户端总是集中访问同一个节点。</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-800">顺序轮换</dt>
                      <dd className="text-slate-600">严格按照管理员选择的顺序逐个尝试，适合有明确主备优先级的线路。</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="table table-zebra min-w-[720px] text-sm">
                  <thead><tr><th>流量或数据</th><th>是否经过应急线路</th><th>说明</th></tr></thead>
                  <tbody>
                    <tr><td>客户端访问客户中台</td><td className="font-semibold text-emerald-700">直连全部失败后才会</td><td>用于登录、获取节点和运行时配置等中台请求。</td></tr>
                    <tr><td>用户的正常代理流量</td><td className="font-semibold text-slate-700">不会</td><td>仍由用户在客户端选择的正常节点承载。</td></tr>
                    <tr><td>公开的 <code>bootstrap.dat</code></td><td className="font-semibold text-slate-700">不会</td><td>对象存储文件仍由客户端直接获取。</td></tr>
                    <tr><td>原始订阅地址</td><td className="font-semibold text-slate-700">不会写入客户端</td><td>订阅只由客户中台读取，最终客户端仅包含已选节点。</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                找到可用应急节点后，本次启动会继续通过该节点访问客户中台；下次重新打开客户端时，仍会优先尝试客户中台直连，只有直连再次全部失败才重新启用应急线路。
              </p>

              <div className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                <p className="font-semibold">修改应急节点后必须重新构建客户端</p>
                <p className="mt-1">应急节点会随当前品牌的客户端一起生成，修改订阅、替换节点或调整节点顺序不会自动更新已经交付的客户端。建议为应急线路建立独立套餐，并限制流量、设备数和速率，降低客户端被逆向后线路遭到滥用的风险。</p>
              </div>
            </div>
          </StepSection>

          <StepSection
            id="verify"
            step={10}
            title="完成上线验收"
            description="每个平台至少完整走一遍登录、购买和代理连接流程。"
          >
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                "客户端可以正常启动并显示正确品牌",
                "注册、登录和找回密码正常",
                "公告、套餐、订单与支付方式正常",
                "节点列表与订阅信息正常",
                "系统代理连接和断开正常",
                "TUN 模式首次授权后可以正常连接",
                "全部主地址不可用时会按预期切换",
                "重启应用后仍优先使用上次可用地址",
              ].map((item) => (
                <label key={item} className="flex items-start gap-3 border-b border-slate-100 py-2 text-sm leading-6 text-slate-700">
                  <input type="checkbox" className="checkbox checkbox-sm mt-0.5" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
              三个平台全部验收通过后再交付客户。遇到问题时，请保留失败时间、平台、客户端版本和管理中心中的任务状态，便于通过工单排查。
            </div>
          </StepSection>
        </div>

        <aside className="hidden xl:block">
          <nav className="sticky top-24 border-l border-slate-200 pl-5" aria-label="客户端部署步骤">
            <p className="mb-3 text-xs font-bold text-slate-400">部署步骤</p>
            <ol className="space-y-1">
              {steps.map(([id, label], index) => (
                <li key={id}>
                  <a href={`#${id}`} className="block py-2 text-sm text-slate-500 transition hover:text-[#6d6bf4]">
                    {index + 1}. {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default ClientDeployGuidePage;
