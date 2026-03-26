import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRegisterMutation, useSendRegisterCodeMutation } from "../../features/auth/mutations";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useRegisterMutation();
  const sendCodeMutation = useSendRegisterCodeMutation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((sec) => Math.max(sec - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSendCode = () => {
    setMessage(null);
    if (!email) {
      setMessage("请先填写邮箱");
      return;
    }
    sendCodeMutation.mutate(
      { email },
      {
        onSuccess: (data) => {
          setCooldown(60);
          if (data?.emailSent) {
            setMessage("验证码已发送，请查收邮箱");
          } else if (data?.code) {
            setMessage(`验证码已生成（当前环境调试用）：${data.code}`);
          } else if (data?.reason === "not_configured") {
            setMessage("邮件服务未配置，无法发送验证码");
          } else {
            setMessage("验证码已生成");
          }
        },
        onError: (err: any) => setMessage(err?.response?.data?.error || "发送验证码失败"),
      },
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!code) {
      setMessage("请先输入邮箱验证码");
      return;
    }
    mutation.mutate(
      { email, password, code },
      {
        onSuccess: () => setMessage("注册成功"),
        onError: (err: any) => setMessage(err?.response?.data?.error || "注册失败"),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Account Access</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900">注册</h1>
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
              placeholder="设置登录密码"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">验证码</span>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="输入邮箱验证码"
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10"
              />
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-[#6d6bf4]/30 hover:text-[#5e5ce6]"
                onClick={onSendCode}
                disabled={sendCodeMutation.status === "pending" || cooldown > 0}
              >
                {sendCodeMutation.status === "pending"
                  ? "发送中..."
                  : cooldown > 0
                    ? `重新发送 (${cooldown}s)`
                    : "发送验证码"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="landing-button-primary w-full rounded-2xl px-6 py-4 text-base"
            disabled={mutation.status === "pending"}
          >
            {mutation.status === "pending" ? "注册中..." : "注册"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>已有账号？</span>
          <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/login">
            立刻登录
          </Link>
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

export default RegisterPage;
