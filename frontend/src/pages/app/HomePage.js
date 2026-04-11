import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAddFrontendOrigin, useCreateUserSite, useSetSiteName, useSiteProfile } from "../../features/builds/siteName";
import { useBuildJob, useBuildJobs } from "../../features/builds/jobs";
import { useBuildQuota } from "../../features/builds/quota";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../components/useAuth";
import { canBuildSpa, getUserTypeBadgeClass, getUserTypeDescription, getUserTypeLabel, normalizeUserType, shouldValidateFrontendOrigins } from "../../lib/userAccess";
const HomePage = () => {
    const siteProfileQuery = useSiteProfile();
    const setSiteNameMutation = useSetSiteName();
    const createUserSiteMutation = useCreateUserSite();
    const addFrontendOriginMutation = useAddFrontendOrigin();
    const jobsQuery = useBuildJobs();
    const quotaQuery = useBuildQuota();
    const auth = useAuth();
    // 尝试从 auth 直接获取或从 auth.user 中获取用户信息，兼容不同的 useAuth 返回结构
    const user = auth.user || {};
    const role = auth.role || user.role;
    const email = auth.email || user.email;
    const userType = normalizeUserType(auth.userType ?? user.userType);
    const requiresFrontendOrigins = shouldValidateFrontendOrigins(role, userType);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [cachedSiteName, setCachedSiteName] = useState(null);
    const [input, setInput] = useState("");
    const [newSiteName, setNewSiteName] = useState("");
    const [frontendOriginInput, setFrontendOriginInput] = useState("");
    const [siteMessage, setSiteMessage] = useState(null);
    const [originMessage, setOriginMessage] = useState(null);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [buildFailure, setBuildFailure] = useState(null);
    const [dismissedFailureId, setDismissedFailureId] = useState(null);
    const prevJobIdRef = useRef(undefined);
    const dismissedStorageKey = "pacmachine-dismissed-failure-id";
    const failureWindowMs = 5 * 60 * 1000;
    const isRecentFailure = (createdAt) => {
        if (!createdAt)
            return false;
        const ts = new Date(createdAt).getTime();
        return Number.isFinite(ts) && Date.now() - ts <= failureWindowMs;
    };
    const siteName = siteProfileQuery.data?.siteName || null;
    const siteOptions = siteProfileQuery.data?.sites || [];
    const siteNameLimit = Math.max(siteProfileQuery.data?.siteNameLimit ?? 1, 1);
    const frontendOrigins = siteProfileQuery.data?.frontendOrigins || [];
    const loadingSiteName = siteProfileQuery.isPending; // 只在首个请求未返回时认为 loading，避免阻塞展示
    const fetchedSiteName = siteProfileQuery.isSuccess || siteProfileQuery.isError;
    const displaySiteName = cachedSiteName || siteName;
    const jobIdParam = searchParams.get("jobId");
    const jobId = jobIdParam ? Number(jobIdParam) : undefined;
    const activeJobQuery = useBuildJob(jobId);
    const derivedActiveJob = jobsQuery.data?.find((j) => j.status === "pending" || j.status === "running") ?? null;
    const hasActiveJob = Boolean(jobId) || Boolean(derivedActiveJob);
    const isAdmin = role === "admin";
    const canConfigureSite = canBuildSpa(role, userType);
    const showSiteNameForm = fetchedSiteName && (!displaySiteName || isAdmin);
    const shouldUseSiteManager = canConfigureSite;
    const quota = quotaQuery.data;
    const isUnlimitedQuota = quota?.unlimited || (quota?.limit ?? 0) >= Number.MAX_SAFE_INTEGER / 2; // 后端用 MAX_SAFE_INTEGER 表示无限
    const activeJobStatusLabel = useMemo(() => {
        if (!activeJobQuery.data)
            return null;
        const s = activeJobQuery.data.status;
        if (s === "pending")
            return "等待中";
        if (s === "running")
            return "构建中";
        if (s === "success")
            return "已完成";
        if (s === "failed")
            return "失败";
        return s;
    }, [activeJobQuery.data]);
    const jobStats = useMemo(() => {
        const jobs = jobsQuery.data ?? [];
        return {
            pending: jobs.filter((j) => j.status === "pending").length,
            running: jobs.filter((j) => j.status === "running").length,
            success: jobs.filter((j) => j.status === "success").length,
            failed: jobs.filter((j) => j.status === "failed").length,
        };
    }, [jobsQuery.data]);
    const isTaskInProgress = activeJobStatusLabel === "等待中" ||
        activeJobStatusLabel === "构建中" ||
        derivedActiveJob?.status === "pending" ||
        derivedActiveJob?.status === "running";
    const onSubmit = (e) => {
        e.preventDefault();
        setSiteMessage(null);
        setSiteNameMutation.mutate({ siteName: input }, {
            onSuccess: (data) => {
                setSiteMessage({ type: "success", text: `站点名称已设置为：${data.siteName}` });
                setCachedSiteName(data.siteName);
                siteProfileQuery.refetch();
            },
            onError: (err) => setSiteMessage({ type: "error", text: err?.response?.data?.error || "设置失败" }),
        });
    };
    const onAddFrontendOrigin = (e) => {
        e.preventDefault();
        setOriginMessage(null);
        addFrontendOriginMutation.mutate({ frontendOrigin: frontendOriginInput }, {
            onSuccess: (data) => {
                const latest = data.frontendOrigins[data.frontendOrigins.length - 1];
                setOriginMessage({ type: "success", text: `已绑定前端域名：${latest}` });
                setFrontendOriginInput("");
                siteProfileQuery.refetch();
            },
            onError: (err) => setOriginMessage({ type: "error", text: err?.response?.data?.error || "绑定前端域名失败" }),
        });
    };
    const onAddSiteName = (e) => {
        e.preventDefault();
        setSiteMessage(null);
        createUserSiteMutation.mutate({ name: newSiteName }, {
            onSuccess: async (data) => {
                setSiteMessage({ type: "success", text: `站点名称已添加：${data.name}` });
                setCachedSiteName(data.name);
                setNewSiteName("");
                await siteProfileQuery.refetch();
            },
            onError: (err) => setSiteMessage({ type: "error", text: err?.response?.data?.error || "添加站点名称失败" }),
        });
    };
    useEffect(() => {
        if (siteName) {
            setCachedSiteName(siteName);
            if (isAdmin) {
                setInput(siteName);
            }
        }
    }, [siteName, isAdmin]);
    useEffect(() => {
        if (!jobId)
            return;
        const status = activeJobQuery.data?.status;
        if (!status)
            return;
        if (status === "failed" && dismissedFailureId !== jobId) {
            const createdAt = activeJobQuery.data?.createdAt;
            if (isRecentFailure(createdAt)) {
                setBuildFailure({
                    jobId,
                    message: activeJobQuery.data?.message || "构建失败，请稍后重试",
                    createdAt: createdAt,
                });
            }
            else {
                setBuildFailure(null);
            }
        }
        if (status === "success" || status === "failed") {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("jobId");
                return next;
            });
            if (status === "success") {
                setBuildFailure(null);
                navigate("/app/downloads");
            }
        }
    }, [jobId, activeJobQuery.data?.status, activeJobQuery.data?.message, activeJobQuery.data?.createdAt, navigate, setSearchParams]);
    useEffect(() => {
        if (jobId !== undefined && jobId !== prevJobIdRef.current) {
            // 新任务开始时清掉旧提示与已忽略的记录
            setBuildFailure(null);
            setDismissedFailureId(null);
            localStorage.removeItem(dismissedStorageKey);
        }
        prevJobIdRef.current = jobId;
    }, [jobId]);
    useEffect(() => {
        const stored = localStorage.getItem(dismissedStorageKey);
        if (stored) {
            const parsed = Number(stored);
            if (Number.isFinite(parsed)) {
                setDismissedFailureId(parsed);
            }
        }
    }, []);
    useEffect(() => {
        if (!jobsQuery.data)
            return;
        const latestFailed = [...jobsQuery.data]
            .filter((j) => j.status === "failed" && isRecentFailure(j.createdAt))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (!latestFailed)
            return;
        if (dismissedFailureId && latestFailed.id === dismissedFailureId)
            return;
        setBuildFailure({
            jobId: latestFailed.id,
            message: latestFailed.message || "构建失败，请稍后重试",
            createdAt: latestFailed.createdAt,
        });
    }, [jobsQuery.data, dismissedFailureId]);
    useEffect(() => {
        if (!buildFailure)
            return;
        const createdAtMs = new Date(buildFailure.createdAt).getTime();
        if (!Number.isFinite(createdAtMs))
            return;
        const remaining = failureWindowMs - (Date.now() - createdAtMs);
        if (remaining <= 0) {
            setBuildFailure(null);
            return;
        }
        const timeout = window.setTimeout(() => {
            setBuildFailure(null);
        }, remaining);
        return () => window.clearTimeout(timeout);
    }, [buildFailure, failureWindowMs]);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs("h2", { className: "text-3xl font-bold", children: ["\u6B22\u8FCE\u4F7F\u7528\uFF0C", email] }), role === 'admin' ? (_jsx("div", { className: "badge badge-lg badge-primary", children: "\u7BA1\u7406\u5458" })) : (_jsx("div", { className: `badge badge-lg ${getUserTypeBadgeClass(userType)}`, children: getUserTypeLabel(userType) })), !isAdmin && (userType === "basic" || userType === "pro") ? (_jsx("button", { type: "button", className: "landing-button-primary rounded-2xl px-4 py-2 text-sm", onClick: () => setIsUpgradeOpen(true), children: userType === "basic" ? "升级 Pro 版本" : "升级优先版" })) : null] }), _jsx("p", { className: "text-base-content/70 mt-1", children: role === "admin"
                            ? "设置站点名，提交打包，完成后在“构建下载”获取仅与你账号绑定的产物。"
                            : `${getUserTypeDescription(userType)}。添加站点名称后即可按当前档位使用构建功能。` })] }), !canConfigureSite && !isAdmin ? (_jsx("section", { className: "mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-8 lg:px-10 lg:py-10", children: _jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]", children: "Pricing" }), _jsx("h2", { className: "mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-900", children: "\u5F00\u901A\u540E\u5373\u53EF\u5F00\u59CB\u6784\u5EFA" }), _jsx("p", { className: "mt-3 max-w-xl text-[15px] leading-7 text-slate-600", children: "\u5F53\u524D\u8D26\u53F7\u4E3A\u5F85\u5F00\u901A\u72B6\u6001\uFF0C\u6682\u4E0D\u652F\u6301\u7ED1\u5B9A\u7AD9\u70B9\u540D\u3001\u524D\u7AEF\u57DF\u540D\u548C\u63D0\u4EA4\u6784\u5EFA\u3002\u5F00\u901A\u57FA\u7840\u7248\u3001\u8BA2\u9605\u7248\u6216\u4F18\u5148\u7248\u540E\u5373\u53EF\u5F00\u59CB\u4F7F\u7528\u6784\u5EFA\u80FD\u529B\u3002" }), _jsxs("div", { className: "mt-5 space-y-2.5 text-[15px] text-slate-600", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "1 \u4E2A\u54C1\u724C\u540D\u6388\u6743" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "4 \u4E2A\u4E3B\u9898\u57DF\u540D\u6388\u6743" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u7EC8\u8EAB\u4F7F\u7528\u6743\u9650" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u6C38\u4E45\u66F4\u65B0\u652F\u6301" })] })] })] }), _jsx("div", { className: "hidden h-20 w-px bg-slate-200 lg:block" }), _jsxs("div", { className: "rounded-[1.75rem] border border-[#6d6bf4]/12 bg-[linear-gradient(180deg,_rgba(248,248,255,1),_rgba(242,244,255,0.88))] p-5 shadow-[0_16px_40px_rgba(109,107,244,0.08)]", children: [_jsx("div", { className: "inline-flex rounded-full bg-[#6d6bf4]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#6d6bf4]", children: "Professional Plan" }), _jsxs("div", { className: "mt-4 flex items-baseline gap-2", children: [_jsx("span", { className: "text-lg font-semibold text-[#6d6bf4]", children: "$" }), _jsx("span", { className: "text-4xl font-bold tracking-[-0.06em] text-slate-900", children: "88" }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-slate-400", children: "usd" }), _jsx("span", { className: "ml-2 text-sm font-semibold text-slate-400 line-through", children: "120 USD" })] }), _jsx("div", { className: "mt-4 h-px bg-gradient-to-r from-[#6d6bf4]/20 via-slate-200 to-transparent" }), _jsx("p", { className: "mt-4 text-[15px] leading-7 text-slate-600", children: "\u7EC8\u8EAB\u8BA2\u9605\uFF0C\u6C38\u4E45\u66F4\u65B0\u3002\u4E00\u6B21\u8D2D\u4E70\u540E\u5373\u53EF\u6301\u7EED\u83B7\u53D6\u540E\u7EED\u4E3B\u9898\u66F4\u65B0\u4E0E\u529F\u80FD\u8FED\u4EE3\uFF0C\u65E0\u9700\u91CD\u590D\u4ED8\u8D39\u3002" }), _jsx("a", { href: "https://t.me/y1niannn", target: "_blank", rel: "noreferrer", className: "landing-button-primary mt-5 inline-flex rounded-2xl px-6 py-3 text-sm", children: "\u8054\u7CFB\u6211\u8D2D\u4E70" })] })] }) })) : (_jsxs("div", { className: "space-y-5", children: [_jsxs("section", { className: "workspace-card p-5", children: [_jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Workspace Setup" }), _jsx("h3", { className: "mt-2 text-[28px] font-bold tracking-[-0.04em] text-slate-900", children: "\u7AD9\u70B9\u914D\u7F6E" }), _jsx("p", { className: "mt-2 max-w-2xl text-[15px] leading-7 text-slate-500", children: requiresFrontendOrigins
                                                    ? "先完成站点名称和前端域名绑定，再进入构建流程。配置完成后可以直接前往前端构建或查看已生成的产物。"
                                                    : "先完成站点名称设置，再进入构建流程。优先版会在构建时自动关闭前端域名校验。" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u4ECA\u65E5\u5269\u4F59\u6784\u5EFA" }), _jsx("p", { className: `mt-2 text-xl font-bold ${quota?.left === 0 && !isUnlimitedQuota ? "text-rose-500" : "text-[#6d6bf4]"}`, children: quota ? (isUnlimitedQuota ? "∞" : `${quota.left}/${quota.limit}`) : "-" })] }), _jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u5F53\u524D\u72B6\u6001" }), _jsx("p", { className: "mt-2 text-xl font-bold text-slate-900", children: displaySiteName && (!requiresFrontendOrigins || frontendOrigins.length > 0) ? "可构建" : "待配置" })] })] })] }), _jsxs("div", { className: `mt-5 grid gap-5 ${requiresFrontendOrigins ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`, children: [_jsxs("div", { className: "workspace-card-soft p-5", children: [_jsx("div", { className: "flex items-start justify-between gap-4", children: _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "Site Name" }), _jsx("h4", { className: "mt-2 text-xl font-bold text-slate-900", children: "\u7AD9\u70B9\u540D\u79F0" })] }) }), _jsxs("p", { className: "mt-3 text-[15px] leading-7 text-slate-500", children: ["\u5728\u524D\u7AEF\u6784\u5EFA\u524D\u7EF4\u62A4\u4F60\u7684\u7AD9\u70B9\u540D\u79F0\uFF0C\u7528\u4E8E\u6253\u5305\u540E\u4E3B\u9898\u7684\u7AD9\u70B9\u540D\u79F0\u548C\u6807\u9898\u3002\u5F53\u524D\u8D26\u53F7\u6700\u591A\u53EF\u6DFB\u52A0 ", siteNameLimit, " \u4E2A\u7AD9\u70B9\u540D\u79F0\u3002"] }), loadingSiteName && !displaySiteName && (_jsx("div", { className: "flex justify-center p-6", children: _jsx("span", { className: "loading loading-spinner loading-md" }) })), shouldUseSiteManager ? (_jsxs(_Fragment, { children: [siteOptions.length > 0 ? (_jsx("div", { className: "mt-5 flex flex-wrap gap-2.5", children: siteOptions.map((site) => (_jsx("span", { className: "rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-sm font-medium text-sky-700", children: site.name }, site.id))) })) : displaySiteName ? (_jsxs("div", { className: "mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500 shadow-sm", children: [_jsx("div", { className: "mb-2 text-2xl font-bold tracking-[-0.03em] text-[#6d6bf4]", children: displaySiteName }), "\u8FD9\u662F\u5F53\u524D\u9ED8\u8BA4\u7AD9\u70B9\u540D\u79F0\u3002"] })) : null, siteOptions.length < siteNameLimit ? (_jsxs("form", { onSubmit: onAddSiteName, className: "mt-5 flex items-stretch gap-3", children: [_jsx("input", { className: "workspace-input input input-bordered h-13 flex-1 rounded-2xl", placeholder: siteOptions.length > 0 ? "输入新的站点名称" : "请输入第一个站点名称", value: newSiteName, onChange: (e) => setNewSiteName(e.target.value), disabled: createUserSiteMutation.status === "pending" }), _jsx("button", { className: "landing-button-primary shrink-0 rounded-2xl px-5 py-3 text-sm", type: "submit", disabled: !newSiteName.trim() || createUserSiteMutation.status === "pending", children: createUserSiteMutation.status === "pending" ? "添加中..." : "添加" })] })) : (_jsx("div", { className: "mt-5 workspace-alert alert border border-sky-200 bg-sky-50 text-sky-700 text-sm py-3", children: _jsx("span", { children: "\u5DF2\u8FBE\u5230\u5F53\u524D\u8D26\u53F7\u53EF\u6DFB\u52A0\u7684\u7AD9\u70B9\u540D\u79F0\u4E0A\u9650\u3002" }) }))] })) : showSiteNameForm ? (_jsxs("form", { onSubmit: onSubmit, className: "mt-5 flex items-stretch gap-3", children: [_jsx("input", { className: "workspace-input input input-bordered h-13 flex-1 rounded-2xl", placeholder: "\u8F93\u5165\u7AD9\u70B9\u540D\u79F0", value: input, onChange: (e) => setInput(e.target.value), disabled: setSiteNameMutation.status === "pending" }), _jsx("button", { className: "landing-button-primary shrink-0 rounded-2xl px-5 py-3 text-sm", type: "submit", disabled: !input.trim() || setSiteNameMutation.status === "pending", children: setSiteNameMutation.status === "pending" ? "保存中..." : isAdmin ? "保存" : "设置" })] })) : (_jsxs("div", { className: "mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500 shadow-sm", children: [displaySiteName ? (_jsx("div", { className: "mb-2 text-2xl font-bold tracking-[-0.03em] text-[#6d6bf4]", children: displaySiteName })) : null, isAdmin ? "管理员可随时修改。" : "当前站点名称已锁定，如需修改请联系管理员。"] })), siteMessage && (_jsx("div", { className: `mt-3 text-sm font-medium ${siteMessage.type === "error" ? "text-rose-600" : "text-emerald-600"}`, children: siteMessage.text }))] }), requiresFrontendOrigins && (_jsxs("div", { className: "workspace-card-soft p-5", children: [_jsx("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "Origins" }), _jsx("h4", { className: "mt-2 text-xl font-bold text-slate-900", children: "\u524D\u7AEF\u57DF\u540D" })] }) }), _jsx("p", { className: "mt-3 text-[15px] leading-7 text-slate-500", children: "\u6BCF\u4E2A\u8D26\u53F7\u6700\u591A\u7ED1\u5B9A 4 \u4E2A\u524D\u7AEF\u57DF\u540D\u3002\u5DF2\u7ED1\u5B9A\u7684\u57DF\u540D\u7528\u6237\u4FA7\u4E0D\u53EF\u5220\u9664\uFF0C\u5982\u9700\u8C03\u6574\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u5904\u7406\u3002" }), frontendOrigins.length > 0 ? (_jsx("div", { className: "mt-5 flex flex-wrap gap-2.5", children: frontendOrigins.map((origin) => (_jsx("span", { className: "rounded-full border border-pink-200 bg-pink-50 px-3.5 py-1.5 text-sm font-medium text-pink-700", children: origin }, origin))) })) : (_jsx("div", { className: "mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-5 text-sm text-slate-500", children: "\u8FD8\u6CA1\u6709\u7ED1\u5B9A\u524D\u7AEF\u57DF\u540D\uFF0C\u5148\u6DFB\u52A0\u81F3\u5C11 1 \u4E2A\u57DF\u540D\u518D\u8FDB\u5165\u6784\u5EFA\u3002" })), frontendOrigins.length < 4 ? (_jsxs("form", { onSubmit: onAddFrontendOrigin, className: "mt-5 flex items-stretch gap-3", children: [_jsx("input", { className: "workspace-input input input-bordered h-13 flex-1 rounded-2xl", placeholder: frontendOrigins.length > 0 ? "继续绑定前端域名，每次输入一个，如 https://a.com" : "请输入完整域名，每次输入一个，如 https://a.com", value: frontendOriginInput, onChange: (e) => setFrontendOriginInput(e.target.value), disabled: addFrontendOriginMutation.status === "pending" }), _jsx("button", { className: "landing-button-primary shrink-0 rounded-2xl px-5 py-3 text-sm", type: "submit", disabled: !frontendOriginInput.trim() || addFrontendOriginMutation.status === "pending", children: addFrontendOriginMutation.status === "pending" ? "提交中..." : frontendOrigins.length > 0 ? "添加" : "绑定" })] })) : (_jsx("div", { className: "mt-5 workspace-alert alert border border-pink-200 bg-pink-50 text-pink-700 text-sm py-3", children: _jsx("span", { children: "\u5DF2\u8FBE\u5230 4 \u4E2A\u524D\u7AEF\u57DF\u540D\u4E0A\u9650\uFF0C\u5982\u9700\u8C03\u6574\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u91CD\u7F6E\u3002" }) })), originMessage && (_jsx("div", { className: `mt-3 text-sm font-medium ${originMessage.type === "error" ? "text-rose-600" : "text-emerald-600"}`, children: originMessage.text }))] }))] }), _jsxs("div", { className: "mt-5 flex flex-wrap gap-3", children: [_jsx("button", { className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", onClick: () => navigate("/app/build"), children: "\u8FDB\u5165\u6784\u5EFA" }), _jsx("button", { className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm", onClick: () => navigate("/app/downloads"), children: "\u67E5\u770B\u4EA7\u7269" })] })] }), _jsxs("section", { className: "grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]", children: [_jsxs("div", { className: "workspace-card p-5", children: [_jsx("p", { className: "workspace-kicker", children: "Queue" }), _jsx("h3", { className: "mt-2 text-xl font-bold tracking-[-0.04em] text-slate-900", children: "\u6784\u5EFA\u961F\u5217\u6982\u89C8" }), _jsxs("div", { className: "mt-5 grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u7B49\u5F85\u4E2D" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-amber-500", children: jobStats.pending })] }), _jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u6784\u5EFA\u4E2D" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-sky-500", children: jobStats.running })] }), _jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u5DF2\u5B8C\u6210" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-emerald-500", children: jobStats.success })] }), _jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u5931\u8D25" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-rose-500", children: jobStats.failed })] })] })] }), _jsxs("div", { className: "workspace-card p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Current Task" }), _jsx("h3", { className: "mt-2 text-xl font-bold tracking-[-0.04em] text-slate-900", children: "\u5F53\u524D\u6784\u5EFA\u72B6\u6001" }), _jsx("p", { className: "mt-2 text-[15px] leading-7 text-slate-500", children: "\u8FD9\u91CC\u5C55\u793A\u5F53\u524D\u8FDB\u884C\u4E2D\u7684\u6784\u5EFA\u4EFB\u52A1\uFF1B\u5982\u679C\u6682\u65F6\u6CA1\u6709\u4EFB\u52A1\uFF0C\u4F1A\u663E\u793A\u7A7A\u95F2\u72B6\u6001\uFF0C\u4F60\u53EF\u4EE5\u76F4\u63A5\u524D\u5F80\u6784\u5EFA\u9875\u63D0\u4EA4\u65B0\u4EFB\u52A1\u3002" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [isTaskInProgress ? _jsx("span", { className: "loading loading-spinner loading-md text-[#6d6bf4]" }) : null, _jsx("button", { className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm", onClick: () => navigate("/app/build"), children: "\u524D\u5F80\u6784\u5EFA\u9875" })] })] }), _jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u4EFB\u52A1\u7F16\u53F7" }), _jsxs("div", { className: "mt-2 text-xl font-bold text-slate-900", children: ["#", jobId ?? derivedActiveJob?.id ?? "..."] })] }), _jsxs("div", { className: "workspace-card-soft p-4", children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-[0.18em] text-slate-400", children: "\u72B6\u6001" }), _jsx("div", { className: "mt-2 text-lg font-bold text-[#6d6bf4]", children: activeJobStatusLabel ?? (derivedActiveJob ? (derivedActiveJob.status === "pending" ? "等待中" : "构建中") : "当前没有进行中的任务") })] })] })] })] })] })), canConfigureSite && buildFailure && (_jsxs("div", { role: "alert", className: "alert alert-error shadow-lg", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("h3", { className: "font-bold", children: ["\u6784\u5EFA\u5931\u8D25 #", buildFailure.jobId] }), _jsx("div", { className: "text-xs", children: buildFailure.message })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn btn-sm bg-white/20 border-0 text-white hover:bg-white/30", onClick: () => navigate("/app/build"), children: "\u91CD\u65B0\u63D0\u4EA4" }), _jsx("button", { className: "btn btn-sm btn-ghost", onClick: () => {
                                    setDismissedFailureId(buildFailure.jobId);
                                    localStorage.setItem(dismissedStorageKey, String(buildFailure.jobId));
                                    setBuildFailure(null);
                                }, children: "\u5173\u95ED" })] })] })), isUpgradeOpen && createPortal(_jsxs("div", { className: "modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm", children: [_jsxs("div", { className: "modal-box workspace-card max-w-2xl border-0 bg-white/95 p-0", children: [_jsx("div", { className: "border-b border-slate-200 px-6 py-5", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Upgrade" }), _jsx("h3", { className: "mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-900", children: "\u5347\u7EA7\u5230 Pro \u7248\u672C" }), _jsx("p", { className: "mt-2 text-[15px] leading-7 text-slate-500", children: "\u89E3\u9501 Pro \u6784\u5EFA\u80FD\u529B\uFF0C\u901A\u8FC7 BFF \u4E2D\u95F4\u4EF6\u8F6C\u53D1\u8BF7\u6C42\uFF0C\u5E76\u4F7F\u7528\u4E2D\u53F0\u5B9E\u65F6\u66F4\u65B0\u4E3B\u9898\u914D\u7F6E\u3002" })] }), _jsx("button", { type: "button", className: "landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0", onClick: () => setIsUpgradeOpen(false), children: "\u2715" })] }) }), _jsxs("div", { className: "grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]", children: [_jsx("div", { className: "px-6 py-6", children: _jsxs("div", { className: "space-y-3 text-[15px] text-slate-600", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u5347\u7EA7\u4E3A Pro \u7248\u672C\uFF0C\u652F\u6301 BFF \u4E2D\u95F4\u4EF6\u8F6C\u53D1\u8BF7\u6C42" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u4E3B\u9898\u8BF7\u6C42\u4E0E API \u8BF7\u6C42\u94FE\u8DEF\u5206\u79BB\uFF0C\u8FDB\u4E00\u6B65\u964D\u4F4E\u7279\u5F81\u66B4\u9732\u98CE\u9669" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u4E2D\u53F0\u63A7\u5236\u7CFB\u7EDF\u65E0\u9700\u6539\u6587\u4EF6\uFF0C\u5373\u53EF\u5B9E\u65F6\u66F4\u65B0\u4E3B\u9898\u914D\u7F6E" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u652F\u6301\u5728\u7EBF\u8C03\u6574\u914D\u8272\u3001\u6587\u6848\u4E0E\u5C55\u793A\u5185\u5BB9" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" }), _jsx("span", { children: "\u5347\u7EA7\u540E\u53EF\u6784\u5EFA SPA \u4E0E Pro(BFF) \u4E24\u79CD\u7248\u672C" })] })] }) }), _jsx("div", { className: "border-t border-slate-200 px-6 py-6 md:border-l md:border-t-0", children: _jsxs("div", { className: "rounded-[1.5rem] border border-[#6d6bf4]/12 bg-[linear-gradient(180deg,_rgba(248,248,255,1),_rgba(242,244,255,0.88))] p-5 shadow-[0_16px_40px_rgba(109,107,244,0.08)]", children: [_jsx("div", { className: "inline-flex rounded-full bg-[#6d6bf4]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#6d6bf4]", children: "Pro Upgrade" }), _jsxs("div", { className: "mt-4 flex items-baseline gap-2", children: [_jsx("span", { className: "text-base font-semibold text-[#6d6bf4]", children: "$" }), _jsx("span", { className: "text-4xl font-bold tracking-[-0.06em] text-slate-900", children: "40" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400", children: "usd" }), _jsx("span", { className: "ml-2 text-sm font-semibold text-slate-400 line-through", children: "88 USD" })] }), _jsx("div", { className: "mt-4 h-px bg-gradient-to-r from-[#6d6bf4]/20 via-slate-200 to-transparent" }), _jsx("p", { className: "mt-4 text-[15px] leading-7 text-slate-600", children: "\u5347\u7EA7\u540E\u5373\u53EF\u4F7F\u7528 Pro \u8BF7\u6C42\u8F6C\u53D1\u80FD\u529B\uFF0C\u5E76\u901A\u8FC7\u4E2D\u53F0\u5B9E\u65F6\u7EF4\u62A4\u4E3B\u9898\u914D\u7F6E\uFF0C\u65E0\u9700\u53CD\u590D\u6539\u52A8\u90E8\u7F72\u6587\u4EF6\u3002" }), _jsx("a", { href: "https://t.me/y1niannn", target: "_blank", rel: "noreferrer", className: "landing-button-primary mt-5 inline-flex w-full rounded-2xl px-5 py-3 text-sm", children: "\u8054\u7CFB\u6211\u8D2D\u4E70" })] }) })] })] }), _jsx("button", { type: "button", className: "modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent", onClick: () => setIsUpgradeOpen(false), children: "close" })] }), document.body)] }));
};
export default HomePage;
