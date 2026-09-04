import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BuildProgressModal, { BuildProgressStatus } from "../../components/BuildProgressModal";
import {
  ClientRuntimeArchitecture,
  ClientBffActivation,
  useClientControlBrands,
  useCreateClientBffActivation,
  useCreateClientRuntimePackage,
  useSaveClientBrandIdentity,
} from "../../features/builds/clientControl";
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

type PageMessage = { tone: "success" | "error"; text: string } | null;

const initialForm: ClientForm = {
  platform: "macos",
  iconUrl: "",
};

const envValue = (value: string) => JSON.stringify(value.trim());

const buildClientEnvironment = (form: ClientForm) =>
  [`VITE_SHUTTLE_APP_ICON=${envValue(form.iconUrl)}`].join("\n");

const requestError = (error: unknown, fallback: string) => {
  const message = (error as any)?.response?.data?.error;
  return typeof message === "string" && message ? message : fallback;
};

const ClientBuildPage = () => {
  const [form, setForm] = useState(initialForm);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);
  const [publisher, setPublisher] = useState("");
  const [brandIconUrl, setBrandIconUrl] = useState("");
  const [activation, setActivation] = useState<ClientBffActivation | null>(null);
  const [activationMessage, setActivationMessage] = useState<PageMessage>(null);
  const [identityMessage, setIdentityMessage] = useState<PageMessage>(null);
  const [activationCopied, setActivationCopied] = useState(false);
  const [runtimeArchitecture, setRuntimeArchitecture] = useState<ClientRuntimeArchitecture>("amd64");
  const [runtimeMessage, setRuntimeMessage] = useState<PageMessage>(null);
  const [runtimeInstallCommand, setRuntimeInstallCommand] = useState("");
  const [runtimeCommandCopied, setRuntimeCommandCopied] = useState(false);
  const [buildProgress, setBuildProgress] = useState<{
    jobId: number | null;
    status: BuildProgressStatus;
    message?: string | null;
  } | null>(null);
  const navigate = useNavigate();
  const siteProfile = useSiteProfile();
  const clientBrands = useClientControlBrands();
  const createActivation = useCreateClientBffActivation();
  const createRuntimePackage = useCreateClientRuntimePackage();
  const saveBrandIdentity = useSaveClientBrandIdentity();
  const jobs = useClientBuildJobs();
  const createBuild = useCreateClientBuild();
  const architecture = useMemo(
    () => form.platform === "macos" ? "arm64" : form.platform === "windows" ? "x64" : "universal",
    [form.platform],
  );
  const sites = (siteProfile.data?.sites ?? []).filter((site) => site.clientBuildEnabled);
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? null;
  const selectedControlBrand = (clientBrands.data ?? []).find((brand) => brand.id === selectedSiteId) ?? null;
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

  useEffect(() => {
    setPublisher(selectedControlBrand?.publisher || selectedSite?.name || "");
    setBrandIconUrl(selectedControlBrand?.iconUrl || "");
    setForm((current) => ({ ...current, iconUrl: selectedControlBrand?.iconUrl || "" }));
    setIdentityMessage(null);
    setActivation(null);
    setActivationMessage(null);
  }, [selectedControlBrand?.appId, selectedControlBrand?.publisher, selectedControlBrand?.iconUrl, selectedSite?.name]);

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

  const onCreateActivation = () => {
    if (!selectedSiteId) return;
    setActivationMessage(null);
    setActivationCopied(false);
    createActivation.mutate(selectedSiteId, {
      onSuccess: (result) => {
        setActivation(result);
        setActivationMessage({ tone: "success", text: "一次性激活凭证已生成" });
      },
      onError: (error) => setActivationMessage({
        tone: "error",
        text: requestError(error, "激活凭证生成失败"),
      }),
    });
  };

  const onCreateRuntimePackage = () => {
    if (!selectedSiteId) return;
    setRuntimeMessage(null);
    setRuntimeInstallCommand("");
    setRuntimeCommandCopied(false);
    createRuntimePackage.mutate(
      { architecture: runtimeArchitecture, siteId: selectedSiteId },
      {
        onSuccess: (result) => {
          setRuntimeInstallCommand(result.installCommand);
          setRuntimeMessage({
            tone: "success",
            text: "客户端已生成，可在构建下载中获取。",
          });
          void jobs.refetch();
          navigate("/app/downloads?category=client");
        },
        onError: (error) => setRuntimeMessage({
          tone: "error",
          text: requestError(error, "部署包生成失败"),
        }),
      },
    );
  };

  const onCopyRuntimeCommand = async () => {
    if (!runtimeInstallCommand) return;
    try {
      await navigator.clipboard.writeText(runtimeInstallCommand);
      setRuntimeCommandCopied(true);
    } catch {
      setRuntimeMessage({ tone: "error", text: "复制失败，请手动选择安装命令" });
    }
  };

  const onCopyActivation = async () => {
    if (!activation) return;
    try {
      await navigator.clipboard.writeText(activation.activationToken);
      setActivationCopied(true);
    } catch {
      setActivationMessage({ tone: "error", text: "复制失败，请手动选择凭证" });
    }
  };

  const onSaveBrandIdentity = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSiteId) return;
    setIdentityMessage(null);
    saveBrandIdentity.mutate(
      { siteId: selectedSiteId, publisher: publisher.trim(), iconUrl: brandIconUrl.trim() },
      {
        onSuccess: (result) => {
          setForm((current) => ({ ...current, iconUrl: result.iconUrl || "" }));
          setIdentityMessage({ tone: "success", text: "品牌客户端资料已保存" });
        },
        onError: (error) => setIdentityMessage({
          tone: "error",
          text: requestError(error, "品牌客户端资料保存失败"),
        }),
      },
    );
  };

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
        onError: (error) => setBuildProgress({
          jobId: null,
          status: "failed",
          message: requestError(error, "客户端构建提交失败"),
        }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="workspace-kicker">Client Control</p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">客户端构建</h2>
          <p className="mt-2 text-lg leading-8 text-slate-500">管理客户中台授权、品牌资料与客户端构建。</p>
        </div>
        <Link to="/app/deploy-guide/client" className="landing-button-secondary w-fit rounded-lg px-5 py-3 text-sm">
          查看部署教程
        </Link>
      </div>

      {siteProfile.isLoading ? (
        <div className="workspace-card flex justify-center py-12"><span className="loading loading-spinner" /></div>
      ) : sites.length === 0 ? (
        <div className="workspace-alert border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          当前没有已开通客户端构建权限的品牌，请联系管理员开通。
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="workspace-card order-3">
            <div className="card-body gap-5">
              <div>
                <p className="workspace-kicker">Server Deployment</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">部署客户中台</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  生成适用于客户 Linux 服务器的部署包。安装完成后，使用上方任一品牌的激活凭证完成首次连接。
                </p>
              </div>

              <div className="max-w-xl">
                <label className="form-control">
                  <span className="label-text">服务器架构</span>
                  <select
                    className="workspace-input select select-bordered"
                    value={runtimeArchitecture}
                    onChange={(event) => setRuntimeArchitecture(event.target.value as ClientRuntimeArchitecture)}
                  >
                    <option value="amd64">Linux x64（Intel / AMD）</option>
                    <option value="arm64">Linux ARM64</option>
                  </select>
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                完整部署包内已经包含 BFF、Builder、Compose 和安装脚本，不含源码或长期存储凭证。服务器需要安装 Docker Engine 与 Docker Compose v2。
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="landing-button-primary rounded-2xl px-5 py-3 text-sm"
                  type="button"
                  onClick={onCreateRuntimePackage}
                  disabled={createRuntimePackage.isPending || !selectedControlBrand?.ready}
                >
                  {createRuntimePackage.isPending ? "生成中..." : "生成客户端"}
                </button>
                {runtimeMessage ? (
                  <span className={`text-sm ${runtimeMessage.tone === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                    {runtimeMessage.text}
                  </span>
                ) : null}
              </div>

              {runtimeInstallCommand ? (
                <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-400">服务器安装命令</p>
                      <code className="mt-2 block select-all overflow-x-auto whitespace-nowrap text-sm">{runtimeInstallCommand}</code>
                    </div>
                    <button className="landing-button-secondary shrink-0 rounded-2xl px-4 py-2 text-sm" type="button" onClick={onCopyRuntimeCommand}>
                      {runtimeCommandCopied ? "已复制" : "复制"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <form className="workspace-card order-1" onSubmit={onSaveBrandIdentity}>
            <div className="card-body gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="workspace-kicker">Brand Identity</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">品牌客户端资料</h3>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedControlBrand?.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {selectedControlBrand?.ready ? "已完成" : "待配置"}
                </span>
              </div>

              {clientBrands.isLoading ? (
                <div className="flex justify-center py-8"><span className="loading loading-spinner" /></div>
              ) : clientBrands.isError ? (
                <div className="workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {requestError(clientBrands.error, "品牌客户端资料加载失败")}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="form-control">
                    <span className="label-text">品牌名字</span>
                    <select
                      required
                      className="workspace-input select select-bordered"
                      value={selectedSiteId ?? ""}
                      onChange={(event) => setSelectedSiteId(Number(event.target.value))}
                    >
                      {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text">应用 ID</span>
                    <input
                      className="workspace-input input input-bordered"
                      value={selectedControlBrand?.appId || "保存后自动生成"}
                      disabled
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text">发布者</span>
                    <input
                      required
                      className="workspace-input input input-bordered"
                      value={publisher}
                      maxLength={80}
                      onChange={(event) => setPublisher(event.target.value)}
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text">应用图标 URL（可选）</span>
                    <input
                      type="url"
                      className="workspace-input input input-bordered"
                      value={brandIconUrl}
                      onChange={(event) => setBrandIconUrl(event.target.value)}
                      placeholder="留空使用客户端默认图标"
                    />
                    <span className="label-text-alt mt-1 text-slate-500">填写后会在保存时下载并校验图标。</span>
                  </label>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="landing-button-primary rounded-2xl px-5 py-3 text-sm"
                  type="submit"
                  disabled={saveBrandIdentity.isPending || clientBrands.isLoading || !selectedSiteId}
                >
                  {saveBrandIdentity.isPending ? "保存中..." : "保存品牌资料"}
                </button>
                {identityMessage ? (
                  <span className={`text-sm ${identityMessage.tone === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                    {identityMessage.text}
                  </span>
                ) : null}
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">连接客户中台</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      为当前品牌生成一次性激活凭证。首次连接和后续追加品牌，都必须使用对应品牌自己的凭证。
                    </p>
                  </div>
                  <button
                    className="landing-button-secondary shrink-0 rounded-lg px-4 py-2.5 text-sm"
                    type="button"
                    onClick={onCreateActivation}
                    disabled={createActivation.isPending || !selectedControlBrand?.ready}
                  >
                    {createActivation.isPending ? "生成中..." : activation ? "重新生成" : "生成激活凭证"}
                  </button>
                </div>

                {activation ? (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-slate-500">一次性激活凭证</p>
                          <span className="badge badge-ghost badge-sm">{activation.siteName}</span>
                        </div>
                        <code className="mt-2 block select-all break-all text-sm text-slate-800">{activation.activationToken}</code>
                        <p className="mt-2 text-xs text-slate-500">有效期至 {new Date(activation.expiresAt).toLocaleString("zh-CN", { hour12: false })}</p>
                      </div>
                      <button className="landing-button-secondary shrink-0 rounded-lg px-4 py-2 text-sm" type="button" onClick={onCopyActivation}>
                        {activationCopied ? "已复制" : "复制"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {activationMessage ? (
                  <p className={`mt-3 text-sm ${activationMessage.tone === "success" ? "text-emerald-700" : "text-rose-600"}`}>
                    {activationMessage.text}
                  </p>
                ) : null}
              </div>

            </div>
          </form>

          <details className="workspace-card order-4 overflow-hidden">
            <summary className="cursor-pointer list-none px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="workspace-kicker">Legacy Build</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">旧版云端客户端构建</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">过渡保留</span>
              </div>
            </summary>
            <form className="border-t border-slate-200" onSubmit={onSubmit}>
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
                  <label className="form-control">
                    <span className="label-text">品牌名字</span>
                    <select
                      required
                      className="workspace-input select select-bordered"
                      value={selectedSiteId ?? ""}
                      onChange={(event) => setSelectedSiteId(Number(event.target.value))}
                    >
                      {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                    </select>
                  </label>
                  <label className="form-control">
                    <span className="label-text">应用图标 URL</span>
                    <input required type="url" className="workspace-input input input-bordered" value={form.iconUrl} onChange={(event) => update("iconUrl", event.target.value)} placeholder="https://cdn.example.com/app-icon.png" />
                  </label>
                  <div className="form-control md:col-span-2">
                    <span className="label-text">Gateway 域名</span>
                    <div className="mt-2 flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      {gatewayOrigins.map((origin) => (
                        <span key={origin} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700">{origin}</span>
                      ))}
                      {!gatewayOrigins.length ? <span className="text-sm text-rose-600">当前品牌没有可用的 HTTPS 前端域名</span> : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button className="landing-button-primary rounded-2xl px-5 py-3 text-sm" type="submit" disabled={createBuild.isPending || Boolean(buildProgress && buildProgress.status !== "failed") || siteProfile.isLoading || !brandName || gatewayOrigins.length === 0}>
                    {createBuild.isPending || (buildProgress && buildProgress.status !== "failed") ? "构建中..." : "开始旧版构建"}
                  </button>
                </div>
              </div>
            </form>
          </details>
        </div>
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
