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
  route(":locale", "routes/home.tsx", { id: "home-locale" }),
  route(":locale/member", "routes/home.tsx", { id: "home-member" }),
  route(":locale/admin", "routes/home.tsx", { id: "home-admin" }),
  route("auth/*", "routes/proxy-auth.ts"),
  route("api/*", "routes/proxy-api.ts"),
] satisfies RouteConfig;
