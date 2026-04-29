export const USER_TYPES = ["pending", "basic", "pro", "priority"] as const;

export type UserType = (typeof USER_TYPES)[number];

const LEGACY_USER_TYPE_MAP: Record<string, UserType> = {
  free: "basic",
  subscriber: "pro",
};

export const normalizeUserType = (value?: string | null): UserType => {
  const normalized = (value ?? "").toString().trim().toLowerCase();
  if (normalized === "pending" || normalized === "basic" || normalized === "pro" || normalized === "priority") {
    return normalized;
  }
  return LEGACY_USER_TYPE_MAP[normalized] ?? "pending";
};

export const getUserTypeLabel = (value?: string | null) => {
  const normalized = normalizeUserType(value);
  if (normalized === "priority") return "优先版";
  if (normalized === "pro") return "订阅版";
  if (normalized === "basic") return "基础版";
  return "待开通";
};

export const getUserTypeDescription = (value?: string | null) => {
  const normalized = normalizeUserType(value);
  if (normalized === "priority") return "可构建 SPA 与 Pro";
  if (normalized === "pro") return "可构建 SPA 与 Pro";
  if (normalized === "basic") return "可构建 SPA";
  return "暂未开通构建权限";
};

export const getUserTypeBadgeClass = (value?: string | null) => {
  const normalized = normalizeUserType(value);
  if (normalized === "priority") return "badge-error";
  if (normalized === "pro") return "badge-secondary";
  if (normalized === "basic") return "badge-accent";
  return "badge-ghost";
};

export const canBuildSpa = (role?: string | null, userType?: string | null) => {
  if (role === "admin") return true;
  const normalized = normalizeUserType(userType);
  return normalized === "basic" || normalized === "pro" || normalized === "priority";
};

export const canBuildBff = (role?: string | null, userType?: string | null) => {
  if (role === "admin") return true;
  const normalized = normalizeUserType(userType);
  return normalized === "pro" || normalized === "priority";
};

export const shouldValidateFrontendOrigins = (role?: string | null, userType?: string | null) => {
  if (role === "admin") return false;
  return canBuildSpa(role, userType);
};

export const getDailyBuildLimit = (role?: string | null, userType?: string | null) => {
  if (role === "admin") return Number.MAX_SAFE_INTEGER;
  const normalized = normalizeUserType(userType);
  if (normalized === "priority") return 10;
  if (normalized === "basic" || normalized === "pro") return 2;
  return 0;
};
