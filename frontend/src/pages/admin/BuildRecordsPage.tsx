import { useMemo } from "react";
import { useAdminBuildJobs } from "../../features/builds/queries";

const statusBadgeClass: Record<string, string> = {
  pending: "badge-ghost",
  running: "badge-info",
  success: "badge-success",
  failed: "badge-error",
};

const BuildRecordsPage = () => {
  const { data, isLoading, error, refetch } = useAdminBuildJobs(200);

  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;

  const jobs = useMemo(
    () =>
      data?.map((j) => ({
        ...j,
        createdAtLabel: new Date(j.createdAt).toLocaleString(),
      })) ?? [],
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="workspace-kicker">Build Records</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">构建记录</h2>
          <p className="mt-2 text-[15px] text-slate-500">查看全站用户的构建历史与状态。</p>
        </div>
        <button className="landing-button-primary rounded-2xl px-5 py-3 text-sm" onClick={() => refetch()} disabled={isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {isLoading ? "刷新中..." : "刷新列表"}
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="workspace-alert flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="workspace-card p-0 sm:p-6">
        <div className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <div className="workspace-table-shell">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>用户</th>
                    <th>站点</th>
                    <th>模板文件</th>
                    <th>状态</th>
                    <th>时间</th>
                    <th>消息</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>{j.id}</td>
                      <td>
                        <div className="flex flex-col">
                          <span>{j.user.email}</span>
                          <span className="text-xs text-base-content/60">UID: {j.user.id}</span>
                        </div>
                      </td>
                      <td>{j.user.siteName ?? "未设置"}</td>
                      <td>{j.filename}</td>
                      <td>
                        <div className={`badge badge-sm capitalize ${statusBadgeClass[j.status] ?? "badge-ghost"}`}>
                          {j.status}
                        </div>
                      </td>
                      <td>{j.createdAtLabel}</td>
                      <td>
                        <div className="max-w-xs truncate" title={j.message || undefined}>
                          {j.message ?? "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && jobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-base-content/60">
                        暂无记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="workspace-table-shell md:hidden flex flex-col divide-y divide-base-200">
            {jobs.map((j) => (
              <div key={j.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs opacity-50">#{j.id}</span>
                    <div className={`badge badge-sm capitalize ${statusBadgeClass[j.status] ?? "badge-ghost"}`}>
                      {j.status}
                    </div>
                  </div>
                  <span className="text-xs text-base-content/50">{j.createdAtLabel}</span>
                </div>

                <div className="text-sm">
                  <div className="font-semibold">{j.user.siteName ?? "未设置"}</div>
                  <div className="text-xs text-base-content/70">{j.filename}</div>
                </div>

                <div className="text-xs text-base-content/60">{j.user.email}</div>

                {j.message && <div className="mt-1 break-all rounded-xl bg-slate-100 p-2 text-xs">{j.message}</div>}
              </div>
            ))}
            {!isLoading && jobs.length === 0 && <div className="p-4 text-center text-base-content/60">暂无记录</div>}
          </div>

          {isLoading && <div className="flex justify-center p-6"><span className="loading loading-spinner loading-md" /></div>}
        </div>
      </div>
    </div>
  );
};

export default BuildRecordsPage;
