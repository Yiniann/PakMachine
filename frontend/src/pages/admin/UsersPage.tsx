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
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Users</h2>
        {isLoading && <p className="loading loading-spinner loading-sm" />}
        {errorMessage && <p className="text-error">{errorMessage}</p>}
        {!isLoading && !errorMessage && (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge badge-outline">{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.isAdmin ? "badge-primary" : "badge-ghost"}`}>
                        {u.isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
