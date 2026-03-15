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
import { Link } from "react-router-dom";

type ScopeNodeData = {
  label: "SPA" | "PRO";
  tone: "spa" | "pro";
};

type PrincipleNodeData = {
  eyebrow: string;
  title: string;
  description: string;
  tone: "frontend" | "bff" | "panel";
};

type NoteNodeData = {
  text: string;
  tone: "spa" | "pro";
};

type ScopeNode = Node<ScopeNodeData, "scope">;
type PrincipleNode = Node<PrincipleNodeData, "principle">;
type NoteNode = Node<NoteNodeData, "note">;
type FlowNode = ScopeNode | PrincipleNode | NoteNode;

const principleToneClassMap: Record<PrincipleNodeData["tone"], string> = {
  frontend: "border-sky-200 bg-sky-50 text-slate-900",
  bff: "border-violet-200 bg-violet-50 text-slate-900",
  panel: "border-emerald-200 bg-emerald-50 text-slate-900",
};

const scopeToneClassMap: Record<ScopeNodeData["tone"], string> = {
  spa: "border-sky-300 bg-sky-100/35 text-sky-700",
  pro: "border-violet-300 bg-violet-100/30 text-violet-700",
};

const noteToneClassMap: Record<NoteNodeData["tone"], string> = {
  spa: "border-sky-200 bg-base-100/95 text-sky-700",
  pro: "border-violet-200 bg-base-100/95 text-violet-700",
};

const ScopeNodeCard = ({ data }: NodeProps<ScopeNode>) => {
  return (
    <div className={`relative h-full w-full rounded-[40px] border-2 border-dashed ${scopeToneClassMap[data.tone]}`}>
      <div className="absolute left-8 top-[-20px] rounded-full border bg-base-100 px-5 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] shadow-sm">
        {data.label}
      </div>
    </div>
  );
};

const PrincipleNodeCard = ({ data }: NodeProps<PrincipleNode>) => {
  return (
    <div className={`w-[280px] rounded-3xl border p-6 shadow-sm ${principleToneClassMap[data.tone]}`}>
      <Handle id="left" type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" />
      <Handle id="top" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{data.eyebrow}</p>
      <h3 className="mt-2 text-xl font-bold">{data.title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-600">{data.description}</p>
      <Handle id="right" type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-base-100 !bg-base-content/30" />
    </div>
  );
};

const NoteNodeCard = ({ data }: NodeProps<NoteNode>) => {
  return (
    <div className={`max-w-[280px] rounded-2xl border px-5 py-3 text-sm font-semibold leading-6 shadow-sm ${noteToneClassMap[data.tone]}`}>
      {data.text}
    </div>
  );
};

const nodeTypes = {
  scope: ScopeNodeCard,
  principle: PrincipleNodeCard,
  note: NoteNodeCard,
};

const nodes: FlowNode[] = [
  {
    id: "pro-scope",
    type: "scope",
    position: { x: 56, y: 88 },
    style: { width: 402, height: 520 },
    draggable: false,
    selectable: false,
    data: {
      label: "PRO",
      tone: "pro",
    },
  },
  {
    id: "spa-scope",
    type: "scope",
    position: { x: 82, y: 120 },
    style: { width: 350, height: 190 },
    draggable: false,
    selectable: false,
    data: {
      label: "SPA",
      tone: "spa",
    },
  },
  {
    id: "frontend",
    type: "principle",
    position: { x: 116, y: 160 },
    draggable: false,
    zIndex: 20,
    data: {
      eyebrow: "站点层",
      title: "前端主题",
      description: "承载首页、登录、订阅页等用户界面。SPA 模式下由它直接发起面板接口请求。",
      tone: "frontend",
    },
  },
  {
    id: "bff",
    type: "principle",
    position: { x: 116, y: 422 },
    draggable: false,
    zIndex: 20,
    data: {
      eyebrow: "服务层",
      title: "中台 + BFF",
      description: "承载管理入口、服务端逻辑与接口聚合。只在 PRO 模式下介入请求链路。",
      tone: "bff",
    },
  },
  {
    id: "panel",
    type: "principle",
    position: { x: 760, y: 292 },
    draggable: false,
    zIndex: 20,
    data: {
      eyebrow: "后端层",
      title: "面板",
      description: "提供用户、订阅、订单、节点等核心后端能力，是 SPA 与 PRO 共同依赖的数据来源。",
      tone: "panel",
    },
  },
  {
    id: "spa-note",
    type: "note",
    position: { x: 512, y: 154 },
    draggable: false,
    selectable: false,
    zIndex: 10,
    data: {
      text: "SPA: 前端主题直接请求面板 API",
      tone: "spa",
    },
  },
  {
    id: "pro-note-1",
    type: "note",
    position: { x: 428, y: 406 },
    draggable: false,
    selectable: false,
    zIndex: 10,
    data: {
      text: "PRO: 前端请求先进入中台 / BFF",
      tone: "pro",
    },
  },
  {
    id: "pro-note-2",
    type: "note",
    position: { x: 610, y: 514 },
    draggable: false,
    selectable: false,
    zIndex: 10,
    data: {
      text: "PRO: BFF 再调用面板能力",
      tone: "pro",
    },
  },
];

const edges: Edge[] = [
  {
    id: "frontend-panel-spa",
    source: "frontend",
    target: "panel",
    sourceHandle: "right",
    targetHandle: "left",
    type: "simplebezier",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#2563eb", strokeWidth: 3 },
  },
  {
    id: "frontend-bff-pro",
    source: "frontend",
    target: "bff",
    sourceHandle: "bottom",
    targetHandle: "top",
    markerEnd: { type: MarkerType.ArrowClosed },
    type: "smoothstep",
    style: { stroke: "#7c3aed", strokeWidth: 3 },
  },
  {
    id: "bff-panel-pro",
    source: "bff",
    target: "panel",
    sourceHandle: "right",
    targetHandle: "left",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#7c3aed", strokeWidth: 3 },
  },
];

const DeployGuidePrinciplePage = () => {
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
        <p className="mt-1 text-base-content/70">这张图只保留前端主题、中台 + BFF、面板 3 个核心模块，并用 SPA 与 PRO 的分组范围直接标出部署边界。</p>
      </div>

      <section className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
        <div className="h-[840px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(241,245,249,0.95))]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll
            panOnScroll={false}
            panOnDrag
            minZoom={0.5}
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
