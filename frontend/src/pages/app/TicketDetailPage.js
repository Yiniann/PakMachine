import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const errorMessage = error && error?.response?.data?.error
        ? error.response.data.error
        : error instanceof Error
            ? error.message
            : null;
    const replyError = addMessage.error && addMessage.error?.response?.data?.error
        ? addMessage.error.response.data.error
        : addMessage.error instanceof Error
            ? addMessage.error.message
            : null;
    const onSubmit = () => {
        if (!ticketId || !reply.trim())
            return;
        addMessage.mutate({ id: ticketId, content: reply }, {
            onSuccess: () => {
                setReply("");
            },
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "breadcrumbs text-sm text-slate-500", children: _jsxs("ul", { children: [_jsx("li", { children: _jsx(Link, { to: "/app/tickets", children: "\u5DE5\u5355\u652F\u6301" }) }), _jsx("li", { children: "\u5DE5\u5355\u8BE6\u60C5" })] }) }), _jsx("h2", { className: "mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900", children: "\u5DE5\u5355\u8BE6\u60C5" })] }), _jsx("div", { className: "flex gap-2", children: _jsx(Link, { to: "/app/tickets", className: "landing-button-secondary rounded-2xl px-5 py-3 text-base", children: "\u8FD4\u56DE\u5217\u8868" }) })] }), errorMessage && (_jsx("div", { role: "alert", className: "workspace-alert alert alert-error", children: _jsx("span", { children: errorMessage }) })), isLoading && _jsx("div", { className: "flex justify-center py-12", children: _jsx("span", { className: "loading loading-spinner loading-lg" }) }), !isLoading && ticket && (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "workspace-card", children: _jsxs("div", { className: "card-body space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h3", { className: "text-2xl font-semibold", children: ticket.subject }), _jsx("span", { className: `badge ${statusMeta[ticket.status].badgeClass}`, children: statusMeta[ticket.status].label })] }), _jsxs("div", { className: "mt-2 text-sm text-base-content/60", children: ["\u5DE5\u5355 #", ticket.id, " \u00B7 ", categoryLabel[ticket.category] ?? ticket.category] })] }), _jsxs("div", { className: "text-sm text-base-content/50 md:text-right", children: [_jsxs("div", { children: ["\u63D0\u4EA4\u65F6\u95F4\uFF1A", new Date(ticket.createdAt).toLocaleString()] }), _jsxs("div", { children: ["\u6700\u540E\u66F4\u65B0\uFF1A", new Date(ticket.updatedAt).toLocaleString()] })] })] }), _jsx("div", { className: "space-y-4", children: ticket.messages?.map((message) => {
                                        const isMine = message.senderRole === "user";
                                        return (_jsx("div", { className: `flex ${isMine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-3xl rounded-2xl px-4 py-3 ${isMine ? "border border-slate-200 bg-slate-50 text-slate-900 shadow-sm" : "bg-white/75 text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"}`, children: [_jsxs("div", { className: "mb-2 text-xs text-slate-500", children: [isMine ? "我" : message.author?.email ?? "管理员", " \u00B7 ", new Date(message.createdAt).toLocaleString()] }), _jsx("div", { className: "whitespace-pre-wrap break-words text-sm", children: message.content })] }) }, message.id));
                                    }) })] }) }), _jsx("div", { className: "workspace-card", children: _jsxs("div", { className: "card-body", children: [_jsxs("div", { children: [_jsx("h3", { className: "card-title", children: "\u7EE7\u7EED\u56DE\u590D" }), _jsx("p", { className: "text-sm text-base-content/60", children: ticket.status === "closed"
                                                ? "当前工单已关闭，如需继续处理请联系管理员重新开启。"
                                                : canReply
                                                    ? "管理员已回复，现在可以继续补充信息。"
                                                    : "当前需要等待管理员先回复，之后你才能继续补充。页面每 4 秒自动同步。" })] }), _jsxs("label", { className: "form-control", children: [_jsx("textarea", { className: "workspace-textarea textarea textarea-bordered min-h-40", value: reply, onChange: (e) => setReply(e.target.value), maxLength: 5000, placeholder: "\u8865\u5145\u95EE\u9898\u73B0\u8C61\u3001\u6392\u67E5\u7ED3\u679C\u6216\u65B0\u7684\u622A\u56FE\u8BF4\u660E", disabled: !canReply }), _jsxs("span", { className: "label-text-alt text-base-content/50", children: [reply.length, "/5000"] })] }), replyError && (_jsx("div", { role: "alert", className: "workspace-alert alert alert-error text-sm", children: _jsx("span", { children: replyError }) })), _jsx("div", { className: "flex justify-end", children: _jsx("button", { className: "landing-button-primary min-w-[120px] rounded-2xl px-6 py-3 text-base", onClick: onSubmit, disabled: !canReply || addMessage.isPending || !reply.trim(), children: addMessage.isPending ? "发送中..." : "发送回复" }) })] }) })] }))] }));
};
export default TicketDetailPage;
