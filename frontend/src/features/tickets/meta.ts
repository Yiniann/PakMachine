import { TicketCategory, TicketStatus } from "./types";

export const categoryOptions: Array<{ value: TicketCategory; label: string }> = [
  { value: "build_consulting", label: "构建问题" },
  { value: "billing_consulting", label: "账单问题" },
  { value: "theme_development_request", label: "开发需求" },
];

export const categoryLabel: Record<string, string> = {
  build_consulting: "构建问题",
  billing_consulting: "账单问题",
  theme_development_request: "开发需求",
  general: "常规咨询",
  technical: "技术问题",
  billing: "计费相关",
  other: "其他",
};

export const statusMeta: Record<TicketStatus, { label: string; badgeClass: string }> = {
  open: { label: "待处理", badgeClass: "badge-warning" },
  processing: { label: "处理中", badgeClass: "badge-info" },
  closed: { label: "已关闭", badgeClass: "badge-success" },
};
