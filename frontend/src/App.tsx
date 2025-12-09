import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import LandingLayout from "./layouts/LandingLayout";
import AdminLayout from "./layouts/AdminLayout";
import LandingPage from "./pages/landing/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import HomePage from "./pages/app/HomePage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminHomePage from "./pages/admin/HomePage";
import TemplateManagePage from "./pages/admin/TemplateManagePage";
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import TemplateBuildPage from "./pages/app/TemplateBuildPage";
import TemplateDownloadsPage from "./pages/app/TemplateDownloadsPage";
import UserSettingsPage from "./pages/app/UserSettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import InitGate from "./components/InitGate";
import InitPage from "./pages/InitPage";

const App = () => {
  return (
    <InitGate>
      <Routes>
        <Route path="/init" element={<InitPage />} />
        <Route element={<LandingLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="/auth/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot" element={<ForgotPasswordPage />} />
          <Route path="reset" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="home" element={<Navigate to="/app" replace />} />
            <Route path="build" element={<TemplateBuildPage />} />
            <Route path="downloads" element={<TemplateDownloadsPage />} />
            <Route path="settings" element={<UserSettingsPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="templates" element={<TemplateManagePage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InitGate>
  );
};

export default App;
