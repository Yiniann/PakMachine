import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../features/auth/mutations";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [requestSucceeded, setRequestSucceeded] = useState(false);

  const forgotMutation = useForgotPasswordMutation();

  const canSubmitRequest = useMemo(() => emailRegex.test(email), [email]);

  const onSubmitRequest = async (e: FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    setRequestSucceeded(false);

    forgotMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setRequestSucceeded(true);
          setForgotMessage("请求已提交，请前往邮箱查看重置链接。");
        },
        onError: (err: any) => {
          setRequestSucceeded(false);
          setForgotMessage(err?.response?.data?.error || "请求失败，请稍后再试");
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Account Recovery</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900">找回密码</h1>
        </div>

        <form onSubmit={onSubmitRequest} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入注册邮箱"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10"
              type="email"
              required
            />
          </label>

          <button
            type="submit"
            className="landing-button-primary w-full rounded-2xl px-6 py-4 text-base"
            disabled={!canSubmitRequest || forgotMutation.status === "pending"}
          >
            {forgotMutation.status === "pending" ? "发送中..." : "发送重置链接"}
          </button>
        </form>

        {forgotMessage ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {forgotMessage}
          </div>
        ) : null}

        {requestSucceeded ? null : (
          <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>下一步请通过邮件链接或重置令牌前往重置密码页面。</p>
            <div className="flex items-center gap-4">
              <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/reset">
                去重置密码
              </Link>
              <Link className="font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]" to="/auth/login">
                返回登录
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ForgotPasswordPage;
