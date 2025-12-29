import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTemplateFiles } from "../../features/builds/queries";
import { useBuildTemplate } from "../../features/builds/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/builds/profile";
import { useSiteName } from "../../features/builds/siteName";
import { useNavigate } from "react-router-dom";

const TemplateBuildPage = () => {
  const navigate = useNavigate();
  const templates = useTemplateFiles();
  const buildMutation = useBuildTemplate();
  const profileQuery = useBuildProfile();
  const saveProfile = useSaveBuildProfile();
  const siteNameQuery = useSiteName();

  const [selected, setSelected] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [enableLanding, setEnableLanding] = useState(true);
  const [enableRedeemCode, setEnableRedeemCode] = useState(true);
  const [siteLogo, setSiteLogo] = useState("");
  const [authBackground, setAuthBackground] = useState("");
  const [enableIdhub, setEnableIdhub] = useState(false);
  const [idhubApiUrl, setIdhubApiUrl] = useState("/idhub-api/");
  const [idhubApiKey, setIdhubApiKey] = useState("");
  const [enableDownload, setEnableDownload] = useState(false);
  const [downloadIos, setDownloadIos] = useState("");
  const [downloadAndroid, setDownloadAndroid] = useState("");
  const [downloadWindows, setDownloadWindows] = useState("");
  const [downloadMacos, setDownloadMacos] = useState("");
  const [prodApiUrl, setProdApiUrl] = useState("/api/v1/");
  const [allowedClientOrigins, setAllowedClientOrigins] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowedOriginsError, setAllowedOriginsError] = useState<string | null>(null);

  const parseOrigins = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const canSubmit = useMemo(() => {
    if (!selected) return false;
    if (!siteName.trim()) return false;
    if (enableIdhub && (!idhubApiUrl.trim() || !idhubApiKey.trim())) return false;
    if (allowedOriginsError) return false;
    if (parseOrigins(allowedClientOrigins).length > 4) return false;
    return true;
  }, [selected, siteName, enableIdhub, idhubApiUrl, idhubApiKey, allowedOriginsError, allowedClientOrigins]);

  const buildEnvContent = () => {
    const prodApiFinal = prodApiUrl.trim() || "/api/v1/";
    const lines = [
      `VITE_SITE_NAME=${siteName.trim()}`,
      `VITE_ENABLE_LANDING=${enableLanding ? "true" : "false"}`,
      `VITE_ENABLE_REDEEM_CODE=${enableRedeemCode ? "true" : "false"}`,
      `VITE_SITE_LOGO=${siteLogo.trim()}`,
      `VITE_AUTH_BACKGROUND=${authBackground.trim()}`,
      `VITE_ENABLE_IDHUB=${enableIdhub ? "true" : "false"}`,
      `VITE_PROD_API_URL=${prodApiFinal}`,
      `VITE_ALLOWED_CLIENT_ORIGINS=${allowedClientOrigins.trim()}`,
      `VITE_ENABLE_DOWNLOAD=${enableDownload ? "true" : "false"}`,
    ];
    if (enableIdhub) {
      lines.push(`VITE_IDHUB_API_URL=${idhubApiUrl.trim()}`, `VITE_IDHUB_API_KEY=${idhubApiKey.trim()}`);
    }
    if (enableDownload) {
      lines.push(
        `VITE_DOWNLOAD_IOS=${downloadIos.trim()}`,
        `VITE_DOWNLOAD_ANDROID=${downloadAndroid.trim()}`,
        `VITE_DOWNLOAD_WINDOWS=${downloadWindows.trim()}`,
        `VITE_DOWNLOAD_MACOS=${downloadMacos.trim()}`,
      );
    }
    return lines.join("\n");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!selected) {
      setError("请先选择一个模板文件");
      return;
    }
    if (!siteName.trim()) {
      setError("请先在主页设置站点名称");
      return;
    }
    const envContent = buildEnvContent();
    buildMutation.mutate(
      { filename: selected, envContent },
      {
        onSuccess: (data) => {
          setMessage(data.message || "构建已加入队列，正在处理...");
          if (data.jobId) {
            navigate(`/app?jobId=${data.jobId}`);
          }
          setError(null);
          saveProfile.mutate({
            siteLogo,
            authBackground,
            prodApiUrl,
            enableIdhub,
            idhubApiUrl,
            idhubApiKey,
            allowedClientOrigins,
            enableLanding,
            enableRedeemCode,
            enableDownload,
            downloadIos,
            downloadAndroid,
            downloadWindows,
            downloadMacos,
          });
        },
        onError: (err: any) => setError(err?.response?.data?.error || "构建失败，请稍后再试"),
      },
    );
  };

  useEffect(() => {
    setSiteName(siteNameQuery.data?.siteName || "");
  }, [siteNameQuery.data?.siteName]);

  useEffect(() => {
    if (profileQuery.data) {
      const cfg: any = profileQuery.data;
      setSiteLogo(cfg.siteLogo || cfg.VITE_SITE_LOGO || "");
      setAuthBackground(cfg.authBackground || cfg.VITE_AUTH_BACKGROUND || "");
      setProdApiUrl(cfg.prodApiUrl || cfg.VITE_PROD_API_URL || "/api/v1/");
      setEnableIdhub(Boolean(cfg.enableIdhub ?? (cfg.VITE_ENABLE_IDHUB === "true" || cfg.VITE_ENABLE_IDHUB === true)));
      setIdhubApiUrl(cfg.idhubApiUrl || cfg.VITE_IDHUB_API_URL || "/idhub-api/");
      setIdhubApiKey(cfg.idhubApiKey || cfg.VITE_IDHUB_API_KEY || "");
      setAllowedClientOrigins(cfg.allowedClientOrigins || cfg.VITE_ALLOWED_CLIENT_ORIGINS || "");
      setAllowedOriginsError(null);
      const downloadIosValue = cfg.downloadIos || cfg.VITE_DOWNLOAD_IOS || "";
      const downloadAndroidValue = cfg.downloadAndroid || cfg.VITE_DOWNLOAD_ANDROID || "";
      const downloadWindowsValue = cfg.downloadWindows || cfg.VITE_DOWNLOAD_WINDOWS || "";
      const downloadMacosValue = cfg.downloadMacos || cfg.VITE_DOWNLOAD_MACOS || "";
      setDownloadIos(downloadIosValue);
      setDownloadAndroid(downloadAndroidValue);
      setDownloadWindows(downloadWindowsValue);
      setDownloadMacos(downloadMacosValue);
      const downloadRaw = cfg.enableDownload ?? cfg.VITE_ENABLE_DOWNLOAD;
      const hasDownloadLinks = Boolean(downloadIosValue || downloadAndroidValue || downloadWindowsValue || downloadMacosValue);
      setEnableDownload(downloadRaw === undefined ? hasDownloadLinks : downloadRaw === true || downloadRaw === "true");
      const landingRaw = cfg.enableLanding ?? cfg.VITE_ENABLE_LANDING;
      setEnableLanding(landingRaw === undefined ? true : landingRaw === true || landingRaw === "true");
      const redeemCodeRaw = cfg.enableRedeemCode ?? cfg.VITE_ENABLE_REDEEM_CODE;
      setEnableRedeemCode(redeemCodeRaw === undefined ? true : redeemCodeRaw === true || redeemCodeRaw === "true");
    }
  }, [profileQuery.data]);

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">选择模板</h2>
          {templates.isLoading && <p>加载中...</p>}
          {templates.error && <p className="text-error">加载失败</p>}
          {!templates.isLoading && templates.data && templates.data.length === 0 && <p>暂无可用模板，请先上传。</p>}
          {!templates.isLoading && templates.data && templates.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>模板名</th>
                    <th>描述</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.data.map((item) => (
                    <tr key={item.filename}>
                      <td>
                        <input
                          type="radio"
                          name="template"
                          className="radio"
                          checked={selected === item.filename}
                          onChange={() => setSelected(item.filename)}
                        />
                      </td>
                      <td className="whitespace-pre-wrap break-all">{item.filename}</td>
                      <td className="max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80">{item.description || "-"}</td>
                      <td>{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">填写站点配置</h2>
          <p className="text-sm text-base-content/70">按要求填写字段，系统会生成 .env 写入模板并进行构建。</p>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="rounded-lg border border-base-200 bg-base-200/30 p-4 space-y-4">
              <div className="font-semibold text-base">站点信息</div>
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
                  <label className="form-control">
                    <span className="label-text">着陆页开关</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={enableLanding}
                        onChange={(e) => setEnableLanding(e.target.checked)}
                      />
                      <span className="text-sm text-base-content/70">{enableLanding ? "开启" : "关闭"}</span>
                    </div>
                  </label>
                  <label className="form-control">
                    <span className="label-text">兑换码开关</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="toggle"
                        checked={enableRedeemCode}
                        onChange={(e) => setEnableRedeemCode(e.target.checked)}
                      />
                      <span className="text-sm text-base-content/70">{enableRedeemCode ? "开启" : "关闭"}</span>
                    </div>
                  </label>
                </div>
                <label className="form-control">
                  <span className="label-text">站点 Logo</span>
                  <input className="input input-bordered" value={siteLogo} onChange={(e) => setSiteLogo(e.target.value)} placeholder="支持url或者本地图片" />
                </label>
                <label className="form-control">
                  <span className="label-text">登陆页背景</span>
                  <input
                    className="input input-bordered"
                    value={authBackground}
                    onChange={(e) => setAuthBackground(e.target.value)}
                    placeholder="支持 url 或本地图片"
                  />
                </label>

                <label className="form-control md:col-span-2">
                  <span className="label-text">前端域名（多个域名用逗号分隔，最多 4 个）</span>
                  <input
                    className="input input-bordered"
                    value={allowedClientOrigins}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAllowedClientOrigins(value);
                      const origins = parseOrigins(value);
                      setAllowedOriginsError(origins.length > 4 ? "最多只能填写 4 个域名" : null);
                    }}
                    placeholder="请输入完整域名，如 https://xxx.xxx.com, https://yyy.yyy.com"
                  />
                  {allowedOriginsError && <span className="text-error text-xs">{allowedOriginsError}</span>}
                </label>
                <label className="form-control md:col-span-2">
                  <span className="label-text">后端 API 地址</span>
                  <input
                    className="input input-bordered"
                    value={prodApiUrl}
                    onChange={(e) => setProdApiUrl(e.target.value)}
                    placeholder="/api/v1/"
                  />
                  <div className="mt-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-warning">
                    服务器静态部署无需修改（保持 /api/v1/ 即可，Nginx 会在服务器端反代）；如使用 serverless 部署，请填写对应的反代 Worker 地址。
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-base-200 bg-base-200/30 p-4 space-y-4">
              <div className="font-semibold text-base">苹果账户分享页</div>
              <div className="rounded-md border border-success/40 bg-success/15 px-3 py-2 text-sm text-success">
                对接 AppleAutoPro 账号分享页。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="form-control md:col-span-2">
                  <span className="label-text">分享页开关</span>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="toggle" checked={enableIdhub} onChange={(e) => setEnableIdhub(e.target.checked)} />
                    <span className="text-sm text-base-content/70">{enableIdhub ? "开启" : "关闭"}</span>
                  </div>
                </label>
                {enableIdhub && (
                  <>
                    <label className="form-control md:col-span-2">
                      <span className="label-text">AppleAutoPro API 地址*</span>
                      <input
                        className="input input-bordered"
                        value={idhubApiUrl}
                        onChange={(e) => setIdhubApiUrl(e.target.value)}
                        placeholder="/idhub-api/"
                        required={enableIdhub}
                      />
                      <div className="mt-2 rounded-md border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-warning">
                        服务器静态部署无需修改（保持 /idhub-api/ 即可，Nginx 会在服务器端反代）；如使用 serverless 部署，请填写对应的反代 Worker 地址。
                      </div>
                    </label>
                    <label className="form-control md:col-span-2">
                      <span className="label-text">AppleAutoPro API Key*</span>
                      <input
                        className="input input-bordered"
                        value={idhubApiKey}
                        onChange={(e) => setIdhubApiKey(e.target.value)}
                        required={enableIdhub}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-base-200 bg-base-200/30 p-4 space-y-4">
              <div className="font-semibold text-base">客户端下载链接</div>
              <label className="form-control">
                <span className="label-text">客户端下载开关</span>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="toggle"
                    checked={enableDownload}
                    onChange={(e) => setEnableDownload(e.target.checked)}
                  />
                  <span className="text-sm text-base-content/70">{enableDownload ? "开启" : "关闭"}</span>
                </div>
              </label>
              {enableDownload && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text">iOS 下载地址</span>
                    <input className="input input-bordered" value={downloadIos} onChange={(e) => setDownloadIos(e.target.value)} placeholder="https://example.com/ios" />
                  </label>
                  <label className="form-control">
                    <span className="label-text">Android 下载地址</span>
                    <input
                      className="input input-bordered"
                      value={downloadAndroid}
                      onChange={(e) => setDownloadAndroid(e.target.value)}
                      placeholder="https://example.com/android"
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text">Windows 下载地址</span>
                    <input
                      className="input input-bordered"
                      value={downloadWindows}
                      onChange={(e) => setDownloadWindows(e.target.value)}
                      placeholder="https://example.com/windows"
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text">macOS 下载地址</span>
                    <input className="input input-bordered" value={downloadMacos} onChange={(e) => setDownloadMacos(e.target.value)} placeholder="https://example.com/macos" />
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-base-200">
              <button className="btn btn-primary" type="submit" disabled={!canSubmit || buildMutation.status === "pending"}>
                {buildMutation.status === "pending" ? "构建中..." : "开始构建"}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setSiteName(siteNameQuery.data?.siteName || "");
                  setSiteLogo("");
                  setEnableIdhub(false);
                  setIdhubApiUrl("/idhub-api/");
                  setIdhubApiKey("");
                  setAllowedClientOrigins("");
                  setAllowedOriginsError(null);
                  setAuthBackground("");
                  setEnableLanding(true);
                  setEnableRedeemCode(true);
                  setEnableDownload(false);
                  setDownloadIos("");
                  setDownloadAndroid("");
                  setDownloadWindows("");
                  setDownloadMacos("");
                  setProdApiUrl("/api/v1/");
                }}
              >
                清空
              </button>
            </div>
          </form>
          {buildMutation.status === "pending" && <progress className="progress progress-primary w-full" />}
          {message && <p className="text-success">{message}</p>}
          {error && <p className="text-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default TemplateBuildPage;
