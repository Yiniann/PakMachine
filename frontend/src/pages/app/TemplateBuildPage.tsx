import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTemplateFiles } from "../../features/builds/queries";
import { useBuildTemplate } from "../../features/builds/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/builds/profile";
import { useSiteName } from "../../features/builds/siteName";
import { useNavigate } from "react-router-dom";

const parseOrigins = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const normalizeEnvValue = (value: string) => value.replace(/[\r\n]+/g, " ").trim();
const hasNewline = (value: string) => /[\r\n]/.test(value);

const TemplateBuildPage = () => {
  const navigate = useNavigate();
  const templates = useTemplateFiles();
  const buildMutation = useBuildTemplate();
  const profileQuery = useBuildProfile();
  const saveProfile = useSaveBuildProfile();
  const siteNameQuery = useSiteName();

  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowedOriginsError, setAllowedOriginsError] = useState<string | null>(null);

  const [form, setForm] = useState({
    backendType: "",
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

  const siteName = siteNameQuery.data?.siteName || "";

  const hasInvalidNewline = useMemo(
    () =>
      [
        siteName,
        ...Object.values(form).filter((v) => typeof v === "string"),
      ].some(hasNewline),
    [siteName, form],
  );

  const canSubmit = useMemo(() => {
    if (!selected) return false;
    if (!siteName.trim()) return false;
    if (!form.backendType.trim()) return false;
    if (form.enableIdhub && (!form.idhubApiUrl.trim() || !form.idhubApiKey.trim())) return false;
    if (allowedOriginsError) return false;
    if (parseOrigins(form.allowedClientOrigins).length > 4) return false;
    if (hasInvalidNewline) return false;
    return true;
  }, [
    selected,
    siteName,
    form,
    allowedOriginsError,
    hasInvalidNewline,
  ]);

  useEffect(() => {
    if (selected || !templates.data || templates.data.length === 0) return;
    const hasModified = templates.data.some((item) => Boolean(item.modifiedAt));
    const latest = hasModified
      ? [...templates.data].sort((a, b) => {
          const aTime = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
          const bTime = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
          return bTime - aTime;
        })[0]
      : templates.data[0];
    setSelected(latest?.filename || null);
  }, [selected, templates.data]);

  useEffect(() => {
    if (selected) {
      setStepError(null);
    }
  }, [selected]);

  const buildEnvContent = () => {
    const prodApiFinal = normalizeEnvValue(form.prodApiUrl) || "/api/v1/";
    const lines = [
      `VITE_SITE_NAME=${normalizeEnvValue(siteName)}`,
      `VITE_BACKEND_TYPE=${normalizeEnvValue(form.backendType)}`,
      `VITE_ENABLE_LANDING=${form.enableLanding ? "true" : "false"}`,
      `VITE_ENABLE_TICKET=${form.enableTicket ? "true" : "false"}`,
      `VITE_SITE_LOGO=${normalizeEnvValue(form.siteLogo)}`,
      `VITE_AUTH_BACKGROUND=${normalizeEnvValue(form.authBackground)}`,
      `VITE_ENABLE_IDHUB=${form.enableIdhub ? "true" : "false"}`,
      `VITE_PROD_API_URL=${prodApiFinal}`,
      `VITE_ALLOWED_CLIENT_ORIGINS=${normalizeEnvValue(form.allowedClientOrigins)}`,
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("请先选择一个模板文件");
      return;
    }
    if (!siteName.trim()) {
      setError("请先在主页设置站点名称");
      return;
    }
    if (!form.backendType.trim()) {
      setError("请先选择面板类型");
      return;
    }
    if (hasInvalidNewline) {
      setError("字段中不允许包含换行");
      return;
    }
    const envContent = buildEnvContent();
    buildMutation.mutate(
      { filename: selected, envContent },
      {
        onSuccess: (data) => {
          if (data.jobId) {
            navigate(`/app?jobId=${data.jobId}`);
          }
          setError(null);
          saveProfile.mutate(form);
        },
        onError: (err: any) => setError(err?.response?.data?.error || "构建失败，请稍后再试"),
      },
    );
  };

  useEffect(() => {
    if (!profileQuery.data) return;
    const cfg: any = profileQuery.data;
    const getVal = (key: string, viteKey: string, fallback: any) => cfg[key] ?? cfg[viteKey] ?? fallback;

    const enableDownloadRaw = getVal("enableDownload", "VITE_ENABLE_DOWNLOAD", undefined);
    const dlIos = getVal("downloadIos", "VITE_DOWNLOAD_IOS", "");
    const dlAndroid = getVal("downloadAndroid", "VITE_DOWNLOAD_ANDROID", "");
    const dlWin = getVal("downloadWindows", "VITE_DOWNLOAD_WINDOWS", "");
    const dlMac = getVal("downloadMacos", "VITE_DOWNLOAD_MACOS", "");
    const dlHarmony = getVal("downloadHarmony", "VITE_DOWNLOAD_HARMONY", "");

    const hasDownloadLinks = Boolean(dlIos || dlAndroid || dlWin || dlMac || dlHarmony);
    const finalEnableDownload = enableDownloadRaw === undefined ? hasDownloadLinks : enableDownloadRaw === true || enableDownloadRaw === "true";

    const enableLandingRaw = getVal("enableLanding", "VITE_ENABLE_LANDING", undefined);
    const finalEnableLanding = enableLandingRaw === undefined ? true : enableLandingRaw === true || enableLandingRaw === "true";

    const enableTicketRaw = getVal("enableTicket", "VITE_ENABLE_TICKET", undefined);
    const finalEnableTicket = enableTicketRaw === undefined ? true : enableTicketRaw === true || enableTicketRaw === "true";

    const enableIdhubRaw = getVal("enableIdhub", "VITE_ENABLE_IDHUB", undefined);
    const finalEnableIdhub = Boolean(enableIdhubRaw === true || enableIdhubRaw === "true");
    const enableThirdPartyScriptsRaw = cfg.enableThirdPartyScripts ?? false;

    setForm({
      backendType: getVal("backendType", "VITE_BACKEND_TYPE", ""),
      enableLanding: finalEnableLanding,
      enableTicket: finalEnableTicket,
      siteLogo: getVal("siteLogo", "VITE_SITE_LOGO", ""),
      authBackground: getVal("authBackground", "VITE_AUTH_BACKGROUND", ""),
      enableIdhub: finalEnableIdhub,
      idhubApiUrl: getVal("idhubApiUrl", "VITE_IDHUB_API_URL", "/idhub-api/"),
      idhubApiKey: getVal("idhubApiKey", "VITE_IDHUB_API_KEY", ""),
      enableDownload: finalEnableDownload,
      downloadIos: dlIos,
      downloadAndroid: dlAndroid,
      downloadWindows: dlWin,
      downloadMacos: dlMac,
      downloadHarmony: dlHarmony,
      prodApiUrl: getVal("prodApiUrl", "VITE_PROD_API_URL", "/api/v1/"),
      allowedClientOrigins: getVal("allowedClientOrigins", "VITE_ALLOWED_CLIENT_ORIGINS", ""),
      thirdPartyScripts: getVal("thirdPartyScripts", "VITE_THIRD_PARTY_SCRIPTS", ""),
      enableThirdPartyScripts: Boolean(enableThirdPartyScriptsRaw === true || enableThirdPartyScriptsRaw === "true"),
    });
    setAllowedOriginsError(null);
  }, [profileQuery.data]);

  useEffect(() => {
    const origins = parseOrigins(form.allowedClientOrigins);
    setAllowedOriginsError(origins.length > 4 ? "最多只能填写 4 个域名" : null);
  }, [form.allowedClientOrigins]);

  const resetForm = () => {
    setForm({
      backendType: "",
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
    setAllowedOriginsError(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <ul className="steps w-full max-w-md">
          <li className={`step ${step >= 1 ? "step-primary" : ""} cursor-pointer`} onClick={() => setStep(1)}>
            选择模板
          </li>
          <li className={`step ${step >= 2 ? "step-primary" : ""}`}>填写配置</li>
        </ul>
      </div>

      {step === 1 && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <div className="flex items-center">
              <h2 className="card-title text-2xl font-bold">选择模板</h2>
            </div>
            {templates.isLoading && <p>加载中...</p>}
            {templates.error && <p className="text-error">加载失败</p>}
            {!templates.isLoading && templates.data && templates.data.length === 0 && <p>暂无可用模板，请先在后台配置 GitHub 模板。</p>}
            {!templates.isLoading && templates.data && templates.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-12"></th>
                      <th>模板名</th>
                      <th>描述</th>
                      <th className="w-40">更新时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.data.map((item) => (
                      <tr
                        key={item.filename}
                        className={`hover cursor-pointer transition-colors ${selected === item.filename ? "bg-base-200" : ""}`}
                        onClick={() => setSelected(item.filename)}
                      >
                        <td>
                          <input
                            type="radio"
                            name="template"
                            className="radio"
                            checked={selected === item.filename}
                            onChange={() => setSelected(item.filename)}
                          />
                        </td>
                        <td className="font-medium">{item.filename}</td>
                        <td className="max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80">{item.description || "-"}</td>
                        <td className="text-sm text-base-content/60">{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {stepError && <p className="text-error text-sm">{stepError}</p>}
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary px-8"
                disabled={!selected}
                onClick={() => {
                  if (!selected) {
                    setStepError("请先选择一个模板");
                    return;
                  }
                  setStep(2);
                }}
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body gap-6">
            <div>
              <h2 className="card-title text-2xl font-bold">填写配置</h2>
              <p className="text-base-content/70 mt-1">按要求填写字段，系统会生成 .env 写入模板并进行构建。</p>
            </div>

            <form id="build-config-form" className="flex min-h-[60vh] flex-col gap-6" onSubmit={onSubmit}>
              <div className="rounded-xl border border-base-200 bg-base-200/50 p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.636 12 12 12m0 0c-1.657 0-3.636 4.03-3.636 9m3.636-9a9.004 9.004 0 01-8.716-6.747M12 12c2.485 0 4.5-4.03 4.5-9S13.636 3 12 3m0 0c-1.657 0-3.636 4.03-3.636 9m3.636-9a9.004 9.004 0 018.716 6.747M12 12c-2.485 0-4.5-4.03-4.5-9" /></svg>
                  <h3 className="font-bold text-lg">站点基础信息</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 flex flex-wrap items-end gap-3">
                    <label className="form-control w-full md:w-1/2">
                      <span className="label-text">站点名称</span>
                      <input
                        className="input input-bordered bg-base-200 text-base-content/60 cursor-not-allowed w-full"
                        value={siteName}
                        readOnly
                        disabled={siteNameQuery.isLoading}
                        placeholder={siteNameQuery.isLoading ? "加载中..." : "请先在主页设置站点名称"}
                      />
                      {!siteName && !siteNameQuery.isLoading && <span className="text-error text-sm">请前往主页先设置站点名称</span>}
                    </label>
                    <label className="form-control w-full md:w-1/4">
                      <span className="label-text">面板类型</span>
                      <select className="select select-bordered" value={form.backendType} onChange={(e) => setForm({ ...form, backendType: e.target.value })} required>
                        <option value="">请选择</option>
                        <option value="xboard">xboard</option>
                        <option value="v2board">v2board</option>
                        <option value="xiaov2board">xiaov2board</option>
                      </select>
                    </label>
                    <label className="form-control">
                      <span className="label-text">着陆页开关</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={form.enableLanding}
                          onChange={(e) => setForm({ ...form, enableLanding: e.target.checked })}
                        />
                        <span className="text-sm text-base-content/70">{form.enableLanding ? "开启" : "关闭"}</span>
                      </div>
                    </label>
                    <label className="form-control">
                      <span className="label-text">代办工单开关</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={form.enableTicket}
                          onChange={(e) => setForm({ ...form, enableTicket: e.target.checked })}
                        />
                        <span className="text-sm text-base-content/70">{form.enableTicket ? "开启" : "关闭"}</span>
                      </div>
                    </label>
                  </div>
                  <label className="form-control">
                    <span className="label-text">站点 Logo</span>
                    <input className="input input-bordered" value={form.siteLogo} onChange={(e) => setForm({ ...form, siteLogo: e.target.value })} placeholder="支持url或者本地图片" />
                  </label>
                  <label className="form-control">
                    <span className="label-text">登陆页背景</span>
                    <input
                      className="input input-bordered"
                      value={form.authBackground}
                      onChange={(e) => setForm({ ...form, authBackground: e.target.value })}
                      placeholder="支持 url 或本地图片"
                    />
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text">前端域名（多个域名用逗号分隔，最多 4 个）</span>
                    <input
                      className="input input-bordered"
                      value={form.allowedClientOrigins}
                      onChange={(e) => setForm({ ...form, allowedClientOrigins: e.target.value })}
                      placeholder="请输入完整域名，如 https://xxx.xxx.com, https://yyy.yyy.com"
                    />
                    {allowedOriginsError && <span className="text-error text-xs">{allowedOriginsError}</span>}
                  </label>
                  <label className="form-control md:col-span-2">
                    <span className="label-text">后端 API 地址</span>
                    <input
                      className="input input-bordered"
                      value={form.prodApiUrl}
                      onChange={(e) => setForm({ ...form, prodApiUrl: e.target.value })}
                      placeholder="/api/v1/"
                    />
                    <div className="mt-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-warning">
                      服务器静态部署无需修改（保持 /api/v1/ 即可，Nginx 会在服务器端反代）；如使用 serverless 部署，请填写对应的反代 Worker 地址。
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-base-200 bg-base-200/50 p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-info"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6.88 3.08 2.3 3.86l1.02.56a2.25 2.25 0 001.08.28h9.9a2.25 2.25 0 001.08-.28l1.02-.56a4.5 4.5 0 002.3-3.86v-1.52a4.5 4.5 0 00-2.3-3.86l-1.02-.56a2.25 2.25 0 00-1.08-.28h-9.9a2.25 2.25 0 00-1.08.28l-1.02.56a4.5 4.5 0 00-2.3 3.86v1.52z" /></svg>
                  <h3 className="font-bold text-lg">三方客服</h3>
                </div>
                <label className="form-control">
                  <span className="label-text font-medium">启用三方客服</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={form.enableThirdPartyScripts}
                      onChange={(e) => setForm({ ...form, enableThirdPartyScripts: e.target.checked })}
                    />
                    <span className="text-sm text-base-content/70">{form.enableThirdPartyScripts ? "开启" : "关闭"}</span>
                  </div>
                </label>
                {form.enableThirdPartyScripts && (
                  <label className="form-control">
                    <span className="label-text">客服脚本</span>
                    <input
                      className="input input-bordered"
                      value={form.thirdPartyScripts}
                      onChange={(e) => setForm({ ...form, thirdPartyScripts: e.target.value })}
                      placeholder="<script>...</script>"
                    />
                  </label>
                )}
                <div className="rounded-md border border-info/40 bg-info/15 px-3 py-2 text-sm text-info">
                  支持crisp，salesmartly，企业qq等客服脚本，输入完整的脚本内容。
                </div>
              </div>
              <div className="rounded-xl border border-base-200 bg-base-200/50 p-6 space-y-6">
                <label className="form-control">
                  <div className="flex items-center gap-2 border-b border-base-200 pb-3 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-secondary"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    <h3 className="font-bold text-lg">客户端下载配置</h3>
                  </div>
                  <span className="label-text font-medium">启用下载卡片</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={form.enableDownload}
                      onChange={(e) => setForm({ ...form, enableDownload: e.target.checked })}
                    />
                    <span className="text-sm text-base-content/70">{form.enableDownload ? "开启" : "关闭"}</span>
                  </div>
                </label>
                {form.enableDownload && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="form-control">
                      <span className="label-text">iOS 下载地址</span>
                      <input className="input input-bordered" value={form.downloadIos} onChange={(e) => setForm({ ...form, downloadIos: e.target.value })} placeholder="https://example.com/ios" />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Android 下载地址</span>
                      <input
                        className="input input-bordered"
                        value={form.downloadAndroid}
                        onChange={(e) => setForm({ ...form, downloadAndroid: e.target.value })}
                        placeholder="https://example.com/android"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text">Windows 下载地址</span>
                      <input
                        className="input input-bordered"
                        value={form.downloadWindows}
                        onChange={(e) => setForm({ ...form, downloadWindows: e.target.value })}
                        placeholder="https://example.com/windows"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label-text">macOS 下载地址</span>
                      <input className="input input-bordered" value={form.downloadMacos} onChange={(e) => setForm({ ...form, downloadMacos: e.target.value })} placeholder="https://example.com/macos" />
                    </label>
                    <label className="form-control">
                      <span className="label-text">鸿蒙下载地址</span>
                      <input
                        className="input input-bordered"
                        value={form.downloadHarmony}
                        onChange={(e) => setForm({ ...form, downloadHarmony: e.target.value })}
                        placeholder="https://example.com/harmony"
                      />
                    </label>
                  </div>
                )}
                <div className="mt-2 rounded-md border border-info/40 bg-info/15 px-3 py-2 text-sm text-info">
                  下载地址可留空，留空则不显示对应客户端的下载按钮。
                </div>
              </div>

              <div className="rounded-xl border border-base-200 bg-base-200/50 p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-accent"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                  <h3 className="font-bold text-lg">AppleAutoPro 集成</h3>
                </div>
                <div role="alert" className="alert alert-success bg-success/10 text-success-content border-success/20 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>对接 AppleAutoPro 账号分享页。</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="form-control md:col-span-2">
                    <span className="label-text font-medium">启用分享页</span>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="toggle" checked={form.enableIdhub} onChange={(e) => setForm({ ...form, enableIdhub: e.target.checked })} />
                      <span className="text-sm text-base-content/70">{form.enableIdhub ? "开启" : "关闭"}</span>
                    </div>
                  </label>
                  {form.enableIdhub && (
                    <>
                      <label className="form-control md:col-span-2">
                        <span className="label-text">AppleAutoPro API 地址*</span>
                        <input
                          className="input input-bordered"
                          value={form.idhubApiUrl}
                          onChange={(e) => setForm({ ...form, idhubApiUrl: e.target.value })}
                          placeholder="/idhub-api/"
                          required={form.enableIdhub}
                        />
                        <div className="mt-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-warning">
                          服务器静态部署无需修改（保持 /idhub-api/ 即可，Nginx 会在服务器端反代）；如使用 serverless 部署，请填写对应的反代 Worker 地址。
                        </div>
                      </label>
                      <label className="form-control md:col-span-2">
                        <span className="label-text">AppleAutoPro API Key*</span>
                        <input
                          className="input input-bordered"
                          value={form.idhubApiKey}
                          onChange={(e) => setForm({ ...form, idhubApiKey: e.target.value })}
                          required={form.enableIdhub}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </form>
            {buildMutation.status === "pending" && <progress className="progress progress-primary w-full" />}
            {error && <p className="text-error">{error}</p>}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-base-200 bg-base-100/80 px-6 py-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] backdrop-blur lg:-mx-8 lg:px-8">
          <button className="btn btn-outline" type="button" onClick={() => setStep(1)}>
            上一步
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-ghost text-error hover:bg-error/10"
              type="button"
              onClick={resetForm}
            >
              清空
            </button>
            <button
              className="btn btn-primary min-w-[160px] shadow-lg shadow-primary/30"
              type="submit"
              form="build-config-form"
              disabled={!canSubmit || buildMutation.status === "pending"}
            >
              {buildMutation.status === "pending" ? "构建中..." : "开始构建"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuildPage;
