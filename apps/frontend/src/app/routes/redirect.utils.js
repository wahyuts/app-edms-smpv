const fallbackRoute = "/dashboard";
const blockedReturnPaths = new Set([
  "/check-email",
  "/forgot-password",
  "/login",
  "/reset-password",
  "/select-project",
]);

const normalizePath = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value.startsWith("/") ? value : null;
  }

  const pathname = value.pathname;
  if (!pathname || !pathname.startsWith("/")) {
    return null;
  }

  return `${pathname}${value.search ?? ""}${value.hash ?? ""}`;
};

export const getReturnToPath = (location, fallback = fallbackRoute) => {
  const candidate = normalizePath(location?.state?.from);
  const candidatePathname = candidate?.split(/[?#]/)[0];

  if (candidate && !blockedReturnPaths.has(candidatePathname)) {
    return candidate;
  }

  return fallback;
};

export default getReturnToPath;
