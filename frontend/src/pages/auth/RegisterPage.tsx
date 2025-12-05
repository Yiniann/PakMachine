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
    <section>
      <h2>Register</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit" disabled={mutation.status === "pending"}>
          {mutation.status === "pending" ? "Registering..." : "Register"}
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </section>
  );
};

export default RegisterPage;
