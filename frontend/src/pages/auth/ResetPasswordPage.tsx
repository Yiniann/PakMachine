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
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body">
        <h2 className="card-title">Reset Password</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token"
            className="input input-bordered w-full"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="input input-bordered w-full"
          />
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.status === "pending"}>
            {mutation.status === "pending" ? "Resetting..." : "Reset"}
          </button>
        </form>
        {message && <p className="text-info mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
