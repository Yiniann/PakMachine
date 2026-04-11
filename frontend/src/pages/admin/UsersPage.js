import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCreateUser } from "../../features/users/mutations";
import { useUsersQuery } from "../../features/users/queries";
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
  const errorMessage = error && error?.response?.data?.error ? error.response.data.error : error instanceof Error ? error.message : null;
  const createError = createUser.error && createUser.error?.response?.data?.error ? createUser.error.response.data.error : createUser.error instanceof Error ? createUser.error.message : null;
  const formattedUsers = useMemo(() => {
    const rows = data?.map((u) => ({
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
  const getQuotaLeft = (u) => {
    const limit = getDailyBuildLimit(u.role, u.userType);
    if (u.role !== "admin" && !canBuildSpa(u.role, u.userType)) return 0;
    if (!u.buildQuotaDate) return limit;
    const isToday = new Date(u.buildQuotaDate).toDateString() === new Date().toDateString();
    const used = u.buildQuotaUsed ?? 0;
    return isToday ? Math.max(limit - used, 0) : limit;
  };
  const getQuotaLabel = (u) => {
    if (u.role !== "admin" && !canBuildSpa(u.role, u.userType)) return "未开通";
    const limit = getDailyBuildLimit(u.role, u.userType);
    return limit >= Number.MAX_SAFE_INTEGER / 2 ? "∞" : `${getQuotaLeft(u)} / ${limit}`;
  };
  const getUserBadgeClass = (u) => {
    if (u.role === "admin") return "badge-primary";
    return getUserTypeBadgeClass(u.userType);
  };
  const onCreate = (e) => {
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
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsxs("div", {
        className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        children: [
          _jsxs("div", {
            children: [
              _jsx("p", { className: "workspace-kicker", children: "Users" }),
              _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "用户管理" }),
              _jsx("p", { className: "mt-2 text-[15px] text-slate-500", children: "管理注册用户、权限及配额。" }),
            ],
          }),
          _jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: [
              _jsxs("select", {
                className: "workspace-select select select-bordered select-sm",
                value: userTypeFilter,
                onChange: (e) => setUserTypeFilter(e.target.value),
                children: [
                  _jsx("option", { value: "all", children: "全部用户" }),
                  _jsx("option", { value: "admin", children: "管理员" }),
                  _jsx("option", { value: "priority", children: "优先版" }),
                  _jsx("option", { value: "pro", children: "订阅版" }),
                  _jsx("option", { value: "basic", children: "基础版" }),
                  _jsx("option", { value: "pending", children: "待开通" }),
                ],
              }),
              _jsxs("button", {
                type: "button",
                className: "landing-button-primary rounded-2xl px-5 py-3 text-sm",
                onClick: () => setCreateOpen(true),
                children: [
                  _jsx("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    strokeWidth: 1.5,
                    stroke: "currentColor",
                    className: "h-4 w-4",
                    children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }),
                  }),
                  "添加用户",
                ],
              }),
            ],
          }),
        ],
      }),
      errorMessage &&
        _jsxs("div", {
          role: "alert",
          className: "workspace-alert flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700",
          children: [
            _jsx("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              className: "h-6 w-6 shrink-0 stroke-current",
              fill: "none",
              viewBox: "0 0 24 24",
              children: _jsx("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: "2",
                d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
              }),
            }),
            _jsx("span", { children: errorMessage }),
          ],
        }),
      _jsx("div", {
        className: "workspace-card p-0 sm:p-6",
        children: _jsxs("div", {
          className: "p-0",
          children: [
            isLoading &&
              _jsx("div", {
                className: "flex justify-center p-4",
                children: _jsx("span", { className: "loading loading-spinner loading-md" }),
              }),
            !isLoading &&
              !errorMessage &&
              _jsxs(_Fragment, {
                children: [
                  _jsx("div", {
                    className: "hidden overflow-x-auto md:block",
                    children: _jsx("div", {
                      className: "workspace-table-shell",
                      children: _jsxs("table", {
                        className: "table table-zebra",
                        children: [
                          _jsx("thead", {
                            children: _jsxs("tr", {
                              children: [
                                _jsx("th", { children: "ID" }),
                                _jsx("th", { children: "邮箱" }),
                                _jsx("th", { children: "站点名" }),
                                _jsx("th", { children: "已绑定前端" }),
                                _jsx("th", { children: "今日剩余构建" }),
                                _jsx("th", { children: "权限档位" }),
                                _jsx("th", { children: "创建时间" }),
                                _jsx("th", { children: "操作" }),
                              ],
                            }),
                          }),
                          _jsx("tbody", {
                            children: formattedUsers.map((u) =>
                              _jsxs("tr", {
                                children: [
                                  _jsx("td", { children: u.id }),
                                  _jsx("td", { children: u.email }),
                                  _jsx("td", { children: u.siteName ?? "未设置" }),
                                  _jsx("td", { children: u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定" }),
                                  _jsx("td", { children: getQuotaLabel(u) }),
                                  _jsx("td", {
                                    children: _jsx("div", {
                                      className: `badge badge-sm ${getUserBadgeClass(u)}`,
                                      children: u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType),
                                    }),
                                  }),
                                  _jsx("td", { children: u.createdAtLabel }),
                                  _jsx("td", {
                                    children: _jsx("button", {
                                      type: "button",
                                      className: "btn btn-xs btn-outline",
                                      onClick: () => navigate(`/admin/users/${u.id}`),
                                      children: "设置",
                                    }),
                                  }),
                                ],
                              }, u.id),
                            ),
                          }),
                        ],
                      }),
                    }),
                  }),
                  _jsx("div", {
                    className: "workspace-table-shell flex flex-col divide-y divide-base-200 md:hidden",
                    children: formattedUsers.map((u) =>
                      _jsxs("div", {
                        className: "space-y-3 p-4",
                        children: [
                          _jsxs("div", {
                            className: "flex items-start justify-between gap-2",
                            children: [
                              _jsxs("div", {
                                children: [
                                  _jsx("div", { className: "break-all font-bold", children: u.email }),
                                  _jsxs("div", { className: "text-xs text-base-content/60", children: ["ID: ", u.id] }),
                                ],
                              }),
                              _jsx("div", {
                                className: `badge badge-sm ${getUserBadgeClass(u)}`,
                                children: u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType),
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "grid grid-cols-2 gap-2 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "flex flex-col",
                                children: [_jsx("span", { className: "text-xs text-base-content/60", children: "站点名" }), _jsx("span", { children: u.siteName ?? "未设置" })],
                              }),
                              _jsxs("div", {
                                className: "flex flex-col",
                                children: [_jsx("span", { className: "text-xs text-base-content/60", children: "已绑定前端" }), _jsx("span", { children: u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定" })],
                              }),
                              _jsxs("div", {
                                className: "flex flex-col",
                                children: [_jsx("span", { className: "text-xs text-base-content/60", children: "剩余构建" }), _jsx("span", { children: getQuotaLabel(u) })],
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "flex items-center justify-between pt-1",
                            children: [
                              _jsx("span", { className: "text-xs text-base-content/50", children: u.createdAtLabel }),
                              _jsx("button", {
                                type: "button",
                                className: "btn btn-xs btn-outline",
                                onClick: () => navigate(`/admin/users/${u.id}`),
                                children: "设置",
                              }),
                            ],
                          }),
                        ],
                      }, u.id),
                    ),
                  }),
                ],
              }),
          ],
        }),
      }),
      createOpen &&
        createPortal(
          _jsxs("div", {
            className: "modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm",
            children: [
              _jsxs("div", {
                className: "modal-box workspace-card max-w-2xl border-0 bg-white/95",
                children: [
                  _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                      _jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "添加用户" }),
                      _jsx("button", {
                        type: "button",
                        className: "landing-button-secondary btn btn-circle btn-sm min-h-0 !h-10 !w-10 !rounded-full !p-0",
                        onClick: () => setCreateOpen(false),
                        children: "✕",
                      }),
                    ],
                  }),
                  _jsxs("form", {
                    onSubmit: onCreate,
                    className: "mt-4 space-y-4",
                    children: [
                      _jsxs("label", {
                        className: "form-control w-full",
                        children: [
                          _jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "邮箱" }) }),
                          _jsx("input", {
                            value: email,
                            onChange: (e) => setEmail(e.target.value),
                            placeholder: "邮箱",
                            className: "workspace-input input input-bordered w-full",
                            required: true,
                          }),
                        ],
                      }),
                      _jsxs("label", {
                        className: "form-control w-full",
                        children: [
                          _jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "密码" }) }),
                          _jsx("input", {
                            type: "password",
                            value: password,
                            onChange: (e) => setPassword(e.target.value),
                            placeholder: "密码",
                            className: "workspace-input input input-bordered w-full",
                            required: true,
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "grid grid-cols-1 gap-4 md:grid-cols-2",
                        children: [
                          _jsxs("label", {
                            className: "form-control w-full",
                            children: [
                              _jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "权限组" }) }),
                              _jsxs("select", {
                                value: role,
                                onChange: (e) => {
                                  const value = e.target.value;
                                  setRole(value);
                                  if (value === "admin") setUserType("pending");
                                },
                                className: "workspace-select select select-bordered w-full",
                                children: [
                                  _jsx("option", { value: "user", children: "用户" }),
                                  _jsx("option", { value: "admin", children: "管理员" }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs("label", {
                            className: "form-control w-full",
                            children: [
                              _jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "权限档位" }) }),
                              _jsxs("select", {
                                value: userType,
                                onChange: (e) => setUserType(e.target.value),
                                className: "workspace-select select select-bordered w-full",
                                disabled: role === "admin",
                                children: [
                                  _jsx("option", { value: "pending", children: "待开通" }),
                                  _jsx("option", { value: "basic", children: "基础版" }),
                                  _jsx("option", { value: "pro", children: "订阅版" }),
                                  _jsx("option", { value: "priority", children: "优先版" }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      role === "admin" && _jsx("p", { className: "text-xs text-base-content/70", children: "管理员账号不区分基础版、订阅版、优先版或待开通。" }),
                      _jsxs("div", {
                        className: "modal-action",
                        children: [
                          _jsx("button", {
                            type: "button",
                            className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm",
                            onClick: () => setCreateOpen(false),
                            children: "取消",
                          }),
                          _jsx("button", {
                            type: "submit",
                            className: "landing-button-primary rounded-2xl px-5 py-3 text-sm",
                            disabled: createUser.status === "pending",
                            children: createUser.status === "pending" ? "创建中..." : "创建",
                          }),
                        ],
                      }),
                    ],
                  }),
                  createError && _jsxs("p", { className: "mt-2 text-error", children: ["失败: ", createError] }),
                ],
              }),
              _jsx("button", {
                type: "button",
                className: "modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
                onClick: () => setCreateOpen(false),
                children: "close",
              }),
            ],
          }),
          document.body,
        ),
    ],
  });
};
export default UsersPage;
