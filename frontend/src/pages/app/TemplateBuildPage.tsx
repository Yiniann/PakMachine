import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTemplateFiles } from "../../features/builds/queries";
import { useBuildTemplate } from "../../features/builds/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/builds/profile";
import { useSiteName } from "../../features/builds/siteName";
import { useAuth } from "../../components/useAuth";
import { useNavigate } from "react-router-dom";

const TemplateBuildPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const templates = useTemplateFiles();
  const buildMutation = useBuildTemplate();
  const profileQuery = useBuildProfile();
  const saveProfile = useSaveBuildProfile();
  const siteNameQuery = useSiteName();

  const [selected, setSelected] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [enableLanding, setEnableLanding] = useState(true);
  const [siteLogo, setSiteLogo] = useState("");
  const [authBackground, setAuthBackground] = useState("");
  const [enableIdhub, setEnableIdhub] = useState(false);
  const [idhubApiUrl, setIdhubApiUrl] = useState("");
  const [idhubApiKey, setIdhubApiKey] = useState("");
  const [downloadIos, setDownloadIos] = useState("");
  const [downloadAndroid, setDownloadAndroid] = useState("");
  const [downloadWindows, setDownloadWindows] = useState("");
  const [downloadMacos, setDownloadMacos] = useState("");
  const [prodApiUrl, setProdApiUrl] = useState("");
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

  const selectedTemplate = useMemo(
    () => templates.data?.find((item) => item.filename === selected),
    [selected, templates.data],
  );

  const buildEnvContent = () => {
    const prodApiFinal = prodApiUrl.trim() || "/api/v1/";
    const lines = [
      `VITE_SITE_NAME=${siteName.trim()}`,
      `VITE_ENABLE_LANDING=${enableLanding ? "true" : "false"}`,
      `VITE_SITE_LOGO=${siteLogo.trim()}`,
      `VITE_AUTH_BACKGROUND=${authBackground.trim()}`,
      `VITE_ENABLE_IDHUB=${enableIdhub ? "true" : "false"}`,
      `VITE_IDHUB_API_URL=${idhubApiUrl.trim()}`,
      `VITE_IDHUB_API_KEY=${idhubApiKey.trim()}`,
      `VITE_PROD_API_URL=${prodApiFinal}`,
      `VITE_ALLOWED_CLIENT_ORIGINS=${allowedClientOrigins.trim()}`,
      `VITE_DOWNLOAD_IOS=${downloadIos.trim()}`,
      `VITE_DOWNLOAD_ANDROID=${downloadAndroid.trim()}`,
      `VITE_DOWNLOAD_WINDOWS=${downloadWindows.trim()}`,
      `VITE_DOWNLOAD_MACOS=${downloadMacos.trim()}`,
    ];
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
      setIdhubApiUrl(cfg.idhubApiUrl || cfg.VITE_IDHUB_API_URL || "");
      setIdhubApiKey(cfg.idhubApiKey || cfg.VITE_IDHUB_API_KEY || "");
      setAllowedClientOrigins(cfg.allowedClientOrigins || cfg.VITE_ALLOWED_CLIENT_ORIGINS || "");
      setAllowedOriginsError(null);
      setDownloadIos(cfg.downloadIos || cfg.VITE_DOWNLOAD_IOS || "");
      setDownloadAndroid(cfg.downloadAndroid || cfg.VITE_DOWNLOAD_ANDROID || "");
      setDownloadWindows(cfg.downloadWindows || cfg.VITE_DOWNLOAD_WINDOWS || "");
      setDownloadMacos(cfg.downloadMacos || cfg.VITE_DOWNLOAD_MACOS || "");
      const landingRaw = cfg.enableLanding ?? cfg.VITE_ENABLE_LANDING;
      setEnableLanding(landingRaw === undefined ? true : landingRaw === true || landingRaw === "true");
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
                    <th>文件名</th>
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
          {selectedTemplate && (
            <div className="alert alert-info">
              <span className="font-semibold">当前选择：</span>
              <div className="flex flex-col">
                <span className="font-mono text-sm break-all">{selectedTemplate.filename}</span>
                <span className="text-sm text-base-content/80">{selectedTemplate.description || "暂无描述"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">填写站点配置</h2>
          <p className="text-sm text-base-content/70">按要求填写字段，系统会生成 .env 写入模板并进行构建。</p>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 font-semibold text-base">站点信息</div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[2fr_auto] gap-3 items-end">
                <label className="form-control">
                  <span className="label-text">站点名称*</span>
                  <input
                    className="input input-bordered"
                    value={siteName}
                    readOnly
                    disabled={siteNameQuery.isLoading}
                    placeholder={siteNameQuery.isLoading ? "加载中..." : "请先在主页设置站点名称"}
                  />
                  {!siteName && !siteNameQuery.isLoading && <span className="text-error text-sm">请前往主页先设置站点名称</span>}
                </label>
                <label className="form-control">
                  <span className="label-text">着陆页开关 VITE_ENABLE_LANDING</span>
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
              </div>
              <label className="form-control">
                <span className="label-text">站点 Logo 链接</span>
                <input className="input input-bordered" value={siteLogo} onChange={(e) => setSiteLogo(e.target.value)} placeholder="支持url或者本地图片" />
              </label>
              <label className="form-control">
                <span className="label-text">登陆页面背景 VITE_AUTH_BACKGROUND</span>
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
            </div>
            <label className="form-control md:col-span-2">
              <span className="label-text">后端 API 地址（默认 /api/v1/，留空自动使用）</span>
              <input
                className="input input-bordered"
                value={prodApiUrl}
                onChange={(e) => setProdApiUrl(e.target.value)}
                placeholder="/api/v1/"
              />
            </label>

            <div className="space-y-3">
              <div className="font-semibold text-base">IDHub</div>
              <label className="form-control">
                <span className="label-text">IDHub 开关 VITE_ENABLE_IDHUB</span>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="toggle" checked={enableIdhub} onChange={(e) => setEnableIdhub(e.target.checked)} />
                  <span className="text-sm text-base-content/70">{enableIdhub ? "开启" : "关闭"}</span>
                </div>
              </label>
              {enableIdhub && (
                <>
                  <label className="form-control">
                    <span className="label-text">IDHub API 地址*</span>
                    <input
                      className="input input-bordered"
                      value={idhubApiUrl}
                      onChange={(e) => setIdhubApiUrl(e.target.value)}
                      placeholder="/idhub-api/"
                      required={enableIdhub}
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text">IDHub API Key*</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 font-semibold text-base">客户端下载链接</div>
              <label className="form-control">
                <span className="label-text">iOS 下载地址</span>
                <input className="input input-bordered" value={downloadIos} onChange={(e) => setDownloadIos(e.target.value)} placeholder="https://example.com/ios" />
              </label>
              <label className="form-control">
                <span className="label-text">Android 下载地址</span>
                <input className="input input-bordered" value={downloadAndroid} onChange={(e) => setDownloadAndroid(e.target.value)} placeholder="https://example.com/android" />
              </label>
              <label className="form-control">
                <span className="label-text">Windows 下载地址</span>
                <input className="input input-bordered" value={downloadWindows} onChange={(e) => setDownloadWindows(e.target.value)} placeholder="https://example.com/windows" />
              </label>
              <label className="form-control">
                <span className="label-text">macOS 下载地址</span>
                <input className="input input-bordered" value={downloadMacos} onChange={(e) => setDownloadMacos(e.target.value)} placeholder="https://example.com/macos" />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
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
                  setIdhubApiUrl("");
                  setIdhubApiKey("");
                  setAllowedClientOrigins("");
                  setAllowedOriginsError(null);
                  setAuthBackground("");
                  setEnableLanding(true);
                  setDownloadIos("");
                  setDownloadAndroid("");
                  setDownloadWindows("");
                  setDownloadMacos("");
                  setProdApiUrl("");
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
