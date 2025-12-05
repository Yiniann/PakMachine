import { FormEvent, useMemo, useState } from "react";
import { useUsersQuery, User } from "../../features/users/queries";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsUser, setSettingsUser] = useState<User | null>(null);

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
          setCreateOpen(false);
        },
      },
    );
  };

  const onReset = (e: FormEvent) => {
    e.preventDefault();
    updatePassword.mutate(
      { email: resetEmail, newPassword },
      {
        onSuccess: () => {
          setResetEmail("");
          setNewPassword("");
          setSettingsUser(null);
        },
      },
    );
  };

  const formattedUsers = useMemo(
    () =>
      data?.map((u) => ({
        ...u,
        createdAtLabel: new Date(u.createdAt).toLocaleString(),
      })) ?? [],
    [data],
  );

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Users</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
              Add User
            </button>
          </div>
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
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.createdAtLabel}</td>
                      <td>
                        <button className="btn btn-xs" onClick={() => {
                          setSettingsUser(u);
                          setRoleEdit({ [u.email]: u.role });
                          setResetEmail(u.email);
                          setNewPassword("");
                        }}>
                          Settings
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

      {/* Create User Modal */}
      {createOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add User</h3>
            <form onSubmit={onCreate} className="grid gap-3 mt-4">
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
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createUser.status === "pending"}>
                  {createUser.status === "pending" ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
            {createError && <p className="text-error mt-2">Failed: {createError}</p>}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Settings for {settingsUser.email}</h3>
            <div className="space-y-3 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    className="select select-bordered select-sm"
                    value={roleEdit[settingsUser.email] ?? settingsUser.role}
                    onChange={(e) =>
                      setRoleEdit((prev) => ({
                        ...prev,
                        [settingsUser.email]: e.target.value,
                      }))
                    }
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={updateRole.status === "pending"}
                    onClick={() =>
                      updateRole.mutate({
                        email: settingsUser.email,
                        role: roleEdit[settingsUser.email] ?? settingsUser.role,
                      })
                    }
                  >
                    Save Role
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <form onSubmit={onReset} className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetEmail(settingsUser.email);
                    }}
                    placeholder="New Password"
                    className="input input-bordered w-full"
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={updatePassword.status === "pending"}>
                    {updatePassword.status === "pending" ? "Updating..." : "Change"}
                  </button>
                </form>
              </div>

              <div className="form-control">
                <button
                  className="btn btn-error text-white"
                  disabled={deleteUser.status === "pending"}
                  onClick={() => {
                    deleteUser.mutate(settingsUser.id, {
                      onSuccess: () => setSettingsUser(null),
                    });
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setSettingsUser(null);
                  setNewPassword("");
                }}
              >
                Close
              </button>
            </div>
            {updateError && <p className="text-error mt-2">Password update failed: {updateError}</p>}
            {updateRoleError && <p className="text-error mt-2">Role update failed: {updateRoleError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
