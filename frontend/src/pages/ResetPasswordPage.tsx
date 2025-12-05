import { FormEvent, useState } from "react";
import api from "../api/client";

const ResetPasswordPage = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post("/users/reset-password", { token, newPassword });
      setMessage(res.data.message || "Password reset");
    } catch (err: any) {
      setMessage(err?.response?.data?.error || "Reset failed");
    }
  };

  return (
    <section>
      <h2>Reset Password</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
        />
        <button type="submit">Reset</button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default ResetPasswordPage;
