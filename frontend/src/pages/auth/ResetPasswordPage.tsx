import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../features/auth/mutations";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useResetPasswordMutation();
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = useMemo(
    () => Boolean(token?.trim()) && newPassword.length >= 8 && newPassword === confirmPassword,
    [token, newPassword, confirmPassword],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!token.trim()) {
      setMessage("缺少 token，请从邮件链接进入或重新申请重置");
      return;
    }
    if (!canSubmit) {
      setMessage("请检查密码长度和确认密码是否一致");
      return;
    }

    mutation.mutate(
      { token, newPassword },
      {
        onSuccess: (data) => {
          setMessage(data.message || "密码已更新，正在跳转登录页");
          setTimeout(() => navigate("/auth/login"), 800);
        },
        onError: (err: any) => setMessage(err?.response?.data?.error || "重置失败，请稍后再试"),
      },
    );
  };

  return (
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body space-y-3">
        <h2 className="card-title">重置密码</h2>
        <p className="text-sm text-base-content/70">从邮箱链接打开时会自动带入 token，可修改为最新邮件里的 token。</p>
        <form onSubmit={onSubmit} className="space-y-3">
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
          <button type="submit" className="btn btn-primary w-full" disabled={!canSubmit || mutation.status === "pending"}>
            {mutation.status === "pending" ? "重置中..." : "重置"}
          </button>
        </form>
        {passwordTooShort && <p className="text-error text-sm">密码至少 8 位</p>}
        {mismatch && <p className="text-error text-sm">两次输入的密码不一致</p>}
        {message && <p className="text-info mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
