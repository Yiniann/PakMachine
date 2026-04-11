import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "../../features/tickets/mutations";
import { categoryLabel, categoryOptions, statusMeta } from "../../features/tickets/meta";
import { useMyTickets } from "../../features/tickets/queries";
const TicketSupportPage = () => {
    const navigate = useNavigate();
    const { data, isLoading, error } = useMyTickets();
    const createTicket = useCreateTicket();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");
    const errorMessage = error && error?.response?.data?.error
        ? error.response.data.error
        : error instanceof Error
            ? error.message
            : null;
    const createError = createTicket.error && createTicket.error?.response?.data?.error
        ? createTicket.error.response.data.error
        : createTicket.error instanceof Error
            ? createTicket.error.message
            : null;
    const tickets = useMemo(() => data?.map((ticket) => ({
        ...ticket,
        createdAtLabel: new Date(ticket.createdAt).toLocaleString(),
        updatedAtLabel: new Date(ticket.updatedAt).toLocaleString(),
    })) ?? [], [data]);
    const onSubmit = (event) => {
        event.preventDefault();
        createTicket.mutate({ subject, category: category, content }, {
            onSuccess: (created) => {
                setSubject("");
                setCategory("");
                setContent("");
                setIsCreateOpen(false);
                navigate(`/app/tickets/${created.id}`);
            },
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Support" }), _jsx("h2", { className: "mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900", children: "\u5DE5\u5355\u652F\u6301" }), _jsx("p", { className: "mt-2 text-lg leading-8 text-slate-500", children: "\u70B9\u51FB\u5DE5\u5355\u8FDB\u5165\u8BE6\u60C5\uFF0C\u53EF\u548C\u7BA1\u7406\u5458\u6301\u7EED\u6C9F\u901A\u3002" })] }), _jsx("button", { className: "landing-button-primary rounded-2xl px-6 py-3 text-base", type: "button", onClick: () => setIsCreateOpen(true), children: "\u53D1\u8D77\u5DE5\u5355" })] }), _jsx("div", { className: "workspace-card", children: _jsxs("div", { className: "card-body", children: [_jsx("div", { children: _jsxs("div", { children: [_jsx("h3", { className: "card-title", children: "\u6211\u7684\u5DE5\u5355" }), _jsx("p", { className: "text-sm text-base-content/60", children: "\u67E5\u770B\u72B6\u6001\u3001\u6700\u65B0\u6D88\u606F\u548C\u56DE\u590D\u8FDB\u5C55\u3002" })] }) }), errorMessage && (_jsx("div", { role: "alert", className: "workspace-alert alert alert-error text-sm", children: _jsx("span", { children: errorMessage }) })), isLoading && _jsx("div", { className: "flex justify-center py-10", children: _jsx("span", { className: "loading loading-spinner loading-md" }) }), !isLoading && tickets.length === 0 && !errorMessage && (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500", children: "\u8FD8\u6CA1\u6709\u5DE5\u5355\uFF0C\u70B9\u51FB\u53F3\u4E0A\u89D2\u6309\u94AE\u5373\u53EF\u53D1\u8D77\u5DE5\u5355\u3002" })), _jsx("div", { className: "space-y-4", children: tickets.map((ticket) => (_jsx("div", { role: "button", tabIndex: 0, className: "workspace-card-soft w-full cursor-pointer p-5 text-left transition hover:border-[#6d6bf4]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#6d6bf4]/20", onClick: () => navigate(`/app/tickets/${ticket.id}`), onKeyDown: (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        navigate(`/app/tickets/${ticket.id}`);
                                    }
                                }, children: _jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h4", { className: "font-semibold text-lg", children: ticket.subject }), _jsx("span", { className: `badge badge-sm ${statusMeta[ticket.status].badgeClass}`, children: statusMeta[ticket.status].label }), _jsxs("span", { className: "badge badge-ghost badge-sm", children: [ticket.messageCount ?? 0, " \u6761\u6D88\u606F"] })] }), _jsxs("div", { className: "text-sm text-base-content/60", children: ["\u5DE5\u5355 #", ticket.id, " \u00B7 ", categoryLabel[ticket.category] ?? ticket.category] }), _jsx("div", { className: "rounded-xl bg-slate-100/80 px-4 py-3 text-sm text-slate-700", children: ticket.lastMessage?.content ?? "暂无消息" })] }), _jsxs("div", { className: "text-sm text-base-content/50 md:text-right", children: [_jsxs("div", { children: ["\u63D0\u4EA4\u65F6\u95F4\uFF1A", ticket.createdAtLabel] }), _jsxs("div", { children: ["\u6700\u540E\u66F4\u65B0\uFF1A", ticket.updatedAtLabel] })] })] }) }, ticket.id))) })] }) }), isCreateOpen && (_jsxs("div", { className: "modal modal-open bg-transparent backdrop-blur-sm", children: [_jsxs("div", { className: "modal-box workspace-card max-w-2xl border-0 bg-white/95", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold", children: "\u53D1\u8D77\u5DE5\u5355" }), _jsx("p", { className: "mt-1 text-sm text-base-content/60", children: "\u5C3D\u91CF\u63CF\u8FF0\u6E05\u695A\u95EE\u9898\u573A\u666F\u3001\u62A5\u9519\u5185\u5BB9\u548C\u590D\u73B0\u6B65\u9AA4\u3002" })] }), _jsx("button", { type: "button", className: "landing-button-secondary btn btn-sm btn-circle min-h-0 !h-10 !w-10 !rounded-full !p-0", onClick: () => setIsCreateOpen(false), disabled: createTicket.isPending, children: "\u2715" })] }), _jsxs("form", { className: "mt-6 space-y-4", onSubmit: onSubmit, children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5DE5\u5355\u6807\u9898" }), _jsx("input", { type: "text", className: "workspace-input input input-bordered", value: subject, onChange: (e) => setSubject(e.target.value), maxLength: 120, placeholder: "\u4F8B\u5982\uFF1A\u6784\u5EFA\u5B8C\u6210\u540E\u524D\u7AEF\u57DF\u540D\u65E0\u6CD5\u8BBF\u95EE", required: true })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u95EE\u9898\u5206\u7C7B" }), _jsxs("select", { className: "workspace-select select select-bordered", value: category, onChange: (e) => setCategory(e.target.value), required: true, children: [_jsx("option", { value: "", disabled: true, children: "\u8BF7\u9009\u62E9\u95EE\u9898\u5206\u7C7B" }), categoryOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u95EE\u9898\u63CF\u8FF0" }), _jsx("textarea", { className: "workspace-textarea textarea textarea-bordered min-h-40", value: content, onChange: (e) => setContent(e.target.value), maxLength: 5000, placeholder: "\u8BF7\u586B\u5199\u95EE\u9898\u73B0\u8C61\u3001\u76F8\u5173\u914D\u7F6E\u3001\u64CD\u4F5C\u6B65\u9AA4\u3001\u671F\u671B\u7ED3\u679C\u7B49\u4FE1\u606F", required: true }), _jsxs("span", { className: "label-text-alt text-base-content/50", children: [content.length, "/5000"] })] }), createError && (_jsx("div", { role: "alert", className: "workspace-alert alert alert-error text-sm", children: _jsx("span", { children: createError }) })), _jsxs("div", { className: "modal-action mt-6", children: [_jsx("button", { type: "button", className: "landing-button-secondary rounded-2xl px-5 py-3 text-base", onClick: () => setIsCreateOpen(false), disabled: createTicket.isPending, children: "\u53D6\u6D88" }), _jsx("button", { className: "landing-button-primary min-w-[120px] rounded-2xl px-6 py-3 text-base", type: "submit", disabled: createTicket.isPending, children: createTicket.isPending ? "提交中..." : "提交工单" })] })] })] }), _jsx("button", { type: "button", className: "modal-backdrop bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent", onClick: () => !createTicket.isPending && setIsCreateOpen(false), "aria-label": "\u5173\u95ED" })] }))] }));
};
export default TicketSupportPage;
