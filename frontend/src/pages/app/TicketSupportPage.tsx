import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "../../features/tickets/mutations";
import { categoryLabel, categoryOptions, statusMeta } from "../../features/tickets/meta";
import { useMyTickets } from "../../features/tickets/queries";
import { TicketCategory } from "../../features/tickets/types";

const TicketSupportPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyTickets();
  const createTicket = useCreateTicket();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [content, setContent] = useState("");

  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
        : null;

  const createError =
    createTicket.error && (createTicket.error as any)?.response?.data?.error
      ? (createTicket.error as any).response.data.error
      : createTicket.error instanceof Error
        ? createTicket.error.message
        : null;

  const tickets = useMemo(
    () =>
      data?.map((ticket) => ({
        ...ticket,
        createdAtLabel: new Date(ticket.createdAt).toLocaleString(),
        updatedAtLabel: new Date(ticket.updatedAt).toLocaleString(),
      })) ?? [],
    [data],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createTicket.mutate(
      { subject, category: category as TicketCategory, content },
      {
        onSuccess: (created) => {
          setSubject("");
          setCategory("");
          setContent("");
          setIsCreateOpen(false);
          navigate(`/app/tickets/${created.id}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="workspace-kicker">Support</p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">工单支持</h2>
          <p className="mt-2 text-lg leading-8 text-slate-500">点击工单进入详情，可和管理员持续沟通。</p>
        </div>
        <button className="landing-button-primary rounded-2xl px-6 py-3 text-base" type="button" onClick={() => setIsCreateOpen(true)}>
          发起工单
        </button>
      </div>

      <div className="workspace-card">
        <div className="card-body">
          <div>
            <div>
              <h3 className="card-title">我的工单</h3>
              <p className="text-sm text-base-content/60">查看状态、最新消息和回复进展。</p>
            </div>
          </div>

          {errorMessage && (
            <div role="alert" className="workspace-alert alert alert-error text-sm">
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading && <div className="flex justify-center py-10"><span className="loading loading-spinner loading-md" /></div>}

          {!isLoading && tickets.length === 0 && !errorMessage && (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500">
              还没有工单，点击右上角按钮即可发起工单。
            </div>
          )}

          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                className="workspace-card-soft w-full cursor-pointer p-5 text-left transition hover:border-[#6d6bf4]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6d6bf4]/20"
                onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/app/tickets/${ticket.id}`);
                  }
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-lg">{ticket.subject}</h4>
                      <span className={`badge badge-sm ${statusMeta[ticket.status].badgeClass}`}>
                        {statusMeta[ticket.status].label}
                      </span>
                      <span className="badge badge-ghost badge-sm">{ticket.messageCount ?? 0} 条消息</span>
                    </div>
                    <div className="text-sm text-base-content/60">
                      工单 #{ticket.id} · {categoryLabel[ticket.category] ?? ticket.category}
                    </div>
                    <div className="rounded-xl bg-slate-100/80 px-4 py-3 text-sm text-slate-700">
                      {ticket.lastMessage?.content ?? "暂无消息"}
                    </div>
                  </div>
                  <div className="text-sm text-base-content/50 md:text-right">
                    <div>提交时间：{ticket.createdAtLabel}</div>
                    <div>最后更新：{ticket.updatedAtLabel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <div className="modal modal-open bg-transparent backdrop-blur-sm">
          <div className="modal-box workspace-card max-w-2xl border-0 bg-white/95">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">发起工单</h3>
                <p className="mt-1 text-sm text-base-content/60">尽量描述清楚问题场景、报错内容和复现步骤。</p>
              </div>
              <button
                type="button"
                  className="landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0"
                onClick={() => setIsCreateOpen(false)}
                disabled={createTicket.isPending}
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="form-control">
                <span className="label-text">工单标题</span>
                <input
                  type="text"
                  className="workspace-input input input-bordered"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={120}
                  placeholder="例如：构建完成后前端域名无法访问"
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text">问题分类</span>
                <select
                  className="workspace-select select select-bordered"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  required
                >
                  <option value="" disabled>
                    请选择问题分类
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control">
                <span className="label-text">问题描述</span>
                <textarea
                  className="workspace-textarea textarea textarea-bordered min-h-40"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={5000}
                  placeholder="请填写问题现象、相关配置、操作步骤、期望结果等信息"
                  required
                />
                <span className="label-text-alt text-base-content/50">{content.length}/5000</span>
              </label>

              {createError && (
                <div role="alert" className="workspace-alert alert alert-error text-sm">
                  <span>{createError}</span>
                </div>
              )}

              <div className="modal-action mt-6">
                <button
                  type="button"
                  className="landing-button-secondary rounded-2xl px-5 py-3 text-base"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createTicket.isPending}
                >
                  取消
                </button>
                <button className="landing-button-primary min-w-[120px] rounded-2xl px-6 py-3 text-base" type="submit" disabled={createTicket.isPending}>
                  {createTicket.isPending ? "提交中..." : "提交工单"}
                </button>
              </div>
            </form>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent"
            onClick={() => !createTicket.isPending && setIsCreateOpen(false)}
            aria-label="关闭"
          />
        </div>
      )}
    </div>
  );
};

export default TicketSupportPage;
