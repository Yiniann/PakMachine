import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../../features/auth/mutations";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
    }
  }, [searchParams]);

  const canSubmitRequest = useMemo(() => emailRegex.test(email), [email]);
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmitReset = useMemo(
    () => Boolean(token.trim()) && newPassword.length >= 8 && newPassword === confirmPassword,
    [token, newPassword, confirmPassword],
  );

  const onSubmitRequest = async (e: FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);

    forgotMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          const baseMsg = data.message || "重置链接已生成，如账号存在会发送到邮箱";
          if (data.resetToken) {
            setToken(data.resetToken);
          }
          setForgotMessage(
            data.emailSent === false ? `${baseMsg}（邮件未发送，请联系管理员配置邮件服务）` : baseMsg,
          );
        },
        onError: (err: any) => setForgotMessage(err?.response?.data?.error || "请求失败，请稍后再试"),
      },
    );
  };

  const onSubmitReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    if (!token.trim()) {
      setResetMessage("缺少 token，请先在左侧生成或从邮件链接打开");
      return;
    }
    if (!canSubmitReset) {
      setResetMessage("请检查密码长度和确认密码是否一致");
      return;
    }

    resetMutation.mutate(
      { token, newPassword },
      {
        onSuccess: (data) => {
          setResetMessage(data.message || "密码已更新，正在跳转登录页");
          setTimeout(() => navigate("/auth/login"), 800);
        },
        onError: (err: any) => setResetMessage(err?.response?.data?.error || "重置失败，请稍后再试"),
      },
    );
  };

  return (
    <div className="card bg-base-100 shadow-xl max-w-4xl mx-auto">
      <div className="card-body grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="card-title">找回密码</h2>
          <p className="text-sm text-base-content/70">填写注册邮箱获取重置链接。</p>
          <form onSubmit={onSubmitRequest} className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              className="input input-bordered w-full"
              type="email"
              required
            />
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!canSubmitRequest || forgotMutation.status === "pending"}
            >
              {forgotMutation.status === "pending" ? "发送中..." : "发送重置"}
            </button>
          </form>
          {forgotMessage && <p className="text-info">{forgotMessage}</p>}
        </div>

        <div className="space-y-3">
          <h2 className="card-title">重置密码</h2>
          <p className="text-sm text-base-content/70">从邮件链接打开时会自动带入 token，或粘贴邮件中的 token。</p>
          <form onSubmit={onSubmitReset} className="space-y-3">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="重置令牌"
              className="input input-bordered w-full"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码（至少 8 位）"
              className={`input input-bordered w-full ${passwordTooShort ? "input-error" : ""}`}
              required
              minLength={8}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认新密码"
              className={`input input-bordered w-full ${mismatch ? "input-error" : ""}`}
              required
              minLength={8}
            />
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!canSubmitReset || resetMutation.status === "pending"}
            >
              {resetMutation.status === "pending" ? "重置中..." : "重置"}
            </button>
          </form>
          {passwordTooShort && <p className="text-error text-sm">密码至少 8 位</p>}
          {mismatch && <p className="text-error text-sm">两次输入的密码不一致</p>}
          {resetMessage && <p className="text-info mt-1">{resetMessage}</p>}
          <div className="text-sm text-base-content/70">
            <p>收不到邮件？请确认邮箱无误，或联系管理员直接修改密码。</p>
            <Link className="link" to="/auth/login">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
