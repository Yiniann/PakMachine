import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDeleteUser, useRemoveFrontendOrigin, useRemoveSiteName, useResetBuildQuota, useResetFrontendOrigins, useResetSiteName, useUpdatePassword, useUpdateRole, useUpdateSiteNameLimit, useUpdateUserType } from "../../features/users/mutations";
import { useUsersQuery } from "../../features/users/queries";
import { canBuildSpa, getDailyBuildLimit, getUserTypeBadgeClass, getUserTypeLabel, normalizeUserType } from "../../lib/userAccess";
const UserDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const userId = Number(params.id);
  const currentEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
  const { data, error, isLoading } = useUsersQuery();
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
  const user = useMemo(() => data?.find((item) => item.id === userId) ?? null, [data, userId]);
  const isSelf = Boolean(currentEmail && user && user.email === currentEmail);
  const [roleValue, setRoleValue] = useState("user");
  const [userTypeValue, setUserTypeValue] = useState("pending");
  const [siteNameLimitValue, setSiteNameLimitValue] = useState("1");
  const [newPassword, setNewPassword] = useState("");
  useEffect(() => {
    if (!user) return;
    setRoleValue(user.role);
    setUserTypeValue(normalizeUserType(user.userType));
    setSiteNameLimitValue(String(Math.max(Number(user.siteNameLimit ?? 1) || 1, 1)));
    setNewPassword("");
  }, [user]);
  const errorMessage = error && error?.response?.data?.error ? error.response.data.error : error instanceof Error ? error.message : null;
  const mutationError = (mutation) => mutation && mutation?.response?.data?.error ? mutation.response.data.error : mutation instanceof Error ? mutation.message : null;
  const getQuotaLeft = () => {
    if (!user) return 0;
    const limit = getDailyBuildLimit(user.role, user.userType);
    if (user.role !== "admin" && !canBuildSpa(user.role, user.userType)) return 0;
    if (!user.buildQuotaDate) return limit;
    const isToday = new Date(user.buildQuotaDate).toDateString() === new Date().toDateString();
    const used = user.buildQuotaUsed ?? 0;
    return isToday ? Math.max(limit - used, 0) : limit;
  };
  const getQuotaLabel = () => {
    if (!user) return "-";
    if (user.role !== "admin" && !canBuildSpa(user.role, user.userType)) return "未开通";
    const limit = getDailyBuildLimit(user.role, user.userType);
    return limit >= Number.MAX_SAFE_INTEGER / 2 ? "∞" : `${getQuotaLeft()} / ${limit}`;
  };
  if (isLoading) {
    return _jsx("div", { className: "flex justify-center py-12", children: _jsx("span", { className: "loading loading-spinner loading-lg" }) });
  }
  if (!user) {
    return _jsxs("div", {
      className: "space-y-4",
      children: [
        _jsxs("div", {
          className: "flex items-center justify-between gap-3",
          children: [
            _jsxs("div", {
              children: [
                _jsx("p", { className: "workspace-kicker", children: "User Settings" }),
                _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "用户详情" }),
              ],
            }),
            _jsx(Link, { to: "/admin/users", className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm", children: "返回用户列表" }),
          ],
        }),
        _jsx("div", {
          role: "alert",
          className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700",
          children: _jsx("span", { children: errorMessage || "未找到该用户" }),
        }),
      ],
    });
  }
  const onPasswordSubmit = (e) => {
    e.preventDefault();
    updatePassword.mutate({ email: user.email, newPassword }, { onSuccess: () => setNewPassword("") });
  };
  const onRoleSubmit = () => updateRole.mutate({ email: user.email, role: roleValue });
  const onUserTypeSubmit = () => updateUserType.mutate({ email: user.email, userType: userTypeValue });
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsxs("div", {
        className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        children: [
          _jsxs("div", {
            children: [
              _jsx("p", { className: "workspace-kicker", children: "User Settings" }),
              _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "用户详情" }),
              _jsxs("p", {
                className: "mt-2 text-[15px] text-slate-500",
                children: ["当前用户：", _jsx("span", { className: "font-mono font-semibold text-slate-700", children: user.email })],
              }),
            ],
          }),
          _jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: [
              _jsx(Link, { to: "/admin/users", className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm", children: "返回列表" }),
              _jsx("button", { type: "button", className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", onClick: () => navigate("/admin/users"), children: "回到用户管理" }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        children: [
          _jsxs("div", {
            className: "workspace-card p-4",
            children: [
              _jsx("div", { className: "text-[11px] uppercase tracking-[0.22em] text-base-content/45", children: "角色" }),
              _jsxs("div", {
                className: "mt-1 flex items-center gap-2",
                children: [
                  _jsx("span", {
                    className: `badge badge-sm ${user.role === "admin" ? "badge-primary" : getUserTypeBadgeClass(user.userType)}`,
                    children: user.role === "admin" ? "管理员" : getUserTypeLabel(user.userType),
                  }),
                  _jsx("span", { className: "text-sm font-medium text-slate-700", children: user.role === "admin" ? "高权限账户" : "普通账户" }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "workspace-card p-4",
            children: [_jsx("div", { className: "text-[11px] uppercase tracking-[0.22em] text-base-content/45", children: "站点名" }), _jsx("div", { className: "mt-1 text-lg font-semibold text-slate-900", children: user.siteName ?? "未设置" })],
          }),
          _jsxs("div", {
            className: "workspace-card p-4",
            children: [_jsx("div", { className: "text-[11px] uppercase tracking-[0.22em] text-base-content/45", children: "前端绑定" }), _jsx("div", { className: "mt-1 text-lg font-semibold text-slate-900", children: user.frontendOrigins?.length ? `${user.frontendOrigins.length} 个` : "未绑定" })],
          }),
          _jsxs("div", {
            className: "workspace-card p-4",
            children: [_jsx("div", { className: "text-[11px] uppercase tracking-[0.22em] text-base-content/45", children: "今日配额" }), _jsx("div", { className: "mt-1 text-lg font-semibold text-slate-900", children: getQuotaLabel() })],
          }),
        ],
      }),
      errorMessage &&
        _jsx("div", {
          role: "alert",
          className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700",
          children: _jsx("span", { children: errorMessage }),
        }),
      _jsxs("div", {
        className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]",
        children: [
          _jsxs("div", {
            className: "space-y-4",
            children: [
              _jsxs("section", {
                className: "workspace-card p-5",
                children: [
                  _jsxs("div", {
                    className: "flex flex-wrap items-center justify-between gap-2",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", { className: "text-[11px] text-base-content/60", children: "站点名称" }),
                          _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "站点名称列表" }),
                        ],
                      }),
                      _jsxs("span", {
                        className: "badge badge-xs badge-neutral",
                        children: [user.sites?.length ?? 0, " / ", Math.max(Number(user.siteNameLimit ?? 1) || 1, 1)],
                      }),
                    ],
                  }),
                  _jsx("div", {
                    className: "mt-3 space-y-2 text-xs text-base-content/80",
                    children: user.sites?.length ? (
                      user.sites.map((site) =>
                        _jsxs("div", {
                          className: "flex items-center gap-2 rounded-2xl bg-base-200/40 px-3 py-2.5",
                          children: [
                            _jsx("div", { className: "min-w-0 flex-1 truncate font-medium", title: site.name, children: site.name }),
                            _jsx("span", { className: "text-[11px] text-base-content/50", children: ["ID ", site.id] }),
                            _jsx("button", {
                              type: "button",
                              className: "inline-flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-rose-500",
                              disabled: removeSiteName.status === "pending",
                              onClick: async () => {
                                if (!window.confirm(`确定删除 ${user.email} 的站点名称 ${site.name} 吗？`)) return;
                                await removeSiteName.mutateAsync({ email: user.email, siteId: site.id, siteName: site.name });
                              },
                              children: "删除",
                            }),
                          ],
                        }, site.id),
                      )
                    ) : (
                      _jsx("div", { className: "rounded-2xl bg-base-200/40 px-3 py-3 text-sm text-base-content/60", children: "-" })
                    ),
                  }),
                  _jsxs("div", {
                    className: "mt-3 flex flex-col gap-2 sm:flex-row",
                    children: [
                      _jsx("input", {
                        type: "number",
                        min: 1,
                        className: "workspace-input input input-bordered h-11 w-full rounded-2xl",
                        value: siteNameLimitValue,
                        onChange: (e) => setSiteNameLimitValue(e.target.value),
                      }),
                      _jsx("button", {
                        type: "button",
                        className: "landing-button-primary inline-flex h-11 min-h-0 items-center justify-center rounded-2xl px-4 py-0 text-xs whitespace-nowrap leading-none sm:w-24 sm:text-sm",
                        disabled: updateSiteNameLimit.status === "pending",
                        onClick: () => {
                          const parsed = Number(siteNameLimitValue);
                          if (!Number.isFinite(parsed) || parsed < 1) return;
                          updateSiteNameLimit.mutate({ email: user.email, siteNameLimit: Math.floor(parsed) });
                        },
                        children: updateSiteNameLimit.status === "pending" ? "保存中..." : "保存",
                      }),
                    ],
                  }),
                  _jsx("button", {
                    type: "button",
                    className: "mt-3 inline-flex h-8 min-h-0 items-center justify-center rounded-full px-2 py-0 text-xs font-medium leading-none text-rose-600",
                    disabled: resetSiteName.status === "pending",
                    onClick: () => {
                      if (!window.confirm(`确定要清空 ${user.email} 的全部站点名称吗？`)) return;
                      resetSiteName.mutate({ email: user.email });
                    },
                    children: resetSiteName.status === "pending" ? "清空中..." : "清空全部站点名称",
                  }),
                ],
              }),
              _jsxs("section", {
                className: "workspace-card p-5",
                children: [
                  _jsxs("div", {
                    className: "flex flex-wrap items-center justify-between gap-2",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", { className: "text-[11px] text-base-content/60", children: "已绑定前端" }),
                          _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "前端域名列表" }),
                        ],
                      }),
                      _jsx("span", { className: "badge badge-xs badge-neutral", children: `${user.frontendOrigins?.length ?? 0} 个` }),
                    ],
                  }),
                  _jsx("div", {
                    className: "mt-3 space-y-2 text-xs text-base-content/80",
                    children: user.frontendOrigins?.length ? (
                      user.frontendOrigins.map((origin) =>
                        _jsxs("div", {
                          className: "flex items-center gap-2 rounded-2xl bg-base-200/40 px-3 py-2.5",
                          children: [
                            _jsx("div", { className: "min-w-0 flex-1 truncate", title: origin, children: origin }),
                            _jsx("button", {
                              type: "button",
                              className: "inline-flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-rose-500",
                              disabled: removeFrontendOrigin.status === "pending",
                              onClick: () => {
                                if (!window.confirm(`确定删除 ${user.email} 的前端域名 ${origin} 吗？`)) return;
                                removeFrontendOrigin.mutate({ email: user.email, frontendOrigin: origin });
                              },
                              children: "删除",
                            }),
                          ],
                        }, origin),
                      )
                    ) : (
                      _jsx("div", { className: "rounded-2xl bg-base-200/40 px-3 py-3 text-sm text-base-content/60", children: "-" })
                    ),
                  }),
                  user.frontendOrigins?.length
                    ? _jsx("button", {
                        type: "button",
                        className: "mt-3 inline-flex h-8 min-h-0 items-center justify-center rounded-full px-2 py-0 text-xs font-medium leading-none text-rose-600",
                        disabled: resetFrontendOrigins.status === "pending",
                        onClick: () => {
                          if (!window.confirm(`确定要清空 ${user.email} 的全部前端绑定吗？`)) return;
                          resetFrontendOrigins.mutate({ email: user.email });
                        },
                        children: resetFrontendOrigins.status === "pending" ? "清空中..." : "清空全部绑定",
                      })
                    : null,
                ],
              }),
              _jsxs("section", {
                className: "workspace-card p-5",
                children: [
                  _jsxs("div", {
                    className: "flex flex-wrap items-center justify-between gap-2",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("p", { className: "text-[11px] text-base-content/60", children: "今日构建" }),
                          _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "今日剩余次数" }),
                        ],
                      }),
                      _jsx("span", { className: "text-[11px] font-mono text-base-content/70", children: getQuotaLabel() }),
                    ],
                  }),
                  _jsx("progress", {
                    className: "progress progress-primary mt-3 w-full",
                    value: user.role !== "admin" && canBuildSpa(user.role, user.userType) ? Math.max(getDailyBuildLimit(user.role, user.userType) - getQuotaLeft(), 0) : 0,
                    max: getDailyBuildLimit(user.role, user.userType) >= Number.MAX_SAFE_INTEGER / 2 ? 1 : getDailyBuildLimit(user.role, user.userType),
                  }),
                  _jsx("button", {
                    type: "button",
                    className: "mt-3 inline-flex h-8 min-h-0 items-center justify-center rounded-full px-2 py-0 text-xs font-medium leading-none text-rose-600",
                    disabled: resetBuildQuota.status === "pending",
                    onClick: () => {
                      if (!window.confirm(`确定重置 ${user.email} 的今日构建次数？`)) return;
                      resetBuildQuota.mutate({ email: user.email });
                    },
                    children: resetBuildQuota.status === "pending" ? "重置中..." : "重置计数",
                  }),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className: "space-y-3",
            children: [
              !isSelf &&
                _jsxs("section", {
                  className: "workspace-card p-5",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("p", { className: "text-[11px] text-base-content/60", children: "账号属性" }),
                        _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "角色与档位" }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "mt-3 space-y-3",
                      children: [
                        _jsxs("div", {
                          className: "form-control",
                          children: [
                            _jsx("label", { className: "label py-0.5", children: _jsx("span", { className: "label-text text-[11px]", children: "角色权限" }) }),
                            _jsxs("div", {
                              className: "join w-full",
                              children: [
                                _jsxs("select", {
                                  className: "workspace-select select select-bordered select-sm join-item w-full",
                                  value: roleValue,
                                  onChange: (e) => setRoleValue(e.target.value),
                                  children: [_jsx("option", { value: "user", children: "用户" }), _jsx("option", { value: "admin", children: "管理员" })],
                                }),
                                _jsx("button", {
                                  type: "button",
                                  className: "landing-button-primary join-item inline-flex h-8 min-h-0 w-[4.75rem] shrink-0 items-center justify-center rounded-r-2xl px-2 py-0 text-[11px] leading-none whitespace-nowrap sm:w-20 sm:px-3 sm:text-xs",
                                  disabled: updateRole.status === "pending",
                                  onClick: onRoleSubmit,
                                  children: "确认",
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className: "form-control",
                          children: [
                            _jsx("label", { className: "label py-0.5", children: _jsx("span", { className: "label-text text-[11px]", children: "权限档位" }) }),
                            _jsxs("div", {
                              className: "join w-full",
                              children: [
                                _jsxs("select", {
                                  className: "workspace-select select select-bordered select-sm join-item w-full",
                                  value: userTypeValue,
                                  disabled: roleValue === "admin",
                                  onChange: (e) => setUserTypeValue(e.target.value),
                                  children: [
                                    _jsx("option", { value: "pending", children: "待开通" }),
                                    _jsx("option", { value: "basic", children: "基础版" }),
                                    _jsx("option", { value: "pro", children: "订阅版" }),
                                    _jsx("option", { value: "priority", children: "优先版" }),
                                  ],
                                }),
                                _jsx("button", {
                                  type: "button",
                                  className: "landing-button-primary join-item inline-flex h-8 min-h-0 w-[4.75rem] shrink-0 items-center justify-center rounded-r-2xl px-2 py-0 text-[11px] leading-none whitespace-nowrap sm:w-20 sm:px-3 sm:text-xs",
                                  disabled: updateUserType.status === "pending" || roleValue === "admin",
                                  onClick: onUserTypeSubmit,
                                  children: "确认",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    user.role === "admin" &&
                      _jsx("div", {
                        className: "mt-3 rounded-2xl border border-teal-200 bg-teal-50/80 px-3 py-2 text-xs text-teal-700",
                        children: "管理员账号不区分基础版、订阅版、优先版或待开通。",
                      }),
                  ],
                }),
              _jsxs("section", {
                className: "workspace-card p-5",
                children: [
                  _jsx("div", { children: [_jsx("p", { className: "text-[11px] text-base-content/60", children: "重置密码" }), _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "修改登录密码" })] }),
                  _jsxs("form", {
                    onSubmit: onPasswordSubmit,
                    className: "mt-3 flex flex-col gap-2 sm:flex-row",
                    children: [
                      _jsx("input", {
                        type: "password",
                        value: newPassword,
                        onChange: (e) => setNewPassword(e.target.value),
                        placeholder: "输入新密码",
                        className: "workspace-input input input-bordered input-sm w-full rounded-2xl",
                        required: true,
                      }),
                      _jsx("button", {
                        type: "submit",
                        className: "landing-button-primary inline-flex h-8 min-h-0 items-center justify-center rounded-2xl px-3 py-0 text-xs whitespace-nowrap leading-none sm:w-20 sm:text-xs",
                        disabled: updatePassword.status === "pending",
                        children: "修改",
                      }),
                    ],
                  }),
                ],
              }),
              !isSelf &&
                _jsxs("section", {
                  className: "rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3",
                  children: [
                    _jsxs("div", {
                      className: "flex items-center gap-2 text-sm font-medium text-rose-600",
                      children: [
                        _jsx("svg", {
                          xmlns: "http://www.w3.org/2000/svg",
                          fill: "none",
                          viewBox: "0 0 24 24",
                          strokeWidth: 1.5,
                          stroke: "currentColor",
                          className: "h-4 w-4",
                          children: _jsx("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
                          }),
                        }),
                        "危险操作区域",
                      ],
                    }),
                    _jsx("p", { className: "mt-1.5 text-xs text-rose-700/75", children: "删除账号将清除该用户所有数据且无法恢复。" }),
                    _jsx("button", {
                      className: "mt-3 inline-flex h-8 min-h-0 w-full items-center justify-center rounded-2xl bg-rose-500 px-4 py-0 text-sm font-semibold leading-none text-white",
                      disabled: deleteUser.status === "pending",
                      type: "button",
                      onClick: () => {
                        if (!window.confirm(`确认删除账号 ${user.email} 吗？该操作不可恢复。`)) return;
                        deleteUser.mutate(user.id, { onSuccess: () => navigate("/admin/users") });
                      },
                      children: "删除账号",
                    }),
                  ],
                }),
              (mutationError(updatePassword.error) ||
                mutationError(updateRole.error) ||
                mutationError(updateUserType.error) ||
                mutationError(removeSiteName.error) ||
                mutationError(updateSiteNameLimit.error) ||
                mutationError(resetSiteName.error) ||
                mutationError(removeFrontendOrigin.error) ||
                mutationError(resetFrontendOrigins.error) ||
                mutationError(resetBuildQuota.error) ||
                mutationError(deleteUser.error)) &&
                _jsxs("div", {
                  className: "space-y-1 rounded-2xl bg-error/10 p-3 text-xs text-error",
                  children: [
                    mutationError(updatePassword.error) && _jsxs("p", { children: ["密码修改失败: ", mutationError(updatePassword.error)] }),
                    mutationError(updateRole.error) && _jsxs("p", { children: ["角色修改失败: ", mutationError(updateRole.error)] }),
                    mutationError(updateUserType.error) && _jsxs("p", { children: ["类型修改失败: ", mutationError(updateUserType.error)] }),
                    mutationError(removeSiteName.error) && _jsxs("p", { children: ["站点删除失败: ", mutationError(removeSiteName.error)] }),
                    mutationError(updateSiteNameLimit.error) && _jsxs("p", { children: ["站点上限修改失败: ", mutationError(updateSiteNameLimit.error)] }),
                    mutationError(resetSiteName.error) && _jsxs("p", { children: ["站点重置失败: ", mutationError(resetSiteName.error)] }),
                    mutationError(removeFrontendOrigin.error) && _jsxs("p", { children: ["前端域名删除失败: ", mutationError(removeFrontendOrigin.error)] }),
                    mutationError(resetFrontendOrigins.error) && _jsxs("p", { children: ["前端绑定重置失败: ", mutationError(resetFrontendOrigins.error)] }),
                    mutationError(resetBuildQuota.error) && _jsxs("p", { children: ["配额重置失败: ", mutationError(resetBuildQuota.error)] }),
                    mutationError(deleteUser.error) && _jsxs("p", { children: ["删除账号失败: ", mutationError(deleteUser.error)] }),
                  ],
                }),
            ],
          }),
        ],
      }),
    ],
  });
};
export default UserDetailPage;
