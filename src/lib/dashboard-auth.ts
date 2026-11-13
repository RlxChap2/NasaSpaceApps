import { createHmac, timingSafeEqual } from "crypto";

export const dashboardCookieName = "maher_dashboard_session";
const maxAgeSeconds = 60 * 60 * 12;

function getPassword() {
  return process.env.DASHBOARD_PASSWORD;
}

function getSecret() {
  return process.env.DASHBOARD_SECRET || getPassword();
}

function sign(value: string) {
  const secret = getSecret();
  return secret ? createHmac("sha256", secret).update(value).digest("hex") : null;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyDashboardPassword(password: string) {
  const configuredPassword = getPassword();
  return !!configuredPassword && safeEqual(password, configuredPassword);
}

export function createDashboardToken() {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const signature = sign(issuedAt);
  if (!signature) throw new Error("Dashboard authentication is not configured.");
  return `${issuedAt}.${signature}`;
}

export function verifyDashboardToken(token?: string | null) {
  if (!token) return false;

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  const expected = sign(issuedAt);
  if (!expected || !safeEqual(signature, expected)) return false;

  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeSeconds;
}

export function dashboardCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function isDashboardRequestAuthorized(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)]),
  );

  return verifyDashboardToken(cookies[dashboardCookieName]);
}
