import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { usePublicSettings } from "../features/settings/publicSettings";
import BrandMark from "../components/BrandMark";

const navLinks = [
  { to: "/admin", label: "首页" },
  { to: "/admin/users", label: "用户管理" },
  { to: "/admin/templates", label: "模板管理" },
  { to: "/admin/builds", label: "构建记录" },
  { to: "/admin/tickets", label: "工单处理" },
  { to: "/admin/settings", label: "系统设置" },
];

const AdminLayout = () => {
  const { pathname } = useLocation();
  const { token, logout } = useAuth();
  const publicSettings = usePublicSettings();
  const siteTitle = publicSettings.data?.siteName || "PacMachine";
  const current =
    navLinks
      .slice()
      .sort((a, b) => b.to.length - a.to.length)
      .find((link) => pathname.startsWith(link.to)) || null;
  const title = current ? current.label : "管理员";
  const closeDrawer = () => {
    const drawer = document.getElementById("admin-drawer") as HTMLInputElement | null;
    if (drawer) drawer.checked = false;
  };

  return (
    <div data-theme="light" className="landing-shell admin-shell drawer lg:drawer-open">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-teal-300/30 blur-3xl" />
      <input id="admin-drawer" type="checkbox" className="drawer-toggle sr-only" />
      <div className="drawer-content relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="navbar-start flex items-center gap-3">
              <label htmlFor="admin-drawer" className="landing-button-secondary btn btn-square min-h-0 !h-11 !w-11 !rounded-2xl !p-0 lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
              <div className="min-w-fit whitespace-nowrap rounded-full border border-slate-200/80 bg-white/72 px-5 py-2 text-sm font-semibold text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                {title}
              </div>
            </div>

            <div className="navbar-end flex items-center gap-3">
              <Link to="/app" className="landing-button-secondary min-h-0 rounded-2xl px-4 py-3 text-sm sm:text-base">
                工作区
              </Link>
              {token && (
                <button onClick={logout} className="landing-button-primary min-h-0 rounded-2xl px-4 py-3 text-sm sm:text-base">
                  退出登陆
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <aside className="flex min-h-full w-[290px] flex-col border-r border-slate-200/80 bg-white/90 px-4 py-5 text-slate-700 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:w-[320px] lg:bg-white/72">
          <Link to="/admin" onClick={closeDrawer} className="mb-5 flex items-center gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white/86 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f766e] text-white shadow-[0_12px_30px_rgba(13,148,136,0.24)]">
              <BrandMark />
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-bold tracking-[-0.03em] text-slate-900">{siteTitle}</div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Admin Console</div>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.to === "/admin"
                  ? pathname === link.to
                  : pathname === link.to || pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  className={`flex items-center rounded-2xl px-4 py-3 text-[0.98rem] font-medium transition-all ${
                    isActive
                      ? "bg-[#0f766e] text-white shadow-[0_14px_32px_rgba(13,148,136,0.22)]"
                      : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                  to={link.to}
                  onClick={closeDrawer}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default AdminLayout;
