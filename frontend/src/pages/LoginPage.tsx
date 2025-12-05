import { FormEvent, useState } from "react";
import api from "../api/client";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post("/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setMessage("Logged in");
    } catch (err: any) {
      setMessage(err?.response?.data?.error || "Login failed");
    }
  };

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default LoginPage;
