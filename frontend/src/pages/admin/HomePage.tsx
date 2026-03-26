import { useAdminStats } from "../../features/admin/queries";

const AdminHomePage = () => {
  const { data, isLoading, error } = useAdminStats();
  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="workspace-kicker">Admin Overview</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">管理员仪表盘</h2>
        <p className="mt-2 text-[15px] text-slate-500">用户、权限和构建数据总览。</p>
      </div>

      {errorMessage && (
        <div role="alert" className="workspace-alert flex items-center gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading && (
        <div className="w-full h-40 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {!isLoading && !errorMessage && data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="workspace-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Users</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.totalUsers}</p>
                <p className="mt-2 text-sm text-slate-500">全部注册用户</p>
              </div>
              <div className="text-[#6d6bf4]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-8 w-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
            </div>
          </div>

          <div className="workspace-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Pro Users</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.proUsers}</p>
                <p className="mt-2 text-sm text-slate-500">已开通 Pro 权限</p>
              </div>
              <div className="text-fuchsia-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-8 w-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
              </div>
            </div>
          </div>

          <div className="workspace-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Build Jobs</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.totalBuildJobs}</p>
                <p className="mt-2 text-sm text-slate-500">历史总任务数</p>
              </div>
              <div className="text-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-8 w-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
            </div>
          </div>

          <div className="workspace-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Today</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.buildsToday}</p>
                <p className="mt-2 text-sm text-slate-500">最近 7 天：{data.buildsLast7Days}</p>
              </div>
              <div className="text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-8 w-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomePage;
