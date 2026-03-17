import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ScopeNodeData = {
  label: string;
  tone: "example";
};

type StageNodeData = {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  requestDetail?: string;
  responseDetail?: string;
  defaultHandles?: string[];
  exampleHandles?: string[];
  tone: "frontend" | "bff" | "panel";
  inactive?: boolean;
};

type ScopeNode = Node<ScopeNodeData, "scope">;
type StageNode = Node<StageNodeData, "stage">;
type FlowNode = ScopeNode | StageNode;

const stageToneClassMap: Record<StageNodeData["tone"], string> = {
  frontend: "border-sky-200 bg-sky-50 text-slate-900",
  bff: "border-violet-200 bg-violet-50 text-slate-900",
  panel: "border-emerald-200 bg-emerald-50 text-slate-900",
};

const scopeToneClassMap: Record<ScopeNodeData["tone"], string> = {
  example: "border-slate-300 bg-slate-100/35 text-slate-700",
};

const requestLabelStyle = {
  fill: "#1d4ed8",
  fontWeight: 700,
  fontSize: 12,
};

const responseLabelStyle = {
  fill: "#047857",
  fontWeight: 700,
  fontSize: 12,
};

const requestLabelBgStyle = {
  fill: "#ffffff",
  fillOpacity: 0.96,
  stroke: "#bfdbfe",
  strokeWidth: 1,
};

const responseLabelBgStyle = {
  fill: "#ffffff",
  fillOpacity: 0.96,
  stroke: "#a7f3d0",
  strokeWidth: 1,
};

const ScopeNodeCard = ({ data }: NodeProps<ScopeNode>) => {
  return (
    <div className={`relative -z-10 h-full w-full rounded-[40px] border-2 border-dashed ${scopeToneClassMap[data.tone]}`}>
      <div className="absolute left-8 top-[-20px] rounded-full border bg-base-100 px-5 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] shadow-sm">
        {data.label}
      </div>
    </div>
  );
};

const StageNodeCard = ({ data }: NodeProps<StageNode>) => {
  const hasFlowBubbles = Boolean(data.requestDetail || data.responseDetail);
  const hasHandle = (id: string) => data.exampleHandles?.includes(id);
  const hasDefaultHandle = (id: string) => data.defaultHandles?.includes(id);

  return (
    <div className={`w-[280px] rounded-3xl border p-6 shadow-sm ${stageToneClassMap[data.tone]} ${data.inactive ? "opacity-45 saturate-50" : ""}`}>
      {hasFlowBubbles ? (
        <>
          {hasHandle("request-left-target") ? <Handle id="request-left-target" type="target" position={Position.Left} className="!top-[45%] !h-3 !w-3 !border-2 !border-base-100 !bg-sky-500" /> : null}
          {hasHandle("request-right-target") ? <Handle id="request-right-target" type="target" position={Position.Right} className="!top-[45%] !h-3 !w-3 !border-2 !border-base-100 !bg-sky-500" /> : null}
          {hasHandle("response-left-target") ? <Handle id="response-left-target" type="target" position={Position.Left} className="!top-[86%] !h-3 !w-3 !border-2 !border-base-100 !bg-emerald-500" /> : null}
          {hasHandle("response-right-target") ? <Handle id="response-right-target" type="target" position={Position.Right} className="!top-[86%] !h-3 !w-3 !border-2 !border-base-100 !bg-emerald-500" /> : null}
        </>
      ) : (
        <>
          {hasDefaultHandle("left-target") ? <Handle id="left-target" type="target" position={Position.Left} className="!top-[42%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
          {hasDefaultHandle("top-target") ? <Handle id="top-target" type="target" position={Position.Top} className="!left-[42%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
          {hasDefaultHandle("right-target") ? <Handle id="right-target" type="target" position={Position.Right} className="!top-[58%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
          {hasDefaultHandle("bottom-target") ? <Handle id="bottom-target" type="target" position={Position.Bottom} className="!left-[58%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
        </>
      )}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{data.eyebrow}</p>
      <h3 className="mt-2 text-xl font-bold">{data.title}</h3>
      {data.description ? <p className="mt-3 text-base leading-7 text-slate-600">{data.description}</p> : null}
      {hasFlowBubbles ? (
        <div className="mt-4 space-y-3">
          {data.requestDetail ? (
            <div className="rounded-2xl border border-sky-200/70 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-700">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">请求</p>
              <div className="whitespace-pre-line font-medium">{data.requestDetail}</div>
            </div>
          ) : null}
          {data.responseDetail ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-white/75 px-4 py-3 text-sm leading-6 text-slate-700">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">返回</p>
              <div className="whitespace-pre-line font-medium">{data.responseDetail}</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {data.detail ? (
        <div className="mt-4 whitespace-pre-line rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium leading-6 text-slate-700">
          {data.detail}
        </div>
      ) : null}
      {hasFlowBubbles ? (
        <>
          {hasHandle("request-left-source") ? <Handle id="request-left-source" type="source" position={Position.Left} className="!top-[45%] !h-3 !w-3 !border-2 !border-base-100 !bg-sky-500" /> : null}
          {hasHandle("request-right-source") ? <Handle id="request-right-source" type="source" position={Position.Right} className="!top-[45%] !h-3 !w-3 !border-2 !border-base-100 !bg-sky-500" /> : null}
          {hasHandle("response-left-source") ? <Handle id="response-left-source" type="source" position={Position.Left} className="!top-[86%] !h-3 !w-3 !border-2 !border-base-100 !bg-emerald-500" /> : null}
          {hasHandle("response-right-source") ? <Handle id="response-right-source" type="source" position={Position.Right} className="!top-[86%] !h-3 !w-3 !border-2 !border-base-100 !bg-emerald-500" /> : null}
        </>
      ) : (
        <>
          {hasDefaultHandle("left-source") ? <Handle id="left-source" type="source" position={Position.Left} className="!top-[58%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
          {hasDefaultHandle("top-source") ? <Handle id="top-source" type="source" position={Position.Top} className="!left-[58%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
          {hasDefaultHandle("right-source") ? <Handle id="right-source" type="source" position={Position.Right} className="!top-[42%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
          {hasDefaultHandle("bottom-source") ? <Handle id="bottom-source" type="source" position={Position.Bottom} className="!left-[42%] !h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" /> : null}
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  scope: ScopeNodeCard,
  stage: StageNodeCard,
};

type RequestMode = "bff" | "spa";

const createNodes = (showExample: boolean, mode: RequestMode): FlowNode[] => {
  const scopeConfig = showExample
    ? {
        position: { x: 12, y: 40 },
        style: { width: 1840, height: 1240 },
        label: mode === "bff" ? "Pro版登录请求链路" : "SPA版登录请求链路",
      }
    : mode === "bff"
      ? {
          position: { x: 60, y: 88 },
          style: { width: 980, height: 860 },
          label: "Pro版产物",
        }
      : {
          position: { x: 60, y: 88 },
          style: { width: 420, height: 420 },
          label: "SPA产物",
        };

  const baseNodes: FlowNode[] = [
    {
      id: "example-scope",
      type: "scope",
      position: scopeConfig.position,
      style: scopeConfig.style,
      draggable: false,
      selectable: false,
      zIndex: -10,
      data: {
        label: scopeConfig.label,
        tone: "example",
      },
    },
    {
      id: "frontend",
      type: "stage",
      position: { x: 120, y: 132 },
      draggable: false,
      zIndex: 20,
      data: {
        eyebrow: "站点层",
        title: !showExample && mode === "spa" ? "SPA产物" : "主题前端",
        description: showExample
          ? "用户在登录页提交表单后，这里先发起请求。"
          : "浏览器里的前端页面负责收集用户输入、发起请求，并在收到响应后更新页面状态。",
        requestDetail: showExample
          ? mode === "bff"
            ? "向 `/api/auth/login` 发起 POST 请求\n携带：email、password"
            : "直接向 `/api/v1/passport/auth/login` 发起对面板的 POST 请求\n携带：email、password"
          : undefined,
        responseDetail: showExample
          ? mode === "bff"
            ? "收到：是否已登录、是否为管理\n成功：更新页面登录状态\n后续请求：统一先发给主题后端（BFF）"
            : "收到结果后判断成功或失败\n成功：把 token 存进 cookie\n后续请求：前端会携带验证 token\n失败：展示错误提示"
          : undefined,
        exampleHandles: showExample
          ? mode === "bff"
            ? ["request-right-source", "response-left-target"]
            : ["request-right-source", "response-right-target"]
          : undefined,
        detail: showExample
          ? ""
          : mode === "bff"
            ? "从页面把请求发到主题后端（BFF）"
            : "从页面直接把请求发到面板",
        defaultHandles: mode === "bff" ? ["right-source", "left-target"] : ["right-source", "right-target"],
        tone: "frontend",
      },
    },
    {
      id: "bff",
      type: "stage",
      position: { x: 620, y: 612 },
      draggable: false,
      zIndex: 20,
      data: {
        eyebrow: "服务层",
        title: "主题后端（BFF）",
        description: showExample
          ? mode === "bff"
            ? "收到请求后，先处理，再转给面板；拿到 token 后自己保存，再把简化结果回给前端。"
            : "这次直连模式里，请求不会经过这一层。"
          : "服务端中间层先接住前端请求，再做鉴权、参数处理、接口转发和响应整理。",
        requestDetail: showExample
          ? mode === "bff"
            ? "收到：`POST /api/auth/login`\n携带：email、password\n处理：校验参数、可补默认值\n再向面板的 `/api/v1/passport/auth/login` 发起 POST 请求"
            : "这次直连模式里，请求不会经过主题后端（BFF）"
          : undefined,
        responseDetail: showExample
          ? mode === "bff"
            ? "收到面板返回的 token、用户信息、状态码\n处理：把 token 保存在主题后端（BFF）\n返回给前端：是否已登录、是否为管理\n后续前端请求：都先到主题后端（BFF），再由它携带验证 token 发给面板"
            : undefined
          : undefined,
        exampleHandles: showExample
          ? mode === "bff"
            ? ["request-left-target", "request-right-source", "response-right-target", "response-left-source"]
            : []
          : undefined,
        detail: showExample
          ? ""
          : mode === "bff"
            ? "接住请求，再整理并转发"
            : "当前展示的是主题前端直连链路",
        defaultHandles: mode === "bff" ? ["left-target", "right-source", "right-target", "left-source"] : [],
        tone: "bff",
        inactive: mode === "spa",
      },
    },
    {
      id: "panel",
      type: "stage",
      position: { x: 1136, y: 212 },
      draggable: false,
      zIndex: 20,
      data: {
        eyebrow: "后端层",
        title: "面板",
        description: showExample
          ? "这里执行业务处理，并把登录结果返回出来。"
          : "真正的业务处理发生在这里，例如登录校验、用户查询、订阅数据生成或订单处理。",
        requestDetail: showExample
          ? "收到：`POST /api/v1/passport/auth/login`\n携带：email、password\n处理：校验账号密码"
          : undefined,
        responseDetail: showExample
          ? mode === "bff"
            ? "返回：token、用户信息、状态码\n先回给主题后端（BFF）"
            : "返回：token、用户信息、状态码\n直接回给主题前端"
          : undefined,
        exampleHandles: showExample
          ? mode === "bff"
            ? ["request-left-target", "response-right-source"]
            : ["request-left-target", "response-left-source"]
          : undefined,
        detail: showExample
          ? ""
          : mode === "bff"
            ? "执行业务并把结果返回给主题后端（BFF）"
            : "执行业务并把结果直接返回给主题前端",
        defaultHandles: mode === "bff" ? ["left-target", "bottom-source"] : ["left-target", "bottom-source"],
        tone: "panel",
      },
    },
  ];

  return baseNodes;
};

const createEdges = (showExample: boolean, mode: RequestMode): Edge[] => {
  if (mode === "spa") {
    return [
      {
        id: "frontend-panel-request",
        source: "frontend",
        target: "panel",
        sourceHandle: showExample ? "request-right-source" : "right-source",
        targetHandle: showExample ? "request-left-target" : "left-target",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        label: showExample ? "请求直达面板" : "请求：主题前端直接把请求发给面板",
        labelStyle: requestLabelStyle,
        labelBgStyle: requestLabelBgStyle,
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 999,
        zIndex: 10,
        style: { stroke: "#2563eb", strokeWidth: 3 },
      },
      {
        id: "panel-frontend-response",
        source: "panel",
        target: "frontend",
        sourceHandle: showExample ? "response-left-source" : "bottom-source",
        targetHandle: showExample ? "response-right-target" : "right-target",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        label: showExample ? "结果直接回前端" : "返回：面板直接把结果交给主题前端",
        labelStyle: responseLabelStyle,
        labelBgStyle: responseLabelBgStyle,
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 999,
        zIndex: 10,
        style: { stroke: "#10b981", strokeWidth: 2.5, strokeDasharray: "8 6" },
      },
    ];
  }

  return [
    {
      id: "frontend-bff-request",
      source: "frontend",
      target: "bff",
      sourceHandle: showExample ? "request-right-source" : "right-source",
      targetHandle: showExample ? "request-left-target" : "left-target",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      label: showExample ? "请求先到主题后端（BFF）" : "请求：主题前端把请求发给主题后端（BFF）",
      labelStyle: requestLabelStyle,
      labelBgStyle: requestLabelBgStyle,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 999,
      zIndex: 10,
      style: { stroke: "#2563eb", strokeWidth: 3 },
    },
    {
      id: "bff-panel-request",
      source: "bff",
      target: "panel",
      sourceHandle: showExample ? "request-right-source" : "right-source",
      targetHandle: showExample ? "request-left-target" : "left-target",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      label: showExample ? "主题后端（BFF）再转给面板" : "请求继续：主题后端（BFF）把请求发给面板",
      labelStyle: requestLabelStyle,
      labelBgStyle: requestLabelBgStyle,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 999,
      zIndex: 10,
        style: { stroke: "#2563eb", strokeWidth: 3 },
      },
    {
      id: "panel-bff-response",
      source: "panel",
      target: "bff",
      sourceHandle: showExample ? "response-right-source" : "bottom-source",
      targetHandle: showExample ? "response-right-target" : "right-target",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      label: showExample ? "面板把 token 和结果先回主题后端（BFF）" : "返回：面板先把结果返回给主题后端（BFF）",
      labelStyle: responseLabelStyle,
      labelBgStyle: responseLabelBgStyle,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 999,
      zIndex: 10,
      style: { stroke: "#10b981", strokeWidth: 2.5, strokeDasharray: "8 6" },
    },
    {
      id: "bff-frontend-response",
      source: "bff",
      target: "frontend",
      sourceHandle: showExample ? "response-left-source" : "left-source",
      targetHandle: showExample ? "response-left-target" : "left-target",
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      label: showExample ? "主题后端（BFF）保存 token，只把登录结果和管理标记回前端" : "返回：主题后端（BFF）再把结果交给主题前端",
      labelStyle: responseLabelStyle,
      labelBgStyle: responseLabelBgStyle,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 999,
      zIndex: 10,
      style: { stroke: "#10b981", strokeWidth: 2.5, strokeDasharray: "8 6" },
    },
  ];
};

const DeployGuidePrinciplePage = () => {
  const [requestMode, setRequestMode] = useState<RequestMode>("bff");
  const [showExample, setShowExample] = useState(false);
  const nodes = useMemo(() => createNodes(showExample, requestMode), [showExample, requestMode]);
  const edges = useMemo(() => createEdges(showExample, requestMode), [showExample, requestMode]);

  return (
    <div className="space-y-6">
      <div>
        <div className="breadcrumbs text-sm text-base-content/60">
          <ul>
            <li><Link to="/app/deploy-guide">部署教程</Link></li>
            <li>工作原理</li>
          </ul>
        </div>
        <h2 className="text-3xl font-bold">工作原理图</h2>
        <p className="mt-1 text-base-content/70">可以切换查看“经过主题后端（BFF）”和“主题前端直连”两种请求链路。需要时再点图例，把一个具体请求例子展开出来。</p>
      </div>

      <section className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 text-sm text-base-content/70">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setRequestMode("bff")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  requestMode === "bff"
                    ? "border-violet-300 bg-violet-100 text-violet-800"
                    : "border-base-300 bg-base-200/70 text-base-content/75 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${requestMode === "bff" ? "bg-violet-600" : "bg-base-content/30"}`} />
                <span>Pro版：经过主题后端（BFF）</span>
              </button>
              <button
                type="button"
                onClick={() => setRequestMode("spa")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  requestMode === "spa"
                    ? "border-sky-300 bg-sky-100 text-sky-800"
                    : "border-base-300 bg-base-200/70 text-base-content/75 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${requestMode === "spa" ? "bg-sky-600" : "bg-base-content/30"}`} />
                <span>SPA版本：直接请求面板</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowExample((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                  showExample
                    ? "border-violet-300 bg-violet-100 text-violet-800"
                    : "border-base-300 bg-base-200/70 text-base-content/75 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${showExample ? "bg-violet-600" : "bg-base-content/30"}`} />
                <span>{showExample ? "隐藏例子：登录请求" : "点击显示例子：登录请求"}</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="h-0.5 w-8 rounded-full bg-sky-600" />
              <span>蓝色实线：请求链路</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="h-0.5 w-8 border-t-2 border-dashed border-emerald-500" />
              <span>绿色虚线：返回链路</span>
            </div>
          </div>
        </div>
        <div className="relative h-[900px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(241,245,249,0.95))]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll
            panOnScroll={false}
            panOnDrag
            minZoom={0.55}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                if (node.id.includes("scope")) return "#f8fafc";
                if (node.id === "frontend") return "#e0f2fe";
                if (node.id === "bff") return "#ede9fe";
                if (node.id === "panel") return "#d1fae5";
                return "#ffffff";
              }}
              maskColor="rgba(15, 23, 42, 0.08)"
            />
            <Controls showInteractive={false} position="top-right" />
            <Background
              id="base"
              gap={20}
              size={1}
              color="rgba(100, 116, 139, 0.18)"
              variant={BackgroundVariant.Dots}
            />
          </ReactFlow>
        </div>
      </section>

    </div>
  );
};

export default DeployGuidePrinciplePage;
