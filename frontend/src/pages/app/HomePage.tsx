import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAddFrontendOrigin, useCreateUserSite, useSetSiteName, useSiteProfile } from "../../features/builds/siteName";
import { useBuildJob, useBuildJobs } from "../../features/builds/jobs";
import { useBuildQuota } from "../../features/builds/quota";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../components/useAuth";
import { canBuildSpa, getUserTypeBadgeClass, getUserTypeDescription, getUserTypeLabel, normalizeUserType, shouldValidateFrontendOrigins } from "../../lib/userAccess";

const HomePage = () => {
  const siteProfileQuery = useSiteProfile();
  const setSiteNameMutation = useSetSiteName();
  const createUserSiteMutation = useCreateUserSite();
  const addFrontendOriginMutation = useAddFrontendOrigin();
  const jobsQuery = useBuildJobs();
  const quotaQuery = useBuildQuota();
  const auth = useAuth() as any;
  // 尝试从 auth 直接获取或从 auth.user 中获取用户信息，兼容不同的 useAuth 返回结构
  const user = auth.user || {};
  const role = auth.role || user.role;
  const email = auth.email || user.email;
  const userType = normalizeUserType(auth.userType ?? user.userType);
  const requiresFrontendOrigins = shouldValidateFrontendOrigins(role, userType);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cachedSiteName, setCachedSiteName] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [frontendOriginInput, setFrontendOriginInput] = useState("");
  const [siteMessage, setSiteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [originMessage, setOriginMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [buildFailure, setBuildFailure] = useState<{ jobId: number; message: string; createdAt: string } | null>(null);
  const [dismissedFailureId, setDismissedFailureId] = useState<number | null>(null);
  const prevJobIdRef = useRef<number | undefined>(undefined);
  const dismissedStorageKey = "pacmachine-dismissed-failure-id";
  const failureWindowMs = 5 * 60 * 1000;

  const isRecentFailure = (createdAt?: string) => {
    if (!createdAt) return false;
    const ts = new Date(createdAt).getTime();
    return Number.isFinite(ts) && Date.now() - ts <= failureWindowMs;
  };

  const siteName = siteProfileQuery.data?.siteName || null;
  const siteOptions = siteProfileQuery.data?.sites || [];
  const siteNameLimit = Math.max(siteProfileQuery.data?.siteNameLimit ?? 1, 1);
  const frontendOrigins = siteProfileQuery.data?.frontendOrigins || [];
  const loadingSiteName = siteProfileQuery.isPending; // 只在首个请求未返回时认为 loading，避免阻塞展示
  const fetchedSiteName = siteProfileQuery.isSuccess || siteProfileQuery.isError;
  const displaySiteName = cachedSiteName || siteName;
  const jobIdParam = searchParams.get("jobId");
  const jobId = jobIdParam ? Number(jobIdParam) : undefined;
  const activeJobQuery = useBuildJob(jobId);
  const derivedActiveJob =
    jobsQuery.data?.find((j) => j.status === "pending" || j.status === "running") ?? null;
  const hasActiveJob = Boolean(jobId) || Boolean(derivedActiveJob);
  const isAdmin = role === "admin";
  const canConfigureSite = canBuildSpa(role, userType);
  const showSiteNameForm = fetchedSiteName && (!displaySiteName || isAdmin);
  const shouldUseSiteManager = canConfigureSite;
  const quota = quotaQuery.data;
  const isUnlimitedQuota =
    quota?.unlimited || (quota?.limit ?? 0) >= Number.MAX_SAFE_INTEGER / 2; // 后端用 MAX_SAFE_INTEGER 表示无限

  const activeJobStatusLabel = useMemo(() => {
    if (!activeJobQuery.data) return null;
    const s = activeJobQuery.data.status;
    if (s === "pending") return "等待中";
    if (s === "running") return "构建中";
    if (s === "success") return "已完成";
    if (s === "failed") return "失败";
    return s;
  }, [activeJobQuery.data]);
  const jobStats = useMemo(() => {
    const jobs = jobsQuery.data ?? [];
    return {
      pending: jobs.filter((j) => j.status === "pending").length,
      running: jobs.filter((j) => j.status === "running").length,
      success: jobs.filter((j) => j.status === "success").length,
      failed: jobs.filter((j) => j.status === "failed").length,
    };
  }, [jobsQuery.data]);
  const isTaskInProgress =
    activeJobStatusLabel === "等待中" ||
    activeJobStatusLabel === "构建中" ||
    derivedActiveJob?.status === "pending" ||
    derivedActiveJob?.status === "running";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSiteMessage(null);
    setSiteNameMutation.mutate(
      { siteName: input },
      {
        onSuccess: (data) => {
          setSiteMessage({ type: "success", text: `站点名称已设置为：${data.siteName}` });
          setCachedSiteName(data.siteName);
          siteProfileQuery.refetch();
        },
        onError: (err: any) => setSiteMessage({ type: "error", text: err?.response?.data?.error || "设置失败" }),
      },
    );
  };

  const onAddFrontendOrigin = (e: FormEvent) => {
    e.preventDefault();
    setOriginMessage(null);
    addFrontendOriginMutation.mutate(
      { frontendOrigin: frontendOriginInput },
      {
        onSuccess: (data) => {
          const latest = data.frontendOrigins[data.frontendOrigins.length - 1];
          setOriginMessage({ type: "success", text: `已绑定前端域名：${latest}` });
          setFrontendOriginInput("");
          siteProfileQuery.refetch();
        },
        onError: (err: any) => setOriginMessage({ type: "error", text: err?.response?.data?.error || "绑定前端域名失败" }),
      },
    );
  };

  const onAddSiteName = (e: FormEvent) => {
    e.preventDefault();
    setSiteMessage(null);
    createUserSiteMutation.mutate(
      { name: newSiteName },
      {
        onSuccess: async (data) => {
          setSiteMessage({ type: "success", text: `站点名称已添加：${data.name}` });
          setCachedSiteName(data.name);
          setNewSiteName("");
          await siteProfileQuery.refetch();
        },
        onError: (err: any) => setSiteMessage({ type: "error", text: err?.response?.data?.error || "添加站点名称失败" }),
      },
    );
  };

  useEffect(() => {
    if (siteName) {
      setCachedSiteName(siteName);
      if (isAdmin) {
        setInput(siteName);
      }
    }
  }, [siteName, isAdmin]);

  useEffect(() => {
    if (!jobId) return;
    const status = activeJobQuery.data?.status;
    if (!status) return;

    if (status === "failed" && dismissedFailureId !== jobId) {
      const createdAt = activeJobQuery.data?.createdAt;
      if (isRecentFailure(createdAt)) {
        setBuildFailure({
          jobId,
          message: activeJobQuery.data?.message || "构建失败，请稍后重试",
          createdAt: createdAt!,
        });
      } else {
        setBuildFailure(null);
      }
    }

    if (status === "success" || status === "failed") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("jobId");
        return next;
      });
      if (status === "success") {
        setBuildFailure(null);
        navigate("/app/downloads");
      }
    }
  }, [jobId, activeJobQuery.data?.status, activeJobQuery.data?.message, activeJobQuery.data?.createdAt, navigate, setSearchParams]);

  useEffect(() => {
    if (jobId !== undefined && jobId !== prevJobIdRef.current) {
      // 新任务开始时清掉旧提示与已忽略的记录
      setBuildFailure(null);
      setDismissedFailureId(null);
      localStorage.removeItem(dismissedStorageKey);
    }
    prevJobIdRef.current = jobId;
  }, [jobId]);

  useEffect(() => {
    const stored = localStorage.getItem(dismissedStorageKey);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        setDismissedFailureId(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (!jobsQuery.data) return;
    const latestFailed = [...jobsQuery.data]
      .filter((j) => j.status === "failed" && isRecentFailure(j.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!latestFailed) return;
    if (dismissedFailureId && latestFailed.id === dismissedFailureId) return;
    setBuildFailure({
      jobId: latestFailed.id,
      message: latestFailed.message || "构建失败，请稍后重试",
      createdAt: latestFailed.createdAt,
    });
  }, [jobsQuery.data, dismissedFailureId]);

  useEffect(() => {
    if (!buildFailure) return;
    const createdAtMs = new Date(buildFailure.createdAt).getTime();
    if (!Number.isFinite(createdAtMs)) return;
    const remaining = failureWindowMs - (Date.now() - createdAtMs);
    if (remaining <= 0) {
      setBuildFailure(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      setBuildFailure(null);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [buildFailure, failureWindowMs]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-bold">欢迎使用，{email}</h2>
          {role === 'admin' ? (
            <div className="badge badge-lg badge-primary">管理员</div>
          ) : (
            <div className={`badge badge-lg ${getUserTypeBadgeClass(userType)}`}>{getUserTypeLabel(userType)}</div>
          )}
          {!isAdmin && userType === "basic" ? (
            <button
              type="button"
              className="landing-button-primary rounded-2xl px-4 py-2 text-sm"
              onClick={() => setIsUpgradeOpen(true)}
            >
              升级 Pro 版本
            </button>
          ) : null}
        </div>
        <p className="text-base-content/70 mt-1">
          {role === "admin"
            ? "设置站点名，提交打包，完成后在“构建下载”获取仅与你账号绑定的产物。"
            : `${getUserTypeDescription(userType)}。添加站点名称后即可按当前档位使用构建功能。`}
        </p>
      </div>

      {!canConfigureSite && !isAdmin ? (
        <section className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]">Pricing</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-900">开通后即可开始构建</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-600">
                当前账号为待开通状态，暂不支持绑定站点名、前端域名和提交构建。开通基础版、订阅版或优先版后即可开始使用构建能力。
              </p>
              <div className="mt-5 space-y-2.5 text-[15px] text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                  <span>1 个品牌名授权</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                  <span>4 个主题域名授权</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                  <span>终身使用权限</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                  <span>永久更新支持</span>
                </div>
              </div>
            </div>
            <div className="hidden h-20 w-px bg-slate-200 lg:block" />
            <div className="rounded-[1.75rem] border border-[#6d6bf4]/12 bg-[linear-gradient(180deg,_rgba(248,248,255,1),_rgba(242,244,255,0.88))] p-5 shadow-[0_16px_40px_rgba(109,107,244,0.08)]">
              <div className="inline-flex rounded-full bg-[#6d6bf4]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#6d6bf4]">
                Professional Plan
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-lg font-semibold text-[#6d6bf4]">$</span>
                <span className="text-4xl font-bold tracking-[-0.06em] text-slate-900">88</span>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">usd</span>
                <span className="ml-2 text-sm font-semibold text-slate-400 line-through">120 USD</span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-[#6d6bf4]/20 via-slate-200 to-transparent" />
              <p className="mt-4 text-[15px] leading-7 text-slate-600">
                终身订阅，永久更新。一次购买后即可持续获取后续主题更新与功能迭代，无需重复付费。
              </p>
              <a
                href="https://t.me/y1niannn"
                target="_blank"
                rel="noreferrer"
                className="landing-button-primary mt-5 inline-flex rounded-2xl px-6 py-3 text-sm"
              >
                联系我购买
              </a>
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <section className="workspace-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="workspace-kicker">Workspace Setup</p>
                  <h3 className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-slate-900">站点配置</h3>
                  <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-500">
                    {requiresFrontendOrigins
                      ? "先完成站点名称和前端域名绑定，再进入构建流程。配置完成后可以直接前往前端构建或查看已生成的产物。"
                      : "先完成站点名称设置，再进入构建流程。优先版会在构建时自动关闭前端域名校验。"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="workspace-card-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">今日剩余构建</p>
                    <p className={`mt-2 text-xl font-bold ${quota?.left === 0 && !isUnlimitedQuota ? "text-rose-500" : "text-[#6d6bf4]"}`}>
                      {quota ? (isUnlimitedQuota ? "∞" : `${quota.left}/${quota.limit}`) : "-"}
                    </p>
                  </div>
                  <div className="workspace-card-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">当前状态</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {displaySiteName && (!requiresFrontendOrigins || frontendOrigins.length > 0) ? "可构建" : "待配置"}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`mt-5 grid gap-5 ${requiresFrontendOrigins ? "xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : ""}`}>
                <div className="workspace-card-soft p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Site Name</p>
                      <h4 className="mt-2 text-xl font-bold text-slate-900">站点名称</h4>
                    </div>
                  </div>

                  <p className="mt-3 text-[15px] leading-7 text-slate-500">
                    在前端构建前维护你的站点名称，用于打包后主题的站点名称和标题。当前账号最多可添加 {siteNameLimit} 个站点名称。
                  </p>

                  {loadingSiteName && !displaySiteName && (
                    <div className="flex justify-center p-6"><span className="loading loading-spinner loading-md" /></div>
                  )}

                  {shouldUseSiteManager ? (
                    <>
                      {siteOptions.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2.5">
                          {siteOptions.map((site) => (
                            <span key={site.id} className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-sm font-medium text-sky-700">
                              {site.name}
                            </span>
                          ))}
                        </div>
                      ) : displaySiteName ? (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500 shadow-sm">
                          <div className="mb-2 text-2xl font-bold tracking-[-0.03em] text-[#6d6bf4]">{displaySiteName}</div>
                          这是当前默认站点名称。
                        </div>
                      ) : null}

                      {siteOptions.length < siteNameLimit ? (
                        <form onSubmit={onAddSiteName} className="mt-5 flex items-stretch gap-3">
                          <input
                            className="workspace-input input input-bordered h-13 flex-1 rounded-2xl"
                            placeholder={siteOptions.length > 0 ? "输入新的站点名称" : "请输入第一个站点名称"}
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                            disabled={createUserSiteMutation.status === "pending"}
                          />
                          <button className="landing-button-primary shrink-0 rounded-2xl px-5 py-3 text-sm" type="submit" disabled={!newSiteName.trim() || createUserSiteMutation.status === "pending"}>
                            {createUserSiteMutation.status === "pending" ? "添加中..." : "添加"}
                          </button>
                        </form>
                      ) : (
                        <div className="mt-5 workspace-alert alert border border-sky-200 bg-sky-50 text-sky-700 text-sm py-3">
                          <span>已达到当前账号可添加的站点名称上限。</span>
                        </div>
                      )}
                    </>
                  ) : showSiteNameForm ? (
                    <form onSubmit={onSubmit} className="mt-5 flex items-stretch gap-3">
                      <input
                        className="workspace-input input input-bordered h-13 flex-1 rounded-2xl"
                        placeholder="输入站点名称"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={setSiteNameMutation.status === "pending"}
                      />
                      <button className="landing-button-primary shrink-0 rounded-2xl px-5 py-3 text-sm" type="submit" disabled={!input.trim() || setSiteNameMutation.status === "pending"}>
                        {setSiteNameMutation.status === "pending" ? "保存中..." : isAdmin ? "保存" : "设置"}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-500 shadow-sm">
                      {displaySiteName ? (
                        <div className="mb-2 text-2xl font-bold tracking-[-0.03em] text-[#6d6bf4]">{displaySiteName}</div>
                      ) : null}
                      {isAdmin ? "管理员可随时修改。" : "当前站点名称已锁定，如需修改请联系管理员。"}
                    </div>
                  )}

                  {siteMessage && (
                    <div className={`mt-3 text-sm font-medium ${siteMessage.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                      {siteMessage.text}
                    </div>
                  )}
                </div>

                {requiresFrontendOrigins && (
                <div className="workspace-card-soft p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Origins</p>
                      <h4 className="mt-2 text-xl font-bold text-slate-900">前端域名</h4>
                    </div>
                  </div>

                  <p className="mt-3 text-[15px] leading-7 text-slate-500">
                    每个账号最多绑定 4 个前端域名。已绑定的域名用户侧不可删除，如需调整请联系管理员处理。
                  </p>

                  {frontendOrigins.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {frontendOrigins.map((origin) => (
                        <span key={origin} className="rounded-full border border-pink-200 bg-pink-50 px-3.5 py-1.5 text-sm font-medium text-pink-700">
                          {origin}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-5 text-sm text-slate-500">
                      还没有绑定前端域名，先添加至少 1 个域名再进入构建。
                    </div>
                  )}

                  {frontendOrigins.length < 4 ? (
                    <form onSubmit={onAddFrontendOrigin} className="mt-5 flex items-stretch gap-3">
                      <input
                        className="workspace-input input input-bordered h-13 flex-1 rounded-2xl"
                        placeholder={frontendOrigins.length > 0 ? "继续绑定前端域名，每次输入一个，如 https://a.com" : "请输入完整域名，每次输入一个，如 https://a.com"}
                        value={frontendOriginInput}
                        onChange={(e) => setFrontendOriginInput(e.target.value)}
                        disabled={addFrontendOriginMutation.status === "pending"}
                      />
                      <button className="landing-button-primary shrink-0 rounded-2xl px-5 py-3 text-sm" type="submit" disabled={!frontendOriginInput.trim() || addFrontendOriginMutation.status === "pending"}>
                        {addFrontendOriginMutation.status === "pending" ? "提交中..." : frontendOrigins.length > 0 ? "添加" : "绑定"}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-5 workspace-alert alert border border-pink-200 bg-pink-50 text-pink-700 text-sm py-3">
                      <span>已达到 4 个前端域名上限，如需调整请联系管理员重置。</span>
                    </div>
                  )}

                  {originMessage && (
                    <div className={`mt-3 text-sm font-medium ${originMessage.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                      {originMessage.text}
                    </div>
                  )}
                </div>
                )}
              </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="landing-button-primary rounded-2xl px-5 py-3 text-sm" onClick={() => navigate("/app/build")}>
                进入构建
              </button>
              <button className="landing-button-secondary rounded-2xl px-5 py-3 text-sm" onClick={() => navigate("/app/downloads")}>
                查看产物
              </button>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="workspace-card p-5">
              <p className="workspace-kicker">Queue</p>
              <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-900">构建队列概览</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="workspace-card-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">等待中</p>
                  <p className="mt-2 text-2xl font-bold text-amber-500">{jobStats.pending}</p>
                </div>
                <div className="workspace-card-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">构建中</p>
                  <p className="mt-2 text-2xl font-bold text-sky-500">{jobStats.running}</p>
                </div>
                <div className="workspace-card-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">已完成</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-500">{jobStats.success}</p>
                </div>
                <div className="workspace-card-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">失败</p>
                  <p className="mt-2 text-2xl font-bold text-rose-500">{jobStats.failed}</p>
                </div>
              </div>
            </div>

            <div className="workspace-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="workspace-kicker">Current Task</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-900">当前构建状态</h3>
                  <p className="mt-2 text-[15px] leading-7 text-slate-500">
                    这里展示当前进行中的构建任务；如果暂时没有任务，会显示空闲状态，你可以直接前往构建页提交新任务。
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isTaskInProgress ? <span className="loading loading-spinner loading-md text-[#6d6bf4]" /> : null}
                  <button className="landing-button-secondary rounded-2xl px-5 py-3 text-sm" onClick={() => navigate("/app/build")}>
                    前往构建页
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="workspace-card-soft p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">任务编号</div>
                  <div className="mt-2 text-xl font-bold text-slate-900">#{jobId ?? derivedActiveJob?.id ?? "..."}</div>
                </div>
                <div className="workspace-card-soft p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">状态</div>
                  <div className="mt-2 text-lg font-bold text-[#6d6bf4]">
                    {activeJobStatusLabel ?? (derivedActiveJob ? (derivedActiveJob.status === "pending" ? "等待中" : "构建中") : "当前没有进行中的任务")}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {canConfigureSite && buildFailure && (
        <div role="alert" className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="flex-1">
            <h3 className="font-bold">构建失败 #{buildFailure.jobId}</h3>
            <div className="text-xs">{buildFailure.message}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm bg-white/20 border-0 text-white hover:bg-white/30" onClick={() => navigate("/app/build")}>
              重新提交
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setDismissedFailureId(buildFailure.jobId);
                localStorage.setItem(dismissedStorageKey, String(buildFailure.jobId));
                setBuildFailure(null);
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {isUpgradeOpen && createPortal(
        <div className="modal modal-open !fixed inset-0 z-[80] bg-slate-900/18 backdrop-blur-sm">
          <div className="modal-box workspace-card max-w-2xl border-0 bg-white/95 p-0">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="workspace-kicker">Upgrade</p>
                  <h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-900">升级到 Pro 版本</h3>
                  <p className="mt-2 text-[15px] leading-7 text-slate-500">
                    解锁 Pro 构建能力，通过 BFF 中间件转发请求，并使用中台实时更新主题配置。
                  </p>
                </div>
                <button
                  type="button"
                  className="landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0"
                  onClick={() => setIsUpgradeOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="px-6 py-6">
                <div className="space-y-3 text-[15px] text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                    <span>升级为 Pro 版本，支持 BFF 中间件转发请求</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                    <span>主题请求与 API 请求链路分离，进一步降低特征暴露风险</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                    <span>中台控制系统无需改文件，即可实时更新主题配置</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                    <span>支持在线调整配色、文案与展示内容</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6d6bf4]" />
                    <span>升级后可构建 SPA 与 Pro(BFF) 两种版本</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 px-6 py-6 md:border-l md:border-t-0">
                <div className="rounded-[1.5rem] border border-[#6d6bf4]/12 bg-[linear-gradient(180deg,_rgba(248,248,255,1),_rgba(242,244,255,0.88))] p-5 shadow-[0_16px_40px_rgba(109,107,244,0.08)]">
                  <div className="inline-flex rounded-full bg-[#6d6bf4]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#6d6bf4]">
                    Pro Upgrade
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-base font-semibold text-[#6d6bf4]">$</span>
                    <span className="text-4xl font-bold tracking-[-0.06em] text-slate-900">40</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">usd</span>
                    <span className="ml-2 text-sm font-semibold text-slate-400 line-through">88 USD</span>
                  </div>
                  <div className="mt-4 h-px bg-gradient-to-r from-[#6d6bf4]/20 via-slate-200 to-transparent" />
                  <p className="mt-4 text-[15px] leading-7 text-slate-600">
                    升级后即可使用 Pro 请求转发能力，并通过中台实时维护主题配置，无需反复改动部署文件。
                  </p>
                  <a
                    href="https://t.me/y1niannn"
                    target="_blank"
                    rel="noreferrer"
                    className="landing-button-primary mt-5 inline-flex w-full rounded-2xl px-5 py-3 text-sm"
                  >
                    联系我购买
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
            onClick={() => setIsUpgradeOpen(false)}
          >
            close
          </button>
        </div>,
        document.body,
      )}

    </div>
  );
};

export default HomePage;
