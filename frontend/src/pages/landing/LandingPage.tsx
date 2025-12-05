import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="hero bg-base-200 rounded-xl shadow-lg">
      <div className="hero-content flex-col lg:flex-row">
        <div>
          <h1 className="text-4xl font-bold mb-4">Welcome to PacMachine</h1>
          <p className="mb-6 text-lg text-base-content/80">
            Build and manage your packages with a simple API-powered dashboard.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/auth/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/auth/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/app/home" className="btn btn-neutral">
              View App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
