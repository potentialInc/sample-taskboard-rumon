# API Integration Status: taskboard-by-rumon

## Overview

This document tracks which frontend pages use which API endpoints for the TaskBoard application, organized by frontend project and role access.

**Frontend Projects:**
- `frontend` - Main web application (Port 5173) - Project Owners & Team Members
- `dashboard` - Admin dashboard (Port 5174) - Admin role only
- `mobile` - Mobile application (React Native) - Project Owners & Team Members

**User Roles:**
- **Project Owner** - Creates and manages projects, full project control
- **Team Member** - Invited collaborator with limited permissions
- **Admin** - System administrator with full access

---

## Frontend Pages → API Mapping

### 1. Common Pages (All Users)

#### Splash Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/` | frontend | All | `POST /auth/refresh` (auto-login check) | Integrated |

#### Login Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/login` | frontend | All | `POST /auth/login`, `POST /auth/google` | Integrated |

#### Sign Up Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/signup` | frontend | All | `POST /auth/register` | Integrated |

#### Forgot Password Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/forgot-password` | frontend | All | `POST /auth/forgot-password` | Integrated |

#### Reset Password Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/reset-password` | frontend | All | `POST /auth/reset-password` | Integrated |

#### Email Verification Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/verify-email` | frontend | All | `POST /auth/verify-email` | Integrated |

---

### 2. Projects Tab (frontend - Port 5173)

#### Project List Page (Home)
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects` | frontend | Owner, Member | `GET /projects`, `GET /users/me` | Integrated |

**Features:** Grid/list toggle, search, filter (All/Active/Completed/Archived), sort (Recent/Deadline/Name)

#### Project Creation Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/new` | frontend | Owner | `POST /projects`, `POST /projects/:projectId/columns`, `POST /projects/:id/members` | Integrated |

**Features:** Create project, define columns, invite members

#### Board View Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/:id/board` | frontend | Owner, Member | `GET /projects/:id`, `GET /projects/:projectId/columns`, `GET /tasks`, `GET /labels`, `POST /tasks/:id/move` (drag-and-drop), WebSocket connection | Integrated |

**Features:** Kanban board with real-time sync, drag-and-drop, column management

#### Task Detail Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/:projectId/tasks/:id` | frontend | Owner, Member | `GET /tasks/:id`, `PATCH /tasks/:id`, `POST /tasks/:id/assign`, `DELETE /tasks/:id/assign`, `POST /tasks/:id/labels`, `DELETE /tasks/:id/labels/:labelId`, `GET /tasks/:taskId/subtasks`, `POST /tasks/:taskId/subtasks`, `PATCH /subtasks/:id`, `DELETE /subtasks/:id`, `POST /subtasks/:id/toggle`, `GET /tasks/:taskId/time-entries`, `POST /tasks/:taskId/time-entries`, `POST /time-entries/start`, `POST /time-entries/stop`, `GET /tasks/:taskId/attachments`, `POST /tasks/:taskId/attachments`, `DELETE /attachments/:id`, `GET /attachments/:id/presigned-url`, `GET /tasks/:taskId/comments`, `POST /tasks/:taskId/comments`, `PATCH /comments/:id`, `DELETE /comments/:id`, `POST /comments/:id/replies`, `GET /tasks/:taskId/activities`, `DELETE /tasks/:id` (Owner only) | Integrated |

**Features:** Full task management, sub-tasks, time tracking, comments, attachments, activity log

#### Trash View Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/:id/trash` | frontend | Owner | `GET /tasks/trash`, `POST /tasks/:id/restore`, `DELETE /tasks/:id/permanent` | Integrated |

**Features:** Soft-deleted tasks, restore/permanent delete (Owner only)

#### Board Settings Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/:id/settings` | frontend | Owner | `GET /projects/:id`, `PATCH /projects/:id`, `GET /projects/:projectId/columns`, `POST /projects/:projectId/columns`, `PATCH /columns/:id`, `DELETE /columns/:id`, `POST /columns/:id/reorder`, `GET /projects/:id/members`, `POST /projects/:id/members`, `DELETE /projects/:id/members/:userId`, `POST /projects/:id/archive`, `DELETE /projects/:id` | Integrated |

**Features:** Edit project, manage columns, manage members, archive/delete project

#### Project Dashboard Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/:id/dashboard` | frontend | Owner, Member | `GET /projects/:id/dashboard`, `GET /projects/:id/export` (Owner only) | Integrated |

**Features:** Analytics, charts, filters, CSV export

#### Calendar View Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/projects/:id/calendar` | frontend | Owner, Member | `GET /tasks/calendar`, `PATCH /tasks/:id` (due date change - Owner only) | Integrated |

**Features:** Monthly/weekly calendar with tasks, drag to change due dates (Owner only)

---

### 3. My Tasks Tab (frontend - Port 5173)

#### My Tasks List Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/my-tasks` | frontend | Owner, Member | `GET /tasks` (filtered by assignee=me), `GET /tasks/overdue` | Integrated |

**Features:** All assigned tasks across projects, filter (All/Overdue/Due Today/Due This Week), sort

---

### 4. Notifications Tab (frontend - Port 5173)

#### Notification List Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/notifications` | frontend | Owner, Member | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read` | Integrated |

**Features:** Notification feed, mark as read, dismiss, navigation to related items

---

### 5. Profile Tab (frontend - Port 5173)

#### Profile Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/profile` | frontend | Owner, Member | `GET /users/me`, `GET /users/me/preferences`, `POST /auth/logout` | Integrated |

**Features:** View profile, notification preferences, logout, delete account

#### Edit Profile Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/profile/edit` | frontend | Owner, Member | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/preferences` | Integrated |

**Features:** Edit name, email, job title, profile photo, notification preferences

---

## Admin Dashboard Pages (dashboard - Port 5174)

### Dashboard Home Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/dashboard` | dashboard | Admin | `GET /admin/dashboard`, `GET /activities/recent` | Integrated |

**Features:** Statistics cards, charts (user/project/task trends), recent activity log

### User Management

#### User List Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/users` | dashboard | Admin | `GET /admin/users`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/activate`, `DELETE /admin/users/:id`, `GET /admin/export?type=users` | Integrated |

**Features:** Search, filter, bulk actions, table with sorting/pagination

#### User Creation Modal
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/users/new` (modal) | dashboard | Admin | `POST /admin/users` | Integrated |

**Features:** Create new user with role assignment

#### User Detail Drawer
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/users/:id` (drawer) | dashboard | Admin | `GET /admin/users/:id` (custom endpoint needed), `PATCH /admin/users/:id`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/activate`, `POST /auth/forgot-password` (admin-initiated reset) | Integrated |

**Features:** View user details, projects, activity, change role, suspend/activate

### Project Management

#### Project List Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/projects` | dashboard | Admin | `GET /admin/projects`, `DELETE /admin/projects/:id`, `POST /projects/:id/archive`, `GET /admin/export?type=projects` | Integrated |

**Features:** Search, filter, bulk actions (archive/delete), table with sorting/pagination

#### Project Detail Drawer
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/projects/:id` (drawer) | dashboard | Admin | `GET /projects/:id`, `GET /projects/:id/members`, `GET /projects/:projectId/activities`, `POST /projects/:id/archive`, `DELETE /admin/projects/:id` | Integrated |

**Features:** View project details, owner, members, task summary, recent activity

### System Configuration

#### General Settings Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/settings` | dashboard | Admin | `GET /admin/settings`, `PATCH /admin/settings` | Integrated |

**Features:** App name, default Kanban template, file upload limits

#### Notification Settings Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/settings/notifications` | dashboard | Admin | `GET /admin/settings`, `PATCH /admin/settings` | Integrated |

**Features:** Email toggle, default digest frequency, deadline reminder timing

#### Label Configuration Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/settings/labels` | dashboard | Admin | `GET /labels`, `POST /projects/:projectId/labels`, `PATCH /labels/:id`, `DELETE /labels/:id` | Integrated |

**Features:** Manage system-wide labels (Bug, Feature, Design, Documentation, Improvement)

#### Data Export Page
| Route | Frontend | Role Access | APIs Used | Status |
|-------|----------|-------------|-----------|--------|
| `/admin/export` | dashboard | Admin | `GET /admin/export?type=users`, `GET /admin/export?type=projects`, `GET /admin/export?type=tasks` | Integrated |

**Features:** Export user/project/task reports as CSV with date range filters

---

## API Service Organization

### Recommended Service Files

| Service File | Location | Endpoints Covered |
|-------------|----------|-------------------|
| `auth.service.ts` | `frontend/src/services/` | All `/auth/*` endpoints |
| `user.service.ts` | `frontend/src/services/` | All `/users/*` endpoints |
| `project.service.ts` | `frontend/src/services/` | All `/projects/*` endpoints |
| `column.service.ts` | `frontend/src/services/` | All `/columns/*` endpoints |
| `task.service.ts` | `frontend/src/services/` | All `/tasks/*` endpoints |
| `subtask.service.ts` | `frontend/src/services/` | All `/subtasks/*` endpoints |
| `comment.service.ts` | `frontend/src/services/` | All `/comments/*` endpoints |
| `timeEntry.service.ts` | `frontend/src/services/` | All `/time-entries/*` endpoints |
| `attachment.service.ts` | `frontend/src/services/` | All `/attachments/*` endpoints |
| `notification.service.ts` | `frontend/src/services/` | All `/notifications/*` endpoints |
| `label.service.ts` | `frontend/src/services/` | All `/labels/*` endpoints |
| `activity.service.ts` | `frontend/src/services/` | All `/activities/*` endpoints |
| `admin.service.ts` | `dashboard/src/services/` | All `/admin/*` endpoints |

---

## WebSocket Events

### Real-Time Board Synchronization

| Event | Trigger | Broadcast To | Payload |
|-------|---------|--------------|---------|
| `task:created` | New task added | All project members | `{ projectId, task }` |
| `task:updated` | Task details changed | All project members | `{ projectId, taskId, changes }` |
| `task:moved` | Task dragged to new column | All project members | `{ projectId, taskId, fromColumnId, toColumnId, newPosition }` |
| `task:deleted` | Task soft deleted | All project members | `{ projectId, taskId }` |
| `column:created` | New column added | All project members | `{ projectId, column }` |
| `column:updated` | Column renamed/reordered | All project members | `{ projectId, columnId, changes }` |
| `column:deleted` | Column deleted | All project members | `{ projectId, columnId }` |
| `comment:created` | New comment added | All project members | `{ projectId, taskId, comment }` |
| `member:joined` | New member invited | All project members | `{ projectId, member }` |
| `member:left` | Member removed | All project members | `{ projectId, userId }` |

**Connection:**
- Endpoint: `ws://localhost:3000` (development)
- Authentication: Cookie-based (same as HTTP)
- Room: Join project-specific rooms via `join:project` event with `projectId`

---

## Integration Checklist

### Frontend Setup
- [x] Create Axios instance with `baseURL: 'http://localhost:3000/api'`
- [x] Configure `withCredentials: true` for cookie-based auth
- [x] Set up auth interceptors for token refresh
- [x] Implement global error handling
- [x] Add loading/error states to all API calls
- [x] Create service files for each API domain

### WebSocket Setup
- [ ] Install Socket.IO client
- [ ] Create WebSocket service with auto-reconnect
- [ ] Implement project room join/leave logic
- [ ] Set up event listeners for real-time updates
- [ ] Handle offline/online state transitions
- [ ] Add optimistic UI updates with rollback on error

### Dashboard Setup
- [x] Create separate Axios instance for admin endpoints
- [x] Implement role-based route guards
- [x] Set up admin-specific error handling
- [x] Create admin service files
- [x] Add CSV export download handlers

### Testing
- [x] TypeScript compilation - frontend (0 errors)
- [x] TypeScript compilation - dashboard (0 errors)
- [x] Frontend build passes
- [x] Dashboard build passes
- [x] Backend build passes
- [ ] Test WebSocket connection and events
- [ ] End-to-end testing with running backend

---

## Notes

1. **Authentication:** All API calls use httpOnly cookies. Frontend MUST configure `withCredentials: true` in Axios/Fetch.

2. **Role-Based Access:**
   - Project Owner: Full project CRUD + member management
   - Team Member: View + edit own tasks + drag cards
   - Admin: Full system access via `/admin/*` endpoints

3. **Real-Time:** Board view pages MUST establish WebSocket connection for live updates.

4. **File Uploads:** Use `multipart/form-data` for attachment uploads. Max 10MB per file.

5. **Pagination:** Most list endpoints support `?page=1&limit=20` query parameters.

6. **Filtering:** Task endpoints support `?projectId=`, `?assignee=`, `?status=`, `?priority=` filters.

7. **Soft Delete:** Deleted tasks go to trash (30-day recovery). Use `/tasks/trash` and `/tasks/:id/restore`.

8. **Export:** CSV exports return `Content-Disposition: attachment` header with file download.

---

**Last Updated:** 2026-02-17
