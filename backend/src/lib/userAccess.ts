export const USER_TYPES = ["pending", "basic", "pro"] as const;

export type UserType = (typeof USER_TYPES)[number];

const LEGACY_USER_TYPE_MAP: Record<string, UserType> = {
  free: "basic",
  subscriber: "pro",
};

export const normalizeUserType = (value?: string | null): UserType => {
  const normalized = (value ?? "").toString().trim().toLowerCase();
  if (normalized === "pending" || normalized === "basic" || normalized === "pro") {
    return normalized;
  }
  return LEGACY_USER_TYPE_MAP[normalized] ?? "pending";
};

export const isValidUserType = (value: string) => {
  const normalized = value.toString().trim().toLowerCase();
  return USER_TYPES.includes(normalized as UserType) || normalized in LEGACY_USER_TYPE_MAP;
};

export const canBuildSpa = (role?: string | null, userType?: string | null) => {
  if (role === "admin") return true;
  const normalized = normalizeUserType(userType);
  return normalized === "basic" || normalized === "pro";
};

export const canBuildBff = (role?: string | null, userType?: string | null) => {
  if (role === "admin") return true;
  return normalizeUserType(userType) === "pro";
};
