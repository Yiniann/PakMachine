import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import api from "../../api/client";
const UserSettingsPage = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        if (newPassword !== confirm) {
            setError("两次输入的新密码不一致");
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post("/auth/change-password", { currentPassword, newPassword });
            setMessage(res.data?.message || "密码已更新");
            setCurrentPassword("");
            setNewPassword("");
            setConfirm("");
        }
        catch (err) {
            setError(err?.response?.data?.error || "修改失败");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Account" }), _jsx("h2", { className: "mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900", children: "\u8D26\u6237\u8BBE\u7F6E" }), _jsx("p", { className: "mt-2 text-lg leading-8 text-slate-500", children: "\u7BA1\u7406\u60A8\u7684\u4E2A\u4EBA\u8D26\u6237\u4FE1\u606F\u4E0E\u5B89\u5168\u8BBE\u7F6E\u3002" })] }), _jsx("div", { className: "workspace-card max-w-2xl", children: _jsxs("div", { className: "card-body", children: [_jsxs("div", { className: "mb-4 flex items-center gap-2 border-b border-slate-200 pb-3", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-6 h-6 text-primary", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" }) }), _jsx("h3", { className: "text-lg font-bold tracking-[-0.03em] text-slate-900", children: "\u4FEE\u6539\u5BC6\u7801" })] }), _jsxs("form", { className: "space-y-4", onSubmit: onSubmit, children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5F53\u524D\u5BC6\u7801" }), _jsx("input", { type: "password", className: "workspace-input input input-bordered", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), required: true, placeholder: "\u8BF7\u8F93\u5165\u5F53\u524D\u4F7F\u7528\u7684\u5BC6\u7801" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u65B0\u5BC6\u7801" }), _jsx("input", { type: "password", className: "workspace-input input input-bordered", value: newPassword, onChange: (e) => setNewPassword(e.target.value), required: true, minLength: 8, placeholder: "\u8BF7\u8F93\u5165\u65B0\u5BC6\u7801\uFF08\u81F3\u5C11 8 \u4F4D\uFF09" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u786E\u8BA4\u65B0\u5BC6\u7801" }), _jsx("input", { type: "password", className: "workspace-input input input-bordered", value: confirm, onChange: (e) => setConfirm(e.target.value), required: true, placeholder: "\u8BF7\u518D\u6B21\u8F93\u5165\u65B0\u5BC6\u7801" })] }), message && (_jsxs("div", { role: "alert", className: "workspace-alert alert alert-success bg-success/10 text-success-content border-success/20 text-sm", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: message })] })), error && (_jsxs("div", { role: "alert", className: "workspace-alert alert alert-error bg-error/10 text-error-content border-error/20 text-sm", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: error })] })), _jsx("div", { className: "flex justify-end pt-2", children: _jsx("button", { className: "btn btn-primary min-w-[120px] shadow-lg shadow-primary/30", type: "submit", disabled: submitting, children: submitting ? "提交中..." : "保存" }) })] })] }) })] }));
};
export default UserSettingsPage;
