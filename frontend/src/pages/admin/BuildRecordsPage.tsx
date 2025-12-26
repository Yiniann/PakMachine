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
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="card-title">构建记录</h2>
              <p className="text-sm text-base-content/70">展示最近构建任务（含所有用户）</p>
            </div>
            <button className="btn btn-sm" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? "刷新中..." : "刷新"}
            </button>
          </div>

          {errorMessage && <p className="text-error mt-2">加载失败：{errorMessage}</p>}

          <div className="overflow-x-auto mt-2">
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
            {isLoading && <p className="loading loading-spinner loading-sm mt-3" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildRecordsPage;
