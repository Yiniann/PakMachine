import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { usePublicSettings } from "../features/settings/publicSettings";
import BrandMark from "../components/BrandMark";

const AuthLayout = () => {
  const { token, logout } = useAuth();
  const publicSettings = usePublicSettings();
  const siteTitle = publicSettings.data?.siteName || "PacMachine";
  return (
    <div className="landing-shell relative min-h-screen">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d6bf4] text-white shadow-[0_12px_30px_rgba(109,107,244,0.26)]">
              <BrandMark />
            </span>
            <span className="text-2xl font-bold tracking-[-0.03em] text-slate-900">{siteTitle}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="min-h-0 rounded-2xl px-4 py-3 text-base font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              返回首页
            </Link>
            {token ? (
              <>
                <Link
                  to="/app"
                  className="landing-button-secondary min-h-0 rounded-2xl px-5 py-3 text-base"
                >
                  开始构建
                </Link>
                <button
                  onClick={logout}
                  className="landing-button-primary min-h-0 rounded-2xl px-5 py-3 text-base"
                >
                  退出登陆
                </button>
              </>
            ) : (
              <Link
                to="/auth/register"
                className="landing-button-primary min-h-0 rounded-2xl px-8 py-3 text-base"
              >
                注册
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
