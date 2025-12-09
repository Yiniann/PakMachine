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

  useEffect(() => {
    if (settingsQuery.data) {
      setSiteName(settingsQuery.data.siteName || "");
      setAllowRegister(settingsQuery.data.allowRegister ?? true);
      setActionDispatchToken(settingsQuery.data.actionDispatchToken || "");
      setActionWebhookSecret(settingsQuery.data.actionWebhookSecret || "");
      setWorkflowFile(settingsQuery.data.workflowFile || "build.yml");
    }
  }, [settingsQuery.data]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    updateSettings.mutate(
      { siteName, allowRegister, actionDispatchToken, actionWebhookSecret, workflowFile },
      {
        onSuccess: () => setMessage("设置已保存"),
        onError: () => setMessage("保存失败"),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">系统设置</h2>
          {settingsQuery.isLoading && <p>加载中...</p>}
          {settingsQuery.error && <p className="text-error">加载失败</p>}
          {!settingsQuery.isLoading && (
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="form-control">
                <span className="label-text">站点名称</span>
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
