import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useArtifacts } from "../../features/builds/artifacts";
import api from "../../api/client";
const DownloadPages = () => {
    const artifacts = useArtifacts(2);
    const [downloadingId, setDownloadingId] = useState(null);
    const onDownload = async (item) => {
        try {
            setDownloadingId(item.id);
            const res = await api.get(`/build/download/${item.id}`, { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = item.sourceFilename;
            a.click();
            window.URL.revokeObjectURL(blobUrl);
        }
        catch (err) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.error ||
                (status === 401
                    ? "请先登录后再下载"
                    : status === 403
                        ? "无权下载此文件"
                        : status === 404
                            ? "文件不存在或已被清理"
                            : "下载失败，请稍后再试");
            alert(msg);
        }
        finally {
            setDownloadingId((current) => (current === item.id ? null : current));
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("p", { className: "workspace-kicker", children: "Downloads" }), _jsx("h2", { className: "mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900", children: "\u4EA7\u7269\u4E0B\u8F7D" }), _jsx("p", { className: "mt-2 text-lg leading-8 text-slate-500", children: "\u67E5\u770B\u5E76\u4E0B\u8F7D\u60A8\u751F\u6210\u7684\u7AD9\u70B9\u524D\u7AEF\u4EA7\u7269\uFF0C\u4EC5\u4FDD\u7559\u6700\u65B0\u4E24\u6B21\u6784\u5EFA\u8BB0\u5F55\u3002" })] }), _jsx("div", { className: "workspace-card-soft", children: _jsxs("div", { className: "card-body flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "\u90E8\u7F72\u6559\u7A0B" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "\u4E0B\u8F7D\u5B8C\u6210\u540E\uFF0C\u53EF\u6309\u6559\u7A0B\u5FEB\u901F\u5B8C\u6210 SPA \u6216 BFF \u90E8\u7F72\u3002" })] }), _jsx(Link, { to: "/app/deploy-guide", className: "landing-button-secondary rounded-2xl px-5 py-3 text-base", children: "\u67E5\u770B\u90E8\u7F72\u6559\u7A0B" })] }) }), _jsx("div", { className: "workspace-card", children: _jsxs("div", { className: "card-body", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsx("h3", { className: "text-xl font-bold tracking-[-0.03em] text-slate-900", children: "\u5386\u53F2\u8BB0\u5F55" }) }), artifacts.isLoading && (_jsx("div", { className: "flex justify-center py-12", children: _jsx("span", { className: "loading loading-spinner loading-lg text-primary" }) })), artifacts.error && (_jsxs("div", { role: "alert", className: "workspace-alert alert alert-error", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" })] })), !artifacts.isLoading && artifacts.data && artifacts.data.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-base-content/50", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-16 h-16 mb-4 opacity-20", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" }) }), _jsx("p", { children: "\u6682\u65E0\u6784\u5EFA\u8BB0\u5F55" })] })), !artifacts.isLoading && artifacts.data && artifacts.data.length > 0 && (_jsx("div", { className: "workspace-table-shell overflow-x-auto", children: _jsxs("table", { className: "table table-zebra", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "w-20", children: "ID" }), _jsx("th", { children: "\u6A21\u677F\u6587\u4EF6" }), _jsx("th", { children: "\u6784\u5EFA\u65F6\u95F4" }), _jsx("th", { className: "w-24 text-right", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: artifacts.data.map((item) => (_jsxs("tr", { className: "hover", children: [_jsxs("td", { className: "font-mono text-xs opacity-70", children: ["#", item.id] }), _jsx("td", { className: "font-medium whitespace-pre-wrap break-all", children: item.sourceFilename }), _jsx("td", { className: "text-sm text-base-content/70", children: new Date(item.createdAt).toLocaleString() }), _jsx("td", { className: "text-right", children: _jsx("button", { className: "landing-button-primary btn btn-sm min-h-0 gap-2 rounded-full px-4 py-2 shadow-sm transition hover:shadow", onClick: () => onDownload(item), disabled: downloadingId === item.id, children: downloadingId === item.id ? (_jsx("span", { className: "loading loading-spinner loading-xs" })) : (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-4 h-4", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" }) })) }) })] }, item.id))) })] }) }))] }) })] }));
};
export default DownloadPages;
