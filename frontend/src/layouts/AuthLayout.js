import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { usePublicSettings } from "../features/settings/publicSettings";
import BrandMark from "../components/BrandMark";
const AuthLayout = () => {
    const { token, logout } = useAuth();
    const publicSettings = usePublicSettings();
    const siteTitle = publicSettings.data?.siteName || "PacMachine";
    if (token) {
        return _jsx(Navigate, { to: "/app", replace: true });
    }
    return (_jsxs("div", { className: "landing-shell relative min-h-screen", children: [_jsx("div", { className: "landing-grid pointer-events-none absolute inset-0 opacity-40" }), _jsx("div", { className: "pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl" }), _jsx("header", { className: "sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl", children: _jsxs("div", { className: "mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d6bf4] text-white shadow-[0_12px_30px_rgba(109,107,244,0.26)]", children: _jsx(BrandMark, {}) }), _jsx("span", { className: "text-2xl font-bold tracking-[-0.03em] text-slate-900", children: siteTitle })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/", className: "min-h-0 rounded-2xl px-4 py-3 text-base font-medium text-slate-500 transition-colors hover:text-slate-900", children: "\u8FD4\u56DE\u9996\u9875" }), token ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/app", className: "landing-button-secondary min-h-0 rounded-2xl px-5 py-3 text-base", children: "\u5F00\u59CB\u6784\u5EFA" }), _jsx("button", { onClick: logout, className: "landing-button-primary min-h-0 rounded-2xl px-5 py-3 text-base", children: "\u9000\u51FA\u767B\u9646" })] })) : (_jsx(Link, { to: "/auth/register", className: "landing-button-primary min-h-0 rounded-2xl px-8 py-3 text-base", children: "\u6CE8\u518C" }))] })] }) }), _jsx("main", { className: "relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16", children: _jsx(Outlet, {}) })] }));
};
export default AuthLayout;
