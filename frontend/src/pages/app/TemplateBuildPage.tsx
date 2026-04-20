import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/useAuth";
import { useCurrentUser } from "../../features/auth/queries";
import { useBuildTemplate } from "../../features/builds/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/builds/profile";
import { useTemplateFiles } from "../../features/builds/queries";
import { useSiteProfile } from "../../features/builds/siteName";
import { canBuildBff, canBuildSpa, getUserTypeLabel, normalizeUserType, shouldEnablePriorityMode, shouldValidateFrontendOrigins } from "../../lib/userAccess";

type BuildMode = "legacy" | "bff";

type LegacyForm = {
  backendType: string;
  siteLogo: string;
  prodApiUrl: string;
  authBackground: string;
  downloadEnabled: boolean;
  downloadIos: string;
  downloadAndroid: string;
  downloadWindows: string;
  downloadMacos: string;
  downloadHarmony: string;
  thirdPartySupportEnabled: boolean;
  supportScript: string;
  appleAutoProShareEnabled: boolean;
  appleAutoProApiBaseUrl: string;
  appleAutoProApiKey: string;
};

type BffForm = {
  frontend: {
    siteLogo: string;
    backendType: string;
  };
  server: {
    panelBaseUrl: string;
    adminBasePath: string;
  };
};

type StoredProfiles = {
  legacy: LegacyForm;
  bff: BffForm;
  lastMode: BuildMode | null;
};

const normalizeEnvValue = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const hasNewline = (value: string) => /[\r\n]/.test(value);
const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const isRecord = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const normalizeString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const createLegacyForm = (): LegacyForm => ({
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

const createBffForm = (): BffForm => ({
  frontend: {
    siteLogo: "",
    backendType: "xboard",
  },
  server: {
    panelBaseUrl: "",
    adminBasePath: "/admin",
  },
});

const normalizeLegacyForm = (input: unknown): LegacyForm => {
  const cfg = isRecord(input) ? input : {};
  const getVal = (key: string, viteKey: string, fallback: unknown) => cfg[key] ?? cfg[viteKey] ?? fallback;
  const downloadIos = normalizeString(getVal("downloadIos", "VITE_DOWNLOAD_IOS", ""));
  const downloadAndroid = normalizeString(getVal("downloadAndroid", "VITE_DOWNLOAD_ANDROID", ""));
  const downloadWindows = normalizeString(getVal("downloadWindows", "VITE_DOWNLOAD_WINDOWS", ""));
  const downloadMacos = normalizeString(getVal("downloadMacos", "VITE_DOWNLOAD_MACOS", ""));
  const downloadHarmony = normalizeString(getVal("downloadHarmony", "VITE_DOWNLOAD_HARMONY", ""));
  const downloadEnabled =
    getVal("downloadEnabled", "VITE_ENABLE_DOWNLOAD", undefined) === undefined
      ? Boolean(downloadIos || downloadAndroid || downloadWindows || downloadMacos || downloadHarmony)
      : getVal("downloadEnabled", "VITE_ENABLE_DOWNLOAD", false) === true ||
        getVal("downloadEnabled", "VITE_ENABLE_DOWNLOAD", false) === "true";
  const thirdPartySupportEnabled =
    getVal("thirdPartySupportEnabled", "", undefined) === undefined
      ? (getVal("supportScript", "VITE_THIRD_PARTY_SCRIPTS", "") ?? "").toString().trim().length > 0
      : getVal("thirdPartySupportEnabled", "", false) === true || getVal("thirdPartySupportEnabled", "", false) === "true";
  const appleAutoProShareEnabled =
    getVal("appleAutoProShareEnabled", "VITE_ENABLE_IDHUB", false) === true ||
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

const normalizeBffForm = (input: unknown): BffForm => {
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

const normalizeStoredProfiles = (input: unknown): StoredProfiles => {
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

const buildLegacyEnvContent = (
  siteName: string,
  frontendOriginsValue: string,
  priorityModeValue: string,
  form: LegacyForm,
) => {
  return [
    "VITE_API_MODE=legacy",
    `VITE_PROD_API_URL=${normalizeEnvValue(form.prodApiUrl) || "/api/v1/"}`,
    `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
    `VITE_SITE_LOGO=${normalizeEnvValue(form.siteLogo)}`,
    `VITE_ALLOWED_CLIENT_ORIGINS=${normalizeEnvValue(frontendOriginsValue)}`,
    `VITE_ENABLE_PRIORITY_MODE=${normalizeEnvValue(priorityModeValue)}`,
    `VITE_BACKEND_TYPE=${normalizeEnvValue(form.backendType)}`,
  ].join("\n");
};

const buildLegacyRuntimeSettings = (form: LegacyForm) => {
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

const buildBffFrontendEnvContent = (
  siteName: string,
  frontendOriginsValue: string,
  priorityModeValue: string,
  form: BffForm,
) => {
  const lines = [
    "VITE_API_MODE=bff",
    `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
    `VITE_SITE_LOGO=${normalizeEnvValue(form.frontend.siteLogo)}`,
    `VITE_ALLOWED_CLIENT_ORIGINS=${normalizeEnvValue(frontendOriginsValue)}`,
    `VITE_ENABLE_PRIORITY_MODE=${normalizeEnvValue(priorityModeValue)}`,
    `VITE_BACKEND_TYPE=${normalizeEnvValue(form.frontend.backendType)}`,
  ];
  return lines.join("\n");
};

const buildBffServerEnvContent = (form: BffForm, priorityModeValue: string) => {
  return [
    `PANEL_BASE_URL=${normalizeEnvValue(form.server.panelBaseUrl)}`,
    `ADMIN_BASE_PATH=${normalizeEnvValue(form.server.adminBasePath) || "/admin"}`,
    `VITE_ENABLE_PRIORITY_MODE=${normalizeEnvValue(priorityModeValue)}`,
  ].join("\n");
};

const TemplateBuildPage = () => {
  const navigate = useNavigate();
  const { role, userType } = useAuth();
  const currentUserQuery = useCurrentUser();
  const templates = useTemplateFiles();
  const buildMutation = useBuildTemplate();
  const saveProfile = useSaveBuildProfile();
  const siteProfileQuery = useSiteProfile();
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<BuildMode | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legacyForm, setLegacyForm] = useState<LegacyForm>(createLegacyForm());
  const [bffForm, setBffForm] = useState<BffForm>(createBffForm());

  const effectiveRole = currentUserQuery.data?.role ?? role;
  const effectiveUserType = normalizeUserType(currentUserQuery.data?.userType ?? userType);
  const siteOptions = siteProfileQuery.data?.sites || [];
  const canManageSites = siteOptions.length > 0;
  const selectedSite = siteOptions.find((item) => item.id === selectedSiteId) ?? null;
  const siteName = selectedSite?.name || siteProfileQuery.data?.siteName || "";
  const frontendOrigins = siteProfileQuery.data?.frontendOrigins || [];
  const frontendOriginsValue = frontendOrigins.join(",");
  const shouldRequireFrontendOrigins = shouldValidateFrontendOrigins(effectiveRole, effectiveUserType);
  const priorityModeEnabled = shouldEnablePriorityMode(effectiveRole, effectiveUserType);
  const priorityModeValue = priorityModeEnabled ? "true" : "false";
  const profileQuery = useBuildProfile(selectedSiteId);
  const adminBasePathPreview = bffForm.server.adminBasePath.trim() || "/admin";
  const previewFrontendOrigin = shouldRequireFrontendOrigins ? (frontendOrigins[0] || "https://your-domain.com") : "https://客户访问网址";
  const canUseSpaMode = canBuildSpa(effectiveRole, effectiveUserType);
  const canUseBffMode = canBuildBff(effectiveRole, effectiveUserType);
  const selectedTemplate = useMemo(() => templates.data?.find((item) => item.filename === selected) ?? null, [selected, templates.data]);
  const selectedModeLabel = selectedMode === "legacy" ? "SPA 版（纯前端）" : selectedMode === "bff" ? "Pro 版（BFF）" : "未选择";

  const currentCanSubmit = Boolean(selected && selectedMode);

  useEffect(() => {
    if (selected || !templates.data || templates.data.length === 0) return;
    const latest = [...templates.data].sort((a, b) => {
      const aTime = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
      const bTime = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
      return bTime - aTime;
    })[0] ?? templates.data[0];
    setSelected(latest?.filename || null);
  }, [selected, templates.data]);

  useEffect(() => {
    if (siteOptions.length === 0) {
      if (selectedSiteId !== null) setSelectedSiteId(null);
      return;
    }
    if (selectedSiteId && siteOptions.some((item) => item.id === selectedSiteId)) return;
    setSelectedSiteId(siteOptions[0]?.id ?? null);
  }, [siteOptions, selectedSiteId]);

  useEffect(() => {
    if (!profileQuery.isSuccess) return;
    const profiles = normalizeStoredProfiles(profileQuery.data);
    setLegacyForm(profiles.legacy);
    setBffForm(profiles.bff);
    setSelectedMode((prev) => profiles.lastMode ?? prev ?? "legacy");
  }, [profileQuery.data, profileQuery.isSuccess]);

  const updateLegacy = <K extends keyof LegacyForm>(key: K, value: LegacyForm[K]) => setLegacyForm((prev) => ({ ...prev, [key]: value }));
  const updateBffFrontend = <K extends keyof BffForm["frontend"]>(key: K, value: BffForm["frontend"][K]) => setBffForm((prev) => ({ ...prev, frontend: { ...prev.frontend, [key]: value } }));
  const updateBffServer = <K extends keyof BffForm["server"]>(key: K, value: BffForm["server"][K]) => setBffForm((prev) => ({ ...prev, server: { ...prev.server, [key]: value } }));

  const saveProfiles = (lastMode: BuildMode) =>
    saveProfile.mutate({
      siteId: selectedSiteId,
      config: { legacy: legacyForm, bff: bffForm, lastMode },
    });

  const resetCurrentForm = () => {
    if (selectedMode === "bff") setBffForm(createBffForm());
    else setLegacyForm(createLegacyForm());
    setError(null);
  };

  const onSubmit = (e: FormEvent) => {
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
      buildMutation.mutate(
        {
          filename: selected,
          siteId: selectedSiteId,
          buildMode: "legacy",
          frontendEnvContent: buildLegacyEnvContent(
            siteName,
            frontendOriginsValue,
            priorityModeValue,
            legacyForm,
          ),
          runtimeSettings: buildLegacyRuntimeSettings(legacyForm),
        },
        {
          onSuccess: (data) => {
            if (data.jobId) navigate(`/app?jobId=${data.jobId}`);
            saveProfiles("legacy");
          },
          onError: (err: any) => setError(err?.response?.data?.error || "构建失败，请稍后再试"),
        },
      );
      return;
    }

    if (selectedMode === "bff") {
      if (!canUseBffMode) {
        setError("当前账号仅订阅版或优先版可使用 Pro 构建");
        return;
      }
      buildMutation.mutate(
        {
          filename: selected,
          siteId: selectedSiteId,
          buildMode: "bff",
          frontendEnvContent: buildBffFrontendEnvContent(
            siteName,
            frontendOriginsValue,
            priorityModeValue,
            bffForm,
          ),
          serverEnvContent: buildBffServerEnvContent(bffForm, priorityModeValue),
        },
        {
          onSuccess: (data) => {
            if (data.jobId) navigate(`/app?jobId=${data.jobId}`);
            saveProfiles("bff");
          },
          onError: (err: any) => setError(err?.response?.data?.error || "构建失败，请稍后再试"),
        },
      );
      return;
    }

    setError("请先选择构建版本");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <ul className="steps w-full max-w-2xl">
          <li className={`step ${step >= 1 ? "step-primary" : ""} cursor-pointer`} onClick={() => setStep(1)}>选择版本</li>
          <li className={`step ${step >= 2 ? "step-primary" : ""} ${selected ? "cursor-pointer" : ""}`} onClick={() => selected && setStep(2)}>选择构建方式</li>
          <li className={`step ${step >= 3 ? "step-primary" : ""}`}>填写配置</li>
        </ul>
      </div>

      {(selected || selectedMode || siteName) && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm sm:p-4">
            <p className="text-xs uppercase tracking-wide text-base-content/50">当前版本</p>
            <p className="mt-2 truncate text-sm font-semibold sm:text-base">{selected || "未选择版本"}</p>
            <p className="mt-1 text-xs text-base-content/60 sm:text-sm">{formatDateTime(selectedTemplate?.modifiedAt)}</p>
          </div>
          <div className="rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm sm:p-4">
            <p className="text-xs uppercase tracking-wide text-base-content/50">构建方式</p>
            <p className="mt-2 truncate text-sm font-semibold sm:text-base">{selectedModeLabel}</p>
            <p className="mt-1 text-xs text-base-content/60 sm:text-sm">{selectedMode === "bff" ? "请求通过服务端中转，更适合增强隔离场景。" : selectedMode === "legacy" ? "浏览器直连面板 API，适合传统部署场景。" : "先选择版本，再进入详细配置。"}</p>
          </div>
          <div className="rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm sm:p-4">
            <p className="text-xs uppercase tracking-wide text-base-content/50">站点名称</p>
            <p className="mt-2 truncate text-sm font-semibold sm:text-base">{siteName || "未设置站点名称"}</p>
            <p className="mt-1 text-xs text-base-content/60 sm:text-sm">{siteName ? "名称将自动带入本次构建配置。" : canManageSites ? "请先在构建页添加并选择站点名称。" : "请先在首页完成站点名称设置。"}</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body gap-6">
            <div>
              <h2 className="card-title text-2xl font-bold">选择版本</h2>
              <p className="mt-1 text-base-content/70">先选择要打包的版本，再根据需求选择构建方式并填写配置。</p>
            </div>
            {templates.isLoading && <p>加载中...</p>}
            {templates.error && <p className="text-error">加载失败</p>}
            {!templates.isLoading && templates.data && templates.data.length === 0 && <p>暂无可用版本，请先在后台配置可构建版本。</p>}
            {!templates.isLoading && templates.data && templates.data.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-base-200">
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr><th className="w-12"></th><th>版本名</th><th>描述</th><th className="w-40">更新时间</th></tr>
                    </thead>
                    <tbody>
                      {templates.data.map((item) => (
                        <tr key={item.filename} className={`hover cursor-pointer transition-colors ${selected === item.filename ? "bg-base-200" : ""}`} onClick={() => setSelected(item.filename)}>
                          <td><input type="radio" name="template" className="radio" checked={selected === item.filename} onChange={() => setSelected(item.filename)} /></td>
                          <td className="font-medium">{item.filename}</td>
                          <td className="max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80">{item.description || "-"}</td>
                          <td className="text-sm text-base-content/60">{formatDateTime(item.modifiedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {stepError && <p className="text-error text-sm">{stepError}</p>}
            <div className="flex justify-end">
              <button className="btn btn-primary px-8" type="button" disabled={!selected} onClick={() => {
                if (!selected) {
                  setStepError("请先选择一个版本");
                  return;
                }
                setStep(2);
              }}>下一步</button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body gap-6">
            <div>
              <h2 className="card-title text-2xl font-bold">选择构建方式</h2>
              <p className="text-base-content/70 mt-1">同一版本支持两种构建方式：SPA 直连面板，或 Pro 通过 BFF 中转。</p>
            </div>
            {effectiveRole !== "admin" && effectiveUserType === "pending" && (
              <div className="rounded-2xl border border-[#6d6bf4]/20 bg-[#6d6bf4]/8 px-5 py-5 text-slate-900 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#6d6bf4]">Build Access</div>
                    <div className="mt-2 text-xl font-bold">当前账号档位：待开通</div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      你的账号暂未开通任何构建权限，当前无法选择 `SPA` 或 `Pro` 构建方式。请先返回主页开通基础版、订阅版、优先版或管理员权限，再继续提交构建。
                    </p>
                  </div>
                  <button
                    className="landing-button-primary rounded-2xl px-5 py-3 text-sm"
                    type="button"
                    onClick={() => navigate("/app")}
                  >
                    返回主页开通
                  </button>
                </div>
              </div>
            )}
            {effectiveRole !== "admin" && effectiveUserType !== "pending" && (
              <div className="rounded-2xl border border-base-200 bg-base-200/50 px-4 py-3 text-sm text-base-content/70">
                当前账号档位：<span className="font-semibold">{getUserTypeLabel(effectiveUserType)}</span>
                {effectiveUserType === "basic"
                  ? "，可使用 SPA 构建。"
                  : effectiveUserType === "priority"
                    ? "，可使用 SPA 与 Pro 构建，且构建时不会校验前端域名。"
                    : "，可使用 SPA 与 Pro 构建。"}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-6 space-y-4 flex h-full flex-col shadow-sm ${selectedMode === "bff" ? "border-secondary bg-secondary/5" : "border-base-200"} ${!canUseBffMode ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-base-content/60">经服务端中转</p><h3 className="text-xl font-bold">Pro 版（BFF）</h3></div><span className="badge badge-secondary">推荐</span></div>
                <p className="text-sm text-base-content/70">前端先请求 BFF 服务，再由服务端统一转发和处理，适合需要后台管理和更强隔离的场景。</p>
                {!canUseBffMode && <p className="text-warning text-sm">仅订阅版、优先版或管理员可用。</p>}
                <button className="btn btn-secondary btn-block mt-auto" type="button" disabled={!canUseBffMode} onClick={() => { setSelectedMode("bff"); setStep(3); }}>进入 Pro 配置</button>
              </div>
              <div className={`rounded-2xl border p-6 space-y-4 flex h-full flex-col shadow-sm ${selectedMode === "legacy" ? "border-primary bg-primary/5" : "border-base-200"} ${!canUseSpaMode ? "opacity-60" : ""}`}>
                <div><p className="text-sm text-base-content/60">前端直连面板</p><h3 className="text-xl font-bold">SPA 版（纯前端）</h3></div>
                <p className="text-sm text-base-content/70">浏览器直接请求面板 API，构建时写入前端环境变量，适合传统前端部署场景。</p>
                {!canUseSpaMode && <p className="text-warning text-sm">待开通账号暂不支持构建。</p>}
                <button className="btn btn-primary btn-block mt-auto" type="button" disabled={!canUseSpaMode} onClick={() => { setSelectedMode("legacy"); setStep(3); }}>进入 SPA 配置</button>
              </div>
            </div>
            <div className="flex justify-between"><button className="btn btn-outline" type="button" onClick={() => setStep(1)}>上一步</button></div>
          </div>
        </div>
      )}

      {step === 3 && selectedMode && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body gap-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="card-title text-2xl font-bold">{selectedMode === "legacy" ? "SPA 配置" : "Pro 配置"}</h2>
              </div>
              <div className={`badge badge-lg ${currentCanSubmit ? "badge-success" : "badge-ghost"}`}>{currentCanSubmit ? "配置已就绪" : "请补全配置"}</div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <form id="build-config-form" className="order-2 flex min-h-[60vh] flex-col gap-6 xl:order-1" onSubmit={onSubmit}>
                {canManageSites && (
                  <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-lg">站点名称</h3>
                      <p className="text-sm text-base-content/60">切换站点后会自动载入该站点自己的构建配置。站点名称请在首页维护，这里只负责选择。</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <label className="form-control">
                        <span className="label-text">选择站点</span>
                        <select
                          className="select select-bordered"
                          value={selectedSiteId ?? ""}
                          onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">请选择站点</option>
                          {siteOptions.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                )}
                {selectedMode === "legacy" ? (
                  <>
                    <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                      <h3 className="font-bold text-lg border-b border-base-200 pb-3">前端构建变量</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="form-control"><span className="label-text">站点名称</span><input className="input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed" value={siteName} readOnly disabled={siteProfileQuery.isLoading || (canManageSites && siteOptions.length > 0 && !selectedSiteId)} /></label>
                        <label className="form-control"><span className="label-text">面板类型</span><select className="select select-bordered" value={legacyForm.backendType} onChange={(e) => updateLegacy("backendType", e.target.value)}><option value="">请选择</option><option value="xboard">xboard</option><option value="v2board">v2board</option><option value="xiaov2board">xiaov2board</option></select></label>
                        <label className="form-control"><span className="label-text">站点 Logo</span><input className="input input-bordered" value={legacyForm.siteLogo} onChange={(e) => updateLegacy("siteLogo", e.target.value)} placeholder="请输入站点 Logo 地址，支持本地文件路径或 URL" /></label>
                        {shouldRequireFrontendOrigins && <label className="form-control md:col-span-2"><span className="label-text">已绑定前端域名</span><textarea className="textarea textarea-bordered min-h-24 bg-base-200 text-base-content/60 cursor-not-allowed" value={frontendOrigins.length ? frontendOrigins.join("\n") : "请先前往首页绑定前端域名"} readOnly />{!frontendOrigins.length && <span className="text-warning text-xs">请先在首页绑定至少 1 个前端域名后再构建。</span>}</label>}
                        <label className="form-control md:col-span-2"><span className="label-text">面板 API 地址</span><input className="input input-bordered" value={legacyForm.prodApiUrl} onChange={(e) => updateLegacy("prodApiUrl", e.target.value)} placeholder="请输入后端 API 地址，如 https://api.example.com/api/v1/" /><span className="label-text-alt text-base-content/60">默认情况下无需修改；如果不通过 Nginx 转发，可以直接填写面板地址加 `/api/v1/`，例如 `https://panel.example.com/api/v1/`。</span></label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                      <div className="border-b border-base-200 pb-3">
                        <h3 className="font-bold text-lg">运行时配置</h3>
                        <p className="mt-1 text-sm text-base-content/60">这些内容打包后仍可在站点根目录的 `runtime-config.json` 中继续调整。</p>
                      </div>

                      <div className="space-y-3">
                        <label className="form-control md:col-span-2">
                          <span className="label-text">登录页背景</span>
                          <input
                            className="input input-bordered"
                            value={legacyForm.authBackground}
                            onChange={(e) => updateLegacy("authBackground", e.target.value)}
                            placeholder="请输入登录页背景图片地址，支持本地文件路径或 URL"
                          />
                        </label>
                      </div>

                      <div className="space-y-3">
                        <label className="form-control">
                          <span className="label-text">启用下载卡片</span>
                          <input type="checkbox" className="toggle" checked={legacyForm.downloadEnabled} onChange={(e) => updateLegacy("downloadEnabled", e.target.checked)} />
                        </label>
                        {legacyForm.downloadEnabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="form-control"><span className="label-text">iOS 下载地址</span><input className="input input-bordered" value={legacyForm.downloadIos} onChange={(e) => updateLegacy("downloadIos", e.target.value)} placeholder="请输入 iOS 下载地址" /></label>
                            <label className="form-control"><span className="label-text">Android 下载地址</span><input className="input input-bordered" value={legacyForm.downloadAndroid} onChange={(e) => updateLegacy("downloadAndroid", e.target.value)} placeholder="请输入 Android 下载地址" /></label>
                            <label className="form-control"><span className="label-text">Windows 下载地址</span><input className="input input-bordered" value={legacyForm.downloadWindows} onChange={(e) => updateLegacy("downloadWindows", e.target.value)} placeholder="请输入 Windows 下载地址" /></label>
                            <label className="form-control"><span className="label-text">macOS 下载地址</span><input className="input input-bordered" value={legacyForm.downloadMacos} onChange={(e) => updateLegacy("downloadMacos", e.target.value)} placeholder="请输入 macOS 下载地址" /></label>
                            <label className="form-control md:col-span-2"><span className="label-text">鸿蒙下载地址</span><input className="input input-bordered" value={legacyForm.downloadHarmony} onChange={(e) => updateLegacy("downloadHarmony", e.target.value)} placeholder="请输入鸿蒙下载地址" /></label>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="form-control">
                          <span className="label-text">启用三方客服</span>
                          <input type="checkbox" className="toggle" checked={legacyForm.thirdPartySupportEnabled} onChange={(e) => updateLegacy("thirdPartySupportEnabled", e.target.checked)} />
                        </label>
                        {legacyForm.thirdPartySupportEnabled && (
                          <label className="form-control">
                            <span className="label-text">客服脚本</span>
                            <textarea
                              className="textarea textarea-bordered min-h-28"
                              value={legacyForm.supportScript}
                              onChange={(e) => updateLegacy("supportScript", e.target.value)}
                              placeholder="请输入客服脚本内容"
                            />
                          </label>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="form-control">
                          <span className="label-text">启用 AppleAutoPro</span>
                          <input type="checkbox" className="toggle" checked={legacyForm.appleAutoProShareEnabled} onChange={(e) => updateLegacy("appleAutoProShareEnabled", e.target.checked)} />
                        </label>
                        {legacyForm.appleAutoProShareEnabled && (
                          <div className="grid grid-cols-1 gap-3">
                            <label className="form-control">
                              <span className="label-text">AppleAutoPro API 地址</span>
                              <input
                                className="input input-bordered"
                                value={legacyForm.appleAutoProApiBaseUrl}
                                onChange={(e) => updateLegacy("appleAutoProApiBaseUrl", e.target.value)}
                                placeholder="请输入 AppleAutoPro API 地址，如 https://example.com/api"
                              />
                            </label>
                            <label className="form-control">
                              <span className="label-text">AppleAutoPro API Key</span>
                              <input
                                className="input input-bordered"
                                value={legacyForm.appleAutoProApiKey}
                                onChange={(e) => updateLegacy("appleAutoProApiKey", e.target.value)}
                                placeholder="请输入 AppleAutoPro API Key"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                      <h3 className="font-bold text-lg border-b border-base-200 pb-3">前端构建变量</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="form-control md:col-span-2"><span className="label-text">站点名称</span><input className="input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed" value={siteName} readOnly disabled={siteProfileQuery.isLoading || (canManageSites && siteOptions.length > 0 && !selectedSiteId)} /></label>
                        <label className="form-control"><span className="label-text">站点 Logo</span><input className="input input-bordered" value={bffForm.frontend.siteLogo} onChange={(e) => updateBffFrontend("siteLogo", e.target.value)} placeholder="请输入站点 Logo 地址，支持本地文件路径或 URL" /></label>
                        <label className="form-control"><span className="label-text">面板类型</span><select className="select select-bordered" value={bffForm.frontend.backendType} onChange={(e) => updateBffFrontend("backendType", e.target.value)}><option value="">请选择</option><option value="xboard">xboard</option><option value="v2board">v2board</option><option value="xiaov2board">xiaov2board</option></select></label>
                        {shouldRequireFrontendOrigins && <label className="form-control md:col-span-2"><span className="label-text">已绑定前端域名</span><textarea className="textarea textarea-bordered min-h-24 bg-base-200 text-base-content/60 cursor-not-allowed" value={frontendOrigins.length ? frontendOrigins.join("\n") : "请先前往首页绑定前端域名"} readOnly />{!frontendOrigins.length && <span className="text-base-content/60 text-xs">如未绑定前端域名，请先在主页完成配置后再继续构建。</span>}</label>}
                        <label className="form-control md:col-span-2">
                          <span className="label-text">管理中台访问路径</span>
                          <div className="join w-full">
                            <span className="join-item flex items-center whitespace-nowrap rounded-l-btn border border-base-300 bg-base-200 px-3 text-sm text-base-content/70">
                              {previewFrontendOrigin}
                            </span>
                            <input
                              className="input input-bordered join-item w-full"
                              value={bffForm.server.adminBasePath}
                              onChange={(e) => updateBffServer("adminBasePath", e.target.value)}
                              placeholder="请输入管理中台访问路径，如 /admin"
                            />
                          </div>
                          <span className="label-text-alt text-base-content/60">{shouldRequireFrontendOrigins ? "上面先展示第一个已绑定前端域名作为示例；实际上所有已绑定前端域名都可以访问管理中台，访问方式相同。" : "配置完成后即可继续提交构建。"}</span>
                          {shouldRequireFrontendOrigins && frontendOrigins.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {frontendOrigins.map((origin) => (
                                <span key={origin} className="rounded-full bg-base-200 px-3 py-1 text-xs text-base-content/70">
                                  {origin}
                                  {adminBasePathPreview}
                                </span>
                              ))}
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                  <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg border-b border-base-200 pb-3">面板环境</h3>
                    <label className="form-control">
                      <span className="label-text font-medium">面板地址</span>
                      <input
                        className="input input-bordered"
                        value={bffForm.server.panelBaseUrl}
                        onChange={(e) => updateBffServer("panelBaseUrl", e.target.value)}
                        placeholder="请输入面板地址，如 https://panel.example.com"
                      />
                    </label>
                  </div>
                  </>
                )}
              </form>

              <aside className="order-1 xl:order-2">
                <div className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm xl:sticky xl:top-6">
                  <h3 className="text-lg font-bold">构建概览</h3>
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <p className="text-base-content/50">站点名称</p>
                      <p className="mt-1 font-medium">{siteName || "未设置"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-base-content/50">构建方式</p>
                        <p className="mt-1 font-medium">{selectedModeLabel}</p>
                      </div>
                      <div>
                        <p className="text-base-content/50">版本</p>
                        <p className="mt-1 font-medium break-all">{selected || "未选择"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-base-content/50">当前状态</p>
                      <p className={`mt-1 font-medium ${currentCanSubmit ? "text-success" : "text-warning"}`}>{currentCanSubmit ? "可以开始构建" : "还有配置待补全"}</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl bg-base-200/60 p-4 text-sm text-base-content/70">
                    {selectedMode === "legacy"
                      ? shouldRequireFrontendOrigins
                        ? "SPA 版只会写入最小前端 env 集合；站点名称和前端域名继续自动取主页设置。"
                        : "SPA 版只会写入最小前端 env 集合。"
                      : shouldRequireFrontendOrigins
                        ? "Pro 版只会写入最小前端 env 集合；站点名称和前端域名继续自动取主页设置。"
                        : "Pro 版只会写入最小前端 env 集合。"}
                  </div>
                </div>
              </aside>
            </div>

            {buildMutation.status === "pending" && <progress className="progress progress-primary w-full" />}
            {error && <p className="text-error">{error}</p>}
          </div>
        </div>
      )}

      {step === 3 && selectedMode && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-base-200 bg-base-100/80 px-6 py-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] backdrop-blur lg:-mx-8 lg:px-8">
          <button className="btn btn-outline" type="button" onClick={() => setStep(2)}>上一步</button>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-ghost text-error hover:bg-error/10" type="button" onClick={resetCurrentForm}>清空当前配置</button>
            <button className="btn btn-primary min-w-[160px] shadow-lg shadow-primary/30" type="submit" form="build-config-form" disabled={buildMutation.status === "pending"}>
              {buildMutation.status === "pending" ? "构建中..." : "开始构建"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuildPage;
