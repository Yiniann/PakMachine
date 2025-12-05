import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <section>
      <h2>Welcome to PacMachine</h2>
      <p>Build and manage your packages with a simple API-powered dashboard.</p>
      <div className="links" style={{ gap: 12, marginTop: 16 }}>
        <Link to="/auth/register" className="button">Get Started</Link>
        <Link to="/auth/login" className="button secondary">Login</Link>
        <Link to="/app/users" className="button tertiary">View App</Link>
      </div>
    </section>
  );
};

export default LandingPage;
