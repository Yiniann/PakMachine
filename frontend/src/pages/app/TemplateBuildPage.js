import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/useAuth";
import { useBuildTemplate } from "../../features/builds/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/builds/profile";
import { useTemplateFiles } from "../../features/builds/queries";
import { useSiteProfile } from "../../features/builds/siteName";
import { canBuildBff, canBuildSpa, getUserTypeLabel, normalizeUserType, shouldValidateFrontendOrigins } from "../../lib/userAccess";
const normalizeEnvValue = (value) => value.replace(/[\r\n]+/g, " ").trim();
const hasNewline = (value) => /[\r\n]/.test(value);
const formatDateTime = (value) => {
    if (!value)
        return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    const pad = (num) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const normalizeString = (value, fallback = "") => (typeof value === "string" ? value : fallback);
const createLegacyForm = () => ({
    backendType: "xboard",
    siteLogo: "",
    prodApiUrl: "/api/v1/",
    authBackground: "/car.jpg",
    downloadEnabled: false,
    downloadIos: "",
    downloadAndroid: "",
    downloadWindows: "",
    downloadMacos: "",
    downloadHarmony: "",
    thirdPartySupportEnabled: false,
    supportScript: "",
    appleAutoProShareEnabled: false,
    appleAutoProApiBaseUrl: "",
    appleAutoProApiKey: "",
});
const createBffForm = () => ({
    frontend: {
        siteLogo: "",
        backendType: "xboard",
    },
    server: {
        panelBaseUrl: "",
        adminBasePath: "/admin",
    },
});
const normalizeLegacyForm = (input) => {
    const cfg = isRecord(input) ? input : {};
    const getVal = (key, viteKey, fallback) => cfg[key] ?? cfg[viteKey] ?? fallback;
    const downloadIos = normalizeString(getVal("downloadIos", "VITE_DOWNLOAD_IOS", ""));
    const downloadAndroid = normalizeString(getVal("downloadAndroid", "VITE_DOWNLOAD_ANDROID", ""));
    const downloadWindows = normalizeString(getVal("downloadWindows", "VITE_DOWNLOAD_WINDOWS", ""));
    const downloadMacos = normalizeString(getVal("downloadMacos", "VITE_DOWNLOAD_MACOS", ""));
    const downloadHarmony = normalizeString(getVal("downloadHarmony", "VITE_DOWNLOAD_HARMONY", ""));
    const downloadEnabled = getVal("downloadEnabled", "VITE_ENABLE_DOWNLOAD", undefined) === undefined
        ? Boolean(downloadIos || downloadAndroid || downloadWindows || downloadMacos || downloadHarmony)
        : getVal("downloadEnabled", "VITE_ENABLE_DOWNLOAD", false) === true ||
            getVal("downloadEnabled", "VITE_ENABLE_DOWNLOAD", false) === "true";
    const thirdPartySupportEnabled = getVal("thirdPartySupportEnabled", "", undefined) === undefined
        ? (getVal("supportScript", "VITE_THIRD_PARTY_SCRIPTS", "") ?? "").toString().trim().length > 0
        : getVal("thirdPartySupportEnabled", "", false) === true || getVal("thirdPartySupportEnabled", "", false) === "true";
    const appleAutoProShareEnabled = getVal("appleAutoProShareEnabled", "VITE_ENABLE_IDHUB", false) === true ||
        getVal("appleAutoProShareEnabled", "VITE_ENABLE_IDHUB", false) === "true";
    return {
        backendType: normalizeString(getVal("backendType", "VITE_BACKEND_TYPE", "xboard")),
        siteLogo: normalizeString(getVal("siteLogo", "VITE_SITE_LOGO", "")),
        prodApiUrl: normalizeString(getVal("prodApiUrl", "VITE_PROD_API_URL", "/api/v1/"), "/api/v1/"),
        authBackground: normalizeString(getVal("authBackground", "VITE_AUTH_BACKGROUND", "/car.jpg"), "/car.jpg"),
        downloadEnabled,
        downloadIos,
        downloadAndroid,
        downloadWindows,
        downloadMacos,
        downloadHarmony,
        thirdPartySupportEnabled,
        supportScript: normalizeString(getVal("supportScript", "VITE_THIRD_PARTY_SCRIPTS", "")),
        appleAutoProShareEnabled,
        appleAutoProApiBaseUrl: normalizeString(getVal("appleAutoProApiBaseUrl", "VITE_IDHUB_API_URL", "")),
        appleAutoProApiKey: normalizeString(getVal("appleAutoProApiKey", "VITE_IDHUB_API_KEY", "")),
    };
};
const normalizeBffForm = (input) => {
    const cfg = isRecord(input) ? input : {};
    const legacy = normalizeLegacyForm(input);
    const frontend = isRecord(cfg.frontend) ? cfg.frontend : {};
    const server = isRecord(cfg.server) ? cfg.server : {};
    return {
        frontend: {
            siteLogo: normalizeString(frontend.siteLogo, legacy.siteLogo),
            backendType: normalizeString(frontend.backendType ?? cfg.backendType ?? cfg.VITE_BACKEND_TYPE, "xboard"),
        },
        server: {
            panelBaseUrl: normalizeString(server.panelBaseUrl, ""),
            adminBasePath: normalizeString(server.adminBasePath, "/admin"),
        },
    };
};
const normalizeStoredProfiles = (input) => {
    if (isRecord(input) && ("legacy" in input || "bff" in input || "lastMode" in input)) {
        return {
            legacy: normalizeLegacyForm(input.legacy),
            bff: normalizeBffForm(input.bff ?? input.legacy),
            lastMode: input.lastMode === "bff" ? "bff" : input.lastMode === "legacy" ? "legacy" : null,
        };
    }
    return {
        legacy: normalizeLegacyForm(input),
        bff: normalizeBffForm(input),
        lastMode: null,
    };
};
const buildLegacyEnvContent = (siteName, clientOriginRestrictionValue, form) => {
    return [
        "VITE_API_MODE=legacy",
        `VITE_PROD_API_URL=${normalizeEnvValue(form.prodApiUrl) || "/api/v1/"}`,
        `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
        `VITE_SITE_LOGO=${normalizeEnvValue(form.siteLogo)}`,
        `VITE_ENABLE_CLIENT_ORIGIN_RESTRICTION=${normalizeEnvValue(clientOriginRestrictionValue)}`,
        `VITE_BACKEND_TYPE=${normalizeEnvValue(form.backendType)}`,
    ].join("\n");
};
const buildLegacyRuntimeSettings = (form) => {
    return {
        panelType: form.backendType,
        authBackground: normalizeEnvValue(form.authBackground) || "/car.jpg",
        downloadEnabled: form.downloadEnabled,
        thirdPartySupportEnabled: form.thirdPartySupportEnabled,
        supportScript: form.thirdPartySupportEnabled ? normalizeEnvValue(form.supportScript) : "",
        appleAutoProShareEnabled: form.appleAutoProShareEnabled,
        appleAutoProApiBaseUrl: form.appleAutoProShareEnabled ? normalizeEnvValue(form.appleAutoProApiBaseUrl) : "",
        appleAutoProApiKey: form.appleAutoProShareEnabled ? normalizeEnvValue(form.appleAutoProApiKey) : "",
        downloadLinks: {
            ios: form.downloadEnabled ? normalizeEnvValue(form.downloadIos) : "",
            android: form.downloadEnabled ? normalizeEnvValue(form.downloadAndroid) : "",
            windows: form.downloadEnabled ? normalizeEnvValue(form.downloadWindows) : "",
            macos: form.downloadEnabled ? normalizeEnvValue(form.downloadMacos) : "",
            harmony: form.downloadEnabled ? normalizeEnvValue(form.downloadHarmony) : "",
        },
    };
};
const buildBffFrontendEnvContent = (siteName, clientOriginRestrictionValue, form) => {
    const lines = [
        "VITE_API_MODE=bff",
        `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
        `VITE_SITE_LOGO=${normalizeEnvValue(form.frontend.siteLogo)}`,
        `VITE_BACKEND_TYPE=${normalizeEnvValue(form.frontend.backendType)}`,
    ];
    if (clientOriginRestrictionValue.trim()) {
        lines.push(`VITE_ENABLE_CLIENT_ORIGIN_RESTRICTION=${normalizeEnvValue(clientOriginRestrictionValue)}`);
    }
    return lines.join("\n");
};
const buildBffServerEnvContent = (form) => {
    return [
        `PANEL_BASE_URL=${normalizeEnvValue(form.server.panelBaseUrl)}`,
        `ADMIN_BASE_PATH=${normalizeEnvValue(form.server.adminBasePath) || "/admin"}`,
    ].join("\n");
};
const TemplateBuildPage = () => {
    const navigate = useNavigate();
    const { role, userType } = useAuth();
    const templates = useTemplateFiles();
    const buildMutation = useBuildTemplate();
    const saveProfile = useSaveBuildProfile();
    const siteProfileQuery = useSiteProfile();
    const [selected, setSelected] = useState(null);
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [step, setStep] = useState(1);
    const [stepError, setStepError] = useState(null);
    const [error, setError] = useState(null);
    const [legacyForm, setLegacyForm] = useState(createLegacyForm());
    const [bffForm, setBffForm] = useState(createBffForm());
    const normalizedUserType = normalizeUserType(userType);
    const siteOptions = siteProfileQuery.data?.sites || [];
    const canManageSites = siteOptions.length > 0;
    const selectedSite = siteOptions.find((item) => item.id === selectedSiteId) ?? null;
    const siteName = selectedSite?.name || siteProfileQuery.data?.siteName || "";
    const frontendOrigins = siteProfileQuery.data?.frontendOrigins || [];
    const shouldRequireFrontendOrigins = shouldValidateFrontendOrigins(role, normalizedUserType);
    const clientOriginRestrictionValue = shouldRequireFrontendOrigins ? "true" : "false";
    const profileQuery = useBuildProfile(selectedSiteId);
    const adminBasePathPreview = bffForm.server.adminBasePath.trim() || "/admin";
    const previewFrontendOrigin = shouldRequireFrontendOrigins ? (frontendOrigins[0] || "https://your-domain.com") : "https://客户访问网址";
    const canUseSpaMode = canBuildSpa(role, normalizedUserType);
    const canUseBffMode = canBuildBff(role, normalizedUserType);
    const selectedTemplate = useMemo(() => templates.data?.find((item) => item.filename === selected) ?? null, [selected, templates.data]);
    const selectedModeLabel = selectedMode === "legacy" ? "SPA 版（纯前端）" : selectedMode === "bff" ? "Pro 版（BFF）" : "未选择";
    const legacyHasInvalidNewline = useMemo(() => [
        siteName,
        legacyForm.siteLogo,
        legacyForm.prodApiUrl,
        legacyForm.authBackground,
        legacyForm.downloadIos,
        legacyForm.downloadAndroid,
        legacyForm.downloadWindows,
        legacyForm.downloadMacos,
        legacyForm.downloadHarmony,
        legacyForm.supportScript,
        legacyForm.appleAutoProApiBaseUrl,
        legacyForm.appleAutoProApiKey,
    ].some(hasNewline), [siteName, legacyForm]);
    const bffHasInvalidNewline = useMemo(() => [siteName, bffForm.frontend.siteLogo, bffForm.frontend.backendType, bffForm.server.panelBaseUrl, bffForm.server.adminBasePath].some(hasNewline), [siteName, bffForm]);
    const legacyCanSubmit = useMemo(() => {
        if (!canUseSpaMode)
            return false;
        if (!selected || !siteName.trim() || !legacyForm.backendType.trim() || !legacyForm.siteLogo.trim() || !legacyForm.prodApiUrl.trim())
            return false;
        if (shouldRequireFrontendOrigins && frontendOrigins.length === 0)
            return false;
        if (legacyForm.thirdPartySupportEnabled && !legacyForm.supportScript.trim())
            return false;
        if (legacyForm.appleAutoProShareEnabled && (!legacyForm.appleAutoProApiBaseUrl.trim() || !legacyForm.appleAutoProApiKey.trim()))
            return false;
        if (legacyHasInvalidNewline)
            return false;
        return true;
    }, [canUseSpaMode, selected, siteName, legacyForm, frontendOrigins.length, legacyHasInvalidNewline, shouldRequireFrontendOrigins]);
    const bffCanSubmit = useMemo(() => {
        if (!selected || !canUseBffMode || !siteName.trim() || !bffForm.frontend.siteLogo.trim() || !bffForm.frontend.backendType.trim() || !bffForm.server.panelBaseUrl.trim())
            return false;
        if (bffHasInvalidNewline)
            return false;
        return true;
    }, [selected, canUseBffMode, siteName, bffForm, bffHasInvalidNewline]);
    const currentCanSubmit = selectedMode === "legacy" ? legacyCanSubmit : selectedMode === "bff" ? bffCanSubmit : false;
    useEffect(() => {
        if (selected || !templates.data || templates.data.length === 0)
            return;
        const latest = [...templates.data].sort((a, b) => {
            const aTime = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
            const bTime = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
            return bTime - aTime;
        })[0] ?? templates.data[0];
        setSelected(latest?.filename || null);
    }, [selected, templates.data]);
    useEffect(() => {
        if (siteOptions.length === 0) {
            if (selectedSiteId !== null)
                setSelectedSiteId(null);
            return;
        }
        if (selectedSiteId && siteOptions.some((item) => item.id === selectedSiteId))
            return;
        setSelectedSiteId(siteOptions[0]?.id ?? null);
    }, [siteOptions, selectedSiteId]);
    useEffect(() => {
        if (!profileQuery.isSuccess)
            return;
        const profiles = normalizeStoredProfiles(profileQuery.data);
        setLegacyForm(profiles.legacy);
        setBffForm(profiles.bff);
        setSelectedMode((prev) => profiles.lastMode ?? prev ?? "legacy");
    }, [profileQuery.data, profileQuery.isSuccess]);
    const updateLegacy = (key, value) => setLegacyForm((prev) => ({ ...prev, [key]: value }));
    const updateBffFrontend = (key, value) => setBffForm((prev) => ({ ...prev, frontend: { ...prev.frontend, [key]: value } }));
    const updateBffServer = (key, value) => setBffForm((prev) => ({ ...prev, server: { ...prev.server, [key]: value } }));
    const saveProfiles = (lastMode) => saveProfile.mutate({
        siteId: selectedSiteId,
        config: { legacy: legacyForm, bff: bffForm, lastMode },
    });
    const resetCurrentForm = () => {
        if (selectedMode === "bff")
            setBffForm(createBffForm());
        else
            setLegacyForm(createLegacyForm());
        setError(null);
    };
    const onSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (!selected) {
            setError("请先选择一个版本");
            return;
        }
        if (canManageSites && siteOptions.length > 0 && !selectedSiteId) {
            setError("请先添加并选择站点名称");
            return;
        }
        if (!siteName.trim()) {
            setError(canManageSites ? "请先添加并选择站点名称" : "请先在主页设置站点名称");
            return;
        }
        if (selectedMode === "legacy") {
            if (!canUseSpaMode) {
                setError("当前账号为待开通状态，请联系管理员开通基础版或订阅版权限");
                return;
            }
            if (!legacyCanSubmit) {
                setError("请补全 SPA 配置");
                return;
            }
            buildMutation.mutate({
                filename: selected,
                siteId: selectedSiteId,
                buildMode: "legacy",
                frontendEnvContent: buildLegacyEnvContent(siteName, clientOriginRestrictionValue, legacyForm),
                runtimeSettings: buildLegacyRuntimeSettings(legacyForm),
            }, {
                onSuccess: (data) => {
                    if (data.jobId)
                        navigate(`/app?jobId=${data.jobId}`);
                    saveProfiles("legacy");
                },
                onError: (err) => setError(err?.response?.data?.error || "构建失败，请稍后再试"),
            });
            return;
        }
        if (selectedMode === "bff") {
            if (!canUseBffMode) {
                setError("当前账号仅订阅版或优先版可使用 Pro 构建");
                return;
            }
            if (!bffCanSubmit) {
                setError("请补全 Pro 配置");
                return;
            }
            buildMutation.mutate({
                filename: selected,
                siteId: selectedSiteId,
                buildMode: "bff",
                frontendEnvContent: buildBffFrontendEnvContent(siteName, clientOriginRestrictionValue, bffForm),
                serverEnvContent: buildBffServerEnvContent(bffForm),
            }, {
                onSuccess: (data) => {
                    if (data.jobId)
                        navigate(`/app?jobId=${data.jobId}`);
                    saveProfiles("bff");
                },
                onError: (err) => setError(err?.response?.data?.error || "构建失败，请稍后再试"),
            });
            return;
        }
        setError("请先选择构建版本");
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-center py-4", children: _jsxs("ul", { className: "steps w-full max-w-2xl", children: [_jsx("li", { className: `step ${step >= 1 ? "step-primary" : ""} cursor-pointer`, onClick: () => setStep(1), children: "\u9009\u62E9\u7248\u672C" }), _jsx("li", { className: `step ${step >= 2 ? "step-primary" : ""} ${selected ? "cursor-pointer" : ""}`, onClick: () => selected && setStep(2), children: "\u9009\u62E9\u6784\u5EFA\u65B9\u5F0F" }), _jsx("li", { className: `step ${step >= 3 ? "step-primary" : ""}`, children: "\u586B\u5199\u914D\u7F6E" })] }) }), (selected || selectedMode || siteName) && (_jsxs("div", { className: "grid grid-cols-3 gap-2 sm:gap-3", children: [_jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm sm:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-base-content/50", children: "\u5F53\u524D\u7248\u672C" }), _jsx("p", { className: "mt-2 truncate text-sm font-semibold sm:text-base", children: selected || "未选择版本" }), _jsx("p", { className: "mt-1 text-xs text-base-content/60 sm:text-sm", children: formatDateTime(selectedTemplate?.modifiedAt) })] }), _jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm sm:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-base-content/50", children: "\u6784\u5EFA\u65B9\u5F0F" }), _jsx("p", { className: "mt-2 truncate text-sm font-semibold sm:text-base", children: selectedModeLabel }), _jsx("p", { className: "mt-1 text-xs text-base-content/60 sm:text-sm", children: selectedMode === "bff" ? "请求通过服务端中转，更适合增强隔离场景。" : selectedMode === "legacy" ? "浏览器直连面板 API，适合传统部署场景。" : "先选择版本，再进入详细配置。" })] }), _jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm sm:p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-base-content/50", children: "\u7AD9\u70B9\u540D\u79F0" }), _jsx("p", { className: "mt-2 truncate text-sm font-semibold sm:text-base", children: siteName || "未设置站点名称" }), _jsx("p", { className: "mt-1 text-xs text-base-content/60 sm:text-sm", children: siteName ? "名称将自动带入本次构建配置。" : canManageSites ? "请先在构建页添加并选择站点名称。" : "请先在首页完成站点名称设置。" })] })] })), step === 1 && (_jsx("div", { className: "card bg-base-100 shadow-xl border border-base-200", children: _jsxs("div", { className: "card-body gap-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "card-title text-2xl font-bold", children: "\u9009\u62E9\u7248\u672C" }), _jsx("p", { className: "mt-1 text-base-content/70", children: "\u5148\u9009\u62E9\u8981\u6253\u5305\u7684\u7248\u672C\uFF0C\u518D\u6839\u636E\u9700\u6C42\u9009\u62E9\u6784\u5EFA\u65B9\u5F0F\u5E76\u586B\u5199\u914D\u7F6E\u3002" })] }), templates.isLoading && _jsx("p", { children: "\u52A0\u8F7D\u4E2D..." }), templates.error && _jsx("p", { className: "text-error", children: "\u52A0\u8F7D\u5931\u8D25" }), !templates.isLoading && templates.data && templates.data.length === 0 && _jsx("p", { children: "\u6682\u65E0\u53EF\u7528\u7248\u672C\uFF0C\u8BF7\u5148\u5728\u540E\u53F0\u914D\u7F6E\u53EF\u6784\u5EFA\u7248\u672C\u3002" }), !templates.isLoading && templates.data && templates.data.length > 0 && (_jsx("div", { className: "overflow-hidden rounded-2xl border border-base-200", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "table table-zebra", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "w-12" }), _jsx("th", { children: "\u7248\u672C\u540D" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { className: "w-40", children: "\u66F4\u65B0\u65F6\u95F4" })] }) }), _jsx("tbody", { children: templates.data.map((item) => (_jsxs("tr", { className: `hover cursor-pointer transition-colors ${selected === item.filename ? "bg-base-200" : ""}`, onClick: () => setSelected(item.filename), children: [_jsx("td", { children: _jsx("input", { type: "radio", name: "template", className: "radio", checked: selected === item.filename, onChange: () => setSelected(item.filename) }) }), _jsx("td", { className: "font-medium", children: item.filename }), _jsx("td", { className: "max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80", children: item.description || "-" }), _jsx("td", { className: "text-sm text-base-content/60", children: formatDateTime(item.modifiedAt) })] }, item.filename))) })] }) }) })), stepError && _jsx("p", { className: "text-error text-sm", children: stepError }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { className: "btn btn-primary px-8", type: "button", disabled: !selected, onClick: () => {
                                    if (!selected) {
                                        setStepError("请先选择一个版本");
                                        return;
                                    }
                                    setStep(2);
                                }, children: "\u4E0B\u4E00\u6B65" }) })] }) })), step === 2 && (_jsx("div", { className: "card bg-base-100 shadow-xl border border-base-200", children: _jsxs("div", { className: "card-body gap-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "card-title text-2xl font-bold", children: "\u9009\u62E9\u6784\u5EFA\u65B9\u5F0F" }), _jsx("p", { className: "text-base-content/70 mt-1", children: "\u540C\u4E00\u7248\u672C\u652F\u6301\u4E24\u79CD\u6784\u5EFA\u65B9\u5F0F\uFF1ASPA \u76F4\u8FDE\u9762\u677F\uFF0C\u6216 Pro \u901A\u8FC7 BFF \u4E2D\u8F6C\u3002" })] }), role !== "admin" && normalizedUserType === "pending" && (_jsx("div", { className: "rounded-2xl border border-[#6d6bf4]/20 bg-[#6d6bf4]/8 px-5 py-5 text-slate-900 shadow-sm", children: _jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-[0.2em] text-[#6d6bf4]", children: "Build Access" }), _jsx("div", { className: "mt-2 text-xl font-bold", children: "\u5F53\u524D\u8D26\u53F7\u6863\u4F4D\uFF1A\u5F85\u5F00\u901A" }), _jsx("p", { className: "mt-2 text-sm leading-7 text-slate-600", children: "\u4F60\u7684\u8D26\u53F7\u6682\u672A\u5F00\u901A\u4EFB\u4F55\u6784\u5EFA\u6743\u9650\uFF0C\u5F53\u524D\u65E0\u6CD5\u9009\u62E9 `SPA` \u6216 `Pro` \u6784\u5EFA\u65B9\u5F0F\u3002\u8BF7\u5148\u8FD4\u56DE\u4E3B\u9875\u5F00\u901A\u57FA\u7840\u7248\u3001\u8BA2\u9605\u7248\u6216\u4F18\u5148\u7248\uFF0C\u518D\u7EE7\u7EED\u63D0\u4EA4\u6784\u5EFA\u3002" })] }), _jsx("button", { className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", type: "button", onClick: () => navigate("/app"), children: "\u8FD4\u56DE\u4E3B\u9875\u5F00\u901A" })] }) })), role !== "admin" && normalizedUserType !== "pending" && (_jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-200/50 px-4 py-3 text-sm text-base-content/70", children: ["\u5F53\u524D\u8D26\u53F7\u6863\u4F4D\uFF1A", _jsx("span", { className: "font-semibold", children: getUserTypeLabel(normalizedUserType) }), normalizedUserType === "basic"
                                    ? "，可使用 SPA 构建。"
                                    : normalizedUserType === "priority"
                                        ? "，可使用 SPA 与 Pro 构建，且构建时不会校验前端域名。"
                                        : "，可使用 SPA 与 Pro 构建。"] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: `rounded-2xl border p-6 space-y-4 flex h-full flex-col shadow-sm ${selectedMode === "bff" ? "border-secondary bg-secondary/5" : "border-base-200"} ${!canUseBffMode ? "opacity-60" : ""}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-base-content/60", children: "\u7ECF\u670D\u52A1\u7AEF\u4E2D\u8F6C" }), _jsx("h3", { className: "text-xl font-bold", children: "Pro \u7248\uFF08BFF\uFF09" })] }), _jsx("span", { className: "badge badge-secondary", children: "\u63A8\u8350" })] }), _jsx("p", { className: "text-sm text-base-content/70", children: "\u524D\u7AEF\u5148\u8BF7\u6C42 BFF \u670D\u52A1\uFF0C\u518D\u7531\u670D\u52A1\u7AEF\u7EDF\u4E00\u8F6C\u53D1\u548C\u5904\u7406\uFF0C\u9002\u5408\u9700\u8981\u540E\u53F0\u7BA1\u7406\u548C\u66F4\u5F3A\u9694\u79BB\u7684\u573A\u666F\u3002" }), !canUseBffMode && _jsx("p", { className: "text-warning text-sm", children: "\u4EC5\u8BA2\u9605\u7248\u6216\u4F18\u5148\u7248\u53EF\u7528\u3002" }), _jsx("button", { className: "btn btn-secondary btn-block mt-auto", type: "button", disabled: !canUseBffMode, onClick: () => { setSelectedMode("bff"); setStep(3); }, children: "\u8FDB\u5165 Pro \u914D\u7F6E" })] }), _jsxs("div", { className: `rounded-2xl border p-6 space-y-4 flex h-full flex-col shadow-sm ${selectedMode === "legacy" ? "border-primary bg-primary/5" : "border-base-200"} ${!canUseSpaMode ? "opacity-60" : ""}`, children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-base-content/60", children: "\u524D\u7AEF\u76F4\u8FDE\u9762\u677F" }), _jsx("h3", { className: "text-xl font-bold", children: "SPA \u7248\uFF08\u7EAF\u524D\u7AEF\uFF09" })] }), _jsx("p", { className: "text-sm text-base-content/70", children: "\u6D4F\u89C8\u5668\u76F4\u63A5\u8BF7\u6C42\u9762\u677F API\uFF0C\u6784\u5EFA\u65F6\u5199\u5165\u524D\u7AEF\u73AF\u5883\u53D8\u91CF\uFF0C\u9002\u5408\u4F20\u7EDF\u524D\u7AEF\u90E8\u7F72\u573A\u666F\u3002" }), !canUseSpaMode && _jsx("p", { className: "text-warning text-sm", children: "\u5F85\u5F00\u901A\u8D26\u53F7\u6682\u4E0D\u652F\u6301\u6784\u5EFA\u3002" }), _jsx("button", { className: "btn btn-primary btn-block mt-auto", type: "button", disabled: !canUseSpaMode, onClick: () => { setSelectedMode("legacy"); setStep(3); }, children: "\u8FDB\u5165 SPA \u914D\u7F6E" })] })] }), _jsx("div", { className: "flex justify-between", children: _jsx("button", { className: "btn btn-outline", type: "button", onClick: () => setStep(1), children: "\u4E0A\u4E00\u6B65" }) })] }) })), step === 3 && selectedMode && (_jsx("div", { className: "card bg-base-100 shadow-xl border border-base-200", children: _jsxs("div", { className: "card-body gap-8", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-end md:justify-between", children: [_jsx("div", { children: _jsx("h2", { className: "card-title text-2xl font-bold", children: selectedMode === "legacy" ? "SPA 配置" : "Pro 配置" }) }), _jsx("div", { className: `badge badge-lg ${currentCanSubmit ? "badge-success" : "badge-ghost"}`, children: currentCanSubmit ? "配置已就绪" : "请补全配置" })] }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]", children: [_jsxs("form", { id: "build-config-form", className: "order-2 flex min-h-[60vh] flex-col gap-6 xl:order-1", onSubmit: onSubmit, children: [canManageSites && (_jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("h3", { className: "font-bold text-lg", children: "\u7AD9\u70B9\u540D\u79F0" }), _jsx("p", { className: "text-sm text-base-content/60", children: "\u5207\u6362\u7AD9\u70B9\u540E\u4F1A\u81EA\u52A8\u8F7D\u5165\u8BE5\u7AD9\u70B9\u81EA\u5DF1\u7684\u6784\u5EFA\u914D\u7F6E\u3002\u7AD9\u70B9\u540D\u79F0\u8BF7\u5728\u9996\u9875\u7EF4\u62A4\uFF0C\u8FD9\u91CC\u53EA\u8D1F\u8D23\u9009\u62E9\u3002" })] }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u9009\u62E9\u7AD9\u70B9" }), _jsxs("select", { className: "select select-bordered", value: selectedSiteId ?? "", onChange: (e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : null), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9\u7AD9\u70B9" }), siteOptions.map((site) => (_jsx("option", { value: site.id, children: site.name }, site.id)))] })] }) })] })), selectedMode === "legacy" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6", children: [_jsx("h3", { className: "font-bold text-lg border-b border-base-200 pb-3", children: "\u524D\u7AEF\u6784\u5EFA\u53D8\u91CF" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u7AD9\u70B9\u540D\u79F0" }), _jsx("input", { className: "input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed", value: siteName, readOnly: true, disabled: siteProfileQuery.isLoading || (canManageSites && siteOptions.length > 0 && !selectedSiteId) })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u9762\u677F\u7C7B\u578B" }), _jsxs("select", { className: "select select-bordered", value: legacyForm.backendType, onChange: (e) => updateLegacy("backendType", e.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), _jsx("option", { value: "xboard", children: "xboard" }), _jsx("option", { value: "v2board", children: "v2board" }), _jsx("option", { value: "xiaov2board", children: "xiaov2board" })] })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u7AD9\u70B9 Logo" }), _jsx("input", { className: "input input-bordered", value: legacyForm.siteLogo, onChange: (e) => updateLegacy("siteLogo", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u7AD9\u70B9 Logo \u5730\u5740\uFF0C\u652F\u6301\u672C\u5730\u6587\u4EF6\u8DEF\u5F84\u6216 URL" })] }), shouldRequireFrontendOrigins && _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u5DF2\u7ED1\u5B9A\u524D\u7AEF\u57DF\u540D" }), _jsx("textarea", { className: "textarea textarea-bordered min-h-24 bg-base-200 text-base-content/60 cursor-not-allowed", value: frontendOrigins.length ? frontendOrigins.join("\n") : "请先前往首页绑定前端域名", readOnly: true }), !frontendOrigins.length && _jsx("span", { className: "text-warning text-xs", children: "\u8BF7\u5148\u5728\u9996\u9875\u7ED1\u5B9A\u81F3\u5C11 1 \u4E2A\u524D\u7AEF\u57DF\u540D\u540E\u518D\u6784\u5EFA\u3002" })] }), _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u9762\u677F API \u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.prodApiUrl, onChange: (e) => updateLegacy("prodApiUrl", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u540E\u7AEF API \u5730\u5740\uFF0C\u5982 https://api.example.com/api/v1/" }), _jsx("span", { className: "label-text-alt text-base-content/60", children: "\u9ED8\u8BA4\u60C5\u51B5\u4E0B\u65E0\u9700\u4FEE\u6539\uFF1B\u5982\u679C\u4E0D\u901A\u8FC7 Nginx \u8F6C\u53D1\uFF0C\u53EF\u4EE5\u76F4\u63A5\u586B\u5199\u9762\u677F\u5730\u5740\u52A0 `/api/v1/`\uFF0C\u4F8B\u5982 `https://panel.example.com/api/v1/`\u3002" })] })] })] }), _jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6", children: [_jsxs("div", { className: "border-b border-base-200 pb-3", children: [_jsx("h3", { className: "font-bold text-lg", children: "\u8FD0\u884C\u65F6\u914D\u7F6E" }), _jsx("p", { className: "mt-1 text-sm text-base-content/60", children: "\u8FD9\u4E9B\u5185\u5BB9\u6253\u5305\u540E\u4ECD\u53EF\u5728\u7AD9\u70B9\u6839\u76EE\u5F55\u7684 `runtime-config.json` \u4E2D\u7EE7\u7EED\u8C03\u6574\u3002" })] }), _jsx("div", { className: "space-y-3", children: _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u767B\u5F55\u9875\u80CC\u666F" }), _jsx("input", { className: "input input-bordered", value: legacyForm.authBackground, onChange: (e) => updateLegacy("authBackground", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u767B\u5F55\u9875\u80CC\u666F\u56FE\u7247\u5730\u5740\uFF0C\u652F\u6301\u672C\u5730\u6587\u4EF6\u8DEF\u5F84\u6216 URL" })] }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u542F\u7528\u4E0B\u8F7D\u5361\u7247" }), _jsx("input", { type: "checkbox", className: "toggle", checked: legacyForm.downloadEnabled, onChange: (e) => updateLegacy("downloadEnabled", e.target.checked) })] }), legacyForm.downloadEnabled && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "iOS \u4E0B\u8F7D\u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.downloadIos, onChange: (e) => updateLegacy("downloadIos", e.target.value), placeholder: "\u8BF7\u8F93\u5165 iOS \u4E0B\u8F7D\u5730\u5740" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "Android \u4E0B\u8F7D\u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.downloadAndroid, onChange: (e) => updateLegacy("downloadAndroid", e.target.value), placeholder: "\u8BF7\u8F93\u5165 Android \u4E0B\u8F7D\u5730\u5740" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "Windows \u4E0B\u8F7D\u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.downloadWindows, onChange: (e) => updateLegacy("downloadWindows", e.target.value), placeholder: "\u8BF7\u8F93\u5165 Windows \u4E0B\u8F7D\u5730\u5740" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "macOS \u4E0B\u8F7D\u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.downloadMacos, onChange: (e) => updateLegacy("downloadMacos", e.target.value), placeholder: "\u8BF7\u8F93\u5165 macOS \u4E0B\u8F7D\u5730\u5740" })] }), _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u9E3F\u8499\u4E0B\u8F7D\u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.downloadHarmony, onChange: (e) => updateLegacy("downloadHarmony", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u9E3F\u8499\u4E0B\u8F7D\u5730\u5740" })] })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u542F\u7528\u4E09\u65B9\u5BA2\u670D" }), _jsx("input", { type: "checkbox", className: "toggle", checked: legacyForm.thirdPartySupportEnabled, onChange: (e) => updateLegacy("thirdPartySupportEnabled", e.target.checked) })] }), legacyForm.thirdPartySupportEnabled && (_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5BA2\u670D\u811A\u672C" }), _jsx("textarea", { className: "textarea textarea-bordered min-h-28", value: legacyForm.supportScript, onChange: (e) => updateLegacy("supportScript", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u5BA2\u670D\u811A\u672C\u5185\u5BB9" })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u542F\u7528 AppleAutoPro" }), _jsx("input", { type: "checkbox", className: "toggle", checked: legacyForm.appleAutoProShareEnabled, onChange: (e) => updateLegacy("appleAutoProShareEnabled", e.target.checked) })] }), legacyForm.appleAutoProShareEnabled && (_jsxs("div", { className: "grid grid-cols-1 gap-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "AppleAutoPro API \u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: legacyForm.appleAutoProApiBaseUrl, onChange: (e) => updateLegacy("appleAutoProApiBaseUrl", e.target.value), placeholder: "\u8BF7\u8F93\u5165 AppleAutoPro API \u5730\u5740\uFF0C\u5982 https://example.com/api" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "AppleAutoPro API Key" }), _jsx("input", { className: "input input-bordered", value: legacyForm.appleAutoProApiKey, onChange: (e) => updateLegacy("appleAutoProApiKey", e.target.value), placeholder: "\u8BF7\u8F93\u5165 AppleAutoPro API Key" })] })] }))] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6", children: [_jsx("h3", { className: "font-bold text-lg border-b border-base-200 pb-3", children: "\u524D\u7AEF\u6784\u5EFA\u53D8\u91CF" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u7AD9\u70B9\u540D\u79F0" }), _jsx("input", { className: "input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed", value: siteName, readOnly: true, disabled: siteProfileQuery.isLoading || (canManageSites && siteOptions.length > 0 && !selectedSiteId) })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u7AD9\u70B9 Logo" }), _jsx("input", { className: "input input-bordered", value: bffForm.frontend.siteLogo, onChange: (e) => updateBffFrontend("siteLogo", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u7AD9\u70B9 Logo \u5730\u5740\uFF0C\u652F\u6301\u672C\u5730\u6587\u4EF6\u8DEF\u5F84\u6216 URL" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u9762\u677F\u7C7B\u578B" }), _jsxs("select", { className: "select select-bordered", value: bffForm.frontend.backendType, onChange: (e) => updateBffFrontend("backendType", e.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), _jsx("option", { value: "xboard", children: "xboard" }), _jsx("option", { value: "v2board", children: "v2board" }), _jsx("option", { value: "xiaov2board", children: "xiaov2board" })] })] }), shouldRequireFrontendOrigins && _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u5DF2\u7ED1\u5B9A\u524D\u7AEF\u57DF\u540D" }), _jsx("textarea", { className: "textarea textarea-bordered min-h-24 bg-base-200 text-base-content/60 cursor-not-allowed", value: frontendOrigins.length ? frontendOrigins.join("\n") : "请先前往首页绑定前端域名", readOnly: true }), !frontendOrigins.length && _jsx("span", { className: "text-base-content/60 text-xs", children: "\u5982\u672A\u7ED1\u5B9A\u524D\u7AEF\u57DF\u540D\uFF0C\u672C\u6B21\u6784\u5EFA\u5C06\u4E0D\u4F1A\u5F00\u542F\u524D\u7AEF\u57DF\u540D\u6821\u9A8C\u3002" })] }), _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u7BA1\u7406\u4E2D\u53F0\u8BBF\u95EE\u8DEF\u5F84" }), _jsxs("div", { className: "join w-full", children: [_jsx("span", { className: "join-item flex items-center whitespace-nowrap rounded-l-btn border border-base-300 bg-base-200 px-3 text-sm text-base-content/70", children: previewFrontendOrigin }), _jsx("input", { className: "input input-bordered join-item w-full", value: bffForm.server.adminBasePath, onChange: (e) => updateBffServer("adminBasePath", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u7BA1\u7406\u4E2D\u53F0\u8BBF\u95EE\u8DEF\u5F84\uFF0C\u5982 /admin" })] }), _jsx("span", { className: "label-text-alt text-base-content/60", children: shouldRequireFrontendOrigins ? "上面先展示第一个已绑定前端域名作为示例；实际上所有已绑定前端域名都可以访问管理中台，访问方式相同。" : "优先版不要求绑定前端域名；这里仅作为常规部署示例，构建时会直接关闭前端来源校验。" }), shouldRequireFrontendOrigins && frontendOrigins.length > 0 && (_jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: frontendOrigins.map((origin) => (_jsxs("span", { className: "rounded-full bg-base-200 px-3 py-1 text-xs text-base-content/70", children: [origin, adminBasePathPreview] }, origin))) }))] })] })] }), _jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6", children: [_jsx("h3", { className: "font-bold text-lg border-b border-base-200 pb-3", children: "\u9762\u677F\u73AF\u5883" }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text font-medium", children: "\u9762\u677F\u5730\u5740" }), _jsx("input", { className: "input input-bordered", value: bffForm.server.panelBaseUrl, onChange: (e) => updateBffServer("panelBaseUrl", e.target.value), placeholder: "\u8BF7\u8F93\u5165\u9762\u677F\u5730\u5740\uFF0C\u5982 https://panel.example.com" })] })] })] }))] }), _jsx("aside", { className: "order-1 xl:order-2", children: _jsxs("div", { className: "rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm xl:sticky xl:top-6", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u6784\u5EFA\u6982\u89C8" }), _jsxs("div", { className: "mt-4 space-y-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base-content/50", children: "\u7AD9\u70B9\u540D\u79F0" }), _jsx("p", { className: "mt-1 font-medium", children: siteName || "未设置" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base-content/50", children: "\u6784\u5EFA\u65B9\u5F0F" }), _jsx("p", { className: "mt-1 font-medium", children: selectedModeLabel })] }), _jsxs("div", { children: [_jsx("p", { className: "text-base-content/50", children: "\u7248\u672C" }), _jsx("p", { className: "mt-1 font-medium break-all", children: selected || "未选择" })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-base-content/50", children: "\u5F53\u524D\u72B6\u6001" }), _jsx("p", { className: `mt-1 font-medium ${currentCanSubmit ? "text-success" : "text-warning"}`, children: currentCanSubmit ? "可以开始构建" : "还有配置待补全" })] })] }), _jsx("div", { className: "mt-5 rounded-xl bg-base-200/60 p-4 text-sm text-base-content/70", children: selectedMode === "legacy"
                                                    ? shouldRequireFrontendOrigins
                                                        ? "SPA 版只会写入最小前端 env 集合；站点名称和前端域名继续自动取主页设置。"
                                                        : "SPA 版只会写入最小前端 env 集合。"
                                                    : shouldRequireFrontendOrigins
                                                        ? "Pro 版只会写入最小前端 env 集合；站点名称和前端域名继续自动取主页设置。"
                                                        : "Pro 版只会写入最小前端 env 集合。" })] }) })] }), buildMutation.status === "pending" && _jsx("progress", { className: "progress progress-primary w-full" }), error && _jsx("p", { className: "text-error", children: error })] }) })), step === 3 && selectedMode && (_jsxs("div", { className: "sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-base-200 bg-base-100/80 px-6 py-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] backdrop-blur lg:-mx-8 lg:px-8", children: [_jsx("button", { className: "btn btn-outline", type: "button", onClick: () => setStep(2), children: "\u4E0A\u4E00\u6B65" }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { className: "btn btn-ghost text-error hover:bg-error/10", type: "button", onClick: resetCurrentForm, children: "\u6E05\u7A7A\u5F53\u524D\u914D\u7F6E" }), _jsx("button", { className: "btn btn-primary min-w-[160px] shadow-lg shadow-primary/30", type: "submit", form: "build-config-form", disabled: buildMutation.status === "pending" || (selectedMode === "legacy" ? !legacyCanSubmit : !bffCanSubmit), children: buildMutation.status === "pending" ? "构建中..." : "开始构建" })] })] }))] }));
};
export default TemplateBuildPage;
