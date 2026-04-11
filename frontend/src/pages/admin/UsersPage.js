import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useUsersQuery } from "../../features/users/queries";
import { useCreateUser, useDeleteUser, useRemoveFrontendOrigin, useResetFrontendOrigins, useResetBuildQuota, useResetSiteName, useUpdatePassword, useRemoveSiteName, useUpdateSiteNameLimit, useUpdateRole, useUpdateUserType, } from "../../features/users/mutations";
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
    const [roleEdit, setRoleEdit] = useState({});
    const [userTypeEdit, setUserTypeEdit] = useState({});
    const [siteNameLimitEdit, setSiteNameLimitEdit] = useState({});
    const [createOpen, setCreateOpen] = useState(false);
    const [settingsUser, setSettingsUser] = useState(null);
    const errorMessage = error && error?.response?.data?.error
        ? error.response.data.error
        : error instanceof Error
            ? error.message
            : null;
    const createError = createUser.error && createUser.error?.response?.data?.error
        ? createUser.error.response.data.error
        : createUser.error instanceof Error
            ? createUser.error.message
            : null;
    const updateError = updatePassword.error && updatePassword.error?.response?.data?.error
        ? updatePassword.error.response.data.error
        : updatePassword.error instanceof Error
            ? updatePassword.error.message
            : null;
    const roleErr = updateRole.error;
    const updateRoleError = roleErr && roleErr.response?.data?.error
        ? roleErr.response.data.error
        : updateRole.error instanceof Error
            ? updateRole.error.message
            : null;
    const userTypeErr = updateUserType.error;
    const updateUserTypeError = userTypeErr && userTypeErr.response?.data?.error
        ? userTypeErr.response.data.error
        : updateUserType.error instanceof Error
            ? updateUserType.error.message
            : null;
    const removeSiteNameErr = removeSiteName.error;
    const removeSiteNameError = removeSiteNameErr && removeSiteNameErr.response?.data?.error
        ? removeSiteNameErr.response.data.error
        : removeSiteName.error instanceof Error
            ? removeSiteName.error.message
            : null;
    const siteNameLimitErr = updateSiteNameLimit.error;
    const updateSiteNameLimitError = siteNameLimitErr && siteNameLimitErr.response?.data?.error
        ? siteNameLimitErr.response.data.error
        : updateSiteNameLimit.error instanceof Error
            ? updateSiteNameLimit.error.message
            : null;
    const resetSiteNameError = resetSiteName.error && resetSiteName.error?.response?.data?.error
        ? resetSiteName.error.response.data.error
        : resetSiteName.error instanceof Error
            ? resetSiteName.error.message
            : null;
    const resetQuotaError = resetBuildQuota.error && resetBuildQuota.error?.response?.data?.error
        ? resetBuildQuota.error.response.data.error
        : resetBuildQuota.error instanceof Error
            ? resetBuildQuota.error.message
            : null;
    const resetFrontendOriginsError = resetFrontendOrigins.error && resetFrontendOrigins.error?.response?.data?.error
        ? resetFrontendOrigins.error.response.data.error
        : resetFrontendOrigins.error instanceof Error
            ? resetFrontendOrigins.error.message
            : null;
    const removeFrontendOriginError = removeFrontendOrigin.error && removeFrontendOrigin.error?.response?.data?.error
        ? removeFrontendOrigin.error.response.data.error
        : removeFrontendOrigin.error instanceof Error
            ? removeFrontendOrigin.error.message
            : null;
    const onCreate = (e) => {
        e.preventDefault();
        createUser.mutate({ email, password, role, userType }, {
            onSuccess: () => {
                setEmail("");
                setPassword("");
                setRole("user");
                setUserType("pending");
                setCreateOpen(false);
            },
        });
    };
    const onReset = (e) => {
        e.preventDefault();
        updatePassword.mutate({ email: resetEmail, newPassword }, {
            onSuccess: () => {
                setResetEmail("");
                setNewPassword("");
                setSettingsUser(null);
            },
        });
    };
    const formattedUsers = useMemo(() => {
        const rows = data?.map((u) => ({
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
    const getQuotaLeft = (u) => {
        const limit = getDailyBuildLimit(u.role, u.userType);
        if (u.role !== "admin" && !canBuildSpa(u.role, u.userType))
            return 0;
        if (!u.buildQuotaDate)
            return limit;
        const isToday = new Date(u.buildQuotaDate).toDateString() === new Date().toDateString();
        const used = u.buildQuotaUsed ?? 0;
        return isToday ? Math.max(limit - used, 0) : limit;
    };
    const getQuotaLabel = (u) => {
        if (u.role !== "admin" && !canBuildSpa(u.role, u.userType))
            return "未开通";
        const limit = getDailyBuildLimit(u.role, u.userType);
        return limit >= Number.MAX_SAFE_INTEGER / 2 ? "∞" : `${getQuotaLeft(u)} / ${limit}`;
    };
    const getUserBadgeClass = (u) => {
        if (u.role === "admin")
            return "badge-primary";
        return getUserTypeBadgeClass(u.userType);
    };
    const getRoleValue = (u) => roleEdit[u.email] ?? u.role;
    const getUserTypeValue = (u) => normalizeUserType(userTypeEdit[u.email] ?? u.userType ?? "pending");
    const isSelf = (u) => Boolean(currentEmail && u.email === currentEmail);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Users" }), _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u7528\u6237\u7BA1\u7406" }), _jsx("p", { className: "mt-2 text-[15px] text-slate-500", children: "\u7BA1\u7406\u6CE8\u518C\u7528\u6237\u3001\u6743\u9650\u53CA\u914D\u989D\u3002" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("select", { className: "workspace-select select select-bordered select-sm", value: userTypeFilter, onChange: (e) => setUserTypeFilter(e.target.value), children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u7528\u6237" }), _jsx("option", { value: "admin", children: "\u7BA1\u7406\u5458" }), _jsx("option", { value: "priority", children: "\u4F18\u5148\u7248" }), _jsx("option", { value: "pro", children: "\u8BA2\u9605\u7248" }), _jsx("option", { value: "basic", children: "\u57FA\u7840\u7248" }), _jsx("option", { value: "pending", children: "\u5F85\u5F00\u901A" })] }), _jsxs("button", { className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", onClick: () => setCreateOpen(true), children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-4 h-4", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }), "\u6DFB\u52A0\u7528\u6237"] })] })] }), errorMessage && (_jsxs("div", { role: "alert", className: "workspace-alert flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: errorMessage })] })), _jsx("div", { className: "workspace-card p-0 sm:p-6", children: _jsxs("div", { className: "p-0", children: [isLoading && _jsx("div", { className: "flex justify-center p-4", children: _jsx("span", { className: "loading loading-spinner loading-md" }) }), !isLoading && !errorMessage && (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto hidden md:block", children: _jsx("div", { className: "workspace-table-shell", children: _jsxs("table", { className: "table table-zebra", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "\u90AE\u7BB1" }), _jsx("th", { children: "\u7AD9\u70B9\u540D" }), _jsx("th", { children: "\u5DF2\u7ED1\u5B9A\u524D\u7AEF" }), _jsx("th", { children: "\u4ECA\u65E5\u5269\u4F59\u6784\u5EFA" }), _jsx("th", { children: "\u6743\u9650\u6863\u4F4D" }), _jsx("th", { children: "\u521B\u5EFA\u65F6\u95F4" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: formattedUsers.map((u) => (_jsxs("tr", { children: [_jsx("td", { children: u.id }), _jsx("td", { children: u.email }), _jsx("td", { children: u.siteName ?? "未设置" }), _jsx("td", { children: u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定" }), _jsx("td", { children: getQuotaLabel(u) }), _jsx("td", { children: _jsx("div", { className: `badge badge-sm ${getUserBadgeClass(u)}`, children: u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType) }) }), _jsx("td", { children: u.createdAtLabel }), _jsx("td", { children: _jsx("button", { className: "btn btn-xs", onClick: () => {
                                                                        setSettingsUser(u);
                                                                        setRoleEdit({ [u.email]: u.role });
                                                                        setUserTypeEdit({ [u.email]: normalizeUserType(u.userType) });
                                                                        setSiteNameLimitEdit({ [u.email]: String(Math.max(Number(u.siteNameLimit ?? 1) || 1, 1)) });
                                                                        setResetEmail(u.email);
                                                                        setNewPassword("");
                                                                    }, children: "\u8BBE\u7F6E" }) })] }, u.id))) })] }) }) }), _jsx("div", { className: "workspace-table-shell md:hidden flex flex-col divide-y divide-base-200", children: formattedUsers.map((u) => (_jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("div", { className: "font-bold break-all", children: u.email }), _jsxs("div", { className: "text-xs text-base-content/60", children: ["ID: ", u.id] })] }), _jsx("div", { className: `badge badge-sm ${getUserBadgeClass(u)}`, children: u.role === "admin" ? "管理员" : getUserTypeLabel(u.userType) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs text-base-content/60", children: "\u7AD9\u70B9\u540D" }), _jsx("span", { children: u.siteName ?? "未设置" })] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs text-base-content/60", children: "\u5DF2\u7ED1\u5B9A\u524D\u7AEF" }), _jsx("span", { children: u.frontendOrigins?.length ? `${u.frontendOrigins.length} 个` : "未绑定" })] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-xs text-base-content/60", children: "\u5269\u4F59\u6784\u5EFA" }), _jsx("span", { children: getQuotaLabel(u) })] })] }), _jsxs("div", { className: "flex justify-between items-center pt-1", children: [_jsx("span", { className: "text-xs text-base-content/50", children: u.createdAtLabel }), _jsx("button", { className: "btn btn-xs btn-outline", onClick: () => {
                                                            setSettingsUser(u);
                                                            setRoleEdit({ [u.email]: u.role });
                                                            setUserTypeEdit({ [u.email]: normalizeUserType(u.userType) });
                                                            setSiteNameLimitEdit({ [u.email]: String(Math.max(Number(u.siteNameLimit ?? 1) || 1, 1)) });
                                                            setResetEmail(u.email);
                                                            setNewPassword("");
                                                        }, children: "\u8BBE\u7F6E" })] })] }, u.id))) })] }))] }) }), createOpen && createPortal(_jsxs("div", { className: "modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm", children: [_jsxs("div", { className: "modal-box workspace-card max-w-2xl border-0 bg-white/95", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "\u6DFB\u52A0\u7528\u6237" }), _jsx("button", { className: "landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0", onClick: () => setCreateOpen(false), children: "\u2715" })] }), _jsxs("form", { onSubmit: onCreate, className: "space-y-3 mt-4", children: [_jsxs("label", { className: "form-control w-full", children: [_jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "\u90AE\u7BB1" }) }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "\u90AE\u7BB1", className: "workspace-input input input-bordered w-full", required: true })] }), _jsxs("label", { className: "form-control w-full", children: [_jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "\u5BC6\u7801" }) }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u5BC6\u7801", className: "workspace-input input input-bordered w-full", required: true })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("label", { className: "form-control w-full", children: [_jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "\u6743\u9650\u7EC4" }) }), _jsxs("select", { value: role, onChange: (e) => {
                                                            const value = e.target.value;
                                                            setRole(value);
                                                            if (value === "admin") {
                                                                setUserType("pending");
                                                            }
                                                        }, className: "workspace-select select select-bordered w-full", children: [_jsx("option", { value: "user", children: "\u7528\u6237" }), _jsx("option", { value: "admin", children: "\u7BA1\u7406\u5458" })] })] }), _jsxs("label", { className: "form-control w-full", children: [_jsx("div", { className: "label", children: _jsx("span", { className: "label-text", children: "\u6743\u9650\u6863\u4F4D" }) }), _jsxs("select", { value: userType, onChange: (e) => setUserType(e.target.value), className: "workspace-select select select-bordered w-full", disabled: role === "admin", children: [_jsx("option", { value: "pending", children: "\u5F85\u5F00\u901A" }), _jsx("option", { value: "basic", children: "\u57FA\u7840\u7248" }), _jsx("option", { value: "pro", children: "\u8BA2\u9605\u7248" }), _jsx("option", { value: "priority", children: "\u4F18\u5148\u7248" })] })] })] }), role === "admin" && _jsx("p", { className: "text-xs text-base-content/70", children: "\u7BA1\u7406\u5458\u8D26\u53F7\u4E0D\u533A\u5206\u57FA\u7840\u7248\u3001\u8BA2\u9605\u7248\u3001\u4F18\u5148\u7248\u6216\u5F85\u5F00\u901A\u3002" }), _jsxs("div", { className: "modal-action", children: [_jsx("button", { type: "button", className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm", onClick: () => setCreateOpen(false), children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", disabled: createUser.status === "pending", children: createUser.status === "pending" ? "创建中..." : "创建" })] })] }), createError && _jsxs("p", { className: "text-error mt-2", children: ["\u5931\u8D25: ", createError] })] }), _jsx("button", { type: "button", className: "modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent", onClick: () => setCreateOpen(false), children: "close" })] }), document.body), settingsUser && createPortal(_jsxs("div", { className: "modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm", children: [_jsxs("div", { className: "modal-box workspace-card max-w-4xl max-h-[85vh] overflow-y-auto border-0 bg-white/95 p-5 sm:p-6", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-bold tracking-[-0.03em] text-slate-900", children: "\u7528\u6237\u8BBE\u7F6E" }), _jsx("button", { className: "landing-button-secondary btn btn-sm btn-circle min-h-0 !h-9 !w-9 !rounded-full !p-0", onClick: () => {
                                            setSettingsUser(null);
                                            setNewPassword("");
                                        }, children: "\u2715" })] }), _jsxs("div", { className: "mb-4 text-xs text-base-content/70 sm:text-sm break-all", children: ["\u5F53\u524D\u7528\u6237\uFF1A", _jsx("span", { className: "font-mono text-base-content font-semibold", children: settingsUser.email })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("section", { className: "border-b border-base-200 pb-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] text-base-content/60", children: "\u7AD9\u70B9\u540D\u79F0" }), _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "\u7AD9\u70B9\u540D\u79F0\u5217\u8868" })] }), _jsxs("span", { className: "badge badge-xs badge-neutral", children: [settingsUser.sites?.length ?? 0, " / ", Math.max(Number(settingsUser.siteNameLimit ?? 1) || 1, 1)] })] }), _jsx("div", { className: "mt-2 space-y-1.5 text-xs text-base-content/80", children: settingsUser.sites?.length ? (settingsUser.sites.map((site) => (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-base-200/40 px-3 py-2", children: [_jsx("div", { className: "min-w-0 flex-1 truncate font-medium", title: site.name, children: site.name }), _jsxs("span", { className: "text-[11px] text-base-content/50", children: ["ID ", site.id] }), _jsx("button", { type: "button", className: "inline-flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-rose-500", disabled: removeSiteName.status === "pending", onClick: async () => {
                                                                if (!window.confirm(`确定删除 ${settingsUser.email} 的站点名称 ${site.name} 吗？`))
                                                                    return;
                                                                try {
                                                                    const data = await removeSiteName.mutateAsync({ email: settingsUser.email, siteId: site.id, siteName: site.name });
                                                                    setSettingsUser((prev) => prev
                                                                        ? {
                                                                            ...prev,
                                                                            sites: data.sites?.length > 0
                                                                                ? data.sites
                                                                                : (prev.sites ?? []).filter((item) => item.id !== site.id),
                                                                            siteName: data.siteName,
                                                                        }
                                                                        : prev);
                                                                    queryClient.invalidateQueries({ queryKey: ["users"] });
                                                                }
                                                                catch (_a) {
                                                                    // error state is already surfaced below in the modal
                                                                }
                                                            }, children: "\u5220\u9664" })] }, site.id)))) : (_jsx("div", { className: "rounded-lg bg-base-200/40 px-3 py-2 text-sm text-base-content/60", children: "-" })) }), _jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [_jsx("input", { type: "number", min: 1, className: "workspace-input input input-bordered h-10 w-full", value: siteNameLimitEdit[settingsUser.email] ?? String(Math.max(Number(settingsUser.siteNameLimit ?? 1) || 1, 1)), onChange: (e) => setSiteNameLimitEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value })) }), _jsx("button", { type: "button", className: "landing-button-primary inline-flex h-10 items-center justify-center rounded-2xl px-3 text-xs whitespace-nowrap leading-none sm:w-24 sm:px-4 sm:text-sm", disabled: updateSiteNameLimit.status === "pending", onClick: () => {
                                                            const parsed = Number(siteNameLimitEdit[settingsUser.email] ?? settingsUser.siteNameLimit ?? 1);
                                                            if (!Number.isFinite(parsed) || parsed < 1)
                                                                return;
                                                            updateSiteNameLimit.mutate({ email: settingsUser.email, siteNameLimit: Math.floor(parsed) }, {
                                                                onSuccess: (data) => {
                                                                    setSettingsUser((prev) => (prev ? { ...prev, siteNameLimit: data.siteNameLimit } : prev));
                                                                    setSiteNameLimitEdit((prev) => ({ ...prev, [settingsUser.email]: String(data.siteNameLimit) }));
                                                                },
                                                            });
                                                        }, children: updateSiteNameLimit.status === "pending" ? "保存中..." : "保存" })] }), _jsx("button", { type: "button", className: "mt-2 inline-flex h-7 items-center justify-center rounded-full px-1.5 text-xs font-medium leading-none text-rose-600", disabled: resetSiteName.status === "pending", onClick: () => {
                                                    if (!window.confirm(`确定要清空 ${settingsUser.email} 的全部站点名称吗？`))
                                                        return;
                                                    resetSiteName.mutate({ email: settingsUser.email }, { onSuccess: () => setSettingsUser((prev) => (prev ? { ...prev, siteName: null, sites: [] } : prev)) });
                                                }, children: resetSiteName.status === "pending" ? "清空中..." : "清空全部站点名称" })] }), _jsxs("section", { className: "border-b border-base-200 pb-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] text-base-content/60", children: "\u5DF2\u7ED1\u5B9A\u524D\u7AEF" }), _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "\u524D\u7AEF\u57DF\u540D\u5217\u8868" })] }), settingsUser.frontendOrigins?.length ? (_jsxs("span", { className: "badge badge-xs badge-neutral", children: [settingsUser.frontendOrigins.length, " \u4E2A"] })) : (_jsx("span", { className: "badge badge-xs badge-ghost", children: "\u672A\u7ED1\u5B9A" }))] }), _jsx("div", { className: "mt-2 space-y-1.5 text-xs text-base-content/80", children: settingsUser.frontendOrigins?.length ? (settingsUser.frontendOrigins.map((origin) => (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-base-200/40 px-3 py-2", children: [_jsx("div", { className: "min-w-0 flex-1 truncate", title: origin, children: origin }), _jsx("button", { type: "button", className: "inline-flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-rose-500", disabled: removeFrontendOrigin.status === "pending", onClick: () => {
                                                                if (!window.confirm(`确定删除 ${settingsUser.email} 的前端域名 ${origin} 吗？`))
                                                                    return;
                                                                removeFrontendOrigin.mutate({ email: settingsUser.email, frontendOrigin: origin }, {
                                                                    onSuccess: (data) => setSettingsUser((prev) => (prev ? { ...prev, frontendOrigins: data.frontendOrigins } : prev)),
                                                                });
                                                            }, children: "\u5220\u9664" })] }, origin)))) : (_jsx("div", { className: "rounded-lg bg-base-200/40 px-3 py-2 text-sm text-base-content/60", children: "-" })) }), settingsUser.frontendOrigins?.length ? (_jsx("button", { type: "button", className: "mt-2 inline-flex h-7 items-center justify-center rounded-full px-1.5 text-xs font-medium leading-none text-rose-600", disabled: resetFrontendOrigins.status === "pending", onClick: () => {
                                                    if (!window.confirm(`确定要清空 ${settingsUser.email} 的全部前端绑定吗？`))
                                                        return;
                                                    resetFrontendOrigins.mutate({ email: settingsUser.email }, { onSuccess: () => setSettingsUser((prev) => (prev ? { ...prev, frontendOrigins: [] } : prev)) });
                                                }, children: resetFrontendOrigins.status === "pending" ? "清空中..." : "清空全部绑定" })) : null] }), _jsxs("section", { className: "border-b border-base-200 pb-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] text-base-content/60", children: "\u4ECA\u65E5\u6784\u5EFA" }), _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "\u4ECA\u65E5\u5269\u4F59\u6B21\u6570" })] }), _jsx("span", { className: "text-[11px] font-mono text-base-content/70", children: getQuotaLabel(settingsUser) })] }), _jsx("progress", { className: "progress progress-primary mt-2 w-full", value: canBuildSpa(settingsUser.role, settingsUser.userType) ? Math.max(getDailyBuildLimit(settingsUser.role, settingsUser.userType) - getQuotaLeft(settingsUser), 0) : 0, max: getDailyBuildLimit(settingsUser.role, settingsUser.userType) >= Number.MAX_SAFE_INTEGER / 2 ? 1 : getDailyBuildLimit(settingsUser.role, settingsUser.userType) }), _jsx("button", { type: "button", className: "mt-2 inline-flex h-7 items-center justify-center rounded-full px-1.5 text-xs font-medium leading-none text-rose-600", disabled: resetBuildQuota.status === "pending", onClick: () => {
                                                    if (!window.confirm(`确定重置 ${settingsUser.email} 的今日构建次数？`))
                                                        return;
                                                    resetBuildQuota.mutate({ email: settingsUser.email }, {
                                                        onSuccess: () => setSettingsUser((prev) => (prev ? { ...prev, buildQuotaUsed: 0, buildQuotaDate: null } : prev)),
                                                    });
                                                }, children: resetBuildQuota.status === "pending" ? "重置中..." : "重置计数" })] }), !isSelf(settingsUser) && (_jsxs("section", { className: "border-b border-base-200 pb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] text-base-content/60", children: "\u8D26\u53F7\u5C5E\u6027" }), _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "\u89D2\u8272\u4E0E\u6863\u4F4D" })] }), _jsxs("div", { className: "mt-2 space-y-2.5", children: [_jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label py-0.5", children: _jsx("span", { className: "label-text text-[11px]", children: "\u89D2\u8272\u6743\u9650" }) }), _jsxs("div", { className: "join w-full", children: [_jsxs("select", { className: "workspace-select select select-bordered select-sm join-item w-full", value: getRoleValue(settingsUser), onChange: (e) => setRoleEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value })), children: [_jsx("option", { value: "user", children: "\u7528\u6237" }), _jsx("option", { value: "admin", children: "\u7BA1\u7406\u5458" })] }), _jsx("button", { className: "landing-button-primary join-item inline-flex h-8 min-h-0 w-[4.75rem] shrink-0 items-center justify-center rounded-r-2xl px-2 py-0 text-[11px] leading-none whitespace-nowrap sm:w-20 sm:px-3 sm:text-xs", disabled: updateRole.status === "pending", onClick: () => updateRole.mutate({ email: settingsUser.email, role: getRoleValue(settingsUser) }), children: "\u786E\u8BA4" })] })] }), _jsxs("div", { className: "form-control", children: [_jsx("label", { className: "label py-0.5", children: _jsx("span", { className: "label-text text-[11px]", children: "\u6743\u9650\u6863\u4F4D" }) }), _jsxs("div", { className: "join w-full", children: [_jsxs("select", { className: "workspace-select select select-bordered select-sm join-item w-full", value: getUserTypeValue(settingsUser), disabled: getRoleValue(settingsUser) === "admin", onChange: (e) => setUserTypeEdit((prev) => ({ ...prev, [settingsUser.email]: e.target.value })), children: [_jsx("option", { value: "pending", children: "\u5F85\u5F00\u901A" }), _jsx("option", { value: "basic", children: "\u57FA\u7840\u7248" }), _jsx("option", { value: "pro", children: "\u8BA2\u9605\u7248" }), _jsx("option", { value: "priority", children: "\u4F18\u5148\u7248" })] }), _jsx("button", { className: "landing-button-primary join-item inline-flex h-8 min-h-0 w-[4.75rem] shrink-0 items-center justify-center rounded-r-2xl px-2 py-0 text-[11px] leading-none whitespace-nowrap sm:w-20 sm:px-3 sm:text-xs", disabled: updateUserType.status === "pending" || getRoleValue(settingsUser) === "admin", onClick: () => updateUserType.mutate({ email: settingsUser.email, userType: getUserTypeValue(settingsUser) }), children: "\u786E\u8BA4" })] })] })] })] })), _jsxs("section", { className: "border-b border-base-200 pb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] text-base-content/60", children: "\u91CD\u7F6E\u5BC6\u7801" }), _jsx("h4", { className: "mt-1 text-sm font-semibold text-slate-900", children: "\u4FEE\u6539\u767B\u5F55\u5BC6\u7801" })] }), _jsxs("form", { onSubmit: onReset, className: "mt-2 flex flex-col gap-2 sm:flex-row", children: [_jsx("input", { type: "password", value: newPassword, onChange: (e) => {
                                                            setNewPassword(e.target.value);
                                                            setResetEmail(settingsUser.email);
                                                        }, placeholder: "\u8F93\u5165\u65B0\u5BC6\u7801", className: "workspace-input input input-bordered input-sm w-full", required: true }), _jsx("button", { type: "submit", className: "landing-button-primary inline-flex h-10 items-center justify-center rounded-2xl px-3 text-xs whitespace-nowrap leading-none sm:w-20 sm:px-4 sm:text-sm", disabled: updatePassword.status === "pending", children: "\u4FEE\u6539" })] })] }), !isSelf(settingsUser) && (_jsxs("section", { className: "rounded-lg border border-error/20 bg-error/5 px-4 py-3", children: [_jsx("input", { type: "checkbox", className: "hidden" }), _jsxs("div", { className: "text-error text-sm font-medium flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-4 h-4", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" }) }), "\u5371\u9669\u64CD\u4F5C\u533A\u57DF"] }), _jsx("p", { className: "mt-1.5 text-xs opacity-70", children: "\u5220\u9664\u8D26\u53F7\u5C06\u6E05\u9664\u8BE5\u7528\u6237\u6240\u6709\u6570\u636E\u4E14\u65E0\u6CD5\u6062\u590D\u3002" }), _jsx("button", { className: "mt-2 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-semibold leading-none text-white", disabled: deleteUser.status === "pending", onClick: () => {
                                                    if (!window.confirm(`确认删除账号 ${settingsUser.email} 吗？该操作不可恢复。`))
                                                        return;
                                                    deleteUser.mutate(settingsUser.id, {
                                                        onSuccess: () => setSettingsUser(null),
                                                    });
                                                }, children: "\u5220\u9664\u8D26\u53F7" })] }))] }), (updateError || updateRoleError || updateUserTypeError || removeSiteNameError || updateSiteNameLimitError || resetSiteNameError || removeFrontendOriginError || resetFrontendOriginsError || resetQuotaError) && (_jsxs("div", { className: "mt-4 p-3 bg-error/10 text-error text-xs rounded-lg space-y-1", children: [updateError && _jsxs("p", { children: ["\u5BC6\u7801\u4FEE\u6539\u5931\u8D25: ", updateError] }), updateRoleError && _jsxs("p", { children: ["\u89D2\u8272\u4FEE\u6539\u5931\u8D25: ", updateRoleError] }), updateUserTypeError && _jsxs("p", { children: ["\u7C7B\u578B\u4FEE\u6539\u5931\u8D25: ", updateUserTypeError] }), removeSiteNameError && _jsxs("p", { children: ["\u7AD9\u70B9\u5220\u9664\u5931\u8D25: ", removeSiteNameError] }), updateSiteNameLimitError && _jsxs("p", { children: ["\u7AD9\u70B9\u4E0A\u9650\u4FEE\u6539\u5931\u8D25: ", updateSiteNameLimitError] }), resetSiteNameError && _jsxs("p", { children: ["\u7AD9\u70B9\u91CD\u7F6E\u5931\u8D25: ", resetSiteNameError] }), removeFrontendOriginError && _jsxs("p", { children: ["\u524D\u7AEF\u57DF\u540D\u5220\u9664\u5931\u8D25: ", removeFrontendOriginError] }), resetFrontendOriginsError && _jsxs("p", { children: ["\u524D\u7AEF\u7ED1\u5B9A\u91CD\u7F6E\u5931\u8D25: ", resetFrontendOriginsError] }), resetQuotaError && _jsxs("p", { children: ["\u914D\u989D\u91CD\u7F6E\u5931\u8D25: ", resetQuotaError] })] }))] }), _jsx("button", { type: "button", className: "modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent", onClick: () => {
                            setSettingsUser(null);
                            setNewPassword("");
                        }, children: "close" })] }), document.body)] }));
};
export default UsersPage;
