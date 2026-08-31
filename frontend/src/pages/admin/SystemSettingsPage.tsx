import { FormEvent, useEffect, useState } from "react";
import {
  useClientBaseStorageConfig,
  useClientSigningConfig,
  useInitializeClientSigning,
  useRotateClientBaseReleaseToken,
  useSaveClientBaseStorage,
  useSystemSettings,
  useTestClientBaseStorage,
  useUpdateSystemSettings,
} from "../../features/settings/systemSettings";

const SystemSettingsPage = () => {
  const settingsQuery = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const clientSigningQuery = useClientSigningConfig();
  const initializeClientSigning = useInitializeClientSigning();
  const clientBaseStorageQuery = useClientBaseStorageConfig();
  const saveClientBaseStorage = useSaveClientBaseStorage();
  const testClientBaseStorage = useTestClientBaseStorage();
  const rotateClientBaseReleaseToken = useRotateClientBaseReleaseToken();

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
  const [clientR2AccountId, setClientR2AccountId] = useState("");
  const [clientR2Bucket, setClientR2Bucket] = useState("");
  const [clientR2AccessKeyId, setClientR2AccessKeyId] = useState("");
  const [clientR2SecretAccessKey, setClientR2SecretAccessKey] = useState("");
  const [clientStorageMessage, setClientStorageMessage] = useState<string | null>(null);
  const [generatedReleaseToken, setGeneratedReleaseToken] = useState("");
  const [releaseTokenCopied, setReleaseTokenCopied] = useState(false);
  const [releaseRotationArmed, setReleaseRotationArmed] = useState(false);

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

  useEffect(() => {
    if (clientBaseStorageQuery.data) {
      setClientR2AccountId(clientBaseStorageQuery.data.accountId || "");
      setClientR2Bucket(clientBaseStorageQuery.data.bucket || "");
    }
  }, [clientBaseStorageQuery.data]);

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

  const saveBaseStorage = (event: FormEvent) => {
    event.preventDefault();
    setClientStorageMessage(null);
    saveClientBaseStorage.mutate(
      {
        accountId: clientR2AccountId.trim(),
        bucket: clientR2Bucket.trim(),
        accessKeyId: clientR2AccessKeyId.trim() || undefined,
        secretAccessKey: clientR2SecretAccessKey.trim() || undefined,
      },
      {
        onSuccess: () => {
          setClientR2AccessKeyId("");
          setClientR2SecretAccessKey("");
          setClientStorageMessage("R2 配置已加密保存");
        },
        onError: (error) => setClientStorageMessage(apiErrorMessage(error, "R2 配置保存失败")),
      },
    );
  };

  const testBaseStorage = () => {
    setClientStorageMessage(null);
    testClientBaseStorage.mutate(undefined, {
      onSuccess: () => setClientStorageMessage("R2 存储桶连接正常"),
      onError: (error) => setClientStorageMessage(apiErrorMessage(error, "R2 连接测试失败")),
    });
  };

  const rotateReleaseToken = () => {
    if (clientBaseStorageQuery.data?.releaseTokenConfigured && !releaseRotationArmed) {
      setReleaseRotationArmed(true);
      setClientStorageMessage("轮换后 GitHub 中的旧发布密钥会立即失效，请再次点击确认轮换");
      return;
    }
    setClientStorageMessage(null);
    setGeneratedReleaseToken("");
    setReleaseTokenCopied(false);
    rotateClientBaseReleaseToken.mutate(undefined, {
      onSuccess: (result) => {
        setGeneratedReleaseToken(result.releaseToken);
        setReleaseRotationArmed(false);
        setClientStorageMessage("发布密钥已生成，只会显示这一次");
      },
      onError: (error) => setClientStorageMessage(apiErrorMessage(error, "发布密钥生成失败")),
    });
  };

  const copyReleaseToken = async () => {
    if (!generatedReleaseToken) return;
    try {
      await navigator.clipboard.writeText(generatedReleaseToken);
      setReleaseTokenCopied(true);
    } catch {
      setClientStorageMessage("浏览器无法写入剪贴板，请手动复制发布密钥");
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

      <section className="workspace-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="workspace-kicker">Client Base Storage</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">客户端基础包存储</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              配置 ShuttleITS 读取私有 R2 基础包所需的凭证，并管理 Client 仓库使用的发布密钥。
            </p>
          </div>
          <span className={`badge badge-lg ${clientBaseStorageQuery.data?.configured ? "badge-success" : "badge-ghost"}`}>
            {clientBaseStorageQuery.data?.configured
              ? clientBaseStorageQuery.data.source === "settings" ? "后台已配置" : "环境变量已配置"
              : "未配置"}
          </span>
        </div>

        {clientBaseStorageQuery.isLoading ? (
          <div className="mt-6 flex justify-center"><span className="loading loading-spinner" /></div>
        ) : clientBaseStorageQuery.error ? (
          <div role="alert" className="workspace-alert mt-6 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            加载客户端基础包存储配置失败
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <form className="space-y-5" onSubmit={saveBaseStorage}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">Cloudflare Account ID</span>
                  <input
                    className="workspace-input input input-bordered font-mono"
                    value={clientR2AccountId}
                    onChange={(event) => setClientR2AccountId(event.target.value)}
                    placeholder="32 位 Account ID"
                    autoComplete="off"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">R2 存储桶</span>
                  <input
                    className="workspace-input input input-bordered"
                    value={clientR2Bucket}
                    onChange={(event) => setClientR2Bucket(event.target.value)}
                    placeholder="shuttle-client-base"
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">R2 Access Key ID</span>
                  <input
                    type="password"
                    className="workspace-input input input-bordered font-mono"
                    value={clientR2AccessKeyId}
                    onChange={(event) => setClientR2AccessKeyId(event.target.value)}
                    placeholder={clientBaseStorageQuery.data?.source === "settings" ? "已配置，留空保持不变" : "填写只读 Access Key ID"}
                    autoComplete="new-password"
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">R2 Secret Access Key</span>
                  <input
                    type="password"
                    className="workspace-input input input-bordered font-mono"
                    value={clientR2SecretAccessKey}
                    onChange={(event) => setClientR2SecretAccessKey(event.target.value)}
                    placeholder={clientBaseStorageQuery.data?.source === "settings" ? "已配置，留空保持不变" : "填写只读 Secret Access Key"}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <p className="text-sm leading-6 text-slate-500">
                凭证会加密保存在服务器，不会通过管理接口返回。建议使用仅允许读取
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{clientR2Bucket || "指定存储桶"}</code>
                的独立 Account API 令牌。
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="landing-button-primary rounded-2xl px-5 py-3 text-sm"
                  type="submit"
                  disabled={saveClientBaseStorage.isPending
                    || !clientR2AccountId.trim()
                    || !clientR2Bucket.trim()
                    || (clientBaseStorageQuery.data?.source !== "settings"
                      && (!clientR2AccessKeyId.trim() || !clientR2SecretAccessKey.trim()))}
                >
                  {saveClientBaseStorage.isPending ? "保存中..." : "保存 R2 配置"}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  disabled={!clientBaseStorageQuery.data?.configured || testClientBaseStorage.isPending}
                  onClick={testBaseStorage}
                >
                  {testClientBaseStorage.isPending ? "测试中..." : "测试连接"}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-200 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">基础包发布密钥</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    复制到 Shuttle Client 仓库的
                    <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">SHUTTLEITS_BASE_RELEASE_TOKEN</code>
                    Secret。服务器只保存哈希。
                  </p>
                </div>
                <span className={`badge ${clientBaseStorageQuery.data?.releaseTokenConfigured ? "badge-success" : "badge-ghost"}`}>
                  {clientBaseStorageQuery.data?.releaseTokenConfigured
                    ? clientBaseStorageQuery.data.releaseTokenSource === "settings" ? "已生成" : "来自环境变量"
                    : "未生成"}
                </span>
              </div>

              {clientBaseStorageQuery.data?.releaseTokenCreatedAt && (
                <p className="mt-3 text-xs text-slate-500">
                  最近生成：{new Date(clientBaseStorageQuery.data.releaseTokenCreatedAt).toLocaleString("zh-CN", { hour12: false })}
                </p>
              )}

              {generatedReleaseToken && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="workspace-input input input-bordered min-w-0 flex-1 font-mono text-sm"
                    value={generatedReleaseToken}
                    readOnly
                    aria-label="新生成的基础包发布密钥"
                  />
                  <button className="btn btn-outline" type="button" onClick={copyReleaseToken}>
                    {releaseTokenCopied ? "已复制" : "复制密钥"}
                  </button>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  className={releaseRotationArmed ? "btn btn-error btn-sm" : "btn btn-outline btn-sm"}
                  type="button"
                  disabled={rotateClientBaseReleaseToken.isPending}
                  onClick={rotateReleaseToken}
                >
                  {rotateClientBaseReleaseToken.isPending
                    ? "生成中..."
                    : releaseRotationArmed
                      ? "确认轮换"
                      : clientBaseStorageQuery.data?.releaseTokenConfigured ? "轮换发布密钥" : "生成发布密钥"}
                </button>
                {clientStorageMessage && <span className="text-sm text-base-content/70">{clientStorageMessage}</span>}
              </div>
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

function apiErrorMessage(error: unknown, fallback: string) {
  const responseError = error as { response?: { data?: { error?: string } } };
  return responseError.response?.data?.error || fallback;
}
