import { FormEvent, useState } from "react";
import { useRegisterMutation } from "../../features/auth/mutations";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useRegisterMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: () => setMessage("Registered"),
        onError: (err: any) => setMessage(err?.response?.data?.error || "Registration failed"),
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
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.status === "pending"}>
            {mutation.status === "pending" ? "注册中..." : "注册"}
          </button>
        </form>
        {message && <p className="text-info mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default RegisterPage;
