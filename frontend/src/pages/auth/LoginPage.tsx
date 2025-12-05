import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginMutation } from "../../features/auth/mutations";
import { useAuth } from "../../components/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/app/home";

  const mutation = useLoginMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          login(data.token);
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
    <section>
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit" disabled={mutation.status === "pending"}>
          {mutation.status === "pending" ? "Logging in..." : "Login"}
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default LoginPage;
