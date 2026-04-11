import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../features/auth/mutations";
import { useAuth } from "../../components/useAuth";
const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    // 登录后统一跳到应用首页
    const from = "/app";
    const mutation = useLoginMutation();
    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        mutation.mutate({ email, password }, {
            onSuccess: (data) => {
                login(data.token, data.user?.role, data.user?.email, data.user?.userType);
                localStorage.setItem("user_role", data.user?.role || "");
                localStorage.setItem("user_email", data.user?.email || "");
                if (data.user?.userType) {
                    localStorage.setItem("user_type", data.user.userType);
                }
                else {
                    localStorage.removeItem("user_type");
                }
                setMessage("Logged in");
                navigate(from, { replace: true });
            },
            onError: (err) => {
                setMessage(err?.response?.data?.error || "Login failed");
            },
        });
    };
    return (_jsx("div", { className: "mx-auto w-full max-w-xl", children: _jsxs("section", { className: "rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9", children: [_jsxs("div", { className: "max-w-xl", children: [_jsx("p", { className: "text-sm font-bold uppercase tracking-[0.24em] text-[#6d6bf4]", children: "Account Access" }), _jsx("h1", { className: "mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u767B\u5F55" })] }), _jsxs("form", { onSubmit: onSubmit, className: "mt-8 space-y-5", children: [_jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u90AE\u7BB1" }), _jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), placeholder: "\u8F93\u5165\u6CE8\u518C\u90AE\u7BB1", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10" })] }), _jsxs("label", { className: "block space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u8F93\u5165\u767B\u5F55\u5BC6\u7801", className: "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6d6bf4] focus:bg-white focus:ring-4 focus:ring-[#6d6bf4]/10" })] }), _jsx("button", { type: "submit", className: "landing-button-primary w-full rounded-2xl px-6 py-4 text-base", disabled: mutation.status === "pending", children: mutation.status === "pending" ? "登录中..." : "登录" })] }), _jsxs("div", { className: "mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between", children: [_jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/forgot", children: "\u5FD8\u8BB0\u5BC6\u7801\uFF1F" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: "\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F" }), _jsx(Link, { className: "font-medium text-[#6d6bf4] transition hover:text-[#5e5ce6]", to: "/auth/register", children: "\u7ACB\u523B\u6CE8\u518C" })] })] }), message ? (_jsx("div", { className: "mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600", children: message })) : null] }) }));
};
export default LoginPage;
