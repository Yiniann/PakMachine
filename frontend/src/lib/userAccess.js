export const USER_TYPES = ["pending", "basic", "pro", "priority"];
const LEGACY_USER_TYPE_MAP = {
    free: "basic",
    subscriber: "pro",
};
export const normalizeUserType = (value) => {
    const normalized = (value ?? "").toString().trim().toLowerCase();
    if (normalized === "pending" || normalized === "basic" || normalized === "pro" || normalized === "priority") {
        return normalized;
    }
    return LEGACY_USER_TYPE_MAP[normalized] ?? "pending";
};
export const getUserTypeLabel = (value) => {
    const normalized = normalizeUserType(value);
    if (normalized === "priority")
        return "优先版";
    if (normalized === "pro")
        return "订阅版";
    if (normalized === "basic")
        return "基础版";
    return "待开通";
};
export const getUserTypeDescription = (value) => {
    const normalized = normalizeUserType(value);
    if (normalized === "priority")
        return "可构建 SPA 与 Pro，且无需绑定前端域名";
    if (normalized === "pro")
        return "可构建 SPA 与 Pro";
    if (normalized === "basic")
        return "可构建 SPA";
    return "暂未开通构建权限";
};
export const getUserTypeBadgeClass = (value) => {
    const normalized = normalizeUserType(value);
    if (normalized === "priority")
        return "badge-error";
    if (normalized === "pro")
        return "badge-secondary";
    if (normalized === "basic")
        return "badge-accent";
    return "badge-ghost";
};
export const canBuildSpa = (role, userType) => {
    if (role === "admin")
        return true;
    const normalized = normalizeUserType(userType);
    return normalized === "basic" || normalized === "pro" || normalized === "priority";
};
export const canBuildBff = (role, userType) => {
    if (role === "admin")
        return true;
    const normalized = normalizeUserType(userType);
    return normalized === "pro" || normalized === "priority";
};
export const shouldValidateFrontendOrigins = (role, userType) => {
    if (role === "admin")
        return false;
    return normalizeUserType(userType) !== "priority";
};
export const getDailyBuildLimit = (role, userType) => {
    if (role === "admin")
        return Number.MAX_SAFE_INTEGER;
    const normalized = normalizeUserType(userType);
    if (normalized === "priority")
        return 10;
    if (normalized === "basic" || normalized === "pro")
        return 2;
    return 0;
};
