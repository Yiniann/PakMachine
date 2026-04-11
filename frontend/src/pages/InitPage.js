import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useInitStatus, useInitializeSystem } from "../features/init/init";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
const InitPage = () => {
    const status = useInitStatus();
    const initMutation = useInitializeSystem();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [siteName, setSiteName] = useState("");
    const [allowRegister, setAllowRegister] = useState(true);
    const [message, setMessage] = useState(null);
    const onSubmit = (e) => {
        e.preventDefault();
        setMessage(null);
        initMutation.mutate({ email, password, siteName, allowRegister }, {
            onSuccess: (data) => {
                queryClient.setQueryData(["init-status"], { initialized: true });
                setMessage(data?.needRestart ? "数据库连接已保存，请重启后端后重新初始化" : "初始化完成，即将前往登录");
                const delay = data?.needRestart ? 0 : 800;
                if (!data?.needRestart) {
                    setTimeout(() => navigate("/auth/login", { replace: true }), delay);
                }
            },
            onError: (err) => setMessage(err?.response?.data?.error || "初始化失败，请检查后端日志"),
        });
    };
    if (status.isLoading) {
        return _jsx("div", { className: "p-6 text-center", children: "\u6B63\u5728\u68C0\u67E5\u7CFB\u7EDF\u72B6\u6001..." });
    }
    if (status.error) {
        return _jsx("div", { className: "p-6 text-center text-error", children: "\u68C0\u67E5\u7CFB\u7EDF\u72B6\u6001\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u540E\u7AEF\u5DF2\u542F\u52A8\u3002" });
    }
    if (status.data?.initialized) {
        return _jsx("div", { className: "p-6 text-center", children: "\u7CFB\u7EDF\u5DF2\u521D\u59CB\u5316\uFF0C\u8BF7\u524D\u5F80\u767B\u5F55\u3002" });
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-base-200", children: _jsx("div", { className: "card w-full max-w-lg bg-base-100 shadow-xl", children: _jsxs("div", { className: "card-body space-y-4", children: [_jsx("h1", { className: "card-title", children: "\u9996\u6B21\u521D\u59CB\u5316" }), _jsx("p", { className: "text-sm text-base-content/70", children: "\u521B\u5EFA\u9996\u4E2A\u7BA1\u7406\u5458\u8D26\u6237\u5E76\u8BBE\u7F6E\u57FA\u7840\u4FE1\u606F\u3002Docker \u90E8\u7F72\u4E0B\u6570\u636E\u5E93\u5DF2\u81EA\u52A8\u914D\u7F6E\uFF0C\u65E0\u9700\u624B\u52A8\u586B\u5199\u3002" }), _jsxs("form", { className: "space-y-3", onSubmit: onSubmit, children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u7BA1\u7406\u5458\u90AE\u7BB1*" }), _jsx("input", { className: "input input-bordered", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u7BA1\u7406\u5458\u5BC6\u7801*" }), _jsx("input", { className: "input input-bordered", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5E73\u53F0\u540D\u79F0\uFF08\u53EF\u9009\uFF09" }), _jsx("input", { className: "input input-bordered", value: siteName, onChange: (e) => setSiteName(e.target.value), placeholder: "\u7528\u4E8E\u7F51\u7AD9\u5C55\u793A\u7684\u6807\u9898\uFF0C\u4E0E\u7528\u6237\u6784\u5EFA\u7684\u7AD9\u70B9\u540D\u65E0\u5173" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5141\u8BB8\u6CE8\u518C" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "toggle", checked: allowRegister, onChange: (e) => setAllowRegister(e.target.checked) }), _jsx("span", { className: "text-sm text-base-content/70", children: allowRegister ? "允许" : "关闭" })] })] }), _jsx("button", { className: "btn btn-primary w-full", type: "submit", disabled: initMutation.status === "pending", children: initMutation.status === "pending" ? "提交中..." : "开始初始化" })] }), message && _jsx("p", { className: "text-center text-sm", children: message })] }) }) }));
};
export default InitPage;
