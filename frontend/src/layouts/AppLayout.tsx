import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../components/useAuth";

const navLinks = [{ to: "/app/home", label: "Home" }];

const AppLayout = () => {
  const { pathname } = useLocation();
  const { token, logout } = useAuth();
  return (
    <div className="app">
      <nav className="nav">
        <h1>PacMachine</h1>
        <div className="links">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={pathname === link.to ? "active" : ""}>
              {link.label}
            </Link>
          ))}
          {token && <button onClick={logout}>Logout</button>}
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
