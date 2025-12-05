import { FormEvent, useState } from "react";
import api from "../api/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post("/users/forgot-password", { email });
      setMessage(res.data.resetToken ? `Token: ${res.data.resetToken}` : res.data.message || "Requested");
    } catch (err: any) {
      setMessage(err?.response?.data?.error || "Request failed");
    }
  };

  return (
    <section>
      <h2>Forgot Password</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <button type="submit">Send Reset</button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default ForgotPasswordPage;
