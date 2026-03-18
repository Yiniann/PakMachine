export type TicketStatus = "open" | "processing" | "closed";

export type TicketCategory =
  | "build_consulting"
  | "billing_consulting"
  | "theme_development_request"
  | "general"
  | "billing"
  | "technical"
  | "other";

export interface SupportTicketUser {
  id: number;
  email: string;
  role?: string;
  siteName?: string | null;
}

export interface SupportTicketMessage {
  id: number;
  authorId?: number | null;
  senderRole: "user" | "admin";
  content: string;
  createdAt: string;
  author?: SupportTicketUser | null;
}

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  category: TicketCategory;
  content: string;
  status: TicketStatus;
  adminReply?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: SupportTicketMessage | null;
  messages?: SupportTicketMessage[];
  user?: SupportTicketUser;
}
