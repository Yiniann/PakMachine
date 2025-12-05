import { Link, Outlet, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/app/users", label: "Users" },
  { to: "/auth/login", label: "Login" },
  { to: "/auth/register", label: "Register" },
];

const AppLayout = () => {
  const { pathname } = useLocation();
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
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
