import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTemplateFiles } from "../../features/uploads/queries";
import { useBuildTemplate } from "../../features/uploads/build";
import { useBuildProfile, useSaveBuildProfile } from "../../features/uploads/profile";
import api from "../../api/client";

const TemplateBuildPage = () => {
  const templates = useTemplateFiles();
  const buildMutation = useBuildTemplate();
  const profileQuery = useBuildProfile();
  const saveProfile = useSaveBuildProfile();

  const [selected, setSelected] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [enableIdhub, setEnableIdhub] = useState(false);
  const [idhubApiUrl, setIdhubApiUrl] = useState("");
  const [idhubApiKey, setIdhubApiKey] = useState("");
  const [downloadIos, setDownloadIos] = useState("");
  const [downloadAndroid, setDownloadAndroid] = useState("");
  const [downloadWindows, setDownloadWindows] = useState("");
  const [downloadMacos, setDownloadMacos] = useState("");
  const [prodApiUrl, setProdApiUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!selected) return false;
    if (!siteName.trim()) return false;
    if (enableIdhub && (!idhubApiUrl.trim() || !idhubApiKey.trim())) return false;
    return true;
  }, [selected, siteName, enableIdhub, idhubApiUrl, idhubApiKey]);

  const buildEnvContent = () => {
    const lines = [
      `VITE_SITE_NAME=${siteName.trim()}`,
      `VITE_SITE_LOGO=${siteLogo.trim()}`,
      `VITE_ENABLE_IDHUB=${enableIdhub ? "true" : "false"}`,
      `VITE_IDHUB_API_URL=${idhubApiUrl.trim()}`,
      `VITE_IDHUB_API_KEY=${idhubApiKey.trim()}`,
      `VITE_PROD_API_URL=${prodApiUrl.trim()}`,
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
    const envContent = buildEnvContent();
    buildMutation.mutate(
      { filename: selected, envContent },
      {
        onSuccess: (data) => {
          setMessage(data.message || "构建任务已提交");
          saveProfile.mutate({
            siteName,
            siteLogo,
            prodApiUrl,
            enableIdhub,
            idhubApiUrl,
            idhubApiKey,
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
    if (profileQuery.data) {
      const cfg: any = profileQuery.data;
      setSiteName(cfg.siteName || cfg.VITE_SITE_NAME || "");
      setSiteLogo(cfg.siteLogo || cfg.VITE_SITE_LOGO || "");
      setProdApiUrl(cfg.prodApiUrl || cfg.VITE_PROD_API_URL || "");
      setEnableIdhub(Boolean(cfg.enableIdhub ?? (cfg.VITE_ENABLE_IDHUB === "true" || cfg.VITE_ENABLE_IDHUB === true)));
      setIdhubApiUrl(cfg.idhubApiUrl || cfg.VITE_IDHUB_API_URL || "");
      setIdhubApiKey(cfg.idhubApiKey || cfg.VITE_IDHUB_API_KEY || "");
      setDownloadIos(cfg.downloadIos || cfg.VITE_DOWNLOAD_IOS || "");
      setDownloadAndroid(cfg.downloadAndroid || cfg.VITE_DOWNLOAD_ANDROID || "");
      setDownloadWindows(cfg.downloadWindows || cfg.VITE_DOWNLOAD_WINDOWS || "");
      setDownloadMacos(cfg.downloadMacos || cfg.VITE_DOWNLOAD_MACOS || "");
    }
  }, [profileQuery.data]);

  const downloadArtifact = async () => {
    if (!buildMutation.data?.artifactId) return;
    try {
      const res = await api.get(`/build/download/${buildMutation.data.artifactId}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      const suggested =
        buildMutation.data.downloadPath?.split("/").pop() ||
        (selected ? selected.replace(/\.zip$/i, "") : "build") + ".zip";
      a.download = suggested;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err?.response?.data?.error || "下载失败，请确认已登录或稍后再试");
    }
  };

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
                    <th>大小</th>
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
                      <td>{(item.size / 1024 / 1024).toFixed(2)} MB</td>
                      <td>{new Date(item.modifiedAt).toLocaleString()}</td>
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
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 font-semibold text-base">站点信息</div>
              <label className="form-control">
                <span className="label-text">站点名称*</span>
                <input className="input input-bordered" value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
              </label>
              <label className="form-control">
                <span className="label-text">站点 Logo 链接</span>
                <input className="input input-bordered" value={siteLogo} onChange={(e) => setSiteLogo(e.target.value)} placeholder="https://example.com/logo.png" />
              </label>
              <label className="form-control md:col-span-2">
                <span className="label-text">后端 API 地址</span>
                <input
                  className="input input-bordered"
                  value={prodApiUrl}
                  onChange={(e) => setProdApiUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </label>
            </div>

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
                      placeholder="https://idhub.example.com/api"
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
                {buildMutation.status === "pending" ? "提交中..." : "开始构建"}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setSiteName("");
                  setSiteLogo("");
                  setEnableIdhub(false);
                  setIdhubApiUrl("");
                  setIdhubApiKey("");
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
          {message && <p className="text-success">{message}</p>}
          {error && <p className="text-error">{error}</p>}
          {(buildMutation.data?.artifactId || buildMutation.data?.downloadPath) && (
            <div className="flex items-center gap-2">
              <button className="btn btn-link" type="button" onClick={downloadArtifact}>
                下载构建产物
              </button>
              {!buildMutation.data?.artifactId && buildMutation.data?.downloadPath && (
                <a
                  className="link text-sm"
                  href={`${api.defaults.baseURL?.replace(/\/$/, "")}/${buildMutation.data.downloadPath}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  备用链接
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateBuildPage;
