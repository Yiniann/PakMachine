import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useCreateGithubTemplate, useDeleteGithubTemplate } from "../../features/builds/mutations";
import { useGithubTemplates } from "../../features/builds/queries";
const TemplateManagePage = () => {
    const [ghName, setGhName] = useState("");
    const [ghRepo, setGhRepo] = useState("");
    const [ghBranch, setGhBranch] = useState("main");
    const [ghWorkdir, setGhWorkdir] = useState("");
    const [ghDescription, setGhDescription] = useState("");
    const [ghMessage, setGhMessage] = useState(null);
    const [ghError, setGhError] = useState(null);
    const createGithubTemplate = useCreateGithubTemplate();
    const deleteGithubTemplate = useDeleteGithubTemplate();
    const githubTemplates = useGithubTemplates();
    const onSubmitGithub = (e) => {
        e.preventDefault();
        setGhMessage(null);
        setGhError(null);
        const payload = {
            name: ghName.trim(),
            repo: ghRepo.trim(),
            branch: ghBranch.trim() || "main",
            workdir: ghWorkdir.trim(),
            description: ghDescription.trim(),
        };
        if (!payload.name || !payload.repo) {
            setGhError("名称和仓库地址不能为空");
            return;
        }
        createGithubTemplate.mutate(payload, {
            onSuccess: () => {
                setGhMessage("已添加 GitHub 模板");
                setGhName("");
                setGhRepo("");
                setGhBranch("main");
                setGhWorkdir("");
                setGhDescription("");
                githubTemplates.refetch();
            },
            onError: (err) => setGhError(err?.response?.data?.error || "添加失败，请稍后再试"),
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Templates" }), _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900", children: "\u6A21\u677F\u7BA1\u7406" }), _jsx("p", { className: "mt-2 text-[15px] text-slate-500", children: "\u914D\u7F6E GitHub \u79C1\u6709\u4ED3\u5E93\u4F5C\u4E3A\u6784\u5EFA\u6A21\u677F\u3002" })] }), _jsx("div", { className: "workspace-card p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "\u6DFB\u52A0\u65B0\u6A21\u677F" }), _jsxs("form", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", onSubmit: onSubmitGithub, children: [_jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u6A21\u677F\u540D\u79F0*" }), _jsx("input", { className: "workspace-input input input-bordered", value: ghName, onChange: (e) => setGhName(e.target.value), placeholder: "\u793A\u4F8B\uFF1Adashboard-template" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u4ED3\u5E93\uFF08owner/repo\uFF09*" }), _jsx("input", { className: "workspace-input input input-bordered", value: ghRepo, onChange: (e) => setGhRepo(e.target.value), placeholder: "org/project" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5206\u652F/Tag" }), _jsx("input", { className: "workspace-input input input-bordered", value: ghBranch, onChange: (e) => setGhBranch(e.target.value), placeholder: "main" })] }), _jsxs("label", { className: "form-control", children: [_jsx("span", { className: "label-text", children: "\u5B50\u76EE\u5F55\uFF08\u53EF\u9009\uFF09" }), _jsx("input", { className: "workspace-input input input-bordered", value: ghWorkdir, onChange: (e) => setGhWorkdir(e.target.value), placeholder: "packages/webapp" })] }), _jsxs("label", { className: "form-control md:col-span-2", children: [_jsx("span", { className: "label-text", children: "\u63CF\u8FF0\uFF08\u53EF\u9009\uFF09" }), _jsx("textarea", { className: "workspace-textarea textarea textarea-bordered", rows: 2, value: ghDescription, onChange: (e) => setGhDescription(e.target.value), placeholder: "\u7528\u4E00\u53E5\u8BDD\u4ECB\u7ECD\u6A21\u677F" })] }), _jsxs("div", { className: "md:col-span-2 flex flex-wrap gap-2", children: [_jsx("button", { className: "landing-button-primary rounded-2xl px-5 py-3 text-sm", type: "submit", disabled: createGithubTemplate.status === "pending", children: createGithubTemplate.status === "pending" ? "提交中..." : "添加 GitHub 模板" }), ghMessage && _jsx("span", { className: "text-success", children: ghMessage }), ghError && _jsx("span", { className: "text-error", children: ghError })] })] }), _jsx("div", { className: "divider my-4" }), _jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "\u6A21\u677F\u5217\u8868" }), githubTemplates.isLoading && _jsx("div", { className: "flex justify-center", children: _jsx("span", { className: "loading loading-spinner" }) }), githubTemplates.error && _jsx("div", { role: "alert", className: "workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700", children: _jsx("span", { children: "\u52A0\u8F7D\u5931\u8D25" }) }), !githubTemplates.isLoading && githubTemplates.data && githubTemplates.data.length === 0 && _jsx("p", { children: "\u6682\u65E0 GitHub \u6A21\u677F" }), !githubTemplates.isLoading && githubTemplates.data && githubTemplates.data.length > 0 && (_jsx("div", { className: "workspace-table-shell overflow-x-auto", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u540D\u79F0" }), _jsx("th", { children: "\u4ED3\u5E93" }), _jsx("th", { children: "\u5206\u652F" }), _jsx("th", { children: "\u5B50\u76EE\u5F55" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { children: "\u521B\u5EFA\u65F6\u95F4" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: githubTemplates.data.map((item) => (_jsxs("tr", { children: [_jsx("td", { className: "whitespace-pre-wrap break-all font-semibold", children: item.name }), _jsx("td", { className: "whitespace-pre-wrap break-all text-sm text-base-content/80", children: item.repo }), _jsx("td", { className: "text-sm", children: item.branch || "main" }), _jsx("td", { className: "text-sm whitespace-pre-wrap break-all", children: item.workdir || "-" }), _jsx("td", { className: "max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80", children: item.description || "-" }), _jsx("td", { className: "text-sm", children: item.createdAt ? new Date(item.createdAt).toLocaleString() : "-" }), _jsx("td", { children: _jsx("button", { className: "rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white", disabled: deleteGithubTemplate.status === "pending", onClick: () => deleteGithubTemplate.mutate(item.name, {
                                                            onError: (err) => setGhError(err?.response?.data?.error || "删除失败"),
                                                            onSuccess: () => githubTemplates.refetch(),
                                                        }), children: "\u5220\u9664" }) })] }, item.name))) })] }) }))] }) })] }));
};
export default TemplateManagePage;
