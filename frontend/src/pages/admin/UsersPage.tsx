import { FormEvent, useState } from "react";
import { useUsersQuery } from "../../features/users/queries";
import { useCreateUser, useDeleteUser, useUpdatePassword, useUpdateRole } from "../../features/users/mutations";

const UsersPage = () => {
  const { data, error, isLoading } = useUsersQuery();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();
  const updateRole = useUpdateRole();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [roleEdit, setRoleEdit] = useState<Record<string, string>>({});

  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;
  const createError =
    createUser.error && (createUser.error as any)?.response?.data?.error
      ? (createUser.error as any).response.data.error
      : createUser.error instanceof Error
        ? createUser.error.message
        : null;
  const updateError =
    updatePassword.error && (updatePassword.error as any)?.response?.data?.error
      ? (updatePassword.error as any).response.data.error
      : updatePassword.error instanceof Error
        ? updatePassword.error.message
        : null;
  const roleErr = updateRole.error as any;
  const updateRoleError =
    roleErr && roleErr.response?.data?.error
      ? roleErr.response.data.error
      : updateRole.error instanceof Error
        ? updateRole.error.message
        : null;

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { email, password, role },
      {
        onSuccess: () => {
          setEmail("");
          setPassword("");
          setRole("user");
        },
      },
    );
  };

  const onReset = (e: FormEvent) => {
    e.preventDefault();
    updatePassword.mutate({ email: resetEmail, newPassword }, {
      onSuccess: () => {
        setResetEmail("");
        setNewPassword("");
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Create User</h2>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input input-bordered w-full"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input input-bordered w-full"
              required
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="select select-bordered w-full">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary w-full" disabled={createUser.status === "pending"}>
                {createUser.status === "pending" ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
          {createError && <p className="text-error mt-2">Failed: {createError}</p>}
        </div>
      </div>

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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <select
                            className="select select-bordered select-sm"
                            value={roleEdit[u.email] ?? u.role}
                            onChange={(e) =>
                              setRoleEdit((prev) => ({
                                ...prev,
                                [u.email]: e.target.value,
                              }))
                            }
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            className="btn btn-xs btn-primary"
                            disabled={updateRole.status === "pending"}
                            onClick={() =>
                              updateRole.mutate({
                                email: u.email,
                                role: roleEdit[u.email] ?? u.role,
                              })
                            }
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td className="flex flex-wrap gap-2">
                        <button
                          className="btn btn-xs btn-error"
                          disabled={deleteUser.status === "pending"}
                          onClick={() => deleteUser.mutate(u.id)}
                        >
                          Delete
                        </button>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => setResetEmail(u.email)}
                          disabled={updatePassword.status === "pending"}
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {updateRoleError && <p className="text-error mt-2">Role update failed: {updateRoleError}</p>}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Reset Password</h2>
          <form onSubmit={onReset} className="grid gap-3 md:grid-cols-2">
            <input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email"
              className="input input-bordered w-full"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="input input-bordered w-full"
              required
            />
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary w-full" disabled={updatePassword.status === "pending"}>
                {updatePassword.status === "pending" ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
          {updateError && <p className="text-error mt-2">Failed: {updateError}</p>}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
