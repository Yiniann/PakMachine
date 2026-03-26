import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../features/auth/mutations";
import { useAuth } from "../../components/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  // 登录后统一跳到应用首页
  const from = "/app";

  const mutation = useLoginMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          login(data.token, data.user?.role, data.user?.email, data.user?.userType);
          localStorage.setItem("user_role", data.user?.role || "");
          localStorage.setItem("user_email", data.user?.email || "");
          if (data.user?.userType) {
            localStorage.setItem("user_type", data.user.userType);
          } else {
            localStorage.removeItem("user_type");
          }
          setMessage("Logged in");
          navigate(from, { replace: true });
        },
        onError: (err: any) => {
          setMessage(err?.response?.data?.error || "Login failed");
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Account Access</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900">登录</h1>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入注册邮箱"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入登录密码"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10"
            />
          </label>

          <button
            type="submit"
            className="landing-button-primary w-full rounded-2xl px-6 py-4 text-base"
            disabled={mutation.status === "pending"}
          >
            {mutation.status === "pending" ? "登录中..." : "登录"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/forgot">
            忘记密码？
          </Link>
          <div className="flex items-center gap-1">
            <span>还没有账号？</span>
            <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/register">
              立刻注册
            </Link>
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {message}
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default LoginPage;
