import { route, index } from "@react-router/dev/routes";

export const adminRoutes = [
  index("pages/admin/dashboard.tsx"),
  route("users", "pages/admin/user-management.tsx"),
  route("projects", "pages/admin/project-management.tsx"),
  route("settings", "pages/admin/system-configuration.tsx"),
];
