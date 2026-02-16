import { route } from "@react-router/dev/routes";

export const userRoutes = [
  route("projects", "pages/user/projects-list.tsx"),
  route("projects/new", "pages/user/project-creation.tsx"),
  route("projects/new/template", "pages/user/board-template.tsx"),
  route("projects/:projectId/board", "pages/user/board-view.tsx"),
  route("projects/:projectId/calendar", "pages/user/calendar-view.tsx"),
  route("projects/:projectId/settings", "pages/user/board-settings.tsx"),
  route("projects/:projectId/dashboard", "pages/user/project-dashboard.tsx"),
  route("projects/:projectId/trash", "pages/user/trash-view.tsx"),
  route("tasks/:taskId", "pages/user/task-detail.tsx"),
  route("my-tasks", "pages/user/my-tasks.tsx"),
  route("notifications", "pages/user/notifications.tsx"),
  route("profile", "pages/user/profile.tsx"),
  route("profile/edit", "pages/user/edit-profile.tsx"),
];
