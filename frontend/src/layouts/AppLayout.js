import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { usePublicSettings } from "../features/settings/publicSettings";
import BrandMark from "../components/BrandMark";
const navLinks = [
    { to: "/app", label: "主页" },
    { to: "/app/build", label: "前端构建" },
    { to: "/app/downloads", label: "构建下载" },
    { to: "/app/deploy-guide", label: "部署教程" },
    { to: "/app/tickets", label: "工单支持" },
    { to: "/app/settings", label: "用户设置" },
];
const AppLayout = () => {
    const { pathname } = useLocation();
    const { token, role, logout } = useAuth();
    const publicSettings = usePublicSettings();
    const siteTitle = publicSettings.data?.siteName || "PacMachine";
    const sortedNav = navLinks.slice().sort((a, b) => b.to.length - a.to.length);
    const current = sortedNav.find((link) => pathname === link.to || pathname.startsWith(`${link.to}/`)) || null;
    const activeTo = current?.to;
    const title = current ? current.label : "应用";
    const closeDrawer = () => {
        const drawer = document.getElementById("app-drawer");
        if (drawer)
            drawer.checked = false;
    };
    return (_jsxs("div", { "data-theme": "light", className: "landing-shell drawer lg:drawer-open", children: [_jsx("div", { className: "landing-grid pointer-events-none absolute inset-0 opacity-40" }), _jsx("div", { className: "pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl" }), _jsx("input", { id: "app-drawer", type: "checkbox", className: "drawer-toggle sr-only" }), _jsxs("div", { className: "drawer-content relative z-10 flex min-h-screen flex-col", children: [_jsx("header", { className: "sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl", children: _jsxs("div", { className: "mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "navbar-start flex items-center gap-3", children: [_jsx("label", { htmlFor: "app-drawer", className: "landing-button-secondary btn btn-square min-h-0 !h-11 !w-11 !rounded-2xl !p-0 lg:hidden", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsx("div", { className: "min-w-fit whitespace-nowrap rounded-full border border-slate-200/80 bg-white/72 px-5 py-2 text-sm font-semibold text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]", children: title })] }), _jsxs("div", { className: "navbar-end flex items-center gap-3", children: [role === "admin" && (_jsx(Link, { to: "/admin", className: "landing-button-secondary min-h-0 rounded-2xl px-4 py-3 text-sm sm:text-base", children: "\u7BA1\u7406\u7AEF" })), token && (_jsx("button", { onClick: logout, className: "landing-button-primary min-h-0 rounded-2xl px-4 py-3 text-sm sm:text-base", children: "\u9000\u51FA\u767B\u9646" }))] })] }) }), _jsx("main", { className: "relative z-10 mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:px-8 lg:py-8", children: _jsx(Outlet, {}) })] }), _jsxs("div", { className: "drawer-side z-40", children: [_jsx("label", { htmlFor: "app-drawer", "aria-label": "close sidebar", className: "drawer-overlay" }), _jsxs("aside", { className: "flex min-h-full w-[290px] flex-col border-r border-slate-200/80 bg-white/90 px-4 py-5 text-slate-700 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:w-[320px] lg:bg-white/72", children: [_jsxs(Link, { to: "/app", onClick: closeDrawer, className: "mb-5 flex items-center gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white/86 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]", children: [_jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d6bf4] text-white shadow-[0_12px_30px_rgba(109,107,244,0.24)]", children: _jsx(BrandMark, {}) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-lg font-bold tracking-[-0.03em] text-slate-900", children: siteTitle }), _jsx("div", { className: "text-xs font-medium uppercase tracking-[0.22em] text-slate-400", children: "Workspace" })] })] }), _jsx("nav", { className: "flex flex-1 flex-col gap-2", children: navLinks.map((link) => {
                                    const isActive = activeTo ? link.to === activeTo : pathname === link.to;
                                    return (_jsx(Link, { className: `flex items-center rounded-2xl px-4 py-3 text-[0.98rem] font-medium transition-all ${isActive
                                            ? "bg-[#6d6bf4] text-white shadow-[0_14px_32px_rgba(109,107,244,0.22)]"
                                            : "text-slate-500 hover:bg-white hover:text-slate-900"}`, to: link.to, onClick: closeDrawer, children: link.label }, link.to));
                                }) })] })] })] }));
};
export default AppLayout;
