import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="hero bg-base-200 rounded-xl shadow-lg">
      <div className="hero-content flex-col lg:flex-row">
        <div>
          <h1 className="text-4xl font-bold mb-4">欢迎使用 PacMachine</h1>
          <p className="mb-6 text-lg text-base-content/80">使用简单的 API 控制台构建并管理你的包。</p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/auth/register" className="btn btn-primary">
              立即注册
            </Link>
            <Link to="/auth/login" className="btn btn-outline">
              登录
            </Link>
            <Link to="/app/home" className="btn btn-neutral">
              查看应用
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
