import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSiteName, useSetSiteName } from "../../features/builds/siteName";
import { useBuildJob, useBuildJobs } from "../../features/builds/jobs";
import { useBuildQuota } from "../../features/builds/quota";
import { useNavigate, useSearchParams } from "react-router-dom";

const HomePage = () => {
  const siteNameQuery = useSiteName();
  const setSiteNameMutation = useSetSiteName();
  const jobsQuery = useBuildJobs();
  const quotaQuery = useBuildQuota();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cachedSiteName, setCachedSiteName] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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
    }
  }, [siteName]);

  useEffect(() => {
    if (!jobId) return;
    const status = activeJobQuery.data?.status;
    if (!status) return;
    if (status === "success" || status === "failed") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("jobId");
        return next;
      });
      if (status === "success") {
        navigate("/app/downloads");
      }
    }
  }, [jobId, activeJobQuery.data?.status, navigate, setSearchParams]);

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="card-title">主题打包机</h2>
            <p className="text-base-content/70">
              设置站点名，提交打包，完成后在“构建下载”获取仅与你账号绑定的产物。
            </p>
          </div>

          {loadingSiteName && !displaySiteName && <p>加载站点名称...</p>}

          {(displaySiteName || hasActiveJob) ? (
            <div className="bg-base-200/60 rounded-box p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">站点名称</span>
                <span className="badge badge-lg badge-outline">{displaySiteName || "已设置"}</span>
                 <span className="text-xs text-base-content/60">如需更改站点名请联系管理员</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/70">
                {quotaQuery.data && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">今日剩余</span>
                    <span className="badge badge-outline">{quotaQuery.data.left} / {quotaQuery.data.limit}</span>
                    <span className="text-xs text-base-content/60">打包次数每日刷新</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-base-200/60 rounded-box p-4 space-y-3">
              <div className="alert">
                <span>在前端构建前输入你的站点名，用于打包后主题的站点名称和标题，后续无法修改。如需更改请联系管理员。</span>
              </div>
              {fetchedSiteName && (
                <>
                  <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 items-start">
                    <input
                      className="input input-bordered w-full sm:w-auto flex-1"
                      placeholder="站点名称"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={setSiteNameMutation.status === "pending"}
                    />
                    <button className="btn btn-primary" type="submit" disabled={!input.trim() || setSiteNameMutation.status === "pending"}>
                      {setSiteNameMutation.status === "pending" ? "提交中..." : "设置"}
                    </button>
                  </form>
                  <p className="text-sm text-base-content/70">确认无误后提交，一旦保存不可修改。</p>
                </>
              )}
            </div>
          )}
          {message && <p className="text-info">{message}</p>}
        </div>
      </div>

      {(jobId || derivedActiveJob) && (
        <div className="alert bg-base-100 flex flex-col sm:flex-row sm:items-center gap-2">
          <span>
            当前构建任务 ID：{jobId ?? derivedActiveJob?.id ?? "获取中"}
          </span>
          <span className="badge badge-outline">
            {activeJobStatusLabel ??
              (derivedActiveJob ? (derivedActiveJob.status === "pending" ? "等待中" : "构建中") : "获取状态中...")}
          </span>
          {activeJobQuery.data?.status === "failed" && (
            <span className="text-error text-sm">{activeJobQuery.data.message || "构建失败"}</span>
          )}
          {(activeJobQuery.isFetching || jobsQuery.isFetching) && <span className="loading loading-spinner loading-xs" />}
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h3 className="card-title">构建队列</h3>
          {jobsQuery.isLoading && <p>加载队列...</p>}
          {jobsQuery.error && <p className="text-error">加载失败</p>}
          {!jobsQuery.isLoading && jobsQuery.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const jobs = jobsQuery.data ?? [];
                const pending = jobs.filter((j) => j.status === "pending").length;
                const running = jobs.filter((j) => j.status === "running").length;
                const success = jobs.filter((j) => j.status === "success").length;
                const failed = jobs.filter((j) => j.status === "failed").length;
                const cards = [
                  { label: "等待中", value: pending, color: "bg-warning/20 text-warning-content" },
                  { label: "构建中", value: running, color: "bg-info/20 text-info-content" },
                  { label: "已完成", value: success, color: "bg-success/20 text-success-content" },
                  { label: "失败", value: failed, color: "bg-error/20 text-error-content" },
                ];
                if (jobs.length === 0) {
                  return <p className="col-span-full">暂无任务</p>;
                }
                return cards.map((c) => (
                  <div key={c.label} className={`stat shadow-sm ${c.color}`}>
                    <div className="stat-title">{c.label}</div>
                    <div className="stat-value text-3xl">{c.value}</div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
