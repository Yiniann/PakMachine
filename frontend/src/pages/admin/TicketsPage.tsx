import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryLabel, statusMeta } from "../../features/tickets/meta";
import { useAdminTickets } from "../../features/tickets/queries";
import { TicketStatus } from "../../features/tickets/types";

const statusOptions: Array<{ value: TicketStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "open", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "closed", label: "已关闭" },
];

const TicketsPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const { data, isLoading, error } = useAdminTickets(statusFilter);

  const errorMessage =
    error && (error as any)?.response?.data?.error
      ? (error as any).response.data.error
      : error instanceof Error
        ? error.message
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="workspace-kicker">Tickets</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">工单处理</h2>
          <p className="mt-2 text-[15px] text-slate-500">查看用户提交的问题，点击进入详情页处理会话。列表每 4 秒自动更新。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="workspace-select select select-bordered select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "all")}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="workspace-card p-0 sm:p-6">
        <div className="p-0">
          {isLoading && <div className="flex justify-center p-8"><span className="loading loading-spinner loading-md" /></div>}

          {!isLoading && tickets.length === 0 && !errorMessage && (
            <div className="px-6 py-12 text-center text-base-content/60">当前筛选条件下暂无工单。</div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <div className="workspace-table-shell">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户</th>
                  <th>分类</th>
                  <th>标题</th>
                  <th>最新消息</th>
                  <th>状态</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                  >
                    <td>#{ticket.id}</td>
                    <td>
                      <div className="flex flex-col">
                        <span>{ticket.user?.email ?? `用户 ${ticket.userId}`}</span>
                        <span className="text-xs text-base-content/50">{ticket.user?.siteName ?? "未设置站点名"}</span>
                      </div>
                    </td>
                    <td>{categoryLabel[ticket.category] ?? ticket.category}</td>
                    <td className="max-w-xs truncate" title={ticket.subject}>{ticket.subject}</td>
                    <td className="max-w-xs truncate" title={ticket.lastMessage?.content ?? ""}>
                      {ticket.lastMessage?.content ?? "-"}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={`badge badge-sm ${statusMeta[ticket.status].badgeClass}`}>
                          {statusMeta[ticket.status].label}
                        </span>
                        <span className="text-xs text-base-content/50">{ticket.messageCount ?? 0} 条消息</span>
                      </div>
                    </td>
                    <td>{ticket.updatedAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="workspace-table-shell md:hidden flex flex-col divide-y divide-base-200">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer p-4 text-left space-y-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/admin/tickets/${ticket.id}`);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{ticket.subject}</span>
                  <span className={`badge badge-sm ${statusMeta[ticket.status].badgeClass}`}>
                    {statusMeta[ticket.status].label}
                  </span>
                </div>
                <div className="text-sm text-base-content/60">{ticket.user?.email ?? `用户 ${ticket.userId}`}</div>
                <div className="text-xs text-base-content/50">{ticket.lastMessage?.content ?? "暂无消息"}</div>
                <div className="text-xs text-base-content/50">
                  工单 #{ticket.id} · {ticket.messageCount ?? 0} 条消息 · {ticket.updatedAtLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;
