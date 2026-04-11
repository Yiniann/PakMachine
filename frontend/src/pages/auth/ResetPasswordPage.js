import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../features/auth/mutations";
const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState(null);
    const mutation = useResetPasswordMutation();
    const navigate = useNavigate();
    useEffect(() => {
        const t = searchParams.get("token");
        if (t)
            setToken(t);
    }, [searchParams]);
    const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;
    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
    const canSubmit = useMemo(() => Boolean(token?.trim()) && newPassword.length >= 8 && newPassword === confirmPassword, [token, newPassword, confirmPassword]);
    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (!token.trim()) {
            setMessage("缺少 token，请从邮件链接进入或重新申请重置");
            return;
        }
        if (!canSubmit) {
            setMessage("请检查密码长度和确认密码是否一致");
            return;
        }
        mutation.mutate({ token, newPassword }, {
            onSuccess: (data) => {
                setMessage(data.message || "密码已更新，正在跳转登录页");
                setTimeout(() => navigate("/auth/login"), 800);
            },
            onError: (err) => setMessage(err?.response?.data?.error || "重置失败，请稍后再试"),
        });
    };
    return (_jsx("div", { className: "mx-auto w-full max-w-xl", children: _jsxs("section", { className: "rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9", children: [_jsxs("div", { className: "max-w-xl", children: [_jsx("p", { className: "text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]", children: "Account Recovery" }), _jsx("h1", { className: "mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u91CD\u7F6E\u5BC6\u7801" })] }), _jsxs("form", { onSubmit: onSubmit, className: "mt-8 space-y-5", children: [_jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u91CD\u7F6E\u4EE4\u724C" }), _jsx("input", { value: token, onChange: (e) => setToken(e.target.value), placeholder: "\u8F93\u5165\u91CD\u7F6E\u4EE4\u724C", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10", required: true })] }), _jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u65B0\u5BC6\u7801" }), _jsx("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "\u65B0\u5BC6\u7801\uFF08\u81F3\u5C11 8 \u4F4D\uFF09", className: `w-full rounded-2xl border bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10 ${passwordTooShort ? "border-red-300" : "border-slate-200"}`, required: true, minLength: 8 })] }), _jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u786E\u8BA4\u65B0\u5BC6\u7801" }), _jsx("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u518D\u6B21\u8F93\u5165\u65B0\u5BC6\u7801", className: `w-full rounded-2xl border bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:ring-4 focus:ring-[#6d6bf4]/10 ${mismatch ? "border-red-300" : "border-slate-200"}`, required: true, minLength: 8 })] }), _jsx("button", { type: "submit", className: "landing-button-primary w-full rounded-2xl px-6 py-4 text-base", disabled: !canSubmit || mutation.status === "pending", children: mutation.status === "pending" ? "重置中..." : "重置密码" })] }), _jsxs("div", { className: "mt-6 space-y-2", children: [passwordTooShort ? _jsx("p", { className: "text-sm text-red-500", children: "\u5BC6\u7801\u81F3\u5C11 8 \u4F4D" }) : null, mismatch ? _jsx("p", { className: "text-sm text-red-500", children: "\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4" }) : null, message ? (_jsx("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: message })) : null] }), _jsxs("div", { className: "mt-6 flex items-center justify-between text-sm text-slate-500", children: [_jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/forgot", children: "\u91CD\u65B0\u83B7\u53D6\u94FE\u63A5" }), _jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/login", children: "\u8FD4\u56DE\u767B\u5F55" })] })] }) }));
};
export default ResetPasswordPage;
