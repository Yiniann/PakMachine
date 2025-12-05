import { Link, Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="app">
      <nav className="nav">
        <h1>PacMachine Auth</h1>
        <div className="links">
          <Link to="/">Landing</Link>
          <Link to="/app/users">App</Link>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
