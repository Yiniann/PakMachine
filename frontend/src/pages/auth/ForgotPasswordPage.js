import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../features/auth/mutations";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState(null);
    const [requestSucceeded, setRequestSucceeded] = useState(false);
    const forgotMutation = useForgotPasswordMutation();
    const canSubmitRequest = useMemo(() => emailRegex.test(email), [email]);
    const onSubmitRequest = async (e) => {
        e.preventDefault();
        setForgotMessage(null);
        setRequestSucceeded(false);
        forgotMutation.mutate({ email }, {
            onSuccess: () => {
                setRequestSucceeded(true);
                setForgotMessage("请求已提交，请前往邮箱查看重置链接。");
            },
            onError: (err) => {
                setRequestSucceeded(false);
                setForgotMessage(err?.response?.data?.error || "请求失败，请稍后再试");
            },
        });
    };
    return (_jsx("div", { className: "mx-auto w-full max-w-xl", children: _jsxs("section", { className: "rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9", children: [_jsxs("div", { className: "max-w-xl", children: [_jsx("p", { className: "text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]", children: "Account Recovery" }), _jsx("h1", { className: "mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u627E\u56DE\u5BC6\u7801" })] }), _jsxs("form", { onSubmit: onSubmitRequest, className: "mt-8 space-y-5", children: [_jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u90AE\u7BB1" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "\u8F93\u5165\u6CE8\u518C\u90AE\u7BB1", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10", type: "email", required: true })] }), _jsx("button", { type: "submit", className: "landing-button-primary w-full rounded-2xl px-6 py-4 text-base", disabled: !canSubmitRequest || forgotMutation.status === "pending", children: forgotMutation.status === "pending" ? "发送中..." : "发送重置链接" })] }), forgotMessage ? (_jsx("div", { className: "mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: forgotMessage })) : null, requestSucceeded ? null : (_jsxs("div", { className: "mt-6 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("p", { children: "\u4E0B\u4E00\u6B65\u8BF7\u901A\u8FC7\u90AE\u4EF6\u94FE\u63A5\u6216\u91CD\u7F6E\u4EE4\u724C\u524D\u5F80\u91CD\u7F6E\u5BC6\u7801\u9875\u9762\u3002" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/reset", children: "\u53BB\u91CD\u7F6E\u5BC6\u7801" }), _jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/login", children: "\u8FD4\u56DE\u767B\u5F55" })] })] }))] }) }));
};
export default ForgotPasswordPage;
