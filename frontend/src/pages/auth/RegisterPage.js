import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRegisterMutation, useSendRegisterCodeMutation } from "../../features/auth/mutations";
const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [message, setMessage] = useState(null);
    const mutation = useRegisterMutation();
    const sendCodeMutation = useSendRegisterCodeMutation();
    useEffect(() => {
        if (cooldown <= 0)
            return;
        const timer = setTimeout(() => setCooldown((sec) => Math.max(sec - 1, 0)), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);
    const onSendCode = () => {
        setMessage(null);
        if (!email) {
            setMessage("请先填写邮箱");
            return;
        }
        sendCodeMutation.mutate({ email }, {
            onSuccess: (data) => {
                setCooldown(60);
                if (data?.emailSent) {
                    setMessage("验证码已发送，请查收邮箱");
                }
                else if (data?.code) {
                    setMessage(`验证码已生成（当前环境调试用）：${data.code}`);
                }
                else if (data?.reason === "not_configured") {
                    setMessage("邮件服务未配置，无法发送验证码");
                }
                else {
                    setMessage("验证码已生成");
                }
            },
            onError: (err) => setMessage(err?.response?.data?.error || "发送验证码失败"),
        });
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (!code) {
            setMessage("请先输入邮箱验证码");
            return;
        }
        mutation.mutate({ email, password, code }, {
            onSuccess: () => setMessage("注册成功"),
            onError: (err) => setMessage(err?.response?.data?.error || "注册失败"),
        });
    };
    return (_jsx("div", { className: "mx-auto w-full max-w-xl", children: _jsxs("section", { className: "rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9", children: [_jsxs("div", { className: "max-w-xl", children: [_jsx("p", { className: "text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]", children: "Account Access" }), _jsx("h1", { className: "mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u6CE8\u518C" })] }), _jsxs("form", { onSubmit: onSubmit, className: "mt-8 space-y-5", children: [_jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u90AE\u7BB1" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "\u8F93\u5165\u6CE8\u518C\u90AE\u7BB1", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10" })] }), _jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u8BBE\u7F6E\u767B\u5F55\u5BC6\u7801", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u9A8C\u8BC1\u7801" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("input", { value: code, onChange: (e) => setCode(e.target.value), placeholder: "\u8F93\u5165\u90AE\u7BB1\u9A8C\u8BC1\u7801", className: "flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10" }), _jsx("button", { type: "button", className: "rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-[#6d6bf4]/30 hover:text-[#5e5ce6]", onClick: onSendCode, disabled: sendCodeMutation.status === "pending" || cooldown > 0, children: sendCodeMutation.status === "pending"
                                                ? "发送中..."
                                                : cooldown > 0
                                                    ? `重新发送 (${cooldown}s)`
                                                    : "发送验证码" })] })] }), _jsx("button", { type: "submit", className: "landing-button-primary w-full rounded-2xl px-6 py-4 text-base", disabled: mutation.status === "pending", children: mutation.status === "pending" ? "注册中..." : "注册" })] }), _jsxs("div", { className: "mt-6 flex items-center justify-center gap-2 text-sm text-slate-500", children: [_jsx("span", { children: "\u5DF2\u6709\u8D26\u53F7\uFF1F" }), _jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/login", children: "\u7ACB\u523B\u767B\u5F55" })] }), message ? (_jsx("div", { className: "mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: message })) : null] }) }));
};
export default RegisterPage;
