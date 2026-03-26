import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
    <div className="mx-auto w-full max-w-xl">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Account Recovery</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900">重置密码</h1>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">重置令牌</span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="输入重置令牌"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">新密码</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码（至少 8 位）"
              className={`w-full rounded-2xl border bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10 ${
                passwordTooShort ? "border-red-300" : "border-slate-200"
              }`}
              required
              minLength={8}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">确认新密码</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className={`w-full rounded-2xl border bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10 ${
                mismatch ? "border-red-300" : "border-slate-200"
              }`}
              required
              minLength={8}
            />
          </label>

          <button
            type="submit"
            className="landing-button-primary w-full rounded-2xl px-6 py-4 text-base"
            disabled={!canSubmit || mutation.status === "pending"}
          >
            {mutation.status === "pending" ? "重置中..." : "重置密码"}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {passwordTooShort ? <p className="text-sm text-red-500">密码至少 8 位</p> : null}
          {mismatch ? <p className="text-sm text-red-500">两次输入的密码不一致</p> : null}
          {message ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {message}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/forgot">
            重新获取链接
          </Link>
          <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/login">
            返回登录
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ResetPasswordPage;
