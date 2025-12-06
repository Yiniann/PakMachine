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
  const from = "/app/home";

  const mutation = useLoginMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          login(data.token, data.user?.role);
          localStorage.setItem("user_role", data.user?.role || "");
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
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body">
        <h2 className="card-title">登录</h2>
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
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.status === "pending"}>
            {mutation.status === "pending" ? "登录中..." : "登录"}
          </button>
        </form>
        <div className="flex items-center justify-between text-sm">
          <Link className="link" to="/auth/forgot">
            忘记密码？
          </Link>
        </div>
        {message && <p className="text-info mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
