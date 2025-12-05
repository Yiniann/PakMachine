import { FormEvent, useState } from "react";
import { useForgotPasswordMutation } from "../api/hooks";

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
    <section>
      <h2>Forgot Password</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <button type="submit" disabled={mutation.status === "pending"}>
          {mutation.status === "pending" ? "Sending..." : "Send Reset"}
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default ForgotPasswordPage;
