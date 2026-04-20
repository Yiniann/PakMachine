import { Fragment, useMemo, useState } from "react";
import { useAdminBuildJobs } from "../../features/builds/queries";

const statusBadgeClass: Record<string, string> = {
  pending: "badge-ghost",
  running: "badge-info",
  success: "badge-success",
  failed: "badge-error",
};

type EnvSnapshot = {
  buildMode?: string;
  frontendEnv?: string;
  serverEnv?: string;
  runtimeSettings?: unknown;
  rawText: string;
};

const parseEnvSnapshot = (value?: string | null): EnvSnapshot | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      return {
        buildMode: typeof record.buildMode === "string" ? record.buildMode : undefined,
        frontendEnv: typeof record.frontendEnv === "string" ? record.frontendEnv : undefined,
        serverEnv: typeof record.serverEnv === "string" ? record.serverEnv : undefined,
        runtimeSettings: record.runtimeSettings ?? null,
        rawText: value,
      };
    }
    return { rawText: value };
  } catch {
    return { frontendEnv: value, rawText: value };
  }
};

const formatObject = (value: unknown) => {
  if (value === null || value === undefined) return "无";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const RuntimeSettingsList = ({ value }: { value: unknown }) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs leading-6 text-slate-100">{formatObject(value)}</pre>;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return <div className="text-sm text-base-content/60">无</div>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, item]) => (
        <div key={key} className="rounded-xl border border-base-200 bg-white/80 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{key}</div>
          {item && typeof item === "object" && !Array.isArray(item) ? (
            <div className="mt-2 space-y-2">
              {Object.entries(item as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey} className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="text-sm font-medium text-slate-700">{nestedKey}</div>
                  <div className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-100">
                    {formatObject(nestedValue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-100">
              {formatObject(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const EnvBlock = ({ title, description, value }: { title: string; description: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="space-y-2 rounded-2xl border border-base-300 bg-white/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-outline">{title}</span>
        <span className="text-xs text-base-content/60">{description}</span>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs leading-6 text-slate-100">{value}</pre>
    </div>
  );
};

const BuildRecordsPage = () => {
  const { data, isLoading, error, refetch } = useAdminBuildJobs(200);
  const [expandedJobIds, setExpandedJobIds] = useState<number[]>([]);

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
        envSnapshot: parseEnvSnapshot(j.envJson),
      })) ?? [],
    [data],
  );

  const toggleExpanded = (jobId: number) => {
    setExpandedJobIds((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]));
  };

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
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <Fragment key={j.id}>
                    <tr
                      className="cursor-pointer hover:bg-base-200/70"
                      onClick={() => toggleExpanded(j.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpanded(j.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={expandedJobIds.includes(j.id)}
                    >
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
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(j.id);
                          }}
                          aria-expanded={expandedJobIds.includes(j.id)}
                          aria-label={expandedJobIds.includes(j.id) ? "收起环境信息" : "展开环境信息"}
                        >
                          {expandedJobIds.includes(j.id) ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedJobIds.includes(j.id) && (
                      <tr key={`${j.id}-env`}>
                        <td colSpan={8} className="bg-base-200/70">
                          <div className="space-y-3 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="badge badge-outline">env 快照</span>
                              <span className="text-xs text-base-content/60">包含本次构建携带的前端 / 后端 / 运行时配置</span>
                            </div>
                            {j.envSnapshot?.buildMode && (
                              <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/70">
                                <span className="font-medium text-base-content">构建模式</span>
                                <span className="badge badge-ghost badge-sm">{j.envSnapshot.buildMode}</span>
                              </div>
                            )}
                            <div className="space-y-3">
                              <EnvBlock
                                title="前端 env"
                                description="最终写入前端的环境变量内容"
                                value={j.envSnapshot?.frontendEnv?.trim() || (typeof j.envSnapshot?.rawText === "string" ? j.envSnapshot.rawText : "")}
                              />
                              <EnvBlock
                                title="后端 env"
                                description="仅 BFF 构建时包含的后端环境变量"
                                value={j.envSnapshot?.serverEnv?.trim() || null}
                              />
                              {j.envSnapshot?.runtimeSettings !== undefined && (
                                <div className="space-y-2 rounded-2xl border border-base-300 bg-white/80 p-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="badge badge-outline">运行时设置</span>
                                    <span className="text-xs text-base-content/60">当前构建的 runtimeSettings 快照</span>
                                  </div>
                                  <RuntimeSettingsList value={j.envSnapshot.runtimeSettings} />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
              <div
                key={j.id}
                className="space-y-2 p-4 hover:bg-base-200/60"
                role="button"
                tabIndex={0}
                aria-expanded={expandedJobIds.includes(j.id)}
                onClick={() => toggleExpanded(j.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpanded(j.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs opacity-50">#{j.id}</span>
                    <div className={`badge badge-sm capitalize ${statusBadgeClass[j.status] ?? "badge-ghost"}`}>
                      {j.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(j.id);
                    }}
                    aria-expanded={expandedJobIds.includes(j.id)}
                    aria-label={expandedJobIds.includes(j.id) ? "收起环境信息" : "展开环境信息"}
                  >
                    {expandedJobIds.includes(j.id) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-xs text-base-content/50">{j.createdAtLabel}</div>

                <div className="text-sm">
                  <div className="font-semibold">{j.user.siteName ?? "未设置"}</div>
                  <div className="text-xs text-base-content/70">{j.filename}</div>
                </div>

                <div className="text-xs text-base-content/60">{j.user.email}</div>

                {j.message && <div className="mt-1 break-all rounded-xl bg-slate-100 p-2 text-xs">{j.message}</div>}

                {expandedJobIds.includes(j.id) && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-outline badge-sm">env 快照</span>
                      <span className="text-xs text-base-content/60">点击可收起</span>
                    </div>
                    {j.envSnapshot?.buildMode && (
                      <div className="flex items-center gap-2 text-xs text-base-content/70">
                        <span className="font-medium text-base-content">构建模式</span>
                        <span className="badge badge-ghost badge-sm">{j.envSnapshot.buildMode}</span>
                      </div>
                    )}
                    <div className="space-y-3">
                      <EnvBlock
                        title="前端 env"
                        description="最终写入前端的环境变量内容"
                        value={j.envSnapshot?.frontendEnv?.trim() || (typeof j.envSnapshot?.rawText === "string" ? j.envSnapshot.rawText : "")}
                      />
                      <EnvBlock
                        title="后端 env"
                        description="仅 BFF 构建时包含的后端环境变量"
                        value={j.envSnapshot?.serverEnv?.trim() || null}
                      />
                      {j.envSnapshot?.runtimeSettings !== undefined && (
                        <div className="space-y-2 rounded-2xl border border-base-300 bg-white/80 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-outline">运行时设置</span>
                            <span className="text-xs text-base-content/60">当前构建的 runtimeSettings 快照</span>
                          </div>
                          <RuntimeSettingsList value={j.envSnapshot.runtimeSettings} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
