import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { DeployPrincipleDiagram } from "../../components/DeployPrincipleDiagram";
const DeployGuidePrinciplePage = () => {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("div", { className: "breadcrumbs text-sm text-slate-500", children: _jsxs("ul", { children: [_jsx("li", { children: _jsx(Link, { to: "/app/deploy-guide", children: "\u90E8\u7F72\u6559\u7A0B" }) }), _jsx("li", { children: "\u5DE5\u4F5C\u539F\u7406" })] }) }), _jsx("h2", { className: "mt-3 text-4xl font-bold tracking-[-0.05em] text-slate-900", children: "\u5DE5\u4F5C\u539F\u7406\u56FE" }), _jsx("p", { className: "mt-2 max-w-3xl text-lg leading-8 text-slate-500", children: "\u53EF\u4EE5\u5207\u6362\u67E5\u770B\u201C\u7ECF\u8FC7\u4E3B\u9898\u540E\u7AEF\uFF08BFF\uFF09\u201D\u548C\u201C\u4E3B\u9898\u524D\u7AEF\u76F4\u8FDE\u201D\u4E24\u79CD\u8BF7\u6C42\u94FE\u8DEF\u3002\u9700\u8981\u65F6\u518D\u70B9\u56FE\u4F8B\uFF0C\u628A\u4E00\u4E2A\u5177\u4F53\u8BF7\u6C42\u4F8B\u5B50\u5C55\u5F00\u51FA\u6765\u3002" })] }), _jsx(DeployPrincipleDiagram, {})] }));
};
export default DeployGuidePrinciplePage;
