import { type RouteConfig, layout } from "@react-router/dev/routes";
import { authRoutes } from "./routes/auth.routes";
import { adminRoutes } from "./routes/admin.routes";

export default [
  layout("components/layout/AdminLayout.tsx", adminRoutes),
  layout("pages/auth/layout.tsx", authRoutes),
] satisfies RouteConfig;
