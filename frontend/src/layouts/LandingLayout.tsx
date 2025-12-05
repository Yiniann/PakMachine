import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../components/useAuth";

const LandingLayout = () => {
  const { token, logout } = useAuth();
  return (
    <div data-theme="light" className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl">
            PacMachine
          </Link>
        </div>
        <div className="navbar-end gap-2">
          {token && (
            <Link to="/app/home" className="btn btn-outline btn-sm">
              App
            </Link>
          )}
          {!token && (
            <>
              <Link to="/auth/login" className="btn btn-primary btn-sm">
                Login
              </Link>
              <Link to="/auth/register" className="btn btn-outline btn-sm">
                Register
              </Link>
            </>
          )}
          {token && (
            <button onClick={logout} className="btn btn-error btn-sm text-white">
              Logout
            </button>
          )}
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default LandingLayout;
