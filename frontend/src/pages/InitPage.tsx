import { FormEvent, useState } from "react";
import { useInitStatus, useInitializeSystem } from "../features/init/init";
import { useNavigate } from "react-router-dom";

const InitPage = () => {
  const status = useInitStatus();
  const initMutation = useInitializeSystem();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [allowRegister, setAllowRegister] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    initMutation.mutate(
      { email, password, siteName, allowRegister },
      {
        onSuccess: () => {
          setMessage("初始化完成，即将前往登录");
          setTimeout(() => navigate("/auth/login", { replace: true }), 800);
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
            <label className="form-control">
              <span className="label-text">管理员邮箱*</span>
              <input className="input input-bordered" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">管理员密码*</span>
              <input className="input input-bordered" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">站点名称（可选）</span>
              <input className="input input-bordered" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
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
