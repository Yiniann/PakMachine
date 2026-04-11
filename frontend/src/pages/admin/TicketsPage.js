import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryLabel, statusMeta } from "../../features/tickets/meta";
import { useAdminTickets } from "../../features/tickets/queries";
const statusOptions = [
    { value: "all", label: "全部状态" },
    { value: "open", label: "待处理" },
    { value: "processing", label: "处理中" },
    { value: "closed", label: "已关闭" },
];
const TicketsPage = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("all");
    const { data, isLoading, error } = useAdminTickets(statusFilter);
    const errorMessage = error && error?.response?.data?.error
        ? error.response.data.error
        : error instanceof Error
            ? error.message
            : null;
    const tickets = useMemo(() => data?.map((ticket) => ({
        ...ticket,
        createdAtLabel: new Date(ticket.createdAt).toLocaleString(),
        updatedAtLabel: new Date(ticket.updatedAt).toLocaleString(),
    })) ?? [], [data]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Tickets" }), _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u5DE5\u5355\u5904\u7406" }), _jsx("p", { className: "mt-2 text-[15px] text-slate-500", children: "\u67E5\u770B\u7528\u6237\u63D0\u4EA4\u7684\u95EE\u9898\uFF0C\u70B9\u51FB\u8FDB\u5165\u8BE6\u60C5\u9875\u5904\u7406\u4F1A\u8BDD\u3002\u5217\u8868\u6BCF 4 \u79D2\u81EA\u52A8\u66F4\u65B0\u3002" })] }), _jsx("div", { className: "flex flex-wrap items-center gap-2", children: _jsx("select", { className: "workspace-select select select-bordered select-sm", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: statusOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }) })] }), errorMessage && (_jsx("div", { role: "alert", className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700", children: _jsx("span", { children: errorMessage }) })), _jsx("div", { className: "workspace-card p-0 sm:p-6", children: _jsxs("div", { className: "p-0", children: [isLoading && _jsx("div", { className: "flex justify-center p-8", children: _jsx("span", { className: "loading loading-spinner loading-md" }) }), !isLoading && tickets.length === 0 && !errorMessage && (_jsx("div", { className: "px-6 py-12 text-center text-base-content/60", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6682\u65E0\u5DE5\u5355\u3002" })), _jsx("div", { className: "hidden md:block overflow-x-auto", children: _jsx("div", { className: "workspace-table-shell", children: _jsxs("table", { className: "table table-zebra", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "\u7528\u6237" }), _jsx("th", { children: "\u5206\u7C7B" }), _jsx("th", { children: "\u6807\u9898" }), _jsx("th", { children: "\u6700\u65B0\u6D88\u606F" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u66F4\u65B0\u65F6\u95F4" })] }) }), _jsx("tbody", { children: tickets.map((ticket) => (_jsxs("tr", { className: "cursor-pointer", onClick: () => navigate(`/admin/tickets/${ticket.id}`), children: [_jsxs("td", { children: ["#", ticket.id] }), _jsx("td", { children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: ticket.user?.email ?? `用户 ${ticket.userId}` }), _jsx("span", { className: "text-xs text-base-content/50", children: ticket.user?.siteName ?? "未设置站点名" })] }) }), _jsx("td", { children: categoryLabel[ticket.category] ?? ticket.category }), _jsx("td", { className: "max-w-xs truncate", title: ticket.subject, children: ticket.subject }), _jsx("td", { className: "max-w-xs truncate", title: ticket.lastMessage?.content ?? "", children: ticket.lastMessage?.content ?? "-" }), _jsx("td", { children: _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: `badge badge-sm ${statusMeta[ticket.status].badgeClass}`, children: statusMeta[ticket.status].label }), _jsxs("span", { className: "text-xs text-base-content/50", children: [ticket.messageCount ?? 0, " \u6761\u6D88\u606F"] })] }) }), _jsx("td", { children: ticket.updatedAtLabel })] }, ticket.id))) })] }) }) }), _jsx("div", { className: "workspace-table-shell md:hidden flex flex-col divide-y divide-base-200", children: tickets.map((ticket) => (_jsxs("div", { role: "button", tabIndex: 0, className: "cursor-pointer p-4 text-left space-y-2 focus:outline-none focus:ring-2 focus:ring-primary/20", onClick: () => navigate(`/admin/tickets/${ticket.id}`), onKeyDown: (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        navigate(`/admin/tickets/${ticket.id}`);
                                    }
                                }, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "font-medium", children: ticket.subject }), _jsx("span", { className: `badge badge-sm ${statusMeta[ticket.status].badgeClass}`, children: statusMeta[ticket.status].label })] }), _jsx("div", { className: "text-sm text-base-content/60", children: ticket.user?.email ?? `用户 ${ticket.userId}` }), _jsx("div", { className: "text-xs text-base-content/50", children: ticket.lastMessage?.content ?? "暂无消息" }), _jsxs("div", { className: "text-xs text-base-content/50", children: ["\u5DE5\u5355 #", ticket.id, " \u00B7 ", ticket.messageCount ?? 0, " \u6761\u6D88\u606F \u00B7 ", ticket.updatedAtLabel] })] }, ticket.id))) })] }) })] }));
};
export default TicketsPage;
