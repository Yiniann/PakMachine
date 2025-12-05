const HomePage = () => {
  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Dashboard</h2>
          <p className="text-base-content/70">Welcome back. Use the sidebar to jump between app and admin tools.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Status</div>
          <div className="stat-value text-primary">Online</div>
          <div className="stat-desc">Backend reachable</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Users</div>
          <div className="stat-value">—</div>
          <div className="stat-desc">See admin/users</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Auth</div>
          <div className="stat-value">Protected</div>
          <div className="stat-desc text-secondary">Token required</div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
