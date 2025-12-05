import { FormEvent, useState } from "react";
import { useResetPasswordMutation } from "../../features/auth/mutations";

const ResetPasswordPage = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useResetPasswordMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(
      { token, newPassword },
      {
        onSuccess: (data) => setMessage(data.message || "Password reset"),
        onError: (err: any) => setMessage(err?.response?.data?.error || "Reset failed"),
      },
    );
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
        <button type="submit" disabled={mutation.status === "pending"}>
          {mutation.status === "pending" ? "Resetting..." : "Reset"}
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default ResetPasswordPage;
