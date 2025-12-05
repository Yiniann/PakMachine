import { useUsersQuery } from "../../features/users/queries";

const UsersPage = () => {
  const { data, error, isLoading } = useUsersQuery();
  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;

  return (
    <section>
      <h2>Users</h2>
      {isLoading && <p>Loading...</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {!isLoading && !errorMessage && (
        <ul className="list">
          {data?.map((u) => (
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
