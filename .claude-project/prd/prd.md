# TaskBoard PRD

> **Source**: prd.pdf
> **Converted**: 2026-02-16
> **Version**: 1.1 (2026-02-09)

## 1. Overview

### Project Description

TaskBoard is a lightweight, mobile-first project management platform centered around Kanban boards. It enables project owners to organize work visually, assign tasks to team members, and track progress in real-time. The platform focuses on simplicity and real-time collaboration without the complexity of traditional enterprise PM tools.

### Goals

1. Provide a simple, intuitive Kanban board experience with real-time synchronization across all users
2. Enable project owners to track team progress through automated dashboards and completion metrics
3. Facilitate team collaboration through task comments, file attachments, and notification-driven workflows

### Key Features

- **Real-Time Kanban Boards**: Drag-and-drop task management with WebSocket synchronization
- **Task Management**: Full task lifecycle with sub-tasks, time tracking, comments, and attachments
- **Multiple Views**: Board view, Calendar view, and List view for different workflows
- **Progress Tracking**: Automated dashboards with completion metrics and analytics
- **Team Collaboration**: Comments with @mentions, file attachments (up to 10MB), and threaded discussions
- **Notifications**: Push and email notifications for assignments, deadlines, and activity
- **Time Tracking**: Built-in timer and manual time entry per task
- **Soft Delete**: 30-day trash recovery for deleted tasks

## 2. Terminology

| Term | Definition |
|------|------------|
| **Board** | A Kanban-style project workspace containing columns and task cards |
| **Column** | A vertical list on the board representing a task status (e.g., To Do, In Progress, Done) |
| **Card** | A task item displayed on the board that can be dragged between columns |
| **Label** | A color-coded tag attached to tasks for categorization (e.g., Bug, Feature, Design) |
| **Assignee** | The team member responsible for completing a task |
| **WIP Limit** | Work In Progress limit - maximum number of cards allowed in a column |
| **Swimlane** | A horizontal division on the board for grouping cards by category or assignee |
| **Backlog** | A holding area for tasks that are planned but not yet moved to the active board |
| **Blocker** | A task dependency or issue preventing progress on the current task |
| **Sprint** | An optional time-boxed period for organizing tasks (not enforced) |
| **Sub-Task** | Checklist-style items within a task with progress tracking |
| **Time Entry** | Logged time spent on a task (timer or manual entry) |

## 3. User Types

### Project Owner

**Description**: Main user who creates and manages projects

**Permissions**:
- Create and manage projects
- Build and configure Kanban boards
- Create and assign tasks
- Invite and manage team members
- Monitor project progress via dashboard
- Edit all project settings and columns
- Delete tasks (soft delete with trash recovery)
- Archive and delete projects
- Export project reports as CSV
- Drag tasks between columns
- Change due dates via calendar drag

### Team Member

**Description**: Invited user who collaborates on projects

**Permissions**:
- View projects they're invited to
- Create tasks
- Edit own tasks (title, description, assignee, priority, due date)
- Drag cards between columns (update status)
- Add/manage sub-tasks on any task
- Log time on any task
- Add comments and file attachments on any task
- View board, calendar, and dashboard
- Receive notifications for assignments

**Restrictions**:
- Cannot create new projects
- Cannot edit project settings
- Cannot manage columns
- Cannot invite/remove members
- Cannot delete or restore tasks
- Cannot archive/delete projects
- Cannot change due dates via calendar (read-only)
- Cannot export CSV reports

### Admin

**Description**: System administrator with full access

**Permissions**:
- Manage all users and projects
- Monitor system usage analytics
- Configure system settings
- Manage label configuration
- Set notification defaults
- Configure file upload limits and types
- Access admin dashboard with charts and reports
- Export system-wide data (users, projects, tasks)

## 4. Project Structure

### Mobile App (React Native)
- **Primary Interface**: Mobile-first design for Project Owner and Team Member
- **Target Platforms**: iOS and Android
- **Key Features**:
  - Native Kanban board with drag-and-drop
  - Push notifications
  - Offline viewing (no editing)
  - Camera integration for task attachments
  - Real-time WebSocket synchronization

### Web App (React)
- **Alternative Access**: Browser-based interface for Project Owner and Team Member
- **Features**: Same as mobile app with responsive design
- **Advantages**: Keyboard shortcuts, larger screen workflow, easier file uploads

### Admin Dashboard (React)
- **Admin Interface**: Web-based management console
- **Features**:
  - User management (CRUD, suspend/activate, role changes)
  - Project management (view, archive, delete)
  - System analytics and charts
  - Configuration settings
  - Data export (CSV)

### Backend API (NestJS)
- **Technology**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Real-Time**: WebSocket for live board synchronization
- **Features**:
  - RESTful API endpoints
  - JWT authentication with httpOnly cookies
  - Google OAuth integration
  - SendGrid email service
  - AWS S3 file storage
  - Real-time event broadcasting

## 5. Page Architecture

### Common Pages (All App Users)
```
├── Splash Page (auto-login check)
├── Auth Flow
│   ├── Login Page
│   ├── Sign Up Page
│   ├── Forgot Password Page
│   └── Reset Password Page (via email link)
```

### Project Owner & Team Member Navigation
```
Main App
├── 1. Projects Tab (Home)
│   ├── Project List Page (grid/list view)
│   ├── Project Creation Page (Owner only)
│   ├── Board View Page
│   │   ├── Task Detail Page
│   │   ├── Trash View Page (Owner only)
│   │   └── Project Dashboard Page
│   ├── Calendar View Page
│   └── Board Settings Page (Owner only)
├── 2. My Tasks Tab
│   └── My Tasks List (across all projects)
├── 3. Notifications Tab
│   └── Notification List
└── 4. Profile Tab
    ├── Profile Page
    └── Edit Profile Page
```

### Admin Dashboard Navigation
```
Admin Dashboard
├── Dashboard Home Page
├── User Management
│   ├── User List Page
│   ├── User Creation Modal
│   └── User Detail Drawer
├── Project Management
│   ├── Project List Page
│   └── Project Detail Drawer
└── System Configuration
    ├── General Settings
    ├── Notification Settings
    ├── Label Configuration
    └── Data Export
```

## 6. Page List with Features

### Common Pages

| Page Name | Features | User Type | Priority |
|-----------|----------|-----------|----------|
| **Splash Page** | Logo display, Auto-login check, Route to Login or Home | All | P0 |
| **Login Page** | Email/password input, Google OAuth, Show/hide password toggle, Forgot password link, Sign up link | All | P0 |
| **Sign Up Page** | Full name, Email, Password (min 8 chars), Job title (optional), Profile photo (optional), Email verification, Terms acceptance | All | P0 |
| **Forgot Password** | Email input, Send reset link via SendGrid, Success message | All | P0 |
| **Reset Password** | New password input, Confirm password, Validation (min 8 chars), Success redirect | All | P0 |

### Project Owner Pages

| Page Name | Features | User Type | Priority |
|-----------|----------|-----------|----------|
| **Projects List (Home)** | Grid/list toggle, Project cards (title, progress %, members, deadline, task count), Search by name, Filter (All/Active/Completed/Archived), Sort (Recent/Deadline/Name), FAB "+" button | Owner, Member | P0 |
| **Project Creation** | Title, Description (rich text), Deadline, Board template selection (Default/Minimal/Custom), Custom columns with WIP limits, Team invitation (emails or link), Create button | Owner | P0 |
| **Board View** | Horizontal scrollable columns, Column title with task count, WIP limit indicator, "+" button per column, Task cards (title, priority badge, assignee, due date, labels, comment count, attachment count), Drag-and-drop between columns, Real-time WebSocket sync, View toggle (Board/Calendar), Settings icon, Dashboard icon, Progress badge | Owner, Member | P0 |
| **Task Detail** | Editable title, Status badge, Priority selector (Low/Medium/High/Urgent), Description (rich text), Assignee dropdown, Due date picker, Label multi-select, Sub-tasks checklist with progress, Time tracking (start/stop timer, manual entry, time log), File attachments (PDF/PNG/JPG/DOCX/XLSX, max 10MB), Threaded comments with @mentions, Activity log, Move to Trash button (Owner only) | Owner, Member | P0 |
| **Trash View** | List of soft-deleted tasks, Restore button per task, Delete permanently button (Owner only), Auto-delete after 30 days, Empty state message | Owner | P1 |
| **Board Settings** | Edit project title/description/deadline, Manage columns (add/rename/reorder/delete/WIP limits), Manage members (view/remove/resend invitation), Trash link, Archive project button, Delete project button with confirmation | Owner | P0 |
| **Project Dashboard** | Summary cards (Total tasks, Completed, Overdue, Completion %), Charts (Tasks per status, Tasks per priority, Member workload, Completion trend), Date range filter, Assignee filter, Priority filter, Export CSV button | Owner, Member | P1 |
| **Calendar View** | Monthly calendar with tasks on due dates, Color-coded by priority, Tap date to see all due tasks, Tap task to open detail, Drag to change due dates (Owner only), Week/Month toggle | Owner, Member | P1 |
| **My Tasks** | All assigned tasks across projects, Grouped by project, Task info (title, project, status, priority, due date), Overdue highlighting, Filter (All/Overdue/Due Today/Due This Week), Sort (Due date/Priority/Project) | Owner, Member | P0 |
| **Notifications** | Chronological list, Types (Task assigned, Due date reminder, Status change, Comment mention, New comment, Invitation), Tap to navigate, Swipe to dismiss, Mark all as read | Owner, Member | P0 |
| **Profile** | Profile photo, Name, Email, Job title, Edit profile button, Notification preferences (Push on/off, Email digest, Per-type toggles), App version, Logout, Delete account | Owner, Member | P0 |

### Admin Dashboard Pages

| Page Name | Features | User Type | Priority |
|-----------|----------|-----------|----------|
| **Dashboard Home** | Statistics cards (Total users, Total projects, Total tasks, Active users today), Period filter (Today/7d/30d/Custom), Charts (User registration trend, Project creation trend, Task completion rate, Top 5 active projects), Recent activity log | Admin | P0 |
| **User Management** | Search by name/email, Filter (Role, Status, Registration date), Bulk actions (Activate/Suspend/Delete/Export CSV), Table (Checkbox, Name, Email, Role, Status, Projects count, Tasks count, Registration date, Last active), Actions (View/Edit/Suspend/Delete), Column sorting, Pagination | Admin | P0 |
| **User Detail Drawer** | Profile photo, Name, Email, Role, Status, Registration date, Account actions (Activate/Suspend, Reset password, Change role), Projects list, Recent tasks, Activity (Last login, Total logins, Tasks completed), Timestamps | Admin | P0 |
| **Project Management** | Search by name/owner, Filter (Status, Date range, Member count), Bulk actions (Archive/Delete/Export CSV), Table (Project name, Owner, Status, Members count, Total tasks, Completed tasks, Completion %, Created date, Deadline), Actions (View/Archive/Delete), Column sorting, Pagination | Admin | P0 |
| **Project Detail Drawer** | Project info (Title, Description, Deadline, Status, Completion %), Owner info (Name, Email with link), Members list with roles, Task summary (Total, Per status, Overdue), Recent activity, Actions (Archive/Delete with confirmation) | Admin | P0 |
| **System Settings** | General (App name, Default Kanban template, Max file size, Allowed file types), Notifications (Email toggle, Default digest frequency, Deadline reminder timing), Label configuration (Bug, Feature, Design, Documentation, Improvement with colors) | Admin | P1 |
| **Data Export** | User reports (CSV with activity metrics), Project reports (CSV with completion stats), Task reports (CSV with status/assignee/dates), Filter (All time, Custom date range, Current filtered results) | Admin | P1 |

## 7. System Modules (Workflows)

### Module 1: Project Creation (Project Owner)

1. Project Owner taps "New Project" button
2. Owner enters project title, description, and deadline
3. Owner selects Kanban template:
   - Default Template: To Do → In Progress → Review → Done
   - Minimal Template: To Do → Done
   - Custom: Create own columns with optional WIP limits
4. System creates project with selected board template
5. Owner invites team members via email or share invitation link
6. Team members receive invitation notification and join project
7. Project appears in both owner's and members' project list

### Module 2: Task Management (Project Owner / Team Member)

1. User opens a project board
2. Any user creates new task card by tapping "+" button on column
3. User fills task details:
   - Title, description
   - Assignee (from project members)
   - Priority (Low/Medium/High/Urgent)
   - Due date
   - Labels (Bug, Feature, Design, Documentation, Improvement)
4. User can add sub-tasks (checklist items) within task
5. Assigned team member receives push notification
6. Team member drags task card between columns to update status
7. System updates status in real-time via WebSocket, notifies relevant users
8. Users can add threaded comments, file attachments, and log time spent

### Module 3: Kanban Board Real-Time Interaction

1. User opens project board
2. Board displays columns with task cards sorted by priority
3. User drags a card from one column to another
4. System broadcasts change to all connected users via WebSocket
5. All users viewing board see change instantly without refresh
6. If column has WIP limit and it's reached, system shows warning before allowing move
7. Board auto-saves all changes

### Module 4: Progress Tracking (Project Owner)

1. Owner opens project dashboard
2. System displays:
   - Overall completion percentage (Done tasks / Total tasks)
   - Overdue tasks count
   - Tasks per status bar chart
   - Member workload distribution
   - Total time logged
3. Owner can filter by date range, assignee, or priority
4. Owner can export project report as CSV

### Module 5: Calendar View (All App Users)

1. User navigates to Calendar View (toggle on Board View header)
2. System displays monthly calendar with task cards on due dates
3. Tasks are color-coded by priority
4. User can tap date to see all tasks due that day
5. User can tap task to open Task Detail Page
6. User can drag tasks to different dates to change due dates (Owner only)
7. Week/Month toggle for different views

## 8. Third-Party APIs

| Service | Purpose | Usage |
|---------|---------|-------|
| **Google OAuth** | Social login authentication | User signup/login with Google account |
| **SendGrid** | Email notifications | Invitations, deadline reminders, daily digest emails |
| **AWS S3** | File storage | Document and image uploads attached to tasks (max 10MB per file) |

## 9. Technical Requirements

### Authentication
- JWT tokens stored in httpOnly cookies
- Google OAuth integration
- Email verification required for new accounts
- Password reset via email link

### Real-Time Features
- WebSocket connections for board synchronization
- Live task updates when users drag cards
- Real-time notifications for assignments and comments

### File Management
- Supported formats: PDF, PNG, JPG, DOCX, XLSX
- Maximum file size: 10MB per file
- Storage: AWS S3
- Preview: Inline for images, first-page thumbnail for PDFs

### Notifications
- Push notifications (mobile)
- Email notifications (configurable)
- In-app notification center
- Types: Assignments, Due date reminders, Status changes, Comment mentions, Invitations

### Soft Delete System
- Deleted tasks moved to Trash
- Recoverable for 30 days
- Automatic permanent deletion after 30 days
- Restore functionality for Project Owner

## 10. Permission Matrix

| Feature | Project Owner | Team Member | Admin |
|---------|---------------|-------------|-------|
| Create project | ✅ Yes | ❌ No | ✅ Yes (via admin panel) |
| Edit project settings | ✅ Yes | ❌ No | ✅ Yes |
| Create tasks | ✅ Yes | ✅ Yes | ✅ Yes |
| Edit task details | ✅ Yes (all tasks) | ✅ Yes (own tasks only) | ✅ Yes |
| Delete tasks (soft delete) | ✅ Yes | ❌ No | ✅ Yes |
| Restore deleted tasks | ✅ Yes | ❌ No | ✅ Yes |
| Manage columns | ✅ Yes | ❌ No | ✅ Yes |
| Invite/remove members | ✅ Yes | ❌ No | ✅ Yes |
| Archive/delete project | ✅ Yes | ❌ No | ✅ Yes |
| Drag cards between columns | ✅ Yes | ✅ Yes | ✅ Yes |
| Add/manage sub-tasks | ✅ Yes | ✅ Yes | ✅ Yes |
| Log time on tasks | ✅ Yes | ✅ Yes | ✅ Yes |
| Add comments | ✅ Yes | ✅ Yes | ✅ Yes |
| Upload file attachments | ✅ Yes | ✅ Yes | ✅ Yes |
| View board, calendar, dashboard | ✅ Yes | ✅ Yes | ✅ Yes |
| Change due dates via calendar | ✅ Yes | ❌ No (read-only) | ✅ Yes |
| Export CSV | ✅ Yes | ❌ No | ✅ Yes (system-wide) |

## 11. UX Improvement Suggestions

### High Priority

**Overdue Task Highlighting**
- **Issue**: With many cards across columns, it's easy to miss overdue tasks
- **Suggestion**: Add a red "Overdue (N)" badge on board header that filters and highlights overdue cards
- **Benefit**: Immediate visibility of deadline issues
- **Complexity**: Simple

### Medium Priority

**List View Toggle**
- **Issue**: When project has 30+ tasks, difficult to sort/filter across all columns
- **Suggestion**: Add "Board View" / "List View" toggle showing all tasks in flat table with sorting
- **Benefit**: Faster task discovery for large projects
- **Complexity**: Medium

**Inline File Preview**
- **Issue**: Users must download files to view contents, friction on mobile
- **Suggestion**: Show inline preview for images (thumbnails) and PDF first-page thumbnail
- **Benefit**: Faster file review, better mobile experience
- **Complexity**: Simple

**Categorized Notifications**
- **Issue**: All notifications mixed together, hard to find urgent items
- **Suggestion**: Add tab filters: All / Assignments / Comments / Deadlines with count badges
- **Benefit**: Better signal-to-noise ratio
- **Complexity**: Simple

### Low Priority

**Keyboard Shortcuts (Desktop/Web)**
- **Issue**: Power users on desktop find mouse-only interaction slow
- **Suggestion**: Add shortcuts (N=new task, arrows=navigate, Enter=open, 1-4=move to column)
- **Benefit**: Faster workflow for desktop users
- **Complexity**: Medium

## 12. Change Log

### Version 1.1 (2026-02-09)

**Client Q&A Updates**:
- ✅ Added Time Tracking Section with start/stop timer and manual time entry
- ✅ Added Sub-Tasks Section with checkboxes and progress indicator
- ✅ Added Calendar View with month/week toggle
- ✅ Updated Team Member permissions to allow task creation
- ✅ Changed task deletion to soft delete with 30-day Trash recovery
- ✅ Added Trash View Page with restore functionality
- ✅ Confirmed no limits on projects per user or members per project
- ✅ Clarified no guest access needed
- ✅ Clarified offline viewing only (no editing)

### Version 1.0 (2026-02-09)

- Initial PRD creation from training project generator
- Level 3 (Medium) difficulty
- Project Management domain

---

*Generated from PRD PDF using /operation:pdf-to-prd skill*
