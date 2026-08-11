import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BuildProgressModal, { BuildProgressStatus } from "../../components/BuildProgressModal";
import {
  ClientPlatform,
  useClientBuildJobs,
  useCreateClientBuild,
} from "../../features/builds/clientBuilds";
import { useSiteProfile } from "../../features/builds/siteName";

type ClientForm = {
  platform: ClientPlatform;
  iconUrl: string;
};

const initialForm: ClientForm = {
  platform: "macos",
  iconUrl: "",
};

const envValue = (value: string) => JSON.stringify(value.trim());

const buildClientEnvironment = (form: ClientForm) =>
  [
    `VITE_SHUTTLE_APP_ICON=${envValue(form.iconUrl)}`,
  ].join("\n");

const ClientBuildPage = () => {
  const [form, setForm] = useState(initialForm);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [buildProgress, setBuildProgress] = useState<{
    jobId: number | null;
    status: BuildProgressStatus;
    message?: string | null;
  } | null>(null);
  const navigate = useNavigate();
  const siteProfile = useSiteProfile();
  const jobs = useClientBuildJobs();
  const createBuild = useCreateClientBuild();
  const architecture = useMemo(
    () => form.platform === "macos" ? "arm64" : form.platform === "windows" ? "x64" : "universal",
    [form.platform],
  );
  const sites = (siteProfile.data?.sites ?? []).filter((site) => site.clientBuildEnabled);
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? null;
  const brandName = selectedSite?.name || siteProfile.data?.siteName || "";
  const gatewayOrigins = (selectedSite?.frontendOrigins ?? []).filter((origin) => origin.startsWith("https://"));

  useEffect(() => {
    if (!sites.length) {
      setSelectedSiteId(null);
      return;
    }
    if (selectedSiteId && sites.some((site) => site.id === selectedSiteId)) return;
    setSelectedSiteId(sites[0].id);
  }, [selectedSiteId, sites]);

  const activeJob = buildProgress?.jobId
    ? jobs.data?.find((job) => job.id === buildProgress.jobId)
    : null;

  useEffect(() => {
    if (!buildProgress?.jobId || !activeJob) return;
    if (activeJob.status === "success") {
      setBuildProgress((current) => current ? { ...current, status: "success", message: null } : current);
      const redirectTimer = window.setTimeout(() => navigate("/app/downloads?category=client"), 350);
      return () => window.clearTimeout(redirectTimer);
    }
    if (activeJob.status === "failed") {
      setBuildProgress((current) => current ? {
        ...current,
        status: "failed",
        message: activeJob.message || "客户端构建失败，请稍后重试",
      } : current);
      return;
    }
    if (activeJob.status === "queued" || activeJob.status === "running") {
      setBuildProgress((current) => current ? {
        ...current,
        status: activeJob.status === "queued" ? "pending" : "running",
      } : current);
    }
  }, [activeJob?.status, activeJob?.message, buildProgress?.jobId, navigate]);

  const update = <K extends keyof ClientForm>(key: K, value: ClientForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setBuildProgress({ jobId: null, status: "submitting" });
    createBuild.mutate(
      {
        platform: form.platform,
        architecture,
        siteId: selectedSiteId,
        clientEnvContent: buildClientEnvironment(form),
      },
      {
        onSuccess: (data) => setBuildProgress({ jobId: data.jobId, status: "pending" }),
        onError: (error: any) => setBuildProgress({
          jobId: null,
          status: "failed",
          message: error?.response?.data?.error || "客户端构建提交失败",
        }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="workspace-kicker">Client Packaging</p>
        <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">客户端构建</h2>
        <p className="mt-2 text-lg leading-8 text-slate-500">按品牌配置生成 macOS、Windows 和 Android 客户端。</p>
      </div>

      {siteProfile.isLoading ? (
        <div className="workspace-card flex justify-center py-12"><span className="loading loading-spinner" /></div>
      ) : sites.length === 0 ? (
        <div className="workspace-alert border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          当前没有已开通客户端构建权限的品牌，请联系管理员开通。
        </div>
      ) : (
      <form className="workspace-card" onSubmit={onSubmit}>
        <div className="card-body gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control">
              <span className="label-text">目标平台</span>
              <select className="workspace-input select select-bordered" value={form.platform} onChange={(event) => update("platform", event.target.value as ClientPlatform)}>
                <option value="macos">macOS</option>
                <option value="windows">Windows</option>
                <option value="android">Android</option>
              </select>
            </label>
            <label className="form-control">
              <span className="label-text">架构</span>
              <input
                className="workspace-input input input-bordered"
                value={form.platform === "macos" ? "Apple Silicon" : architecture}
                disabled
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control">
              <span className="label-text">品牌名字</span>
              {sites.length > 1 ? (
                <select
                  required
                  className="workspace-input select select-bordered"
                  value={selectedSiteId ?? ""}
                  onChange={(event) => setSelectedSiteId(Number(event.target.value))}
                >
                  {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              ) : (
                <input required className="workspace-input input input-bordered" value={brandName} disabled />
              )}
            </label>
            <label className="form-control">
              <span className="label-text">应用图标 URL</span>
              <input required type="url" className="workspace-input input input-bordered" value={form.iconUrl} onChange={(event) => update("iconUrl", event.target.value)} placeholder="https://cdn.example.com/app-icon.png" />
            </label>
            <div className="form-control md:col-span-2">
              <span className="label-text">Gateway 域名</span>
              <div className="mt-2 flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                {gatewayOrigins.map((origin) => (
                  <span key={origin} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700">{origin}</span>
                ))}
                {!gatewayOrigins.length ? <span className="text-sm text-rose-600">当前品牌没有可用的 HTTPS 前端域名</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="landing-button-primary rounded-2xl px-5 py-3 text-sm" type="submit" disabled={createBuild.isPending || Boolean(buildProgress && buildProgress.status !== "failed") || siteProfile.isLoading || !brandName || gatewayOrigins.length === 0}>
              {createBuild.isPending || (buildProgress && buildProgress.status !== "failed") ? "构建中..." : "开始构建"}
            </button>
          </div>
        </div>
      </form>
      )}

      <BuildProgressModal
        open={Boolean(buildProgress)}
        title="客户端构建"
        jobId={buildProgress?.jobId}
        status={buildProgress?.status || "submitting"}
        message={buildProgress?.message}
        onClose={() => setBuildProgress(null)}
      />

    </div>
  );
};

export default ClientBuildPage;
