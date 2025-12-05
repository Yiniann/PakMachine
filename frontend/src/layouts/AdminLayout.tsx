import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../components/useAuth";

const navLinks = [
  { to: "/admin", label: "首页" },
  { to: "/admin/users", label: "用户管理" },
];

const AdminLayout = () => {
  const { pathname } = useLocation();
  const { token, logout } = useAuth();
  const current =
    navLinks
      .slice()
      .sort((a, b) => b.to.length - a.to.length)
      .find((link) => pathname.startsWith(link.to)) || null;
  const title = current ? current.label : "管理员";
  return (
    <div data-theme="light" className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle sr-only" />
      <div className="drawer-content flex flex-col min-h-screen bg-base-200">
        <div className="navbar bg-base-100 shadow">
          <div className="navbar-start">
            <label htmlFor="admin-drawer" className="btn btn-ghost btn-square lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            <span className="text-lg font-semibold ml-2">{title}</span>
          </div>
          <div className="navbar-end gap-2 pr-4">
            <Link to="/app/home" className="btn btn-outline btn-sm">
              客户端
            </Link>
            {token && (
              <button onClick={logout} className="btn btn-error btn-sm text-white">
                退出
              </button>
            )}
          </div>
        </div>
        <main className="p-4 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side">
        <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu p-4 w-72 min-h-full bg-base-100 text-base-content">
          <li className="mb-2 px-2 text-xl font-bold">PacMachine</li>
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link className={pathname === link.to ? "active" : ""} to={link.to}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminLayout;
