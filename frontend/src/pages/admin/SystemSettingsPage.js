import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useSystemSettings, useUpdateSystemSettings } from "../../features/settings/systemSettings";
const SystemSettingsPage = () => {
    const settingsQuery = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();
    const [siteName, setSiteName] = useState("");
    const [allowRegister, setAllowRegister] = useState(true);
    const [actionDispatchToken, setActionDispatchToken] = useState("");
    const [actionWebhookSecret, setActionWebhookSecret] = useState("");
    const [workflowFile, setWorkflowFile] = useState("package.yml");
    const [message, setMessage] = useState(null);
    const [mailerHost, setMailerHost] = useState("");
    const [mailerPort, setMailerPort] = useState("");
    const [mailerSecure, setMailerSecure] = useState(false);
    const [mailerUser, setMailerUser] = useState("");
    const [mailerPass, setMailerPass] = useState("");
    const [mailerFrom, setMailerFrom] = useState("");
    const [passwordResetBaseUrl, setPasswordResetBaseUrl] = useState("");
    useEffect(() => {
        if (settingsQuery.data) {
            setSiteName(settingsQuery.data.siteName || "");
            setAllowRegister(settingsQuery.data.allowRegister ?? true);
            setActionDispatchToken(settingsQuery.data.actionDispatchToken || "");
            setActionWebhookSecret(settingsQuery.data.actionWebhookSecret || "");
            setWorkflowFile(settingsQuery.data.workflowFile || "package.yml");
            setMailerHost(settingsQuery.data.mailerHost || "");
            setMailerPort(settingsQuery.data.mailerPort ? String(settingsQuery.data.mailerPort) : "");
            setMailerSecure(Boolean(settingsQuery.data.mailerSecure));
            setMailerUser(settingsQuery.data.mailerUser || "");
            setMailerPass(settingsQuery.data.mailerPass || "");
            setMailerFrom(settingsQuery.data.mailerFrom || "");
            setPasswordResetBaseUrl(settingsQuery.data.passwordResetBaseUrl || "");
        }
    }, [settingsQuery.data]);
    const onSubmit = (e) => {
        e.preventDefault();
        setMessage(null);
        updateSettings.mutate({
            siteName,
            allowRegister,
            actionDispatchToken,
            actionWebhookSecret,
            workflowFile,
            mailerHost,
            mailerPort: mailerPort ? Number(mailerPort) : undefined,
            mailerSecure,
            mailerUser,
            mailerPass,
            mailerFrom,
            passwordResetBaseUrl,
        }, {
            onSuccess: () => setMessage("设置已保存"),
            onError: () => setMessage("保存失败"),
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "System Settings" }), _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u7CFB\u7EDF\u8BBE\u7F6E" }), _jsx("p", { className: "mt-2 text-[15px] text-slate-500", children: "\u914D\u7F6E\u5E73\u53F0\u53C2\u6570\u3001\u6784\u5EFA\u5BC6\u94A5\u53CA\u90AE\u4EF6\u670D\u52A1\u3002" })] }), _jsx("div", { className: "workspace-card p-6", children: _jsxs("div", { children: [settingsQuery.isLoading && _jsx("div", { className: "flex justify-center", children: _jsx("span", { className: "loading loading-spinner" }) }), settingsQuery.error && _jsx("div", { role: "alert", className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700", children: _jsx("span", { children: "\u52A0\u8F7D\u5931\u8D25" }) }), !settingsQuery.isLoading && (_jsxs("form", { className: "space-y-5", onSubmit: onSubmit, children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5E73\u53F0\u540D\u79F0\uFF08\u7528\u4E8E\u5C55\u793A\uFF0C\u4E0E\u7528\u6237\u6784\u5EFA\u7AD9\u70B9\u540D\u65E0\u5173\uFF09" }), _jsx("input", { className: "workspace-input input input-bordered", value: siteName, onChange: (e) => setSiteName(e.target.value), placeholder: "\u7528\u4E8E\u5C55\u793A\u7684\u7AD9\u70B9\u540D\u79F0" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u6CE8\u518C\u5F00\u653E" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "toggle", checked: allowRegister, onChange: (e) => setAllowRegister(e.target.checked) }), _jsx("span", { className: "text-sm text-base-content/70", children: allowRegister ? "允许注册" : "关闭注册" })] })] }), _jsx("div", { className: "divider", children: "GitHub Actions" }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "Dispatch Token\uFF08ACTION_DISPATCH_TOKEN\uFF09" }), _jsx("input", { type: "password", className: "workspace-input input input-bordered", value: actionDispatchToken, onChange: (e) => setActionDispatchToken(e.target.value), placeholder: "PAT\uFF0C\u6700\u5C0F workflow/repo \u6743\u9650" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "Webhook Secret\uFF08ACTION_WEBHOOK_SECRET\uFF09" }), _jsx("input", { type: "password", className: "workspace-input input input-bordered", value: actionWebhookSecret, onChange: (e) => setActionWebhookSecret(e.target.value), placeholder: "\u7528\u4E8E\u6821\u9A8C\u56DE\u8C03\u7B7E\u540D" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "Workflow \u6587\u4EF6\u540D" }), _jsx("input", { className: "workspace-input input input-bordered", value: workflowFile, onChange: (e) => setWorkflowFile(e.target.value || "package.yml"), placeholder: "\u5982 package.yml / build.yml" })] }), _jsx("div", { className: "divider", children: "\u90AE\u4EF6\u670D\u52A1" }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "SMTP Host" }), _jsx("input", { className: "workspace-input input input-bordered", value: mailerHost, onChange: (e) => setMailerHost(e.target.value), placeholder: "smtp.example.com" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "SMTP Port" }), _jsx("input", { className: "workspace-input input input-bordered", type: "number", min: 1, value: mailerPort, onChange: (e) => setMailerPort(e.target.value), placeholder: "465 / 587" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u52A0\u5BC6 (TLS/SSL)" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "toggle", checked: mailerSecure, onChange: (e) => setMailerSecure(e.target.checked) }), _jsx("span", { className: "text-sm text-base-content/70", children: mailerSecure ? "启用" : "关闭" })] })] })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "SMTP \u7528\u6237\u540D" }), _jsx("input", { className: "workspace-input input input-bordered", value: mailerUser, onChange: (e) => setMailerUser(e.target.value), placeholder: "\u53EF\u4E3A\u7A7A\uFF0C\u53D6\u51B3\u4E8E\u670D\u52A1\u5546" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "SMTP \u5BC6\u7801/\u5BC6\u94A5" }), _jsx("input", { type: "password", className: "workspace-input input input-bordered", value: mailerPass, onChange: (e) => setMailerPass(e.target.value), placeholder: "\u4E0D\u4F1A\u81EA\u52A8\u9690\u85CF\uFF0C\u8BF7\u59A5\u5584\u4FDD\u5B58\u6587\u4EF6\u6743\u9650" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u53D1\u4EF6\u4EBA\uFF08From\uFF09" }), _jsx("input", { className: "workspace-input input input-bordered", value: mailerFrom, onChange: (e) => setMailerFrom(e.target.value), placeholder: "PacMachine <noreply@example.com>" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u91CD\u7F6E\u94FE\u63A5\u57FA\u7840\u5730\u5740" }), _jsx("input", { className: "workspace-input input input-bordered", value: passwordResetBaseUrl, onChange: (e) => setPasswordResetBaseUrl(e.target.value), placeholder: "https://your-frontend.com/auth/reset" }), _jsx("span", { className: "text-xs text-base-content/60", children: "\u7528\u4E8E\u90AE\u4EF6\u4E2D\u7684\u91CD\u7F6E\u94FE\u63A5\uFF0C\u7559\u7A7A\u5219\u4F7F\u7528\u9ED8\u8BA4\u6216\u73AF\u5883\u53D8\u91CF PASSWORD_RESET_BASE_URL\u3002" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", type: "submit", disabled: updateSettings.status === "pending", children: updateSettings.status === "pending" ? "保存中..." : "保存设置" }), message && _jsx("span", { className: "text-sm text-base-content/70", children: message })] })] }))] }) })] }));
};
export default SystemSettingsPage;
