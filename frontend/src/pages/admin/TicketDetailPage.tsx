import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAddAdminTicketMessage, useUpdateAdminTicket } from "../../features/tickets/mutations";
import { categoryLabel, statusMeta } from "../../features/tickets/meta";
import { useAdminTicket } from "../../features/tickets/queries";
import { TicketStatus } from "../../features/tickets/types";

const statusOptions: Array<{ value: TicketStatus; label: string }> = [
  { value: "open", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "closed", label: "已关闭" },
];

const TicketDetailPage = () => {
  const { id } = useParams();
  const ticketId = id ? Number(id) : null;
  const { data: ticket, isLoading, error } = useAdminTicket(ticketId);
  const updateTicket = useUpdateAdminTicket();
  const addMessage = useAddAdminTicketMessage();
  const [editStatus, setEditStatus] = useState<TicketStatus>("open");
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (!ticket) return;
    setEditStatus(ticket.status);
  }, [ticket]);

  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;

  const saveError =
    (addMessage.error && (addMessage.error as any)?.response?.data?.error)
      ? (addMessage.error as any).response.data.error
      : (updateTicket.error && (updateTicket.error as any)?.response?.data?.error)
        ? (updateTicket.error as any).response.data.error
        : addMessage.error instanceof Error
          ? addMessage.error.message
          : updateTicket.error instanceof Error
            ? updateTicket.error.message
            : null;

  const isSaving = addMessage.isPending || updateTicket.isPending;

  const onSubmit = async () => {
    if (!ticketId || !ticket) return;

    if (reply.trim()) {
      addMessage.mutate(
        {
          id: ticketId,
          content: reply,
          status: editStatus,
        },
        {
          onSuccess: () => {
            setReply("");
          },
        },
      );
      return;
    }

    if (editStatus !== ticket.status) {
      updateTicket.mutate(
        { id: ticketId, status: editStatus },
        {
          onSuccess: () => {
            setReply("");
          },
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="breadcrumbs text-sm">
            <ul>
              <li><Link to="/admin/tickets">工单处理</Link></li>
              <li>工单详情</li>
            </ul>
          </div>
          <h2 className="text-3xl font-bold mt-2">工单详情</h2>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/tickets" className="btn btn-ghost btn-sm">返回列表</Link>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="alert alert-error">
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}

      {!isLoading && ticket && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-semibold">{ticket.subject}</h3>
                    <span className={`badge ${statusMeta[ticket.status].badgeClass}`}>
                      {statusMeta[ticket.status].label}
                    </span>
                    <span className="badge badge-ghost">{ticket.messageCount ?? 0} 条消息</span>
                  </div>
                  <div className="mt-2 text-sm text-base-content/60">
                    工单 #{ticket.id} · {categoryLabel[ticket.category] ?? ticket.category}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-base-200/60 p-4 grid gap-2 text-sm">
                <div>用户邮箱：{ticket.user?.email ?? `用户 ${ticket.userId}`}</div>
                <div>站点名称：{ticket.user?.siteName ?? "未设置"}</div>
                <div>提交时间：{new Date(ticket.createdAt).toLocaleString()}</div>
                <div>最后更新：{new Date(ticket.updatedAt).toLocaleString()}</div>
              </div>

              <div className="space-y-4">
                {ticket.messages?.map((message) => {
                  const isAdmin = message.senderRole === "admin";
                  return (
                    <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-3xl rounded-2xl px-4 py-3 ${isAdmin ? "border border-slate-200 bg-slate-50 text-slate-900 shadow-sm" : "bg-base-200 text-base-content"}`}>
                        <div className="text-xs mb-2 text-base-content/50">
                          {isAdmin ? message.author?.email ?? "管理员" : ticket.user?.email ?? "用户"} · {new Date(message.createdAt).toLocaleString()}
                        </div>
                        <div className="whitespace-pre-wrap break-words text-sm">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body space-y-4">
              <div>
                <h3 className="card-title">处理工单</h3>
              </div>

              <label className="form-control max-w-xs">
                <span className="label-text">处理状态</span>
                <select
                  className="select select-bordered"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text">新增回复</span>
                <textarea
                  className="textarea textarea-bordered min-h-48"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={5000}
                  placeholder="填写处理结果、排查建议或后续动作"
                />
                <span className="label-text-alt text-base-content/50">{reply.length}/5000</span>
              </label>

              {saveError && (
                <div role="alert" className="alert alert-error text-sm">
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className="btn btn-primary min-w-[120px]"
                  onClick={onSubmit}
                  disabled={isSaving || (!reply.trim() && editStatus === ticket.status)}
                >
                  {isSaving ? "保存中..." : "保存处理结果"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;
