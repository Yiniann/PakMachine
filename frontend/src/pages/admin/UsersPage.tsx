import { FormEvent, useMemo, useState } from "react";
import { useUsersQuery, User } from "../../features/users/queries";
import { useAuth } from "../../components/useAuth";
import {
  useCreateUser,
  useDeleteUser,
  useResetBuildQuota,
  useResetSiteName,
  useUpdatePassword,
  useUpdateRole,
  useUpdateUserType,
} from "../../features/users/mutations";

const normalizeUserType = (value?: string | null) => (value ?? "free").toString().trim().toLowerCase();

const UsersPage = () => {
  const { email: currentEmail } = useAuth();
  const { data, error, isLoading } = useUsersQuery();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();
  const updateRole = useUpdateRole();
  const updateUserType = useUpdateUserType();
  const resetSiteName = useResetSiteName();
  const resetBuildQuota = useResetBuildQuota();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [userType, setUserType] = useState("free");
  const [userTypeFilter, setUserTypeFilter] = useState("all");

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [roleEdit, setRoleEdit] = useState<Record<string, string>>({});
  const [userTypeEdit, setUserTypeEdit] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsUser, setSettingsUser] = useState<User | null>(null);
  const BUILD_LIMIT = 2;

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
  const userTypeErr = updateUserType.error as any;
  const updateUserTypeError =
    userTypeErr && userTypeErr.response?.data?.error
      ? userTypeErr.response.data.error
      : updateUserType.error instanceof Error
        ? updateUserType.error.message
        : null;
  const resetSiteNameError =
    resetSiteName.error && (resetSiteName.error as any)?.response?.data?.error
      ? (resetSiteName.error as any).response.data.error
      : resetSiteName.error instanceof Error
        ? resetSiteName.error.message
        : null;
  const resetQuotaError =
    resetBuildQuota.error && (resetBuildQuota.error as any)?.response?.data?.error
      ? (resetBuildQuota.error as any).response.data.error
      : resetBuildQuota.error instanceof Error
        ? resetBuildQuota.error.message
        : null;

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { email, password, role, userType },
      {
        onSuccess: () => {
          setEmail("");
          setPassword("");
          setRole("user");
          setUserType("free");
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

  const formattedUsers = useMemo(() => {
    const rows =
      data?.map((u) => ({
        ...u,
        createdAtLabel: new Date(u.createdAt).toLocaleString(),
      })) ?? [];
    if (userTypeFilter === "admin") {
      return rows.filter((u) => u.role === "admin");
    }
    if (userTypeFilter === "subscriber") {
      return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "subscriber");
    }
    if (userTypeFilter === "free") {
      return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "free");
    }
    return rows;
  }, [data, userTypeFilter]);

  const getQuotaLeft = (u: User) => {
    if (!u.buildQuotaDate) return BUILD_LIMIT;
    const isToday = new Date(u.buildQuotaDate).toDateString() === new Date().toDateString();
    const used = u.buildQuotaUsed ?? 0;
    return isToday ? Math.max(BUILD_LIMIT - used, 0) : BUILD_LIMIT;
  };
  const getUserTypeLabel = (u: User) => {
    if (u.role === "admin") return "管理员";
    return normalizeUserType(u.userType) === "subscriber" ? "订阅用户" : "免费用户";
  };
  const getUserTypeBadgeClass = (u: User) => {
    if (u.role === "admin") return "badge-primary";
    if (normalizeUserType(u.userType) === "subscriber") return "badge-secondary";
    return "hidden";
  };
  const getRoleValue = (u: User) => roleEdit[u.email] ?? u.role;
  const getUserTypeValue = (u: User) => userTypeEdit[u.email] ?? u.userType ?? "free";
  const isSelf = (u: User) => Boolean(currentEmail && u.email === currentEmail);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">用户管理</h2>
          <p className="text-base-content/70 mt-1">管理注册用户、权限及配额</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm"
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
          >
            <option value="all">全部用户</option>
            <option value="admin">管理员</option>
            <option value="subscriber">订阅用户</option>
            <option value="free">免费用户</option>
          </select>
          <button className="btn btn-primary btn-sm gap-2" onClick={() => setCreateOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            添加用户
          </button>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0 sm:p-6">
          {isLoading && <div className="flex justify-center p-4"><span className="loading loading-spinner loading-md" /></div>}
          {!isLoading && !errorMessage && (
            <>
            <div className="overflow-x-auto hidden md:block">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>邮箱</th>
                    <th>站点名</th>
                    <th>今日剩余构建</th>
                    <th>用户类型</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.siteName ?? "未设置"}</td>
                      <td>
                        {getQuotaLeft(u)} / {BUILD_LIMIT}
                      </td>
                      <td>
                        {(u.role === "admin" || normalizeUserType(u.userType) === "subscriber") && (
                          <div className={`badge badge-sm ${getUserTypeBadgeClass(u)}`}>{getUserTypeLabel(u)}</div>
                        )}
                      </td>
                      <td>{u.createdAtLabel}</td>
                      <td>
                        <button className="btn btn-xs" onClick={() => {
                          setSettingsUser(u);
                          setRoleEdit({ [u.email]: u.role });
                          setUserTypeEdit({ [u.email]: u.userType ?? "free" });
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

            {/* Mobile List View */}
            <div className="md:hidden flex flex-col divide-y divide-base-200">
              {formattedUsers.map((u) => (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold break-all">{u.email}</div>
                      <div className="text-xs text-base-content/60">ID: {u.id}</div>
                    </div>
                    {(u.role === "admin" || normalizeUserType(u.userType) === "subscriber") && (
                      <div className={`badge badge-sm ${getUserTypeBadgeClass(u)}`}>{getUserTypeLabel(u)}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-base-content/60">站点名</span>
                      <span>{u.siteName ?? "未设置"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-base-content/60">剩余构建</span>
                      <span>{getQuotaLeft(u)} / {BUILD_LIMIT}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-base-content/50">{u.createdAtLabel}</span>
                    <button className="btn btn-xs btn-outline" onClick={() => {
                          setSettingsUser(u);
                          setRoleEdit({ [u.email]: u.role });
                          setUserTypeEdit({ [u.email]: u.userType ?? "free" });
                          setResetEmail(u.email);
                          setNewPassword("");
                        }}>
                          设置
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div className="modal modal-open bg-transparent backdrop-blur-sm">
          <div className="modal-box">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">添加用户</h3>
              <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={onCreate} className="space-y-4 mt-4">
              <label className="form-control w-full">
                <div className="label"><span className="label-text">邮箱</span></div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱"
                  className="input input-bordered w-full"
                  required
                />
              </label>
              <label className="form-control w-full">
                <div className="label"><span className="label-text">密码</span></div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="input input-bordered w-full"
                  required
                />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <div className="label"><span className="label-text">权限组</span></div>
                  <select
                    value={role}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRole(value);
                      if (value === "admin") {
                        setUserType("free");
                      }
                    }}
                    className="select select-bordered w-full"
                  >
                    <option value="user">用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </label>
                <label className="form-control w-full">
                  <div className="label"><span className="label-text">用户类型</span></div>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="select select-bordered w-full"
                    disabled={role === "admin"}
                  >
                    <option value="free">免费用户</option>
                    <option value="subscriber">订阅用户</option>
                  </select>
                </label>
              </div>
              {role === "admin" && <p className="text-xs text-base-content/70">管理员账号不区分订阅/免费。</p>}
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
        <div className="modal modal-open bg-transparent backdrop-blur-sm">
          <div className="modal-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">用户设置</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => {
                  setSettingsUser(null);
                  setNewPassword("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-base-content/70 mb-5 break-all">
              当前用户：<span className="font-mono text-base-content font-semibold">{settingsUser.email}</span>
            </div>

            <div className="space-y-5">
              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-base-200 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-base-content/60">站点名称</span>
                    {settingsUser.siteName ? (
                      <span className="badge badge-xs badge-neutral">已设置</span>
                    ) : (
                      <span className="badge badge-xs badge-ghost">未设置</span>
                    )}
                  </div>
                  <div className="font-medium truncate h-6 text-sm" title={settingsUser.siteName || ""}>
                    {settingsUser.siteName || "-"}
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline w-full"
                    disabled={resetSiteName.status === "pending"}
                    onClick={() => {
                      if (!window.confirm(`确定要重置 ${settingsUser.email} 的站点名吗？`)) return;
                      resetSiteName.mutate(
                        { email: settingsUser.email },
                        { onSuccess: () => setSettingsUser((prev) => (prev ? { ...prev, siteName: null } : prev)) },
                      );
                    }}
                  >
                    {resetSiteName.status === "pending" ? "重置中..." : "重置站点名"}
                  </button>
                </div>

                <div className="border border-base-200 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-base-content/60">今日构建</span>
                    <span className="text-xs font-mono">
                      {getQuotaLeft(settingsUser)}/{BUILD_LIMIT}
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full flex-1"
                    value={BUILD_LIMIT - getQuotaLeft(settingsUser)}
                    max={BUILD_LIMIT}
                  ></progress>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline w-full"
                    disabled={resetBuildQuota.status === "pending"}
                    onClick={() => {
                      if (!window.confirm(`确定重置 ${settingsUser.email} 的今日构建次数？`)) return;
                      resetBuildQuota.mutate(
                        { email: settingsUser.email },
                        {
                          onSuccess: () =>
                            setSettingsUser((prev) => (prev ? { ...prev, buildQuotaUsed: 0, buildQuotaDate: null } : prev)),
                        },
                      );
                    }}
                  >
                    {resetBuildQuota.status === "pending" ? "重置中..." : "重置计数"}
                  </button>
                </div>
              </div>

              {/* Role & Type */}
              {!isSelf(settingsUser) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">角色权限</span>
                    </label>
                    <div className="join w-full">
                      <select
                        className="select select-bordered select-sm join-item w-full"
                        value={getRoleValue(settingsUser)}
                        onChange={(e) => setRoleEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value }))}
                      >
                        <option value="user">用户</option>
                        <option value="admin">管理员</option>
                      </select>
                      <button
                        className="btn btn-sm btn-primary join-item"
                        disabled={updateRole.status === "pending"}
                        onClick={() =>
                          updateRole.mutate({ email: settingsUser.email, role: getRoleValue(settingsUser) })
                        }
                      >
                        确认
                      </button>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">用户类型</span>
                    </label>
                    <div className="join w-full">
                      <select
                        className="select select-bordered select-sm join-item w-full"
                        value={getUserTypeValue(settingsUser)}
                        disabled={getRoleValue(settingsUser) === "admin"}
                        onChange={(e) => setUserTypeEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value }))}
                      >
                        <option value="free">免费用户</option>
                        <option value="subscriber">订阅用户</option>
                      </select>
                      <button
                        className="btn btn-sm btn-primary join-item"
                        disabled={updateUserType.status === "pending" || getRoleValue(settingsUser) === "admin"}
                        onClick={() =>
                          updateUserType.mutate({ email: settingsUser.email, userType: getUserTypeValue(settingsUser) })
                        }
                      >
                        确认
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs">重置密码</span>
                </label>
                <form onSubmit={onReset} className="join w-full">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetEmail(settingsUser.email);
                    }}
                    placeholder="输入新密码"
                    className="input input-bordered input-sm join-item w-full"
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary join-item"
                    disabled={updatePassword.status === "pending"}
                  >
                    修改
                  </button>
                </form>
              </div>

              {!isSelf(settingsUser) && (
                <div className="collapse collapse-arrow border border-error/20 bg-error/5 rounded-lg">
                  <input type="checkbox" />
                  <div className="collapse-title text-error text-sm font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    危险操作区域
                  </div>
                  <div className="collapse-content">
                    <p className="text-xs mb-3 opacity-70">删除账号将清除该用户所有数据且无法恢复。</p>
                    <button
                      className="btn btn-sm btn-error text-white w-full"
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
              )}
            </div>

            {(updateError || updateRoleError || updateUserTypeError || resetSiteNameError || resetQuotaError) && (
              <div className="mt-4 p-3 bg-error/10 text-error text-xs rounded-lg space-y-1">
                {updateError && <p>密码修改失败: {updateError}</p>}
                {updateRoleError && <p>角色修改失败: {updateRoleError}</p>}
                {updateUserTypeError && <p>类型修改失败: {updateUserTypeError}</p>}
                {resetSiteNameError && <p>站点重置失败: {resetSiteNameError}</p>}
                {resetQuotaError && <p>配额重置失败: {resetQuotaError}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
