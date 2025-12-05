const HomePage = () => {
  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">控制台</h2>
          <p className="text-base-content/70">欢迎回来，使用侧边导航切换应用与管理功能。</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">状态</div>
          <div className="stat-value text-primary">在线</div>
          <div className="stat-desc">后端可访问</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">用户</div>
          <div className="stat-value">—</div>
          <div className="stat-desc">详情见 管理/用户</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">认证</div>
          <div className="stat-value">已保护</div>
          <div className="stat-desc text-secondary">需要 token</div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
