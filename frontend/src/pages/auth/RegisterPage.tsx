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
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body">
        <h2 className="card-title">注册</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="input input-bordered w-full"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="input input-bordered w-full"
          />
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="验证码"
              className="input input-bordered flex-1"
            />
            <button
              type="button"
              className="btn btn-outline"
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
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.status === "pending"}>
            {mutation.status === "pending" ? "注册中..." : "注册"}
          </button>
        </form>
        <div className="text-sm flex items-center justify-center gap-2 mt-2">
          <span>已有账号？</span>
          <Link className="link link-primary" to="/auth/login">
            立刻登录
          </Link>
        </div>
        {message && <p className="text-info mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default RegisterPage;
