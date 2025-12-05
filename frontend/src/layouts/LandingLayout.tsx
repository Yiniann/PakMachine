import { Link, Outlet } from "react-router-dom";

const LandingLayout = () => {
  return (
    <div className="app">
      <nav className="nav">
        <h1>PacMachine</h1>
        <div className="links">
          <Link to="/auth/login">Login</Link>
          <Link to="/auth/register">Register</Link>
          <Link to="/app/users">App</Link>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
};

export default LandingLayout;
