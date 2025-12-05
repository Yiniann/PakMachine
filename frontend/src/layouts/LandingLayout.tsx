import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../components/useAuth";

const LandingLayout = () => {
  const { token, logout } = useAuth();
  return (
    <div className="app">
      <nav className="nav">
        <h1>PacMachine</h1>
        <div className="links">
          {token && <Link to="/app/home">App</Link>}
          {!token && (
            <>
              <Link to="/auth/login">Login</Link>
              <Link to="/auth/register">Register</Link>
            </>
          )}
          {token && <button onClick={logout}>Logout</button>}
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default LandingLayout;
