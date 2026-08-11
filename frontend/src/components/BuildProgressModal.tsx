type BuildProgressStatus = "submitting" | "pending" | "running" | "success" | "failed";

type BuildProgressModalProps = {
  open: boolean;
  title: string;
  jobId?: number | null;
  status: BuildProgressStatus;
  message?: string | null;
  onClose: () => void;
};

const statusText: Record<BuildProgressStatus, string> = {
  submitting: "正在提交构建任务",
  pending: "构建任务正在排队",
  running: "正在构建",
  success: "构建已完成",
  failed: "构建失败",
};

const BuildProgressModal = ({ open, title, jobId, status, message, onClose }: BuildProgressModalProps) => {
  if (!open) return null;
  const failed = status === "failed";
  const inProgress = status === "submitting" || status === "pending" || status === "running";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm" role="presentation">
      <div
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-progress-title"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${failed ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"}`}>
            {inProgress ? <span className="loading loading-spinner loading-sm" /> : failed ? <span className="text-xl font-bold">!</span> : <span className="text-xl font-bold">✓</span>}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="build-progress-title" className="text-lg font-bold text-slate-900">{title}</h2>
            <p className={`mt-1 text-sm font-medium ${failed ? "text-rose-600" : "text-slate-600"}`}>{statusText[status]}</p>
            {jobId ? <p className="mt-2 text-xs text-slate-400">任务 #{jobId}</p> : null}
          </div>
        </div>

        <div className="mt-5 min-h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${failed ? "w-full bg-rose-500" : status === "success" ? "w-full bg-emerald-500" : "w-2/3 animate-pulse bg-indigo-500"}`} />
        </div>

        <p className={`mt-4 break-words text-sm leading-6 ${failed ? "text-rose-600" : "text-slate-500"}`}>
          {message || (inProgress ? "完成后将自动打开对应的构建下载记录。" : "正在打开构建下载记录。")}
        </p>

        {failed ? (
          <div className="mt-6 flex justify-end">
            <button type="button" className="landing-button-secondary rounded-lg px-5 py-2.5 text-sm" onClick={onClose}>
              关闭
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export type { BuildProgressStatus };
export default BuildProgressModal;
