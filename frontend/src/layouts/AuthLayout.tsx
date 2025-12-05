import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../components/useAuth";

const AuthLayout = () => {
  const { token, logout } = useAuth();
  return (
    <div className="app">
      <nav className="nav">
        <h1>PacMachine Auth</h1>
        <div className="links">
          <Link to="/">Landing</Link>
          {token && <Link to="/app/home">App</Link>}
          {token ? <button onClick={logout}>Logout</button> : null}
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
