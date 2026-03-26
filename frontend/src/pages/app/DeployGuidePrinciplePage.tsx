import { Link } from "react-router-dom";
import { DeployPrincipleDiagram } from "../../components/DeployPrincipleDiagram";

const DeployGuidePrinciplePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-slate-500">
          <ul>
            <li><Link to="/app/deploy-guide">部署教程</Link></li>
            <li>工作原理</li>
          </ul>
        </div>
        <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900">工作原理图</h2>
        <p className="mt-2 max-w-3xl text-lg leading-8 text-slate-500">可以切换查看“经过主题后端（BFF）”和“主题前端直连”两种请求链路。需要时再点图例，把一个具体请求例子展开出来。</p>
      </div>
      <DeployPrincipleDiagram />
    </div>
  );
};

export default DeployGuidePrinciplePage;
