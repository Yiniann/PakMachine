import { FormEvent, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCreateUser } from "../../features/users/mutations";
import { useUsersQuery, User } from "../../features/users/queries";
import { canBuildSpa, getDailyBuildLimit, getUserTypeBadgeClass, getUserTypeLabel, normalizeUserType } from "../../lib/userAccess";

const UsersPage = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useUsersQuery();
  const createUser = useCreateUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [userType, setUserType] = useState("pending");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

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

  const formattedUsers = useMemo(() => {
    const rows =
      data?.map((u) => ({
        ...u,
        createdAtLabel: new Date(u.createdAt).toLocaleString(),
      })) ?? [];

    if (userTypeFilter === "admin") return rows.filter((u) => u.role === "admin");
    if (userTypeFilter === "pro") return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "pro");
    if (userTypeFilter === "priority") return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "priority");
    if (userTypeFilter === "basic") return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "basic");
    if (userTypeFilter === "pending") return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "pending");
    return rows;
  }, [data, userTypeFilter]);

  const getQuotaLeft = (u: User) => {
    const limit = getDailyBuildLimit(u.role, u.userType);
    if (u.role !== "admin" && !canBuildSpa(u.role, u.userType)) return 0;
    if (!u.buildQuotaDate) return limit;
    const isToday = new Date(u.buildQuotaDate).toDateString() === new Date().toDateString();
    const used = u.buildQuotaUsed ?? 0;
    return isToday ? Math.max(limit - used, 0) : limit;
  };

  const getQuotaLabel = (u: User) => {
    if (u.role !== "admin" && !canBuildSpa(u.role, u.userType)) return "未开通";
    const limit = getDailyBuildLimit(u.role, u.userType);
    return limit >= Number.MAX_SAFE_INTEGER / 2 ? "∞" : `${getQuotaLeft(u)} / ${limit}`;
  };

  const getUserBadgeClass = (u: User) => {
    if (u.role === "admin") return "badge-primary";
    return getUserTypeBadgeClass(u.userType);
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { email, password, role, userType },
      {
        onSuccess: () => {
          setEmail("");
          setPassword("");
          setRole("user");
          setUserType("pending");
          setCreateOpen(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="workspace-kicker">Users</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">用户管理</h2>
          <p className="mt-2 text-[15px] text-slate-500">管理注册用户、权限及配额。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="workspace-select select select-bordered select-sm"
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
          >
            <option value="all">全部用户</option>
            <option value="admin">管理员</option>
            <option value="priority">优先版</option>
            <option value="pro">订阅版</option>
            <option value="basic">基础版</option>
            <option value="pending">待开通</option>
          </select>
          <button type="button" className="landing-button-primary rounded-2xl px-5 py-3 text-sm" onClick={() => setCreateOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            添加用户
          </button>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="workspace-alert flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="workspace-card p-0 sm:p-6">
        <div className="p-0">
          {isLoading && (
            <div className="flex justify-center p-4">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}
          {!isLoading && !errorMessage && (
            <>
              <div className="hidden overflow-x-auto md:block">
                <div className="workspace-table-shell">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>邮箱</th>
                        <th>站点名</th>
                        <th>站点名数</th>
                        <th>已绑定前端</th>
                        <th>今日剩余构建</th>
                        <th>权限档位</th>
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
                          <td>{`${u.sites?.length ?? 0} / ${Math.max(Number(u.siteNameLimit ?? 1) || 1, 1)}`}</td>
                          <td>{u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定"}</td>
                          <td>{getQuotaLabel(u)}</td>
                          <td>
                            <div className={`badge badge-sm ${getUserBadgeClass(u)}`}>{u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType)}</div>
                          </td>
                          <td>{u.createdAtLabel}</td>
                          <td>
                            <button type="button" className="btn btn-xs btn-outline" onClick={() => navigate(`/admin/users/${u.id}`)}>
                              设置
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="workspace-table-shell flex flex-col divide-y divide-base-200 md:hidden">
                {formattedUsers.map((u) => (
                  <div key={u.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="break-all font-bold">{u.email}</div>
                        <div className="text-xs text-base-content/60">ID: {u.id}</div>
                      </div>
                      <div className={`badge badge-sm ${getUserBadgeClass(u)}`}>{u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-base-content/60">站点名</span>
                        <span>{u.siteName ?? "未设置"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-base-content/60">站点名数</span>
                        <span>{`${u.sites?.length ?? 0} / ${Math.max(Number(u.siteNameLimit ?? 1) || 1, 1)}`}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-base-content/60">已绑定前端</span>
                        <span>{u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-base-content/60">剩余构建</span>
                        <span>{getQuotaLabel(u)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-base-content/50">{u.createdAtLabel}</span>
                      <button type="button" className="btn btn-xs btn-outline" onClick={() => navigate(`/admin/users/${u.id}`)}>
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

      {createOpen &&
        createPortal(
          <div className="modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm">
            <div className="modal-box workspace-card max-w-2xl border-0 bg-white/95">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">添加用户</h3>
                <button
                  type="button"
                  className="landing-button-secondary btn btn-circle btn-sm min-h-0 !h-10 !w-10 !rounded-full !p-0"
                  onClick={() => setCreateOpen(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={onCreate} className="mt-4 space-y-4">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">邮箱</span>
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="邮箱"
                    className="workspace-input input input-bordered w-full"
                    required
                  />
                </label>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">密码</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密码"
                    className="workspace-input input input-bordered w-full"
                    required
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text">权限组</span>
                    </div>
                    <select
                      value={role}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRole(value);
                        if (value === "admin") setUserType("pending");
                      }}
                      className="workspace-select select select-bordered w-full"
                    >
                      <option value="user">用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </label>
                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text">权限档位</span>
                    </div>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="workspace-select select select-bordered w-full"
                      disabled={role === "admin"}
                    >
                      <option value="pending">待开通</option>
                      <option value="basic">基础版</option>
                      <option value="pro">订阅版</option>
                      <option value="priority">优先版</option>
                    </select>
                  </label>
                </div>
                {role === "admin" && <p className="text-xs text-base-content/70">管理员账号不区分基础版、订阅版、优先版或待开通。</p>}
                <div className="modal-action">
                  <button type="button" className="landing-button-secondary rounded-2xl px-5 py-3 text-sm" onClick={() => setCreateOpen(false)}>
                    取消
                  </button>
                  <button type="submit" className="landing-button-primary rounded-2xl px-5 py-3 text-sm" disabled={createUser.status === "pending"}>
                    {createUser.status === "pending" ? "创建中..." : "创建"}
                  </button>
                </div>
              </form>
              {createError && <p className="mt-2 text-error">失败: {createError}</p>}
            </div>
            <button
              type="button"
              className="modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
              onClick={() => setCreateOpen(false)}
            >
              close
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default UsersPage;
