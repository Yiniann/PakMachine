import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/client";
import { Artifact, useArtifacts } from "../../features/builds/artifacts";
import {
  ClientBuildJob,
  ClientPlatform,
  requestClientDownload,
  useClientBuildJobs,
} from "../../features/builds/clientBuilds";

type DownloadCategory = "web" | "client";

const platformLabel = (platform: ClientPlatform) =>
  platform === "macos" ? "macOS" : platform === "windows" ? "Windows" : platform === "linux" ? "Linux" : "Android";

const statusLabel = (status: string) => {
  if (status === "queued") return "等待中";
  if (status === "running") return "构建中";
  if (status === "success") return "已完成";
  if (status === "failed") return "失败";
  return status;
};

const formatSize = (size?: number | null) => {
  if (!size) return "-";
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatDuration = (durationMs?: number | null) => {
  if (durationMs === null || durationMs === undefined) return null;
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} 分 ${remainder} 秒` : `${minutes} 分钟`;
};

const DownloadPages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category: DownloadCategory = searchParams.get("category") === "client" ? "client" : "web";
  const artifacts = useArtifacts(5);
  const clientJobs = useClientBuildJobs();
  const [downloadingWebId, setDownloadingWebId] = useState<number | null>(null);
  const [downloadingClientId, setDownloadingClientId] = useState<number | string | null>(null);
  const [clientDownloadError, setClientDownloadError] = useState<string | null>(null);

  const onDownloadWeb = async (item: Artifact) => {
    try {
      setDownloadingWebId(item.id);
      const res = await api.get(`/build/download/${item.id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = item.sourceFilename;
      anchor.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        (status === 401
          ? "请先登录后再下载"
          : status === 403
            ? "无权下载此文件"
            : status === 404
              ? "文件不存在或已被清理"
              : "下载失败，请稍后再试");
      alert(message);
    } finally {
      setDownloadingWebId((current) => (current === item.id ? null : current));
    }
  };

  const onDownloadClient = async (job: ClientBuildJob) => {
    if (typeof job.id !== "number" || !job.downloadable) return;
    try {
      setClientDownloadError(null);
      setDownloadingClientId(job.id);
      const { url } = await requestClientDownload(job.id);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = job.artifactFilename || "";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error: any) {
      setClientDownloadError(error?.response?.data?.error || "下载地址生成失败");
    } finally {
      setDownloadingClientId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="workspace-kicker">Downloads</p>
        <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">构建下载</h2>
        <p className="mt-2 text-lg leading-8 text-slate-500">查看 Web 与客户端构建记录并下载可用产物。</p>
      </div>

      <div className="inline-flex w-full max-w-md rounded-lg bg-slate-100 p-1" role="tablist" aria-label="构建记录类型">
        <button
          type="button"
          role="tab"
          aria-selected={category === "web"}
          className={`min-h-10 flex-1 rounded-md px-4 text-sm font-semibold transition ${category === "web" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => setSearchParams({ category: "web" }, { replace: true })}
        >
          Web 构建
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={category === "client"}
          className={`min-h-10 flex-1 rounded-md px-4 text-sm font-semibold transition ${category === "client" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => setSearchParams({ category: "client" }, { replace: true })}
        >
          客户端构建
        </button>
      </div>

      {category === "web" ? (
        <>
          <div className="workspace-card-soft">
            <div className="card-body flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">主题部署教程</h3>
                <p className="mt-1 text-sm text-slate-500">下载完成后，按对应教程完成 SPA 或 Pro 版主题部署。</p>
              </div>
              <Link to="/app/deploy-guide/theme" className="landing-button-secondary rounded-lg px-5 py-3 text-base">
                查看主题教程
              </Link>
            </div>
          </div>

          <section className="workspace-card">
            <div className="card-body">
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">Web 构建记录</h3>
                  <p className="mt-1 text-sm text-slate-500">保留最新五次构建产物。</p>
                </div>
                <button type="button" className="landing-button-secondary rounded-lg px-4 py-2 text-sm" onClick={() => artifacts.refetch()} disabled={artifacts.isFetching}>
                  刷新
                </button>
              </div>

              {artifacts.isLoading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary" /></div>}
              {artifacts.error && <div role="alert" className="workspace-alert alert alert-error"><span>加载失败，请稍后重试</span></div>}
              {!artifacts.isLoading && artifacts.data?.length === 0 && <div className="py-16 text-center text-base-content/50">暂无 Web 构建记录</div>}

              {!artifacts.isLoading && artifacts.data && artifacts.data.length > 0 && (
                <div className="workspace-table-shell overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th className="w-20">ID</th>
                        <th>模板文件</th>
                        <th>构建时间</th>
                        <th className="w-24 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artifacts.data.map((item) => (
                        <tr key={item.id} className="hover">
                          <td className="font-mono text-xs opacity-70">#{item.id}</td>
                          <td className="whitespace-pre-wrap break-all font-medium">{item.sourceFilename}</td>
                          <td className="text-sm text-base-content/70">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="text-right">
                            <button
                              className="landing-button-primary btn btn-sm min-h-0 rounded-lg px-4 py-2 shadow-sm transition hover:shadow"
                              onClick={() => onDownloadWeb(item)}
                              disabled={downloadingWebId === item.id}
                            >
                              {downloadingWebId === item.id ? "处理中..." : "下载"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="workspace-card-soft">
            <div className="card-body flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">客户端部署教程</h3>
                <p className="mt-1 text-sm text-slate-500">按照教程完成客户中台部署、面板连接和三端客户端构建。</p>
              </div>
              <Link to="/app/deploy-guide/client" className="landing-button-secondary rounded-lg px-5 py-3 text-base">
                查看客户端教程
              </Link>
            </div>
          </div>
          <section className="workspace-card">
            <div className="card-body">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">客户端构建记录</h3>
                  <p className="mt-1 text-sm text-slate-500">集中查看云端构建与客户中台构建记录。</p>
                </div>
                <button type="button" className="landing-button-secondary rounded-lg px-4 py-2 text-sm" onClick={() => clientJobs.refetch()} disabled={clientJobs.isFetching}>
                  刷新
                </button>
              </div>

            {clientDownloadError && <div role="alert" className="workspace-alert mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{clientDownloadError}</div>}
            {clientJobs.isLoading && <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>}
            {clientJobs.isError && <div role="alert" className="workspace-alert mt-5 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">加载客户端构建记录失败</div>}
            {!clientJobs.isLoading && clientJobs.data?.length === 0 && <div className="py-12 text-center text-slate-400">暂无客户端构建记录</div>}

            {clientJobs.data?.length ? (
              <div className="workspace-table-shell mt-5 overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>应用</th>
                      <th>平台</th>
                      <th>版本</th>
                      <th>大小</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th className="text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientJobs.data.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div className="font-semibold text-slate-800">{job.appName}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>#{job.id}</span>
                            {job.source === "deployment-package" ? <span className="badge badge-ghost badge-xs">部署包</span> : null}
                          </div>
                          {job.installCommand ? (
                            <div className="mt-2 max-w-xs">
                              <p className="mb-1 text-xs font-medium text-slate-400">服务器安装命令</p>
                              <code className="block select-all overflow-x-auto whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{job.installCommand}</code>
                            </div>
                          ) : null}
                        </td>
                        <td>{platformLabel(job.platform)} {job.arch ? `· ${job.arch}` : ""}</td>
                        <td>{job.version || "-"}</td>
                        <td>{formatSize(job.size)}</td>
                        <td>
                          <span className={`badge ${job.status === "success" ? "badge-success" : job.status === "failed" ? "badge-error" : "badge-ghost"}`}>
                            {statusLabel(job.status)}
                          </span>
                          {job.status === "failed" && job.message ? <div className="mt-1 max-w-xs text-xs text-rose-600">{job.message}</div> : null}
                        </td>
                        <td className="whitespace-nowrap text-sm text-slate-500">
                          <div>{new Date(job.createdAt).toLocaleString()}</div>
                          {formatDuration(job.durationMs) ? <div className="mt-1 text-xs text-slate-400">耗时 {formatDuration(job.durationMs)}</div> : null}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="landing-button-primary rounded-lg px-4 py-2 text-sm"
                            disabled={!job.downloadable || downloadingClientId === job.id}
                            onClick={() => onDownloadClient(job)}
                          >
                            {downloadingClientId === job.id ? "处理中..." : "下载"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DownloadPages;
