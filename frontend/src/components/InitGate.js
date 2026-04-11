import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useInitStatus } from "../features/init/init";
const InitGate = ({ children }) => {
    const location = useLocation();
    const status = useInitStatus();
    if (status.isLoading) {
        return (_jsx("div", { className: "modal modal-open", children: _jsx("div", { className: "modal-box text-center", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("span", { className: "loading loading-spinner loading-lg" }), _jsx("p", { className: "text-base-content/80", children: "\u6B63\u5728\u52A0\u8F7D\uFF0C\u8BF7\u7A0D\u5019..." })] }) }) }));
    }
    if (status.error) {
        return (_jsx("div", { className: "modal modal-open", children: _jsx("div", { className: "modal-box text-center", children: _jsx("p", { className: "text-error", children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" }) }) }));
    }
    const initialized = status.data?.initialized;
    const isInitPage = location.pathname === "/init";
    if (!initialized && !isInitPage) {
        return _jsx(Navigate, { to: "/init", replace: true });
    }
    if (initialized && isInitPage) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
export default InitGate;
