import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/useAuth";
import { useBuildTemplate } from "../../features/builds/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/builds/profile";
import { useTemplateFiles } from "../../features/builds/queries";
import { useSiteProfile } from "../../features/builds/siteName";

type BuildMode = "legacy" | "bff";

type LegacyForm = {
  backendType: string;
  enableLanding: boolean;
  enableTicket: boolean;
  siteLogo: string;
  authBackground: string;
  enableIdhub: boolean;
  idhubApiUrl: string;
  idhubApiKey: string;
  enableDownload: boolean;
  downloadIos: string;
  downloadAndroid: string;
  downloadWindows: string;
  downloadMacos: string;
  downloadHarmony: string;
  prodApiUrl: string;
  allowedClientOrigins: string;
  thirdPartyScripts: string;
  enableThirdPartyScripts: boolean;
};

type BffForm = {
  frontend: {
    siteLogo: string;
    authBackground: string;
    allowedClientOrigins: string;
  };
  server: {
    panelBaseUrl: string;
  };
};

type StoredProfiles = {
  legacy: LegacyForm;
  bff: BffForm;
  lastMode: BuildMode | null;
};

const parseOrigins = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
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
const normalizeFlag = (value: unknown, fallback = false) => (value === undefined ? fallback : value === true || value === "true");
const normalizeString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const normalizeUserType = (value?: string | null) => (value ?? "free").toString().trim().toLowerCase();
const createLegacyForm = (): LegacyForm => ({
  backendType: "xboard",
  enableLanding: true,
  enableTicket: true,
  siteLogo: "",
  authBackground: "",
  enableIdhub: false,
  idhubApiUrl: "/idhub-api/",
  idhubApiKey: "",
  enableDownload: false,
  downloadIos: "",
  downloadAndroid: "",
  downloadWindows: "",
  downloadMacos: "",
  downloadHarmony: "",
  prodApiUrl: "/api/v1/",
  allowedClientOrigins: "",
  thirdPartyScripts: "",
  enableThirdPartyScripts: false,
});

const createBffForm = (): BffForm => ({
  frontend: {
    siteLogo: "",
    authBackground: "",
    allowedClientOrigins: "",
  },
  server: {
    panelBaseUrl: "",
  },
});

const normalizeLegacyForm = (input: unknown): LegacyForm => {
  const cfg = isRecord(input) ? input : {};
  const getVal = (key: string, viteKey: string, fallback: unknown) => cfg[key] ?? cfg[viteKey] ?? fallback;
  const dlIos = normalizeString(getVal("downloadIos", "VITE_DOWNLOAD_IOS", ""));
  const dlAndroid = normalizeString(getVal("downloadAndroid", "VITE_DOWNLOAD_ANDROID", ""));
  const dlWindows = normalizeString(getVal("downloadWindows", "VITE_DOWNLOAD_WINDOWS", ""));
  const dlMacos = normalizeString(getVal("downloadMacos", "VITE_DOWNLOAD_MACOS", ""));
  const dlHarmony = normalizeString(getVal("downloadHarmony", "VITE_DOWNLOAD_HARMONY", ""));
  const enableDownloadRaw = getVal("enableDownload", "VITE_ENABLE_DOWNLOAD", undefined);
  const hasDownloadLinks = Boolean(dlIos || dlAndroid || dlWindows || dlMacos || dlHarmony);

  return {
    backendType: normalizeString(getVal("backendType", "VITE_BACKEND_TYPE", "xboard")),
    enableLanding: normalizeFlag(getVal("enableLanding", "VITE_ENABLE_LANDING", true), true),
    enableTicket: normalizeFlag(getVal("enableTicket", "VITE_ENABLE_TICKET", true), true),
    siteLogo: normalizeString(getVal("siteLogo", "VITE_SITE_LOGO", "")),
    authBackground: normalizeString(getVal("authBackground", "VITE_AUTH_BACKGROUND", "")),
    enableIdhub: normalizeFlag(getVal("enableIdhub", "VITE_ENABLE_IDHUB", false), false),
    idhubApiUrl: normalizeString(getVal("idhubApiUrl", "VITE_IDHUB_API_URL", "/idhub-api/"), "/idhub-api/"),
    idhubApiKey: normalizeString(getVal("idhubApiKey", "VITE_IDHUB_API_KEY", "")),
    enableDownload: enableDownloadRaw === undefined ? hasDownloadLinks : normalizeFlag(enableDownloadRaw, false),
    downloadIos: dlIos,
    downloadAndroid: dlAndroid,
    downloadWindows: dlWindows,
    downloadMacos: dlMacos,
    downloadHarmony: dlHarmony,
    prodApiUrl: normalizeString(getVal("prodApiUrl", "VITE_PROD_API_URL", "/api/v1/"), "/api/v1/"),
    allowedClientOrigins: normalizeString(getVal("allowedClientOrigins", "VITE_ALLOWED_CLIENT_ORIGINS", "")),
    thirdPartyScripts: normalizeString(getVal("thirdPartyScripts", "VITE_THIRD_PARTY_SCRIPTS", "")),
    enableThirdPartyScripts: normalizeFlag(cfg.enableThirdPartyScripts, false),
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
      authBackground: normalizeString(frontend.authBackground, legacy.authBackground),
      allowedClientOrigins: normalizeString(frontend.allowedClientOrigins, legacy.allowedClientOrigins),
    },
    server: {
      panelBaseUrl: normalizeString(server.panelBaseUrl, ""),
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

const buildLegacyEnvContent = (siteName: string, frontendOriginsValue: string, form: LegacyForm) => {
  const lines = [
    "VITE_API_MODE=legacy",
    `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
    `VITE_BACKEND_TYPE=${normalizeEnvValue(form.backendType)}`,
    `VITE_ENABLE_LANDING=${form.enableLanding ? "true" : "false"}`,
    `VITE_ENABLE_TICKET=${form.enableTicket ? "true" : "false"}`,
    `VITE_SITE_LOGO=${normalizeEnvValue(form.siteLogo)}`,
    `VITE_AUTH_BACKGROUND=${normalizeEnvValue(form.authBackground)}`,
    `VITE_ENABLE_IDHUB=${form.enableIdhub ? "true" : "false"}`,
    `VITE_PROD_API_URL=${normalizeEnvValue(form.prodApiUrl) || "/api/v1/"}`,
    `VITE_ALLOWED_CLIENT_ORIGINS=${normalizeEnvValue(frontendOriginsValue)}`,
    `VITE_THIRD_PARTY_SCRIPTS=${form.enableThirdPartyScripts ? normalizeEnvValue(form.thirdPartyScripts) : ""}`,
    `VITE_ENABLE_DOWNLOAD=${form.enableDownload ? "true" : "false"}`,
  ];
  if (form.enableIdhub) {
    lines.push(`VITE_IDHUB_API_URL=${normalizeEnvValue(form.idhubApiUrl)}`, `VITE_IDHUB_API_KEY=${normalizeEnvValue(form.idhubApiKey)}`);
  }
  if (form.enableDownload) {
    lines.push(
      `VITE_DOWNLOAD_IOS=${normalizeEnvValue(form.downloadIos)}`,
      `VITE_DOWNLOAD_ANDROID=${normalizeEnvValue(form.downloadAndroid)}`,
      `VITE_DOWNLOAD_WINDOWS=${normalizeEnvValue(form.downloadWindows)}`,
      `VITE_DOWNLOAD_MACOS=${normalizeEnvValue(form.downloadMacos)}`,
      `VITE_DOWNLOAD_HARMONY=${normalizeEnvValue(form.downloadHarmony)}`,
    );
  }
  return lines.join("\n");
};

const buildBffFrontendEnvContent = (siteName: string, frontendOriginsValue: string, form: BffForm) => {
  return [
    "VITE_API_MODE=bff",
    `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
    `VITE_SITE_LOGO=${normalizeEnvValue(form.frontend.siteLogo)}`,
    `VITE_AUTH_BACKGROUND=${normalizeEnvValue(form.frontend.authBackground)}`,
    `VITE_ALLOWED_CLIENT_ORIGINS=${normalizeEnvValue(frontendOriginsValue)}`,
  ].join("\n");
};

const buildBffServerEnvContent = (form: BffForm) => {
  return `PANEL_BASE_URL=${normalizeEnvValue(form.server.panelBaseUrl)}`;
};

const TemplateBuildPage = () => {
  const navigate = useNavigate();
  const { role, userType } = useAuth();
  const templates = useTemplateFiles();
  const buildMutation = useBuildTemplate();
  const profileQuery = useBuildProfile();
  const saveProfile = useSaveBuildProfile();
  const siteProfileQuery = useSiteProfile();

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<BuildMode | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legacyForm, setLegacyForm] = useState<LegacyForm>(createLegacyForm());
  const [bffForm, setBffForm] = useState<BffForm>(createBffForm());

  const siteName = siteProfileQuery.data?.siteName || "";
  const frontendOrigins = siteProfileQuery.data?.frontendOrigins || [];
  const frontendOriginsValue = frontendOrigins.join(",");
  const canUseBff = role === "admin" || normalizeUserType(userType) === "subscriber";
  const selectedTemplate = useMemo(() => templates.data?.find((item) => item.filename === selected) ?? null, [selected, templates.data]);
  const selectedModeLabel = selectedMode === "legacy" ? "SPA 版（纯前端）" : selectedMode === "bff" ? "Pro 版（BFF）" : "未选择";

  const legacyHasInvalidNewline = useMemo(
    () => [
      siteName,
      legacyForm.siteLogo,
      legacyForm.authBackground,
      legacyForm.idhubApiUrl,
      legacyForm.idhubApiKey,
      legacyForm.downloadIos,
      legacyForm.downloadAndroid,
      legacyForm.downloadWindows,
      legacyForm.downloadMacos,
      legacyForm.downloadHarmony,
      legacyForm.prodApiUrl,
      legacyForm.thirdPartyScripts,
    ].some(hasNewline),
    [siteName, legacyForm],
  );

  const bffHasInvalidNewline = useMemo(
    () => [siteName, bffForm.frontend.siteLogo, bffForm.frontend.authBackground, bffForm.server.panelBaseUrl].some(hasNewline),
    [siteName, bffForm],
  );

  const legacyCanSubmit = useMemo(() => {
    if (!selected || !siteName.trim() || !legacyForm.backendType.trim()) return false;
    if (frontendOrigins.length === 0) return false;
    if (legacyForm.enableIdhub && (!legacyForm.idhubApiUrl.trim() || !legacyForm.idhubApiKey.trim())) return false;
    if (legacyHasInvalidNewline) return false;
    return true;
  }, [selected, siteName, legacyForm, frontendOrigins.length, legacyHasInvalidNewline]);

  const bffCanSubmit = useMemo(() => {
    if (!selected || !canUseBff || !siteName.trim() || !bffForm.server.panelBaseUrl.trim()) return false;
    if (frontendOrigins.length === 0) return false;
    if (bffHasInvalidNewline) return false;
    return true;
  }, [selected, canUseBff, siteName, bffForm, frontendOrigins.length, bffHasInvalidNewline]);
  const currentCanSubmit = selectedMode === "legacy" ? legacyCanSubmit : selectedMode === "bff" ? bffCanSubmit : false;

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
    if (!profileQuery.data) return;
    const profiles = normalizeStoredProfiles(profileQuery.data);
    setLegacyForm(profiles.legacy);
    setBffForm(profiles.bff);
    setSelectedMode((prev) => prev ?? profiles.lastMode);
  }, [profileQuery.data]);

  const updateLegacy = <K extends keyof LegacyForm>(key: K, value: LegacyForm[K]) => setLegacyForm((prev) => ({ ...prev, [key]: value }));
  const updateBffFrontend = <K extends keyof BffForm["frontend"]>(key: K, value: BffForm["frontend"][K]) => setBffForm((prev) => ({ ...prev, frontend: { ...prev.frontend, [key]: value } }));
  const updateBffServer = <K extends keyof BffForm["server"]>(key: K, value: BffForm["server"][K]) => setBffForm((prev) => ({ ...prev, server: { ...prev.server, [key]: value } }));

  const saveProfiles = (lastMode: BuildMode) => saveProfile.mutate({ legacy: legacyForm, bff: bffForm, lastMode });

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
    if (!siteName.trim()) {
      setError("请先在主页设置站点名称");
      return;
    }

    if (selectedMode === "legacy") {
      if (!legacyCanSubmit) {
        setError("请补全 SPA 配置");
        return;
      }
      buildMutation.mutate(
        { filename: selected, buildMode: "legacy", frontendEnvContent: buildLegacyEnvContent(siteName, frontendOriginsValue, legacyForm) },
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
      if (!canUseBff) {
        setError("Pro 版仅订阅用户可用");
        return;
      }
      if (!bffCanSubmit) {
        setError("请补全 Pro 配置");
        return;
      }
      buildMutation.mutate(
        {
          filename: selected,
          buildMode: "bff",
          frontendEnvContent: buildBffFrontendEnvContent(siteName, frontendOriginsValue, bffForm),
          serverEnvContent: buildBffServerEnvContent(bffForm),
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-center py-4">
        <ul className="steps w-full max-w-2xl">
          <li className={`step ${step >= 1 ? "step-primary" : ""} cursor-pointer`} onClick={() => setStep(1)}>选择版本</li>
          <li className={`step ${step >= 2 ? "step-primary" : ""} ${selected ? "cursor-pointer" : ""}`} onClick={() => selected && setStep(2)}>选择构建方式</li>
          <li className={`step ${step >= 3 ? "step-primary" : ""}`}>填写配置</li>
        </ul>
      </div>

      {(selected || selectedMode || siteName) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-base-content/50">当前版本</p>
            <p className="mt-2 truncate font-semibold">{selected || "未选择版本"}</p>
            <p className="mt-1 text-sm text-base-content/60">{formatDateTime(selectedTemplate?.modifiedAt)}</p>
          </div>
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-base-content/50">构建方式</p>
            <p className="mt-2 font-semibold">{selectedModeLabel}</p>
            <p className="mt-1 text-sm text-base-content/60">{selectedMode === "bff" ? "请求通过服务端中转，更适合增强隔离场景。" : selectedMode === "legacy" ? "浏览器直连面板 API，适合传统部署场景。" : "先选择版本，再进入详细配置。"}</p>
          </div>
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-base-content/50">站点名称</p>
            <p className="mt-2 font-semibold">{siteName || "未设置站点名称"}</p>
            <p className="mt-1 text-sm text-base-content/60">{siteName ? "名称将自动带入本次构建配置。" : "请先在首页完成站点名称设置。"}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-6 space-y-4 flex h-full flex-col shadow-sm ${selectedMode === "bff" ? "border-secondary bg-secondary/5" : "border-base-200"} ${!canUseBff ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-base-content/60">经服务端中转</p><h3 className="text-xl font-bold">Pro 版（BFF）</h3></div><span className="badge badge-secondary">推荐</span></div>
                <p className="text-sm text-base-content/70">前端先请求 BFF 服务，再由服务端统一转发和处理，适合需要后台管理和更强隔离的场景。</p>
                {!canUseBff && <p className="text-warning text-sm">仅订阅用户可用。</p>}
                <button className="btn btn-secondary btn-block mt-auto" type="button" disabled={!canUseBff} onClick={() => { setSelectedMode("bff"); setStep(3); }}>进入 Pro 配置</button>
              </div>
              <div className={`rounded-2xl border p-6 space-y-4 flex h-full flex-col shadow-sm ${selectedMode === "legacy" ? "border-primary bg-primary/5" : "border-base-200"}`}>
                <div><p className="text-sm text-base-content/60">前端直连面板</p><h3 className="text-xl font-bold">SPA 版（纯前端）</h3></div>
                <p className="text-sm text-base-content/70">浏览器直接请求面板 API，构建时写入前端环境变量，适合传统前端部署场景。</p>
                <button className="btn btn-primary btn-block mt-auto" type="button" onClick={() => { setSelectedMode("legacy"); setStep(3); }}>进入 SPA 配置</button>
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
                {selectedMode === "legacy" ? (
                  <>
                    <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                      <h3 className="font-bold text-lg border-b border-base-200 pb-3">站点与面板信息</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="form-control"><span className="label-text">站点名称</span><input className="input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed" value={siteName} readOnly disabled={siteProfileQuery.isLoading} /></label>
                        <label className="form-control"><span className="label-text">面板类型</span><select className="select select-bordered" value={legacyForm.backendType} onChange={(e) => updateLegacy("backendType", e.target.value)}><option value="">请选择</option><option value="xboard">xboard</option><option value="v2board">v2board</option><option value="xiaov2board">xiaov2board</option></select></label>
                        <label className="form-control"><span className="label-text">着陆页</span><input type="checkbox" className="toggle" checked={legacyForm.enableLanding} onChange={(e) => updateLegacy("enableLanding", e.target.checked)} /></label>
                        <label className="form-control"><span className="label-text">工单</span><input type="checkbox" className="toggle" checked={legacyForm.enableTicket} onChange={(e) => updateLegacy("enableTicket", e.target.checked)} /></label>
                        <label className="form-control"><span className="label-text">站点 Logo</span><input className="input input-bordered" value={legacyForm.siteLogo} onChange={(e) => updateLegacy("siteLogo", e.target.value)} placeholder="请输入站点 Logo 地址，支持本地文件路径或 URL" /></label>
                        <label className="form-control"><span className="label-text">登录页背景</span><input className="input input-bordered" value={legacyForm.authBackground} onChange={(e) => updateLegacy("authBackground", e.target.value)} placeholder="请输入登录页背景图片地址，支持本地文件路径或 URL" /></label>
                        <label className="form-control md:col-span-2"><span className="label-text">已绑定前端域名</span><textarea className="textarea textarea-bordered min-h-24 bg-base-200 text-base-content/60 cursor-not-allowed" value={frontendOrigins.length ? frontendOrigins.join("\n") : "请先前往首页绑定前端域名"} readOnly />{!frontendOrigins.length && <span className="text-warning text-xs">请先在首页绑定至少 1 个前端域名后再构建。</span>}</label>
                        <label className="form-control md:col-span-2"><span className="label-text">后端 API 地址</span><input className="input input-bordered" value={legacyForm.prodApiUrl} onChange={(e) => updateLegacy("prodApiUrl", e.target.value)} placeholder="请输入后端 API 地址，如 https://api.example.com/api/v1/" /><span className="label-text-alt text-base-content/60">默认情况下无需修改；如果不通过 Nginx 转发，可以直接填写面板地址加 `/api/v1/`，例如 `https://panel.example.com/api/v1/`。</span></label>
                      </div>
                    </div>

                  <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg border-b border-base-200 pb-3">三方客服与下载</h3>
                    <label className="form-control"><span className="label-text">启用三方客服</span><input type="checkbox" className="toggle" checked={legacyForm.enableThirdPartyScripts} onChange={(e) => updateLegacy("enableThirdPartyScripts", e.target.checked)} /></label>
                    {legacyForm.enableThirdPartyScripts && <label className="form-control"><span className="label-text">客服脚本</span><input className="input input-bordered" value={legacyForm.thirdPartyScripts} onChange={(e) => updateLegacy("thirdPartyScripts", e.target.value)} placeholder="请输入脚本内容或脚本地址，如 &lt;script src='https://example.com/chat.js'&gt;&lt;/script&gt;" /></label>}
                    <label className="form-control"><span className="label-text">启用下载卡片</span><input type="checkbox" className="toggle" checked={legacyForm.enableDownload} onChange={(e) => updateLegacy("enableDownload", e.target.checked)} /></label>
                    {legacyForm.enableDownload && <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="form-control"><span className="label-text">iOS 下载地址</span><input className="input input-bordered" value={legacyForm.downloadIos} onChange={(e) => updateLegacy("downloadIos", e.target.value)} placeholder="请输入 iOS 下载地址" /></label><label className="form-control"><span className="label-text">Android 下载地址</span><input className="input input-bordered" value={legacyForm.downloadAndroid} onChange={(e) => updateLegacy("downloadAndroid", e.target.value)} placeholder="请输入 Android 下载地址" /></label><label className="form-control"><span className="label-text">Windows 下载地址</span><input className="input input-bordered" value={legacyForm.downloadWindows} onChange={(e) => updateLegacy("downloadWindows", e.target.value)} placeholder="请输入 Windows 下载地址" /></label><label className="form-control"><span className="label-text">macOS 下载地址</span><input className="input input-bordered" value={legacyForm.downloadMacos} onChange={(e) => updateLegacy("downloadMacos", e.target.value)} placeholder="请输入 macOS 下载地址" /></label><label className="form-control md:col-span-2"><span className="label-text">鸿蒙下载地址</span><input className="input input-bordered" value={legacyForm.downloadHarmony} onChange={(e) => updateLegacy("downloadHarmony", e.target.value)} placeholder="请输入鸿蒙下载地址" /></label></div>}
                  </div>

                  <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg border-b border-base-200 pb-3">AppleAutoPro 集成</h3>
                    <label className="form-control"><span className="label-text">启用分享页</span><input type="checkbox" className="toggle" checked={legacyForm.enableIdhub} onChange={(e) => updateLegacy("enableIdhub", e.target.checked)} /></label>
                    {legacyForm.enableIdhub && <div className="grid grid-cols-1 gap-3"><label className="form-control"><span className="label-text">AppleAutoPro API 地址</span><input className="input input-bordered" value={legacyForm.idhubApiUrl} onChange={(e) => updateLegacy("idhubApiUrl", e.target.value)} placeholder="请输入 AppleAutoPro API 地址，如 https://example.com/api" /><span className="label-text-alt text-base-content/60">默认情况下无需修改；如果不通过 Nginx 转发，可以直接填写面板地址加 `/api/`，例如 `https://panel.example.com/api/`。</span></label><label className="form-control"><span className="label-text">AppleAutoPro API Key</span><input className="input input-bordered" value={legacyForm.idhubApiKey} onChange={(e) => updateLegacy("idhubApiKey", e.target.value)} placeholder="请输入 AppleAutoPro API Key" /></label></div>}
                  </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                      <h3 className="font-bold text-lg border-b border-base-200 pb-3">站点基础信息</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="form-control md:col-span-2"><span className="label-text">站点名称</span><input className="input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed" value={siteName} readOnly disabled={siteProfileQuery.isLoading} /></label>
                        <label className="form-control"><span className="label-text">站点 Logo</span><input className="input input-bordered" value={bffForm.frontend.siteLogo} onChange={(e) => updateBffFrontend("siteLogo", e.target.value)} placeholder="请输入站点 Logo 地址，支持本地文件路径或 URL" /></label>
                        <label className="form-control"><span className="label-text">登录页背景</span><input className="input input-bordered" value={bffForm.frontend.authBackground} onChange={(e) => updateBffFrontend("authBackground", e.target.value)} placeholder="请输入登录页背景图片地址，支持本地文件路径或 URL" /></label>
                        <label className="form-control md:col-span-2"><span className="label-text">已绑定前端域名</span><textarea className="textarea textarea-bordered min-h-24 bg-base-200 text-base-content/60 cursor-not-allowed" value={frontendOrigins.length ? frontendOrigins.join("\n") : "请先前往首页绑定前端域名"} readOnly />{!frontendOrigins.length && <span className="text-warning text-xs">请先在首页绑定至少 1 个前端域名后再构建。</span>}</label>
                      </div>
                    </div>

                  <div className="rounded-2xl border border-base-200 bg-base-200/40 p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg border-b border-base-200 pb-3">面板环境</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <label className="form-control"><span className="label-text">面板地址</span><input className="input input-bordered" value={bffForm.server.panelBaseUrl} onChange={(e) => updateBffServer("panelBaseUrl", e.target.value)} placeholder="请输入面板完整地址，如 https://panel.example.com" /></label>
                    </div>
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
                      ? "SPA 版会把前端配置直接写入构建产物，适合前端直连面板的部署方式。"
                      : "Pro 版由 BFF 统一转发请求，适合需要后台管理和更强隔离的场景。"}
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
            <button className="btn btn-primary min-w-[160px] shadow-lg shadow-primary/30" type="submit" form="build-config-form" disabled={buildMutation.status === "pending" || (selectedMode === "legacy" ? !legacyCanSubmit : !bffCanSubmit)}>
              {buildMutation.status === "pending" ? "构建中..." : "开始构建"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuildPage;
