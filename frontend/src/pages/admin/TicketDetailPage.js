import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAddAdminTicketMessage, useUpdateAdminTicket } from "../../features/tickets/mutations";
import { categoryLabel, statusMeta } from "../../features/tickets/meta";
import { useAdminTicket } from "../../features/tickets/queries";
const statusOptions = [
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
    const [editStatus, setEditStatus] = useState("open");
    const [reply, setReply] = useState("");
    useEffect(() => {
        if (!ticket)
            return;
        setEditStatus(ticket.status);
    }, [ticket]);
    const errorMessage = error && error?.response?.data?.error
        ? error.response.data.error
        : error instanceof Error
            ? error.message
            : null;
    const saveError = (addMessage.error && addMessage.error?.response?.data?.error)
        ? addMessage.error.response.data.error
        : (updateTicket.error && updateTicket.error?.response?.data?.error)
            ? updateTicket.error.response.data.error
            : addMessage.error instanceof Error
                ? addMessage.error.message
                : updateTicket.error instanceof Error
                    ? updateTicket.error.message
                    : null;
    const isSaving = addMessage.isPending || updateTicket.isPending;
    const onSubmit = async () => {
        if (!ticketId || !ticket)
            return;
        if (reply.trim()) {
            addMessage.mutate({
                id: ticketId,
                content: reply,
                status: editStatus,
            }, {
                onSuccess: () => {
                    setReply("");
                },
            });
            return;
        }
        if (editStatus !== ticket.status) {
            updateTicket.mutate({ id: ticketId, status: editStatus }, {
                onSuccess: () => {
                    setReply("");
                },
            });
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Ticket Detail" }), _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u5DE5\u5355\u8BE6\u60C5" })] }), _jsx("div", { className: "flex gap-2", children: _jsx(Link, { to: "/admin/tickets", className: "landing-button-secondary rounded-2xl px-5 py-3 text-sm", children: "\u8FD4\u56DE\u5217\u8868" }) })] }), errorMessage && (_jsx("div", { role: "alert", className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700", children: _jsx("span", { children: errorMessage }) })), isLoading && _jsx("div", { className: "flex justify-center py-12", children: _jsx("span", { className: "loading loading-spinner loading-lg" }) }), !isLoading && ticket && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "workspace-card p-6", children: _jsxs("div", { className: "space-y-5", children: [_jsx("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: _jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h3", { className: "text-2xl font-semibold", children: ticket.subject }), _jsx("span", { className: `badge ${statusMeta[ticket.status].badgeClass}`, children: statusMeta[ticket.status].label }), _jsxs("span", { className: "badge badge-ghost", children: [ticket.messageCount ?? 0, " \u6761\u6D88\u606F"] })] }), _jsxs("div", { className: "mt-2 text-sm text-base-content/60", children: ["\u5DE5\u5355 #", ticket.id, " \u00B7 ", categoryLabel[ticket.category] ?? ticket.category] })] }) }), _jsxs("div", { className: "workspace-card-soft grid gap-2 p-4 text-sm", children: [_jsxs("div", { children: ["\u7528\u6237\u90AE\u7BB1\uFF1A", ticket.user?.email ?? `用户 ${ticket.userId}`] }), _jsxs("div", { children: ["\u7AD9\u70B9\u540D\u79F0\uFF1A", ticket.user?.siteName ?? "未设置"] }), _jsxs("div", { children: ["\u63D0\u4EA4\u65F6\u95F4\uFF1A", new Date(ticket.createdAt).toLocaleString()] }), _jsxs("div", { children: ["\u6700\u540E\u66F4\u65B0\uFF1A", new Date(ticket.updatedAt).toLocaleString()] })] }), _jsx("div", { className: "space-y-4", children: ticket.messages?.map((message) => {
                                        const isAdmin = message.senderRole === "admin";
                                        return (_jsx("div", { className: `flex ${isAdmin ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-3xl rounded-2xl px-4 py-3 ${isAdmin ? "border border-slate-200 bg-slate-50 text-slate-900 shadow-sm" : "bg-base-200 text-base-content"}`, children: [_jsxs("div", { className: "text-xs mb-2 text-base-content/50", children: [isAdmin ? message.author?.email ?? "管理员" : ticket.user?.email ?? "用户", " \u00B7 ", new Date(message.createdAt).toLocaleString()] }), _jsx("div", { className: "whitespace-pre-wrap break-words text-sm", children: message.content })] }) }, message.id));
                                    }) })] }) }), _jsx("div", { className: "workspace-card p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { children: _jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "\u5904\u7406\u5DE5\u5355" }) }), _jsxs("label", { className: "form-control max-w-xs", children: [_jsx("span", { className: "label-text", children: "\u5904\u7406\u72B6\u6001" }), _jsx("select", { className: "workspace-select select select-bordered", value: editStatus, onChange: (e) => setEditStatus(e.target.value), children: statusOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u65B0\u589E\u56DE\u590D" }), _jsx("textarea", { className: "workspace-textarea textarea textarea-bordered min-h-48", value: reply, onChange: (e) => setReply(e.target.value), maxLength: 5000, placeholder: "\u586B\u5199\u5904\u7406\u7ED3\u679C\u3001\u6392\u67E5\u5EFA\u8BAE\u6216\u540E\u7EED\u52A8\u4F5C" }), _jsxs("span", { className: "label-text-alt text-base-content/50", children: [reply.length, "/5000"] })] }), saveError && (_jsx("div", { role: "alert", className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700", children: _jsx("span", { children: saveError }) })), _jsx("div", { className: "flex justify-end", children: _jsx("button", { className: "landing-button-primary min-w-[120px] rounded-2xl px-5 py-3 text-sm", onClick: onSubmit, disabled: isSaving || (!reply.trim() && editStatus === ticket.status), children: isSaving ? "保存中..." : "保存处理结果" }) })] }) })] }))] }));
};
export default TicketDetailPage;
