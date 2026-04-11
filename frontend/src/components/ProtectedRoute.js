import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
const ProtectedRoute = () => {
    const { token } = useAuth();
    const location = useLocation();
    if (!token) {
        return _jsx(Navigate, { to: "/auth/login", replace: true, state: { from: location.pathname } });
    }
    return _jsx(Outlet, {});
};
export default ProtectedRoute;
