import { FormEvent, useState } from "react";
import { useForgotPasswordMutation } from "../../features/auth/mutations";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useForgotPasswordMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(
      { email },
      {
        onSuccess: (data) => setMessage(data.resetToken ? `Token: ${data.resetToken}` : data.message || "Requested"),
        onError: (err: any) => setMessage(err?.response?.data?.error || "Request failed"),
      },
    );
  };

  return (
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body">
        <h2 className="card-title">Forgot Password</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input input-bordered w-full"
          />
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.status === "pending"}>
            {mutation.status === "pending" ? "Sending..." : "Send Reset"}
          </button>
        </form>
        {message && <p className="text-info mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
