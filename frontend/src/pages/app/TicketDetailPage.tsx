import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAddMyTicketMessage } from "../../features/tickets/mutations";
import { categoryLabel, statusMeta } from "../../features/tickets/meta";
import { useMyTicket } from "../../features/tickets/queries";

const TicketDetailPage = () => {
  const { id } = useParams();
  const ticketId = id ? Number(id) : null;
  const { data: ticket, isLoading, error } = useMyTicket(ticketId);
  const addMessage = useAddMyTicketMessage();
  const [reply, setReply] = useState("");
  const lastMessage = ticket?.messages?.[ticket.messages ? ticket.messages.length - 1 : 0];
  const canReply = Boolean(ticket && ticket.status !== "closed" && lastMessage?.senderRole === "admin");

  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;

  const replyError =
    addMessage.error && (addMessage.error as any)?.response?.data?.error
      ? (addMessage.error as any).response.data.error
      : addMessage.error instanceof Error
        ? addMessage.error.message
        : null;

  const onSubmit = () => {
    if (!ticketId || !reply.trim()) return;
    addMessage.mutate(
      { id: ticketId, content: reply },
      {
        onSuccess: () => {
          setReply("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="breadcrumbs text-sm">
            <ul>
              <li><Link to="/app/tickets">工单支持</Link></li>
              <li>工单详情</li>
            </ul>
          </div>
          <h2 className="text-3xl font-bold mt-2">工单详情</h2>
        </div>
        <div className="flex gap-2">
          <Link to="/app/tickets" className="btn btn-ghost btn-sm">返回列表</Link>
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
                  </div>
                  <div className="mt-2 text-sm text-base-content/60">
                    工单 #{ticket.id} · {categoryLabel[ticket.category] ?? ticket.category}
                  </div>
                </div>
                <div className="text-sm text-base-content/50 md:text-right">
                  <div>提交时间：{new Date(ticket.createdAt).toLocaleString()}</div>
                  <div>最后更新：{new Date(ticket.updatedAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                {ticket.messages?.map((message) => {
                  const isMine = message.senderRole === "user";
                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-3xl rounded-2xl px-4 py-3 ${isMine ? "border border-slate-200 bg-slate-50 text-slate-900 shadow-sm" : "bg-base-200 text-base-content"}`}>
                        <div className="text-xs mb-2 text-base-content/50">
                          {isMine ? "我" : message.author?.email ?? "管理员"} · {new Date(message.createdAt).toLocaleString()}
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
            <div className="card-body">
              <div>
                <h3 className="card-title">继续回复</h3>
                <p className="text-sm text-base-content/60">
                  {ticket.status === "closed"
                    ? "当前工单已关闭，如需继续处理请联系管理员重新开启。"
                    : canReply
                      ? "管理员已回复，现在可以继续补充信息。"
                      : "当前需要等待管理员先回复，之后你才能继续补充。页面每 4 秒自动同步。"}
                </p>
              </div>

              <label className="form-control">
                <textarea
                  className="textarea textarea-bordered min-h-40"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={5000}
                  placeholder="补充问题现象、排查结果或新的截图说明"
                  disabled={!canReply}
                />
                <span className="label-text-alt text-base-content/50">{reply.length}/5000</span>
              </label>

              {replyError && (
                <div role="alert" className="alert alert-error text-sm">
                  <span>{replyError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className="btn btn-primary min-w-[120px]"
                  onClick={onSubmit}
                  disabled={!canReply || addMessage.isPending || !reply.trim()}
                >
                  {addMessage.isPending ? "发送中..." : "发送回复"}
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
