import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";

const TICKET_STATUSES = new Set(["open", "processing", "closed"]);
const TICKET_CATEGORIES = new Set([
  "build_consulting",
  "billing_consulting",
  "theme_development_request",
  "general",
  "billing",
  "technical",
  "other",
]);
const MESSAGE_SENDER_ROLES = new Set(["user", "admin"]);

const messageSelect = {
  id: true,
  authorId: true,
  senderRole: true,
  content: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
} as const;

const adminTicketInclude = {
  user: {
    select: {
      id: true,
      email: true,
      siteName: true,
    },
  },
  _count: {
    select: {
      messages: true,
    },
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc" as const,
    },
    select: messageSelect,
  },
} as const;

const myTicketInclude = {
  _count: {
    select: {
      messages: true,
    },
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc" as const,
    },
    select: messageSelect,
  },
} as const;

const ticketDetailInclude = {
  user: {
    select: {
      id: true,
      email: true,
      siteName: true,
    },
  },
  messages: {
    orderBy: {
      createdAt: "asc" as const,
    },
    select: messageSelect,
  },
  _count: {
    select: {
      messages: true,
    },
  },
} as const;

const toSafeTrimmedString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const serializeMessage = (
  message: {
    id: number;
    authorId: number | null;
    senderRole: string;
    content: string;
    createdAt: Date;
    author: {
      id: number;
      email: string;
      role: string;
    } | null;
  },
) => ({
  id: message.id,
  authorId: message.authorId,
  senderRole: message.senderRole,
  content: message.content,
  createdAt: message.createdAt,
  author: message.author
    ? {
        id: message.author.id,
        email: message.author.email,
        role: message.author.role,
      }
    : null,
});

const serializeTicket = (
  ticket: {
    id: number;
    userId: number;
    subject: string;
    category: string;
    content: string;
    status: string;
    adminReply: string | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: number;
      email: string;
      siteName: string | null;
    };
    _count?: {
      messages: number;
    };
    messages?: Array<{
      id: number;
      authorId: number | null;
      senderRole: string;
      content: string;
      createdAt: Date;
      author: {
        id: number;
        email: string;
        role: string;
      } | null;
    }>;
  },
) => ({
  id: ticket.id,
  userId: ticket.userId,
  subject: ticket.subject,
  category: ticket.category,
  content: ticket.content,
  status: ticket.status,
  adminReply: ticket.adminReply,
  closedAt: ticket.closedAt,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
  user: ticket.user,
  messageCount: ticket._count?.messages ?? undefined,
  lastMessage: ticket.messages?.[0] ? serializeMessage(ticket.messages[0]) : null,
  messages: ticket.messages && ticket.messages.length > 1 ? ticket.messages.map(serializeMessage) : ticket.messages?.[0] ? [serializeMessage(ticket.messages[0])] : undefined,
});

const validateTicketId = (rawId: unknown) => {
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
};

const validateMessageContent = (value: unknown) => {
  const content = toSafeTrimmedString(value);
  if (!content) {
    throw Object.assign(new Error("回复内容不能为空"), { statusCode: 400 });
  }
  if (content.length > 5000) {
    throw Object.assign(new Error("回复内容不能超过 5000 个字符"), { statusCode: 400 });
  }
  return content;
};

const validateStatus = (value: unknown) => {
  const status = toSafeTrimmedString(value);
  if (!TICKET_STATUSES.has(status)) {
    throw Object.assign(new Error("工单状态不合法"), { statusCode: 400 });
  }
  return status;
};

const createTicketMessage = async ({
  ticketId,
  authorId,
  senderRole,
  content,
  status,
}: {
  ticketId: number;
  authorId: number;
  senderRole: "user" | "admin";
  content: string;
  status?: string;
}) => {
  if (!MESSAGE_SENDER_ROLES.has(senderRole)) {
    throw new Error("senderRole 不合法");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw Object.assign(new Error("工单不存在"), { statusCode: 404 });
    }

    if (senderRole === "user" && existing.status === "closed") {
      throw Object.assign(new Error("工单已关闭，无法继续回复"), { statusCode: 400 });
    }

    const nextStatus = status ?? existing.status;
    const now = new Date();

    await tx.supportTicketMessage.create({
      data: {
        ticketId,
        authorId,
        senderRole,
        content,
        createdAt: now,
      },
    });

    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        updatedAt: now,
        closedAt: nextStatus === "closed" ? now : null,
        ...(senderRole === "admin" ? { adminReply: content } : {}),
      },
    });
  });
};

const getMyTicketOrThrow = async (ticketId: number, userId: number) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: ticketDetailInclude,
  });

  if (!ticket || ticket.userId !== userId) {
    throw Object.assign(new Error("工单不存在"), { statusCode: 404 });
  }

  return ticket;
};

const getAdminTicketOrThrow = async (ticketId: number) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: ticketDetailInclude,
  });

  if (!ticket) {
    throw Object.assign(new Error("工单不存在"), { statusCode: 404 });
  }

  return ticket;
};

export const listMyTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: Number(user.sub) },
      include: myTicketInclude,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    res.json(tickets.map(serializeTicket));
  } catch (error) {
    next(error);
  }
};

export const getMyTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const id = validateTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "工单 ID 不合法" });
    }

    const ticket = await getMyTicketOrThrow(id, Number(user.sub));
    res.json(serializeTicket(ticket));
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const createMyTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const subject = toSafeTrimmedString(req.body?.subject);
    const category = toSafeTrimmedString(req.body?.category);
    const content = toSafeTrimmedString(req.body?.content);

    if (!subject) {
      return res.status(400).json({ error: "工单标题不能为空" });
    }
    if (subject.length > 120) {
      return res.status(400).json({ error: "工单标题不能超过 120 个字符" });
    }
    if (!content) {
      return res.status(400).json({ error: "工单内容不能为空" });
    }
    if (content.length > 5000) {
      return res.status(400).json({ error: "工单内容不能超过 5000 个字符" });
    }
    if (!category) {
      return res.status(400).json({ error: "请选择问题分类" });
    }
    if (!TICKET_CATEGORIES.has(category)) {
      return res.status(400).json({ error: "工单分类不合法" });
    }

    const created = await prisma.supportTicket.create({
      data: {
        userId: Number(user.sub),
        subject,
        category,
        content,
        messages: {
          create: {
            authorId: Number(user.sub),
            senderRole: "user",
            content,
          },
        },
      },
      include: ticketDetailInclude,
    });

    res.status(201).json(serializeTicket(created));
  } catch (error) {
    next(error);
  }
};

export const addMyTicketMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const id = validateTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "工单 ID 不合法" });
    }

    const ticket = await getMyTicketOrThrow(id, Number(user.sub));
    const content = validateMessageContent(req.body?.content);
    const lastMessage = ticket.messages?.[ticket.messages.length - 1] ?? null;

    if (ticket.status === "closed") {
      return res.status(400).json({ error: "工单已关闭，无法继续回复" });
    }
    if (lastMessage && lastMessage.senderRole !== "admin") {
      return res.status(400).json({ error: "请等待管理员回复后再继续补充" });
    }

    await createTicketMessage({
      ticketId: id,
      authorId: Number(user.sub),
      senderRole: "user",
      content,
    });

    const updated = await getMyTicketOrThrow(id, Number(user.sub));
    res.status(201).json(serializeTicket(updated));
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const listAdminTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = toSafeTrimmedString(req.query.status);
    if (status && !TICKET_STATUSES.has(status)) {
      return res.status(400).json({ error: "工单状态不合法" });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      include: adminTicketInclude,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    res.json(tickets.map(serializeTicket));
  } catch (error) {
    next(error);
  }
};

export const getAdminTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = validateTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "工单 ID 不合法" });
    }

    const ticket = await getAdminTicketOrThrow(id);
    res.json(serializeTicket(ticket));
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const addAdminTicketMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const id = validateTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "工单 ID 不合法" });
    }

    const content = validateMessageContent(req.body?.content);
    const nextStatus = req.body?.status ? validateStatus(req.body.status) : undefined;

    await getAdminTicketOrThrow(id);
    await createTicketMessage({
      ticketId: id,
      authorId: Number(user.sub),
      senderRole: "admin",
      content,
      status: nextStatus,
    });

    const updated = await getAdminTicketOrThrow(id);
    res.status(201).json(serializeTicket(updated));
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

export const updateAdminTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = validateTicketId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "工单 ID 不合法" });
    }

    const status = validateStatus(req.body?.status);
    await getAdminTicketOrThrow(id);

    const now = new Date();
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        updatedAt: now,
        closedAt: status === "closed" ? now : null,
      },
      include: ticketDetailInclude,
    });

    res.json(serializeTicket(updated));
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};
