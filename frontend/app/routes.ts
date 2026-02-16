import { type RouteConfig, layout } from "@react-router/dev/routes";
import { publicRoutes } from "./routes/public.routes";
import { authRoutes } from "./routes/auth.routes";
import { userRoutes } from "./routes/user.routes";

export default [
  layout("pages/layout.tsx", publicRoutes),
  layout("pages/auth/layout.tsx", authRoutes),
  layout("components/layout/UserLayout.tsx", userRoutes),
] satisfies RouteConfig;
