import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import LandingLayout from "./layouts/LandingLayout";
import AdminLayout from "./layouts/AdminLayout";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import HomePage from "./pages/app/HomePage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminHomePage from "./pages/admin/HomePage";
import TemplateManagePage from "./pages/admin/TemplateManagePage";
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import BuildRecordsPage from "./pages/admin/BuildRecordsPage";
import TemplateBuildPage from "./pages/app/TemplateBuildPage";
import DownloadPages from "./pages/app/DownloadPages";
import DeployGuidePage from "./pages/app/DeployGuidePage";
import DeployGuideBffPage from "./pages/app/DeployGuideBffPage";
import DeployGuideSpaPage from "./pages/app/DeployGuideSpaPage";
import DeployGuidePrinciplePage from "./pages/app/DeployGuidePrinciplePage";
import UserSettingsPage from "./pages/app/UserSettingsPage";
import TicketSupportPage from "./pages/app/TicketSupportPage";
import TicketDetailPage from "./pages/app/TicketDetailPage";
import AdminUserDetailPage from "./pages/admin/UserDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import InitGate from "./components/InitGate";
import InitPage from "./pages/InitPage";
import AdminTicketsPage from "./pages/admin/TicketsPage";
import AdminTicketDetailPage from "./pages/admin/TicketDetailPage";
const App = () => {
  return _jsx(InitGate, {
    children: _jsxs(Routes, {
      children: [
        _jsx(Route, { path: "/init", element: _jsx(InitPage, {}) }),
        _jsx(Route, {
          element: _jsx(LandingLayout, {}),
          children: _jsx(Route, { index: true, element: _jsx(LandingPage, {}) }),
        }),
        _jsxs(Route, {
          path: "/auth",
          element: _jsx(AuthLayout, {}),
          children: [
            _jsx(Route, { index: true, element: _jsx(Navigate, { to: "/auth/login", replace: true }) }),
            _jsx(Route, { path: "login", element: _jsx(LoginPage, {}) }),
            _jsx(Route, { path: "register", element: _jsx(RegisterPage, {}) }),
            _jsx(Route, { path: "forgot", element: _jsx(ForgotPasswordPage, {}) }),
            _jsx(Route, { path: "reset", element: _jsx(ResetPasswordPage, {}) }),
          ],
        }),
        _jsxs(Route, {
          element: _jsx(ProtectedRoute, {}),
          children: [
            _jsxs(Route, {
              path: "/app",
              element: _jsx(AppLayout, {}),
              children: [
                _jsx(Route, { index: true, element: _jsx(HomePage, {}) }),
                _jsx(Route, { path: "home", element: _jsx(Navigate, { to: "/app", replace: true }) }),
                _jsx(Route, { path: "build", element: _jsx(TemplateBuildPage, {}) }),
                _jsx(Route, { path: "downloads", element: _jsx(DownloadPages, {}) }),
                _jsx(Route, { path: "deploy-guide", element: _jsx(DeployGuidePage, {}) }),
                _jsx(Route, { path: "deploy-guide/bff", element: _jsx(DeployGuideBffPage, {}) }),
                _jsx(Route, { path: "deploy-guide/spa", element: _jsx(DeployGuideSpaPage, {}) }),
                _jsx(Route, { path: "deploy-guide/principle", element: _jsx(DeployGuidePrinciplePage, {}) }),
                _jsx(Route, { path: "downloads/deploy-guide", element: _jsx(Navigate, { to: "/app/deploy-guide", replace: true }) }),
                _jsx(Route, { path: "downloads/deploy-guide/bff", element: _jsx(Navigate, { to: "/app/deploy-guide/bff", replace: true }) }),
                _jsx(Route, { path: "downloads/deploy-guide/spa", element: _jsx(Navigate, { to: "/app/deploy-guide/spa", replace: true }) }),
                _jsx(Route, { path: "settings", element: _jsx(UserSettingsPage, {}) }),
                _jsx(Route, { path: "tickets", element: _jsx(TicketSupportPage, {}) }),
                _jsx(Route, { path: "tickets/:id", element: _jsx(TicketDetailPage, {}) }),
              ],
            }),
            _jsxs(Route, {
              path: "/admin",
              element: _jsx(AdminLayout, {}),
              children: [
                _jsx(Route, { index: true, element: _jsx(AdminHomePage, {}) }),
                _jsx(Route, { path: "users", element: _jsx(AdminUsersPage, {}) }),
                _jsx(Route, { path: "users/:id", element: _jsx(AdminUserDetailPage, {}) }),
                _jsx(Route, { path: "templates", element: _jsx(TemplateManagePage, {}) }),
                _jsx(Route, { path: "settings", element: _jsx(SystemSettingsPage, {}) }),
                _jsx(Route, { path: "builds", element: _jsx(BuildRecordsPage, {}) }),
                _jsx(Route, { path: "tickets", element: _jsx(AdminTicketsPage, {}) }),
                _jsx(Route, { path: "tickets/:id", element: _jsx(AdminTicketDetailPage, {}) }),
              ],
            }),
          ],
        }),
        _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) }),
      ],
    }),
  });
};
export default App;
