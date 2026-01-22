import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSiteName, useSetSiteName } from "../../features/builds/siteName";
import { useBuildJob, useBuildJobs } from "../../features/builds/jobs";
import { useBuildQuota } from "../../features/builds/quota";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../components/useAuth";

const HomePage = () => {
  const siteNameQuery = useSiteName();
  const setSiteNameMutation = useSetSiteName();
  const jobsQuery = useBuildJobs();
  const quotaQuery = useBuildQuota();
  const auth = useAuth() as any;
  // 尝试从 auth 直接获取或从 auth.user 中获取用户信息，兼容不同的 useAuth 返回结构
  const user = auth.user || {};
  const role = auth.role || user.role;
  const email = auth.email || user.email;
  const normalizeUserType = (value?: string | null) => (value ?? "free").toString().trim().toLowerCase();
  const userType = normalizeUserType(auth.userType ?? user.userType);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cachedSiteName, setCachedSiteName] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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

  const siteName = siteNameQuery.data?.siteName || null;
  const loadingSiteName = siteNameQuery.isPending; // 只在首个请求未返回时认为 loading，避免阻塞展示
  const fetchedSiteName = siteNameQuery.isSuccess || siteNameQuery.isError;
  const displaySiteName = cachedSiteName || siteName;
  const jobIdParam = searchParams.get("jobId");
  const jobId = jobIdParam ? Number(jobIdParam) : undefined;
  const activeJobQuery = useBuildJob(jobId);
  const derivedActiveJob =
    jobsQuery.data?.find((j) => j.status === "pending" || j.status === "running") ?? null;
  const hasActiveJob = Boolean(jobId) || Boolean(derivedActiveJob);
  const isAdmin = role === "admin";
  const showSiteNameForm = fetchedSiteName && (!displaySiteName || isAdmin);
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSiteNameMutation.mutate(
      { siteName: input },
      {
        onSuccess: (data) => {
          setMessage(`站点名称已设置为：${data.siteName}`);
          setCachedSiteName(data.siteName);
          siteNameQuery.refetch();
        },
        onError: (err: any) => setMessage(err?.response?.data?.error || "设置失败"),
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-3xl font-bold">欢迎使用，{email}</h2>
          {role === 'admin' ? (
            <div className="badge badge-lg badge-primary">管理员</div>
          ) : userType === 'subscriber' ? (
            <div className="badge badge-lg badge-secondary">订阅用户</div>
          ) : null}
        </div>
        <p className="text-base-content/70 mt-1">
          设置站点名，提交打包，完成后在“构建下载”获取仅与你账号绑定的产物。
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg mb-2">站点配置</h3>
          {loadingSiteName && !displaySiteName && (
            <div className="flex justify-center p-4"><span className="loading loading-spinner loading-md" /></div>
          )}

          {!showSiteNameForm && (displaySiteName || hasActiveJob) ? (
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 bg-base-200/30 rounded-xl border border-base-200">
              <div className="flex-1 space-y-1">
                <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider">当前站点名称</div>
                <div className="text-3xl font-bold text-primary">{displaySiteName || "已设置"}</div>
                <div className="text-xs text-base-content/60 flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>
                      管理员可随时修改
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      如需更改请联系管理员
                    </>
                  )}
                </div>
              </div>

              {quota && (
                <div className="stats shadow bg-base-100 shrink-0">
                  <div className="stat place-items-center p-4">
                    <div className="stat-title text-xs">今日剩余构建</div>
                    <div className={`stat-value text-2xl ${quota.left === 0 && !isUnlimitedQuota ? 'text-error' : 'text-secondary'}`}>
                      {isUnlimitedQuota ? "∞" : `${quota.left}/${quota.limit}`}
                    </div>
                    <div className="stat-desc text-xs mt-1">
                      {isUnlimitedQuota ? "无限制" : "每日刷新"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <div role="alert" className="alert alert-info bg-info/10 text-info-content border-info/20 text-sm py-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>
                  在前端构建前输入你的站点名，用于打包后主题的站点名称和标题。{isAdmin ? "管理员可重复修改。" : "确认无误后提交，一旦保存不可修改。"}
                </span>
              </div>
              {fetchedSiteName && (
                <form onSubmit={onSubmit} className="join w-full">
                  <input
                    className="input input-bordered join-item w-full"
                    placeholder="输入站点名称"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={setSiteNameMutation.status === "pending"}
                  />
                  <button className="btn btn-primary join-item" type="submit" disabled={!input.trim() || setSiteNameMutation.status === "pending"}>
                    {setSiteNameMutation.status === "pending" ? <span className="loading loading-spinner loading-xs" /> : (isAdmin ? "保存" : "设置")}
                  </button>
                </form>
              )}
            </div>
          )}
          {message && <div className="text-success text-sm mt-2 font-medium">{message}</div>}
        </div>
      </div>

      {buildFailure && (
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

      {(jobId || derivedActiveJob) && (
        <div role="alert" className="alert bg-base-100 shadow-lg border border-base-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <div className="flex items-center gap-3">
              {(activeJobQuery.isFetching || jobsQuery.isFetching || activeJobStatusLabel === "running" || activeJobStatusLabel === "构建中") ?
                <span className="loading loading-spinner loading-md text-primary"></span> :
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-base-content/70"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              }
              <div>
                <div className="font-bold">当前任务 #{jobId ?? derivedActiveJob?.id ?? "..."}</div>
                <div className="text-xs opacity-70">
                  状态: <span className="font-semibold text-primary">{activeJobStatusLabel ?? (derivedActiveJob ? (derivedActiveJob.status === "pending" ? "等待中" : "构建中") : "获取中...")}</span>
                </div>
              </div>
            </div>
            {activeJobQuery.data?.status === "failed" && (
              <div className="text-error text-sm flex-1">{activeJobQuery.data.message || "构建失败"}</div>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold mb-3 px-1">构建队列</h3>
        {jobsQuery.isLoading && <div className="w-full h-20 flex items-center justify-center"><span className="loading loading-spinner" /></div>}
        {!jobsQuery.isLoading && jobsQuery.data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              const jobs = jobsQuery.data ?? [];
              const pending = jobs.filter((j) => j.status === "pending").length;
              const running = jobs.filter((j) => j.status === "running").length;
              const success = jobs.filter((j) => j.status === "success").length;
              const failed = jobs.filter((j) => j.status === "failed").length;

              return (
                <>
                  <div className="stats shadow bg-base-100 border-l-4 border-warning">
                    <div className="stat p-4">
                      <div className="stat-figure text-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div className="stat-title">等待中</div>
                      <div className="stat-value text-warning">{pending}</div>
                    </div>
                  </div>
                  <div className="stats shadow bg-base-100 border-l-4 border-info">
                    <div className="stat p-4">
                      <div className="stat-figure text-info">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      </div>
                      <div className="stat-title">构建中</div>
                      <div className="stat-value text-info">{running}</div>
                    </div>
                  </div>
                  <div className="stats shadow bg-base-100 border-l-4 border-success">
                    <div className="stat p-4">
                      <div className="stat-figure text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div className="stat-title">已完成</div>
                      <div className="stat-value text-success">{success}</div>
                    </div>
                  </div>
                  <div className="stats shadow bg-base-100 border-l-4 border-error">
                    <div className="stat p-4">
                      <div className="stat-figure text-error">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div className="stat-title">失败</div>
                      <div className="stat-value text-error">{failed}</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
