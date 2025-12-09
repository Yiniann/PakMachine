import { FormEvent, useState } from "react";
import { useInitStatus, useInitializeSystem, useSaveDatabaseUrl } from "../features/init/init";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const InitPage = () => {
  const status = useInitStatus();
  const initMutation = useInitializeSystem();
  const saveDbMutation = useSaveDatabaseUrl();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [allowRegister, setAllowRegister] = useState(true);
  const [dbHost, setDbHost] = useState("localhost");
  const [dbPort, setDbPort] = useState("3306");
  const [dbName, setDbName] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbMessage, setDbMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasDbConfigInput = () =>
    dbName.trim() !== "" ||
    dbUser.trim() !== "" ||
    dbPassword.trim() !== "" ||
    dbHost.trim() !== "localhost" ||
    dbPort.trim() !== "3306";

  const buildDatabaseUrl = () => {
    if (!hasDbConfigInput()) return "";
    if (!dbHost.trim() || !dbName.trim() || !dbUser.trim() || !dbPassword.trim()) {
      return "";
    }
    const port = dbPort.trim() || "3306";
    const encodedUser = encodeURIComponent(dbUser.trim());
    const encodedPassword = encodeURIComponent(dbPassword.trim());
    return `mysql://${encodedUser}:${encodedPassword}@${dbHost.trim()}:${port}/${dbName.trim()}`;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const usingCustomDb = hasDbConfigInput();
    const builtDatabaseUrl = buildDatabaseUrl();
    if (usingCustomDb && !builtDatabaseUrl) {
      setMessage("请填写完整的数据库主机、名称、用户和密码");
      return;
    }
    initMutation.mutate(
      { email, password, siteName, allowRegister, databaseUrl: builtDatabaseUrl || undefined },
      {
        onSuccess: (data: any) => {
          queryClient.setQueryData(["init-status"], { initialized: true });
          setMessage(data?.needRestart ? "数据库连接已保存，请重启后端后重新初始化" : "初始化完成，即将前往登录");
          const delay = data?.needRestart ? 0 : 800;
          if (!data?.needRestart) {
            setTimeout(() => navigate("/auth/login", { replace: true }), delay);
          }
        },
        onError: (err: any) => setMessage(err?.response?.data?.error || "初始化失败，请检查后端日志"),
      },
    );
  };

  if (status.isLoading) {
    return <div className="p-6 text-center">正在检查系统状态...</div>;
  }
  if (status.error) {
    return <div className="p-6 text-center text-error">检查系统状态失败，请确认后端已启动。</div>;
  }
  if (status.data?.initialized) {
    return <div className="p-6 text-center">系统已初始化，请前往登录。</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <h1 className="card-title">首次初始化</h1>
          <p className="text-sm text-base-content/70">创建首个管理员账户并设置基础信息。</p>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-3 rounded-lg border border-base-300 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">数据库连接（MySQL）</span>
                <span className="text-xs text-base-content/60">默认指向 localhost:3306</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="form-control">
                  <span className="label-text">主机</span>
                  <input className="input input-bordered" value={dbHost} onChange={(e) => setDbHost(e.target.value)} placeholder="localhost" />
                </label>
                <label className="form-control">
                  <span className="label-text">端口</span>
                  <input className="input input-bordered" value={dbPort} onChange={(e) => setDbPort(e.target.value)} placeholder="3306" />
                </label>
                <label className="form-control">
                  <span className="label-text">数据库名称</span>
                  <input className="input input-bordered" value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="如 pacmachine" />
                </label>
                <label className="form-control">
                  <span className="label-text">数据库用户</span>
                  <input className="input input-bordered" value={dbUser} onChange={(e) => setDbUser(e.target.value)} placeholder="如 root" />
                </label>
              </div>
              <label className="form-control">
                <span className="label-text">数据库密码</span>
                <input className="input input-bordered" type="password" value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} placeholder="用户密码" />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="btn"
                  type="button"
                  disabled={saveDbMutation.status === "pending"}
                  onClick={() => {
                    setDbMessage(null);
                    const hasInput = hasDbConfigInput();
                    const url = buildDatabaseUrl();
                    if (!hasInput || !url) {
                      setDbMessage("请选择 localhost 并填写数据库名、用户和密码");
                      return;
                    }
                    saveDbMutation.mutate(
                      { databaseUrl: url },
                      {
                        onSuccess: (data: any) => {
                          setDbMessage(data?.needRestart ? "已保存数据库连接，请重启后端使其生效" : "已保存数据库连接");
                        },
                        onError: (err: any) => setDbMessage(err?.response?.data?.error || "保存失败"),
                      },
                    );
                  }}
                >
                  {saveDbMutation.status === "pending" ? "保存中..." : "数据库连接保存"}
                </button>
                {dbMessage && <span className="text-sm text-base-content/70">{dbMessage}</span>}
                {!dbMessage && hasDbConfigInput() && (
                  <span className="text-xs text-base-content/60 break-all">将保存为：{buildDatabaseUrl() || "请补全信息以生成连接"}</span>
                )}
              </div>
            </div>
            <div className="text-xs text-base-content/60">
              如使用默认本地 MySQL，请选择主机为 localhost，端口 3306，并填写数据库名、用户和密码。
            </div>

            <div className="divider my-0" />

            <label className="form-control">
              <span className="label-text">管理员邮箱*</span>
              <input className="input input-bordered" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">管理员密码*</span>
              <input className="input input-bordered" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">平台名称（可选）</span>
              <input
                className="input input-bordered"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="用于网站展示的标题，与用户构建的站点名无关"
              />
            </label>
            <label className="form-control">
              <span className="label-text">允许注册</span>
              <div className="flex items-center gap-2">
                <input type="checkbox" className="toggle" checked={allowRegister} onChange={(e) => setAllowRegister(e.target.checked)} />
                <span className="text-sm text-base-content/70">{allowRegister ? "允许" : "关闭"}</span>
              </div>
            </label>
            <button className="btn btn-primary w-full" type="submit" disabled={initMutation.status === "pending"}>
              {initMutation.status === "pending" ? "提交中..." : "开始初始化"}
            </button>
          </form>
          {message && <p className="text-center text-sm">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default InitPage;
