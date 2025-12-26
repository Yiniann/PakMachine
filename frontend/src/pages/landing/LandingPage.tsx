import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="hero bg-base-200 rounded-xl shadow-lg">
      <div className="hero-content flex-col lg:flex-row">
        <div>
          <h1 className="text-4xl font-bold mb-4">欢迎使用 PacMachine</h1>
          <p className="mb-6 text-lg text-base-content/80">
            用于打包 Shuttle 主题的一站式工具：一键生成主题包、配置品牌与接口，并支持静态托管/无服务器部署。
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/app" className="btn btn-neutral">
              立刻开始
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
