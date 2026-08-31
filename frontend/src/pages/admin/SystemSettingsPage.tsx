import { FormEvent, useEffect, useState } from "react";
import {
  useClientSigningConfig,
  useInitializeClientSigning,
  useSystemSettings,
  useUpdateSystemSettings,
} from "../../features/settings/systemSettings";

const SystemSettingsPage = () => {
  const settingsQuery = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const clientSigningQuery = useClientSigningConfig();
  const initializeClientSigning = useInitializeClientSigning();

  const [siteName, setSiteName] = useState("");
  const [allowRegister, setAllowRegister] = useState(true);
  const [actionDispatchToken, setActionDispatchToken] = useState("");
  const [actionWebhookSecret, setActionWebhookSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [mailerHost, setMailerHost] = useState("");
  const [mailerPort, setMailerPort] = useState("");
  const [mailerSecure, setMailerSecure] = useState(false);
  const [mailerUser, setMailerUser] = useState("");
  const [mailerPass, setMailerPass] = useState("");
  const [mailerFrom, setMailerFrom] = useState("");
  const [passwordResetBaseUrl, setPasswordResetBaseUrl] = useState("");
  const [clientControlBaseUrl, setClientControlBaseUrl] = useState("");
  const [clientSigningMessage, setClientSigningMessage] = useState<string | null>(null);
  const [clientConfigCopied, setClientConfigCopied] = useState(false);

  useEffect(() => {
    if (settingsQuery.data) {
      setSiteName(settingsQuery.data.siteName || "");
      setAllowRegister(settingsQuery.data.allowRegister ?? true);
      setActionDispatchToken(settingsQuery.data.actionDispatchToken || "");
      setActionWebhookSecret(settingsQuery.data.actionWebhookSecret || "");
      setMailerHost(settingsQuery.data.mailerHost || "");
      setMailerPort(settingsQuery.data.mailerPort ? String(settingsQuery.data.mailerPort) : "");
      setMailerSecure(Boolean(settingsQuery.data.mailerSecure));
      setMailerUser(settingsQuery.data.mailerUser || "");
      setMailerPass(settingsQuery.data.mailerPass || "");
      setMailerFrom(settingsQuery.data.mailerFrom || "");
      setPasswordResetBaseUrl(settingsQuery.data.passwordResetBaseUrl || "");
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    if (clientSigningQuery.data?.controlBaseUrl) {
      setClientControlBaseUrl(clientSigningQuery.data.controlBaseUrl);
    }
  }, [clientSigningQuery.data?.controlBaseUrl]);

  const initializeSigning = () => {
    setClientSigningMessage(null);
    setClientConfigCopied(false);
    initializeClientSigning.mutate(
      { controlBaseUrl: clientControlBaseUrl.trim() },
      {
        onSuccess: (config) => {
          setClientControlBaseUrl(config.controlBaseUrl || "");
          setClientSigningMessage(config.configured ? "客户端构建服务已就绪" : "配置尚未完成");
        },
        onError: (error) => {
          const responseError = error as { response?: { data?: { error?: string } } };
          const message = responseError.response?.data?.error || "客户端构建服务配置失败";
          setClientSigningMessage(message);
        },
      },
    );
  };

  const copyClientDevelopmentConfig = async () => {
    const config = clientSigningQuery.data;
    if (!config?.controlBaseUrl || !config.publicKeyBase64) return;
    try {
      await navigator.clipboard.writeText(
        `SHUTTLEITS_CONTROL_BASE_URL=${config.controlBaseUrl}\nSHUTTLEITS_MANIFEST_PUBLIC_KEY_BASE64=${config.publicKeyBase64}`,
      );
      setClientConfigCopied(true);
      setClientSigningMessage(null);
    } catch {
      setClientSigningMessage("浏览器无法写入剪贴板，请手动复制验签公钥");
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    updateSettings.mutate(
      {
        siteName,
        allowRegister,
        actionDispatchToken,
        actionWebhookSecret,
        mailerHost,
        mailerPort: mailerPort ? Number(mailerPort) : undefined,
        mailerSecure,
        mailerUser,
        mailerPass,
        mailerFrom,
        passwordResetBaseUrl,
      },
      {
        onSuccess: () => setMessage("设置已保存"),
        onError: () => setMessage("保存失败"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="workspace-kicker">System Settings</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">系统设置</h2>
        <p className="mt-2 text-[15px] text-slate-500">配置平台参数、构建密钥及邮件服务。</p>
      </div>

      <section className="workspace-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="workspace-kicker">Client Build Service</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">客户端构建服务</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">生成平台签名身份，供客户 BFF 验证 ShuttleITS 签发的构建清单。</p>
          </div>
          <span className={`badge badge-lg ${clientSigningQuery.data?.configured ? "badge-success" : "badge-ghost"}`}>
            {clientSigningQuery.data?.configured ? "已就绪" : "未配置"}
          </span>
        </div>

        {clientSigningQuery.isLoading ? (
          <div className="mt-6 flex justify-center"><span className="loading loading-spinner" /></div>
        ) : clientSigningQuery.error ? (
          <div role="alert" className="workspace-alert mt-6 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">加载客户端构建服务失败</div>
        ) : (
          <div className="mt-6 space-y-5">
            <label className="form-control">
              <span className="label-text">ShuttleITS 公网地址</span>
              <input
                className="workspace-input input input-bordered"
                value={clientControlBaseUrl}
                onChange={(event) => setClientControlBaseUrl(event.target.value)}
                placeholder="https://shuttleits.com"
              />
              <span className="text-xs text-base-content/60">生成 BFF 交付包时会自动写入该地址，客户无需填写。</span>
            </label>

            {clientSigningQuery.data?.publicKeyBase64 ? (
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                <div className="grid gap-1 py-3 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
                  <span className="text-sm text-slate-500">公钥指纹</span>
                  <code className="break-all text-sm text-slate-800">{clientSigningQuery.data.keyId}</code>
                </div>
                <div className="grid gap-1 py-3 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
                  <span className="text-sm text-slate-500">生成时间</span>
                  <span className="text-sm text-slate-800">
                    {clientSigningQuery.data.createdAt
                      ? new Date(clientSigningQuery.data.createdAt).toLocaleString("zh-CN", { hour12: false })
                      : "-"}
                  </span>
                </div>
                <div className="grid gap-1 py-3 md:grid-cols-[160px_minmax(0,1fr)]">
                  <span className="text-sm text-slate-500">验签公钥</span>
                  <code className="break-all text-sm leading-6 text-slate-800">{clientSigningQuery.data.publicKeyBase64}</code>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">签名身份只需生成一次。私钥仅保存在当前 ShuttleITS 服务器，不会显示或写入客户 BFF。</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="landing-button-primary rounded-2xl px-5 py-3 text-sm"
                type="button"
                disabled={initializeClientSigning.isPending || !clientControlBaseUrl.trim()}
                onClick={initializeSigning}
              >
                {initializeClientSigning.isPending
                  ? "处理中..."
                  : clientSigningQuery.data?.publicKeyBase64
                    ? "保存服务地址"
                    : "生成签名身份"}
              </button>
              {clientSigningQuery.data?.configured && (
                <button className="btn btn-outline btn-sm" type="button" onClick={copyClientDevelopmentConfig}>
                  {clientConfigCopied ? "已复制" : "复制开发连接配置"}
                </button>
              )}
              {clientSigningMessage && <span className="text-sm text-base-content/70">{clientSigningMessage}</span>}
            </div>
          </div>
        )}
      </section>

      <div className="workspace-card p-6">
        <div>
          {settingsQuery.isLoading && <div className="flex justify-center"><span className="loading loading-spinner" /></div>}
          {settingsQuery.error && <div role="alert" className="workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"><span>加载失败</span></div>}
          {!settingsQuery.isLoading && (
            <form className="space-y-5" onSubmit={onSubmit}>
              <label className="form-control">
                <span className="label-text">平台名称（用于展示，与用户构建站点名无关）</span>
                <input
                  className="workspace-input input input-bordered"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="用于展示的站点名称"
                />
              </label>

              <label className="form-control">
                <span className="label-text">注册开放</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={allowRegister}
                    onChange={(e) => setAllowRegister(e.target.checked)}
                  />
                  <span className="text-sm text-base-content/70">{allowRegister ? "允许注册" : "关闭注册"}</span>
                </div>
              </label>

              <div className="divider">GitHub Actions</div>
              <label className="form-control">
                <span className="label-text">Dispatch Token（ACTION_DISPATCH_TOKEN）</span>
                <input
                  type="password"
                  className="workspace-input input input-bordered"
                  value={actionDispatchToken}
                  onChange={(e) => setActionDispatchToken(e.target.value)}
                  placeholder="PAT，最小 workflow/repo 权限"
                />
              </label>
              <label className="form-control">
                <span className="label-text">Webhook Secret（ACTION_WEBHOOK_SECRET）</span>
                <input
                  type="password"
                  className="workspace-input input input-bordered"
                  value={actionWebhookSecret}
                  onChange={(e) => setActionWebhookSecret(e.target.value)}
                  placeholder="用于校验回调签名"
                />
              </label>
              <div className="divider">邮件服务</div>
              <label className="form-control">
                <span className="label-text">SMTP Host</span>
                <input
                  className="workspace-input input input-bordered"
                  value={mailerHost}
                  onChange={(e) => setMailerHost(e.target.value)}
                  placeholder="smtp.example.com"
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="form-control">
                  <span className="label-text">SMTP Port</span>
                  <input
                    className="workspace-input input input-bordered"
                    type="number"
                    min={1}
                    value={mailerPort}
                    onChange={(e) => setMailerPort(e.target.value)}
                    placeholder="465 / 587"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">加密 (TLS/SSL)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={mailerSecure}
                      onChange={(e) => setMailerSecure(e.target.checked)}
                    />
                    <span className="text-sm text-base-content/70">{mailerSecure ? "启用" : "关闭"}</span>
                  </div>
                </label>
              </div>
              <label className="form-control">
                <span className="label-text">SMTP 用户名</span>
                <input
                  className="workspace-input input input-bordered"
                  value={mailerUser}
                  onChange={(e) => setMailerUser(e.target.value)}
                  placeholder="可为空，取决于服务商"
                />
              </label>
              <label className="form-control">
                <span className="label-text">SMTP 密码/密钥</span>
                <input
                  type="password"
                  className="workspace-input input input-bordered"
                  value={mailerPass}
                  onChange={(e) => setMailerPass(e.target.value)}
                  placeholder="不会自动隐藏，请妥善保存文件权限"
                />
              </label>
              <label className="form-control">
                <span className="label-text">发件人（From）</span>
                <input
                  className="workspace-input input input-bordered"
                  value={mailerFrom}
                  onChange={(e) => setMailerFrom(e.target.value)}
                  placeholder="PacMachine <noreply@example.com>"
                />
              </label>
              <label className="form-control">
                <span className="label-text">重置链接基础地址</span>
                <input
                  className="workspace-input input input-bordered"
                  value={passwordResetBaseUrl}
                  onChange={(e) => setPasswordResetBaseUrl(e.target.value)}
                  placeholder="https://your-frontend.com/auth/reset"
                />
                <span className="text-xs text-base-content/60">用于邮件中的重置链接，留空则使用默认或环境变量 PASSWORD_RESET_BASE_URL。</span>
              </label>

              <div className="flex gap-2">
                <button className="landing-button-primary rounded-2xl px-5 py-3 text-sm" type="submit" disabled={updateSettings.status === "pending"}>
                  {updateSettings.status === "pending" ? "保存中..." : "保存设置"}
                </button>
                {message && <span className="text-sm text-base-content/70">{message}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
