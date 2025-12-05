import { useEffect, useState } from "react";
import api from "../api/client";

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<User[]>("/users");
        setUsers(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section>
      <h2>Users</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <ul className="list">
          {users.map((u) => (
            <li key={u.id}>
              <strong>{u.email}</strong> — {u.role}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UsersPage;
