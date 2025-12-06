import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../components/useAuth";

const AuthLayout = () => {
  const { token, logout } = useAuth();
  return (
    <div data-theme="light" className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl">
            PacMachine Auth
          </Link>
        </div>
        <div className="navbar-end gap-2">
          <Link to="/" className="btn btn-outline btn-sm">
            首页
          </Link>
          {token && (
            <Link to="/app" className="btn btn-outline btn-sm">
              应用
            </Link>
          )}
          {token ? (
            <button onClick={logout} className="btn btn-error btn-sm text-white">
              退出
            </button>
          ) : null}
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
