import {
  index,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx", { id: "home-index" }),
  route(":locale", "routes/home.tsx", { id: "home-locale" }),
  route(":locale/member", "routes/home.tsx", { id: "home-member" }),
  route(":locale/admin", "routes/home.tsx", { id: "home-admin" }),
  route("auth/*", "routes/proxy-auth.ts"),
  route("api/*", "routes/proxy-api.ts"),
] satisfies RouteConfig;
