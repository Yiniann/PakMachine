import { FormEvent, useMemo, useState } from "react";
import { useUsersQuery, User } from "../../features/users/queries";
import { useCreateUser, useDeleteUser, useResetSiteName, useUpdatePassword, useUpdateRole } from "../../features/users/mutations";

const UsersPage = () => {
  const { data, error, isLoading } = useUsersQuery();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();
  const updateRole = useUpdateRole();
  const resetSiteName = useResetSiteName();

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
  const resetSiteNameError =
    resetSiteName.error && (resetSiteName.error as any)?.response?.data?.error
      ? (resetSiteName.error as any).response.data.error
      : resetSiteName.error instanceof Error
        ? resetSiteName.error.message
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
            <h2 className="card-title">用户列表</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
              添加用户
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
                    <th>邮箱</th>
                    <th>权限组</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.role === "admin" ? "管理员" : "用户"}</td>
                      <td>{u.createdAtLabel}</td>
                      <td>
                        <button className="btn btn-xs" onClick={() => {
                          setSettingsUser(u);
                          setRoleEdit({ [u.email]: u.role });
                          setResetEmail(u.email);
                          setNewPassword("");
                        }}>
                          设置
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
            <h3 className="font-bold text-lg">添加用户</h3>
            <form onSubmit={onCreate} className="grid gap-3 mt-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱"
                className="input input-bordered w-full"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="input input-bordered w-full"
                required
              />
              <a>权限组：</a>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="select select-bordered w-full">
                <option value="user">用户</option>
                <option value="admin">管理员</option>
              </select>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setCreateOpen(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={createUser.status === "pending"}>
                  {createUser.status === "pending" ? "创建中..." : "创建"}
                </button>
              </div>
            </form>
            {createError && <p className="text-error mt-2">失败: {createError}</p>}
          </div>
        </div>
      )}

      {settingsUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">设置：{settingsUser.email}</h3>
            <div className="mt-4 space-y-4">
               <div className="form-control">
                <label className="label">
                  <span className="label-text">站点名称</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-outline">{settingsUser.siteName ?? "未设置"}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={resetSiteName.status === "pending"}
                    onClick={() => {
                      if (!window.confirm(`确定要重置 ${settingsUser.email} 的站点名吗？用户需重新设置。`)) return;
                      resetSiteName.mutate({ email: settingsUser.email });
                    }}
                  >
                    {resetSiteName.status === "pending" ? "重置中..." : "重置站点名"}
                  </button>
                </div>
                <p className="text-xs text-base-content/70 mt-1">重置后，用户下次登录需要重新填写站点名称。</p>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">角色</span>
                </label>
                <div className="flex flex-wrap gap-2">
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
                    <option value="user">用户</option>
                    <option value="admin">管理员</option>
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
                    {updateRole.status === "pending" ? "更改中..." : "更改权限"}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">新密码</span>
                </label>
                <form onSubmit={onReset} className="flex flex-wrap gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetEmail(settingsUser.email);
                    }}
                    placeholder="新密码"
                    className="input input-bordered w-full md:w-auto flex-1"
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={updatePassword.status === "pending"}>
                    {updatePassword.status === "pending" ? "更新中..." : "修改密码"}
                  </button>
                </form>
              </div>


              <div className="divider my-1"></div>

              <div className="collapse collapse-arrow border border-base-200 bg-base-100">
                <input type="checkbox" />
                <div className="collapse-title text-error font-medium">危险操作</div>
                <div className="collapse-content">
                  <button
                    className="btn btn-error text-white"
                    disabled={deleteUser.status === "pending"}
                    onClick={() => {
                      if (!window.confirm(`确认删除账号 ${settingsUser.email} 吗？该操作不可恢复。`)) return;
                      deleteUser.mutate(settingsUser.id, {
                        onSuccess: () => setSettingsUser(null),
                      });
                    }}
                  >
                    删除账号
                  </button>
                </div>
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
                关闭
              </button>
            </div>
            {updateError && <p className="text-error mt-2">修改密码失败: {updateError}</p>}
            {updateRoleError && <p className="text-error mt-2">修改角色失败: {updateRoleError}</p>}
            {resetSiteNameError && <p className="text-error mt-2">重置站点名失败: {resetSiteNameError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
