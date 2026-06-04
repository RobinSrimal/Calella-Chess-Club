import {
  index,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx", { id: "home-index" }),
  route("login", "routes/login.tsx", { id: "login-root" }),
  route("register", "routes/register.tsx", { id: "register-root" }),
  route("ca/login", "routes/login.tsx", { id: "login-ca" }),
  route("es/login", "routes/login.tsx", { id: "login-es" }),
  route("en/login", "routes/login.tsx", { id: "login-en" }),
  route("ca/register", "routes/register.tsx", { id: "register-ca" }),
  route("es/register", "routes/register.tsx", { id: "register-es" }),
  route("en/register", "routes/register.tsx", { id: "register-en" }),
  route("ca/verify-email", "routes/verify-email.tsx", {
    id: "verify-email-ca",
  }),
  route("es/verify-email", "routes/verify-email.tsx", {
    id: "verify-email-es",
  }),
  route("en/verify-email", "routes/verify-email.tsx", {
    id: "verify-email-en",
  }),
  route("ca/forgot-password", "routes/forgot-password.tsx", {
    id: "forgot-password-ca",
  }),
  route("es/forgot-password", "routes/forgot-password.tsx", {
    id: "forgot-password-es",
  }),
  route("en/forgot-password", "routes/forgot-password.tsx", {
    id: "forgot-password-en",
  }),
  route("ca/reset-password", "routes/reset-password.tsx", {
    id: "reset-password-ca",
  }),
  route("es/reset-password", "routes/reset-password.tsx", {
    id: "reset-password-es",
  }),
  route("en/reset-password", "routes/reset-password.tsx", {
    id: "reset-password-en",
  }),
  route("ca/admin/users", "routes/admin-users.tsx", { id: "admin-users-ca" }),
  route("es/admin/users", "routes/admin-users.tsx", { id: "admin-users-es" }),
  route("en/admin/users", "routes/admin-users.tsx", { id: "admin-users-en" }),
  route(":locale", "routes/home.tsx", { id: "home-locale" }),
  route(":locale/member", "routes/home.tsx", { id: "home-member" }),
  route(":locale/admin", "routes/home.tsx", { id: "home-admin" }),
  route("auth/*", "routes/proxy-auth.ts"),
  route("api/*", "routes/proxy-api.ts"),
] satisfies RouteConfig;
