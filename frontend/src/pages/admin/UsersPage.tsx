import { FormEvent, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useUsersQuery, User } from "../../features/users/queries";
import {
  useCreateUser,
  useDeleteUser,
  useRemoveFrontendOrigin,
  useResetFrontendOrigins,
  useResetBuildQuota,
  useResetSiteName,
  useUpdatePassword,
  useRemoveSiteName,
  useUpdateSiteNameLimit,
  useUpdateRole,
  useUpdateUserType,
} from "../../features/users/mutations";
import { canBuildSpa, getDailyBuildLimit, getUserTypeBadgeClass, getUserTypeLabel, normalizeUserType } from "../../lib/userAccess";

const UsersPage = () => {
  const currentEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useUsersQuery();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updatePassword = useUpdatePassword();
  const updateRole = useUpdateRole();
  const updateUserType = useUpdateUserType();
  const removeSiteName = useRemoveSiteName();
  const updateSiteNameLimit = useUpdateSiteNameLimit();
  const resetSiteName = useResetSiteName();
  const removeFrontendOrigin = useRemoveFrontendOrigin();
  const resetFrontendOrigins = useResetFrontendOrigins();
  const resetBuildQuota = useResetBuildQuota();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [userType, setUserType] = useState("pending");
  const [userTypeFilter, setUserTypeFilter] = useState("all");

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [roleEdit, setRoleEdit] = useState<Record<string, string>>({});
  const [userTypeEdit, setUserTypeEdit] = useState<Record<string, string>>({});
  const [siteNameLimitEdit, setSiteNameLimitEdit] = useState<Record<string, string>>({});
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
  const userTypeErr = updateUserType.error as any;
  const updateUserTypeError =
    userTypeErr && userTypeErr.response?.data?.error
      ? userTypeErr.response.data.error
      : updateUserType.error instanceof Error
        ? updateUserType.error.message
        : null;
  const removeSiteNameErr = removeSiteName.error as any;
  const removeSiteNameError =
    removeSiteNameErr && removeSiteNameErr.response?.data?.error
      ? removeSiteNameErr.response.data.error
      : removeSiteName.error instanceof Error
        ? removeSiteName.error.message
        : null;
  const siteNameLimitErr = updateSiteNameLimit.error as any;
  const updateSiteNameLimitError =
    siteNameLimitErr && siteNameLimitErr.response?.data?.error
      ? siteNameLimitErr.response.data.error
      : updateSiteNameLimit.error instanceof Error
        ? updateSiteNameLimit.error.message
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
  const resetFrontendOriginsError =
    resetFrontendOrigins.error && (resetFrontendOrigins.error as any)?.response?.data?.error
      ? (resetFrontendOrigins.error as any).response.data.error
      : resetFrontendOrigins.error instanceof Error
        ? resetFrontendOrigins.error.message
        : null;
  const removeFrontendOriginError =
    removeFrontendOrigin.error && (removeFrontendOrigin.error as any)?.response?.data?.error
      ? (removeFrontendOrigin.error as any).response.data.error
      : removeFrontendOrigin.error instanceof Error
        ? removeFrontendOrigin.error.message
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
          setUserType("pending");
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
    if (userTypeFilter === "pro") {
      return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "pro");
    }
    if (userTypeFilter === "priority") {
      return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "priority");
    }
    if (userTypeFilter === "basic") {
      return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "basic");
    }
    if (userTypeFilter === "pending") {
      return rows.filter((u) => u.role !== "admin" && normalizeUserType(u.userType) === "pending");
    }
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
  const getRoleValue = (u: User) => roleEdit[u.email] ?? u.role;
  const getUserTypeValue = (u: User) => normalizeUserType(userTypeEdit[u.email] ?? u.userType ?? "pending");
  const isSelf = (u: User) => Boolean(currentEmail && u.email === currentEmail);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <button className="landing-button-primary rounded-2xl px-5 py-3 text-sm" onClick={() => setCreateOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            添加用户
          </button>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="workspace-alert flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="workspace-card p-0 sm:p-6">
        <div className="p-0">
          {isLoading && <div className="flex justify-center p-4"><span className="loading loading-spinner loading-md" /></div>}
          {!isLoading && !errorMessage && (
            <>
            <div className="overflow-x-auto hidden md:block">
              <div className="workspace-table-shell">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>邮箱</th>
                    <th>站点名</th>
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
                      <td>{u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定"}</td>
                      <td>
                        {getQuotaLabel(u)}
                      </td>
                      <td>
                        <div className={`badge badge-sm ${getUserBadgeClass(u)}`}>{u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType)}</div>
                      </td>
                      <td>{u.createdAtLabel}</td>
                      <td>
                        <button className="btn btn-xs" onClick={() => {
                          setSettingsUser(u);
                          setRoleEdit({ [u.email]: u.role });
                          setUserTypeEdit({ [u.email]: normalizeUserType(u.userType) });
                          setSiteNameLimitEdit({ [u.email]: String(Math.max(Number(u.siteNameLimit ?? 1) || 1, 1)) });
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
            </div>

            {/* Mobile List View */}
            <div className="workspace-table-shell md:hidden flex flex-col divide-y divide-base-200">
              {formattedUsers.map((u) => (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold break-all">{u.email}</div>
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
                      <span className="text-xs text-base-content/60">已绑定前端</span>
                      <span>{u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-base-content/60">剩余构建</span>
                      <span>{getQuotaLabel(u)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-base-content/50">{u.createdAtLabel}</span>
                    <button className="btn btn-xs btn-outline" onClick={() => {
                          setSettingsUser(u);
                          setRoleEdit({ [u.email]: u.role });
                          setUserTypeEdit({ [u.email]: normalizeUserType(u.userType) });
                          setSiteNameLimitEdit({ [u.email]: String(Math.max(Number(u.siteNameLimit ?? 1) || 1, 1)) });
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
      {createOpen && createPortal(
        <div className="modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm">
          <div className="modal-box workspace-card max-w-2xl border-0 bg-white/95">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">添加用户</h3>
              <button className="landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0" onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={onCreate} className="space-y-4 mt-4">
              <label className="form-control w-full">
                <div className="label"><span className="label-text">邮箱</span></div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱"
                  className="workspace-input input input-bordered w-full"
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
                  className="workspace-input input input-bordered w-full"
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
                        setUserType("pending");
                      }
                    }}
                    className="workspace-select select select-bordered w-full"
                  >
                    <option value="user">用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </label>
                <label className="form-control w-full">
                  <div className="label"><span className="label-text">权限档位</span></div>
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
            {createError && <p className="text-error mt-2">失败: {createError}</p>}
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

      {settingsUser && createPortal(
        <div className="modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm">
          <div className="modal-box workspace-card max-w-5xl overflow-hidden border-0 bg-white/96 p-0">
            <div className="border-b border-base-200/80 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="workspace-kicker">User Settings</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-900">用户设置</h3>
                  <p className="mt-2 text-sm text-base-content/60 break-all">
                    当前用户：<span className="font-mono font-semibold text-base-content">{settingsUser.email}</span>
                  </p>
                </div>
                <button
                  className="landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0"
                  onClick={() => {
                    setSettingsUser(null);
                    setNewPassword("");
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-base-200 bg-base-100/70 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-base-content/45">角色</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`badge badge-sm ${getUserBadgeClass(settingsUser)}`}>{settingsUser.role === "admin" ? "管理员" : getUserTypeLabel(settingsUser.userType)}</span>
                    <span className="text-sm font-medium text-slate-700">{settingsUser.role === "admin" ? "高权限账户" : "普通账户"}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-base-200 bg-base-100/70 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-base-content/45">站点名</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{settingsUser.siteName ?? "未设置"}</div>
                </div>
                <div className="rounded-2xl border border-base-200 bg-base-100/70 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-base-content/45">前端绑定</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {settingsUser.frontendOrigins?.length ? `${settingsUser.frontendOrigins.length} 个` : "未绑定"}
                  </div>
                </div>
                <div className="rounded-2xl border border-base-200 bg-base-100/70 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-base-content/45">今日配额</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{getQuotaLabel(settingsUser)}</div>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(92vh-7rem)] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-3">
                  <section className="rounded-3xl border border-base-200 bg-base-100/75 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-base-content/60">站点名称</p>
                        <h4 className="mt-1 text-sm font-semibold text-slate-900">站点名称列表</h4>
                      </div>
                      <span className="badge badge-xs badge-neutral">
                        {settingsUser.sites?.length ?? 0} / {Math.max(Number(settingsUser.siteNameLimit ?? 1) || 1, 1)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-base-content/80">
                      {settingsUser.sites?.length ? (
                        settingsUser.sites.map((site) => (
                          <div key={site.id} className="flex items-center gap-2 rounded-2xl bg-base-200/40 px-3 py-2.5">
                            <div className="min-w-0 flex-1 truncate font-medium" title={site.name}>
                              {site.name}
                            </div>
                            <span className="text-[11px] text-base-content/50">ID {site.id}</span>
                            <button
                              type="button"
                              className="inline-flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-rose-500"
                              disabled={removeSiteName.status === "pending"}
                              onClick={async () => {
                                if (!window.confirm(`确定删除 ${settingsUser.email} 的站点名称 ${site.name} 吗？`)) return;
                                try {
                                  const data = await removeSiteName.mutateAsync({ email: settingsUser.email, siteId: site.id, siteName: site.name });
                                  setSettingsUser((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          sites:
                                            data.sites?.length > 0
                                              ? data.sites
                                              : (prev.sites ?? []).filter((item) => item.id !== site.id),
                                          siteName: data.siteName,
                                        }
                                      : prev,
                                  );
                                  queryClient.invalidateQueries({ queryKey: ["users"] });
                                } catch {
                                  // error state is already surfaced below in the modal
                                }
                              }}
                            >
                              删除
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-base-200/40 px-3 py-3 text-sm text-base-content/60">-</div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="number"
                        min={1}
                        className="workspace-input input input-bordered h-11 w-full rounded-2xl"
                        value={siteNameLimitEdit[settingsUser.email] ?? String(Math.max(Number(settingsUser.siteNameLimit ?? 1) || 1, 1))}
                        onChange={(e) => setSiteNameLimitEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="landing-button-primary inline-flex h-11 min-h-0 items-center justify-center rounded-2xl px-4 py-0 text-xs whitespace-nowrap leading-none sm:w-24 sm:text-sm"
                        disabled={updateSiteNameLimit.status === "pending"}
                        onClick={() => {
                          const parsed = Number(siteNameLimitEdit[settingsUser.email] ?? settingsUser.siteNameLimit ?? 1);
                          if (!Number.isFinite(parsed) || parsed < 1) return;
                          updateSiteNameLimit.mutate(
                            { email: settingsUser.email, siteNameLimit: Math.floor(parsed) },
                            {
                              onSuccess: (data) => {
                                setSettingsUser((prev) => (prev ? { ...prev, siteNameLimit: data.siteNameLimit } : prev));
                                setSiteNameLimitEdit((prev) => ({ ...prev, [settingsUser.email]: String(data.siteNameLimit) }));
                              },
                            },
                          );
                        }}
                      >
                        {updateSiteNameLimit.status === "pending" ? "保存中..." : "保存"}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex h-8 min-h-0 items-center justify-center rounded-full px-2 py-0 text-xs font-medium leading-none text-rose-600"
                      disabled={resetSiteName.status === "pending"}
                      onClick={() => {
                        if (!window.confirm(`确定要清空 ${settingsUser.email} 的全部站点名称吗？`)) return;
                        resetSiteName.mutate(
                          { email: settingsUser.email },
                          { onSuccess: () => setSettingsUser((prev) => (prev ? { ...prev, siteName: null, sites: [] } : prev)) },
                        );
                      }}
                    >
                      {resetSiteName.status === "pending" ? "清空中..." : "清空全部站点名称"}
                    </button>
                  </section>

                  <section className="rounded-3xl border border-base-200 bg-base-100/75 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-base-content/60">已绑定前端</p>
                        <h4 className="mt-1 text-sm font-semibold text-slate-900">前端域名列表</h4>
                      </div>
                      {settingsUser.frontendOrigins?.length ? (
                        <span className="badge badge-xs badge-neutral">{settingsUser.frontendOrigins.length} 个</span>
                      ) : (
                        <span className="badge badge-xs badge-ghost">未绑定</span>
                      )}
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-base-content/80">
                      {settingsUser.frontendOrigins?.length ? (
                        settingsUser.frontendOrigins.map((origin) => (
                          <div key={origin} className="flex items-center gap-2 rounded-2xl bg-base-200/40 px-3 py-2.5">
                            <div className="min-w-0 flex-1 truncate" title={origin}>
                              {origin}
                            </div>
                            <button
                              type="button"
                              className="inline-flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-rose-500"
                              disabled={removeFrontendOrigin.status === "pending"}
                              onClick={() => {
                                if (!window.confirm(`确定删除 ${settingsUser.email} 的前端域名 ${origin} 吗？`)) return;
                                removeFrontendOrigin.mutate(
                                  { email: settingsUser.email, frontendOrigin: origin },
                                  {
                                    onSuccess: (data) =>
                                      setSettingsUser((prev) => (prev ? { ...prev, frontendOrigins: data.frontendOrigins } : prev)),
                                  },
                                );
                              }}
                            >
                              删除
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-base-200/40 px-3 py-3 text-sm text-base-content/60">-</div>
                      )}
                    </div>
                    {settingsUser.frontendOrigins?.length ? (
                      <button
                        type="button"
                        className="mt-3 inline-flex h-8 min-h-0 items-center justify-center rounded-full px-2 py-0 text-xs font-medium leading-none text-rose-600"
                        disabled={resetFrontendOrigins.status === "pending"}
                        onClick={() => {
                          if (!window.confirm(`确定要清空 ${settingsUser.email} 的全部前端绑定吗？`)) return;
                          resetFrontendOrigins.mutate(
                            { email: settingsUser.email },
                            { onSuccess: () => setSettingsUser((prev) => (prev ? { ...prev, frontendOrigins: [] } : prev)) },
                          );
                        }}
                      >
                        {resetFrontendOrigins.status === "pending" ? "清空中..." : "清空全部绑定"}
                      </button>
                    ) : null}
                  </section>

                  <section className="rounded-3xl border border-base-200 bg-base-100/75 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-base-content/60">今日构建</p>
                        <h4 className="mt-1 text-sm font-semibold text-slate-900">今日剩余次数</h4>
                      </div>
                      <span className="text-[11px] font-mono text-base-content/70">{getQuotaLabel(settingsUser)}</span>
                    </div>
                    <progress
                      className="progress progress-primary mt-3 w-full"
                      value={
                        canBuildSpa(settingsUser.role, settingsUser.userType)
                          ? Math.max(getDailyBuildLimit(settingsUser.role, settingsUser.userType) - getQuotaLeft(settingsUser), 0)
                          : 0
                      }
                      max={
                        getDailyBuildLimit(settingsUser.role, settingsUser.userType) >= Number.MAX_SAFE_INTEGER / 2
                          ? 1
                          : getDailyBuildLimit(settingsUser.role, settingsUser.userType)
                      }
                    />
                    <button
                      type="button"
                      className="mt-3 inline-flex h-8 min-h-0 items-center justify-center rounded-full px-2 py-0 text-xs font-medium leading-none text-rose-600"
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
                  </section>
                </div>

                <div className="space-y-3">
                  {!isSelf(settingsUser) && (
                    <section className="rounded-3xl border border-base-200 bg-base-100/75 p-3 sm:p-4">
                      <div>
                        <p className="text-[11px] text-base-content/60">账号属性</p>
                        <h4 className="mt-1 text-sm font-semibold text-slate-900">角色与档位</h4>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div className="form-control">
                          <label className="label py-0.5">
                            <span className="label-text text-[11px]">角色权限</span>
                          </label>
                          <div className="join w-full">
                            <select
                              className="workspace-select select select-bordered select-sm join-item w-full"
                              value={getRoleValue(settingsUser)}
                              onChange={(e) => setRoleEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value }))}
                            >
                              <option value="user">用户</option>
                              <option value="admin">管理员</option>
                            </select>
                            <button
                              className="landing-button-primary join-item inline-flex h-8 min-h-0 w-[4.75rem] shrink-0 items-center justify-center rounded-r-2xl px-2 py-0 text-[11px] leading-none whitespace-nowrap sm:w-20 sm:px-3 sm:text-xs"
                              disabled={updateRole.status === "pending"}
                              onClick={() => updateRole.mutate({ email: settingsUser.email, role: getRoleValue(settingsUser) })}
                            >
                              确认
                            </button>
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label py-0.5">
                            <span className="label-text text-[11px]">权限档位</span>
                          </label>
                          <div className="join w-full">
                            <select
                              className="workspace-select select select-bordered select-sm join-item w-full"
                              value={getUserTypeValue(settingsUser)}
                              disabled={getRoleValue(settingsUser) === "admin"}
                              onChange={(e) => setUserTypeEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value }))}
                            >
                              <option value="pending">待开通</option>
                              <option value="basic">基础版</option>
                              <option value="pro">订阅版</option>
                              <option value="priority">优先版</option>
                            </select>
                            <button
                              className="landing-button-primary join-item inline-flex h-8 min-h-0 w-[4.75rem] shrink-0 items-center justify-center rounded-r-2xl px-2 py-0 text-[11px] leading-none whitespace-nowrap sm:w-20 sm:px-3 sm:text-xs"
                              disabled={updateUserType.status === "pending" || getRoleValue(settingsUser) === "admin"}
                              onClick={() => updateUserType.mutate({ email: settingsUser.email, userType: getUserTypeValue(settingsUser) })}
                            >
                              确认
                            </button>
                          </div>
                        </div>
                      </div>

                      {settingsUser.role === "admin" && (
                        <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50/80 px-3 py-2 text-xs text-teal-700">
                          管理员账号不区分基础版、订阅版、优先版或待开通。
                        </div>
                      )}
                    </section>
                  )}

                    <section className="rounded-3xl border border-base-200 bg-base-100/75 p-3 sm:p-4">
                    <div>
                      <p className="text-[11px] text-base-content/60">重置密码</p>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900">修改登录密码</h4>
                    </div>
                    <form onSubmit={onReset} className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setResetEmail(settingsUser.email);
                        }}
                        placeholder="输入新密码"
                        className="workspace-input input input-bordered input-sm w-full rounded-2xl"
                        required
                      />
                      <button
                        type="submit"
                        className="landing-button-primary inline-flex h-8 min-h-0 items-center justify-center rounded-2xl px-3 py-0 text-xs whitespace-nowrap leading-none sm:w-20 sm:text-xs"
                        disabled={updatePassword.status === "pending"}
                      >
                        修改
                      </button>
                    </form>
                  </section>

                  {!isSelf(settingsUser) && (
                    <section className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        危险操作区域
                      </div>
                      <p className="mt-1.5 text-xs text-rose-700/75">删除账号将清除该用户所有数据且无法恢复。</p>
                      <button
                        className="mt-3 inline-flex h-8 min-h-0 w-full items-center justify-center rounded-2xl bg-rose-500 px-4 py-0 text-sm font-semibold leading-none text-white"
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
                    </section>
                  )}
                </div>
              </div>

              {(updateError || updateRoleError || updateUserTypeError || removeSiteNameError || updateSiteNameLimitError || resetSiteNameError || removeFrontendOriginError || resetFrontendOriginsError || resetQuotaError) && (
                <div className="mt-4 rounded-2xl bg-error/10 p-3 text-xs text-error space-y-1">
                  {updateError && <p>密码修改失败: {updateError}</p>}
                  {updateRoleError && <p>角色修改失败: {updateRoleError}</p>}
                  {updateUserTypeError && <p>类型修改失败: {updateUserTypeError}</p>}
                  {removeSiteNameError && <p>站点删除失败: {removeSiteNameError}</p>}
                  {updateSiteNameLimitError && <p>站点上限修改失败: {updateSiteNameLimitError}</p>}
                  {resetSiteNameError && <p>站点重置失败: {resetSiteNameError}</p>}
                  {removeFrontendOriginError && <p>前端域名删除失败: {removeFrontendOriginError}</p>}
                  {resetFrontendOriginsError && <p>前端绑定重置失败: {resetFrontendOriginsError}</p>}
                  {resetQuotaError && <p>配额重置失败: {resetQuotaError}</p>}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
            onClick={() => {
              setSettingsUser(null);
              setNewPassword("");
            }}
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
