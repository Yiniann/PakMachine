import { FormEvent, useEffect, useState } from "react";
import { useSystemSettings, useUpdateSystemSettings } from "../../features/settings/systemSettings";

const SystemSettingsPage = () => {
  const settingsQuery = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();

  const [siteName, setSiteName] = useState("");
  const [allowRegister, setAllowRegister] = useState(true);
  const [actionDispatchToken, setActionDispatchToken] = useState("");
  const [actionWebhookSecret, setActionWebhookSecret] = useState("");
  const [workflowFile, setWorkflowFile] = useState("build.yml");
  const [message, setMessage] = useState<string | null>(null);
  const [mailerHost, setMailerHost] = useState("");
  const [mailerPort, setMailerPort] = useState("");
  const [mailerSecure, setMailerSecure] = useState(false);
  const [mailerUser, setMailerUser] = useState("");
  const [mailerPass, setMailerPass] = useState("");
  const [mailerFrom, setMailerFrom] = useState("");
  const [passwordResetBaseUrl, setPasswordResetBaseUrl] = useState("");

  useEffect(() => {
    if (settingsQuery.data) {
      setSiteName(settingsQuery.data.siteName || "");
      setAllowRegister(settingsQuery.data.allowRegister ?? true);
      setActionDispatchToken(settingsQuery.data.actionDispatchToken || "");
      setActionWebhookSecret(settingsQuery.data.actionWebhookSecret || "");
      setWorkflowFile(settingsQuery.data.workflowFile || "build.yml");
      setMailerHost(settingsQuery.data.mailerHost || "");
      setMailerPort(settingsQuery.data.mailerPort ? String(settingsQuery.data.mailerPort) : "");
      setMailerSecure(Boolean(settingsQuery.data.mailerSecure));
      setMailerUser(settingsQuery.data.mailerUser || "");
      setMailerPass(settingsQuery.data.mailerPass || "");
      setMailerFrom(settingsQuery.data.mailerFrom || "");
      setPasswordResetBaseUrl(settingsQuery.data.passwordResetBaseUrl || "");
    }
  }, [settingsQuery.data]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    updateSettings.mutate(
      {
        siteName,
        allowRegister,
        actionDispatchToken,
        actionWebhookSecret,
        workflowFile,
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
        <h2 className="text-3xl font-bold">系统设置</h2>
        <p className="text-base-content/70 mt-1">配置平台参数、构建密钥及邮件服务</p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {settingsQuery.isLoading && <div className="flex justify-center"><span className="loading loading-spinner" /></div>}
          {settingsQuery.error && <div role="alert" className="alert alert-error"><span>加载失败</span></div>}
          {!settingsQuery.isLoading && (
            <form className="space-y-5" onSubmit={onSubmit}>
              <label className="form-control">
                <span className="label-text">平台名称（用于展示，与用户构建站点名无关）</span>
                <input
                  className="input input-bordered"
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
                  className="input input-bordered"
                  value={actionDispatchToken}
                  onChange={(e) => setActionDispatchToken(e.target.value)}
                  placeholder="PAT，最小 workflow/repo 权限"
                />
              </label>
              <label className="form-control">
                <span className="label-text">Webhook Secret（ACTION_WEBHOOK_SECRET）</span>
                <input
                  type="password"
                  className="input input-bordered"
                  value={actionWebhookSecret}
                  onChange={(e) => setActionWebhookSecret(e.target.value)}
                  placeholder="用于校验回调签名"
                />
              </label>
              <label className="form-control">
                <span className="label-text">Workflow 文件名</span>
                <input
                  className="input input-bordered"
                  value={workflowFile}
                  onChange={(e) => setWorkflowFile(e.target.value || "build.yml")}
                  placeholder="如 build.yml"
                />
              </label>

              <div className="divider">邮件服务</div>
              <label className="form-control">
                <span className="label-text">SMTP Host</span>
                <input
                  className="input input-bordered"
                  value={mailerHost}
                  onChange={(e) => setMailerHost(e.target.value)}
                  placeholder="smtp.example.com"
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="form-control">
                  <span className="label-text">SMTP Port</span>
                  <input
                    className="input input-bordered"
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
                  className="input input-bordered"
                  value={mailerUser}
                  onChange={(e) => setMailerUser(e.target.value)}
                  placeholder="可为空，取决于服务商"
                />
              </label>
              <label className="form-control">
                <span className="label-text">SMTP 密码/密钥</span>
                <input
                  type="password"
                  className="input input-bordered"
                  value={mailerPass}
                  onChange={(e) => setMailerPass(e.target.value)}
                  placeholder="不会自动隐藏，请妥善保存文件权限"
                />
              </label>
              <label className="form-control">
                <span className="label-text">发件人（From）</span>
                <input
                  className="input input-bordered"
                  value={mailerFrom}
                  onChange={(e) => setMailerFrom(e.target.value)}
                  placeholder="PacMachine <noreply@example.com>"
                />
              </label>
              <label className="form-control">
                <span className="label-text">重置链接基础地址</span>
                <input
                  className="input input-bordered"
                  value={passwordResetBaseUrl}
                  onChange={(e) => setPasswordResetBaseUrl(e.target.value)}
                  placeholder="https://your-frontend.com/auth/reset"
                />
                <span className="text-xs text-base-content/60">用于邮件中的重置链接，留空则使用默认或环境变量 PASSWORD_RESET_BASE_URL。</span>
              </label>

              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit" disabled={updateSettings.status === "pending"}>
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
