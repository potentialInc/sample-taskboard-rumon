# Database Schema: TaskBoard

## Overview

- **Database**: PostgreSQL 14+
- **ORM**: TypeORM
- **Migrations**: `backend/src/migrations/`
- **Naming Convention**: snake_case for tables/columns, PascalCase for entities

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    User      │◄──────│  ProjectMember   │──────►│   Project    │
│              │  1:N  │                  │  N:1  │              │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id           │       │ id               │       │ id           │
│ email        │       │ user_id  (FK)    │       │ title        │
│ password     │       │ project_id (FK)  │       │ owner_id (FK)│
│ name         │       │ role             │       │ deadline     │
│ role         │       │ joined_at        │       │ status       │
└──────────────┘       └──────────────────┘       └──────────────┘
                                                          │
                                                          │ 1:N
                                                          ▼
                                                   ┌──────────────┐
                                                   │   Column     │
                                                   ├──────────────┤
                                                   │ id           │
                                                   │ project_id   │
                                                   │ title        │
                                                   │ position     │
                                                   │ wip_limit    │
                                                   └──────────────┘
                                                          │
                                                          │ 1:N
                                                          ▼
┌──────────────┐       ┌──────────────┐            ┌──────────────┐
│    Label     │◄──────│  TaskLabel   │       ┌────│     Task     │
│              │  1:N  │              │       │    │              │
├──────────────┤       ├──────────────┤       │    ├──────────────┤
│ id           │       │ task_id (FK) │       │    │ id           │
│ name         │       │ label_id (FK)│       │    │ column_id    │
│ color        │       └──────────────┘       │    │ title        │
└──────────────┘                              │    │ assignee_id  │
                                              │    │ priority     │
                                              │    └──────────────┘
                                              │           │
                                              │           │ 1:N
                                              │           ├──────────────┐
                                              │           │              │
                                              │           ▼              ▼
                                              │    ┌──────────────┐  ┌──────────────┐
                                              │    │   SubTask    │  │   Comment    │
                                              │    ├──────────────┤  ├──────────────┤
                                              │    │ id           │  │ id           │
                                              │    │ task_id (FK) │  │ task_id (FK) │
                                              │    │ title        │  │ author_id    │
                                              │    │ completed    │  │ text         │
                                              │    └──────────────┘  └──────────────┘
                                              │
                                              │           ┌──────────────┐
                                              ├──────────►│  TimeEntry   │
                                              │           ├──────────────┤
                                              │           │ id           │
                                              │           │ task_id (FK) │
                                              │           │ user_id (FK) │
                                              │           │ duration     │
                                              │           └──────────────┘
                                              │
                                              └──────────►┌──────────────┐
                                                          │  Attachment  │
                                                          ├──────────────┤
                                                          │ id           │
                                                          │ task_id (FK) │
                                                          │ file_url     │
                                                          │ file_name    │
                                                          └──────────────┘
```

## Tables

### users

User accounts (Project Owners, Team Members, Admins)

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | No | - | UNIQUE, NOT NULL | User email (unique) |
| password | VARCHAR(255) | Yes | NULL | - | Hashed password (nullable for OAuth-only users) |
| name | VARCHAR(100) | No | - | NOT NULL | Full name |
| job_title | VARCHAR(100) | Yes | NULL | - | Job title (optional) |
| profile_photo_url | TEXT | Yes | NULL | - | Profile photo URL (S3) |
| role | ENUM | No | 'member' | CHECK | 'admin', 'owner', 'member' |
| email_verified | BOOLEAN | No | false | - | Email verification status |
| email_verification_token | VARCHAR(255) | Yes | NULL | - | Email verification token |
| password_reset_token | VARCHAR(255) | Yes | NULL | - | Password reset token |
| password_reset_expires | TIMESTAMP | Yes | NULL | - | Password reset expiration |
| google_id | VARCHAR(255) | Yes | NULL | - | Google OAuth ID |
| notification_preferences | JSONB | No | {} | - | Notification settings (push, email, digest frequency) |
| created_at | TIMESTAMP | No | NOW() | - | Account creation date |
| updated_at | TIMESTAMP | No | NOW() | - | Last update |
| last_active_at | TIMESTAMP | Yes | NULL | - | Last activity timestamp |
| is_active | BOOLEAN | No | true | - | Account active status (for suspend/deactivate) |

**Indexes:**
- `users_email_idx` on `email` (UNIQUE)
- `users_google_id_idx` on `google_id`
- `users_role_idx` on `role`

---

### projects

Project workspaces

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Project ID |
| title | VARCHAR(255) | No | - | NOT NULL | Project title |
| description | TEXT | Yes | NULL | - | Project description (rich text) |
| owner_id | UUID | No | - | FOREIGN KEY (users.id) | Project owner (creator) |
| deadline | DATE | Yes | NULL | - | Project deadline |
| status | ENUM | No | 'active' | CHECK | 'active', 'completed', 'archived' |
| completion_percentage | DECIMAL(5,2) | No | 0.00 | - | Auto-calculated completion % |
| created_at | TIMESTAMP | No | NOW() | - | Project creation date |
| updated_at | TIMESTAMP | No | NOW() | - | Last update |
| deleted_at | TIMESTAMP | Yes | NULL | - | Soft delete timestamp |

**Indexes:**
- `projects_owner_id_idx` on `owner_id`
- `projects_status_idx` on `status`
- `projects_deleted_at_idx` on `deleted_at` (for soft delete queries)

---

### project_members

Many-to-many relationship between users and projects

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Membership ID |
| project_id | UUID | No | - | FOREIGN KEY (projects.id) ON DELETE CASCADE | Project ID |
| user_id | UUID | No | - | FOREIGN KEY (users.id) ON DELETE CASCADE | User ID |
| role | ENUM | No | 'member' | CHECK | 'owner', 'member' (owner duplicates projects.owner_id) |
| invitation_status | ENUM | No | 'accepted' | CHECK | 'pending', 'accepted', 'declined' |
| invitation_token | VARCHAR(255) | Yes | NULL | - | Invitation link token |
| joined_at | TIMESTAMP | No | NOW() | - | Date member joined |
| invited_by | UUID | Yes | NULL | FOREIGN KEY (users.id) | User who sent invitation |

**Indexes:**
- `project_members_project_user_idx` on `(project_id, user_id)` (UNIQUE)
- `project_members_user_id_idx` on `user_id`
- `project_members_invitation_token_idx` on `invitation_token`

---

### columns

Kanban board columns within projects

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Column ID |
| project_id | UUID | No | - | FOREIGN KEY (projects.id) ON DELETE CASCADE | Parent project |
| title | VARCHAR(100) | No | - | NOT NULL | Column name (e.g., "To Do") |
| position | INTEGER | No | 0 | - | Display order (0-indexed) |
| wip_limit | INTEGER | Yes | NULL | - | Work-in-progress limit (nullable = no limit) |
| created_at | TIMESTAMP | No | NOW() | - | Column creation date |
| updated_at | TIMESTAMP | No | NOW() | - | Last update |

**Indexes:**
- `columns_project_id_idx` on `project_id`
- `columns_project_position_idx` on `(project_id, position)` (for ordering)

---

### tasks

Task cards on Kanban board

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Task ID |
| column_id | UUID | No | - | FOREIGN KEY (columns.id) ON DELETE CASCADE | Current column |
| title | VARCHAR(255) | No | - | NOT NULL | Task title |
| description | TEXT | Yes | NULL | - | Task description (rich text) |
| assignee_id | UUID | Yes | NULL | FOREIGN KEY (users.id) ON DELETE SET NULL | Assigned team member |
| creator_id | UUID | No | - | FOREIGN KEY (users.id) | User who created task |
| priority | ENUM | No | 'medium' | CHECK | 'low', 'medium', 'high', 'urgent' |
| due_date | DATE | Yes | NULL | - | Task deadline |
| position | INTEGER | No | 0 | - | Position within column (for ordering) |
| progress_percentage | DECIMAL(5,2) | No | 0.00 | - | Sub-task completion % |
| total_time_logged | INTEGER | No | 0 | - | Total time in seconds |
| is_overdue | BOOLEAN | No | false | - | Auto-calculated based on due_date |
| created_at | TIMESTAMP | No | NOW() | - | Task creation date |
| updated_at | TIMESTAMP | No | NOW() | - | Last update |
| deleted_at | TIMESTAMP | Yes | NULL | - | Soft delete (trash) timestamp |
| deleted_by | UUID | Yes | NULL | FOREIGN KEY (users.id) | User who deleted task |

**Indexes:**
- `tasks_column_id_idx` on `column_id`
- `tasks_assignee_id_idx` on `assignee_id`
- `tasks_creator_id_idx` on `creator_id`
- `tasks_column_position_idx` on `(column_id, position)` (for ordering)
- `tasks_deleted_at_idx` on `deleted_at` (for trash queries)
- `tasks_due_date_idx` on `due_date`

---

### sub_tasks

Checklist items within tasks

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Sub-task ID |
| task_id | UUID | No | - | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Parent task |
| title | VARCHAR(255) | No | - | NOT NULL | Sub-task title |
| completed | BOOLEAN | No | false | - | Completion status |
| position | INTEGER | No | 0 | - | Display order |
| created_at | TIMESTAMP | No | NOW() | - | Creation date |
| updated_at | TIMESTAMP | No | NOW() | - | Last update |

**Indexes:**
- `sub_tasks_task_id_idx` on `task_id`
- `sub_tasks_task_position_idx` on `(task_id, position)`

---

### labels

Predefined task labels (global or per-project)

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Label ID |
| name | VARCHAR(50) | No | - | NOT NULL | Label name (e.g., "Bug", "Feature") |
| color | VARCHAR(7) | No | '#808080' | - | Hex color code (e.g., "#FF5733") |
| is_system | BOOLEAN | No | true | - | System-defined (true) or custom (false) |
| project_id | UUID | Yes | NULL | FOREIGN KEY (projects.id) ON DELETE CASCADE | NULL for system labels, project_id for custom |
| created_at | TIMESTAMP | No | NOW() | - | Creation date |

**Indexes:**
- `labels_project_id_idx` on `project_id`
- `labels_is_system_idx` on `is_system`

**Default System Labels:**
- Bug (red #EF4444)
- Feature (green #10B981)
- Design (purple #8B5CF6)
- Documentation (blue #3B82F6)
- Improvement (orange #F59E0B)

---

### task_labels

Many-to-many relationship between tasks and labels

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Relationship ID |
| task_id | UUID | No | - | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Task ID |
| label_id | UUID | No | - | FOREIGN KEY (labels.id) ON DELETE CASCADE | Label ID |
| created_at | TIMESTAMP | No | NOW() | - | Assignment date |

**Indexes:**
- `task_labels_task_label_idx` on `(task_id, label_id)` (UNIQUE)
- `task_labels_label_id_idx` on `label_id`

---

### comments

Threaded comments on tasks

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Comment ID |
| task_id | UUID | No | - | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Parent task |
| author_id | UUID | No | - | FOREIGN KEY (users.id) | Comment author |
| text | TEXT | No | - | NOT NULL | Comment content |
| parent_comment_id | UUID | Yes | NULL | FOREIGN KEY (comments.id) ON DELETE CASCADE | For threaded replies |
| mentions | JSONB | No | '[]' | - | Array of user IDs mentioned with @ |
| created_at | TIMESTAMP | No | NOW() | - | Comment creation |
| updated_at | TIMESTAMP | No | NOW() | - | Last edit |
| deleted_at | TIMESTAMP | Yes | NULL | - | Soft delete |

**Indexes:**
- `comments_task_id_idx` on `task_id`
- `comments_author_id_idx` on `author_id`
- `comments_parent_comment_id_idx` on `parent_comment_id`

---

### time_entries

Time tracking logs

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Time entry ID |
| task_id | UUID | No | - | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Task |
| user_id | UUID | No | - | FOREIGN KEY (users.id) | User who logged time |
| duration_seconds | INTEGER | No | 0 | CHECK (>= 0) | Time in seconds |
| description | TEXT | Yes | NULL | - | Manual entry description |
| entry_type | ENUM | No | 'manual' | CHECK | 'timer', 'manual' |
| started_at | TIMESTAMP | Yes | NULL | - | Timer start time (for timer type) |
| ended_at | TIMESTAMP | Yes | NULL | - | Timer end time (for timer type) |
| logged_at | TIMESTAMP | No | NOW() | - | Date logged |

**Indexes:**
- `time_entries_task_id_idx` on `task_id`
- `time_entries_user_id_idx` on `user_id`
- `time_entries_logged_at_idx` on `logged_at`

---

### attachments

File attachments on tasks

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Attachment ID |
| task_id | UUID | No | - | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Parent task |
| uploaded_by | UUID | No | - | FOREIGN KEY (users.id) | Uploader |
| file_name | VARCHAR(255) | No | - | NOT NULL | Original filename |
| file_url | TEXT | No | - | NOT NULL | S3 URL or presigned URL |
| file_size | INTEGER | No | 0 | - | File size in bytes |
| file_type | VARCHAR(50) | No | - | - | MIME type (e.g., "application/pdf") |
| created_at | TIMESTAMP | No | NOW() | - | Upload date |

**Indexes:**
- `attachments_task_id_idx` on `task_id`
- `attachments_uploaded_by_idx` on `uploaded_by`

---

### notifications

User notifications

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Notification ID |
| user_id | UUID | No | - | FOREIGN KEY (users.id) ON DELETE CASCADE | Recipient |
| type | ENUM | No | - | CHECK | 'task_assigned', 'due_date_reminder', 'status_change', 'comment_mention', 'new_comment', 'invitation' |
| title | VARCHAR(255) | No | - | NOT NULL | Notification title |
| message | TEXT | No | - | NOT NULL | Notification message |
| link | TEXT | Yes | NULL | - | Deep link to related resource |
| related_task_id | UUID | Yes | NULL | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Related task (if applicable) |
| related_project_id | UUID | Yes | NULL | FOREIGN KEY (projects.id) ON DELETE CASCADE | Related project |
| is_read | BOOLEAN | No | false | - | Read status |
| sent_at | TIMESTAMP | No | NOW() | - | Notification creation |
| read_at | TIMESTAMP | Yes | NULL | - | When marked as read |

**Indexes:**
- `notifications_user_id_idx` on `user_id`
- `notifications_user_read_idx` on `(user_id, is_read)` (for unread queries)
- `notifications_type_idx` on `type`

---

### activity_logs

Audit trail for task/project changes

| Column | Type | Nullable | Default | Constraints | Description |
|--------|------|----------|---------|-------------|-------------|
| id | UUID | No | uuid_generate_v4() | PRIMARY KEY | Log ID |
| user_id | UUID | No | - | FOREIGN KEY (users.id) | User who performed action |
| project_id | UUID | Yes | NULL | FOREIGN KEY (projects.id) ON DELETE CASCADE | Related project |
| task_id | UUID | Yes | NULL | FOREIGN KEY (tasks.id) ON DELETE CASCADE | Related task |
| action_type | VARCHAR(50) | No | - | NOT NULL | e.g., "task_created", "status_changed", "comment_added" |
| description | TEXT | No | - | NOT NULL | Human-readable description |
| metadata | JSONB | No | '{}' | - | Additional context (old/new values) |
| created_at | TIMESTAMP | No | NOW() | - | Action timestamp |

**Indexes:**
- `activity_logs_user_id_idx` on `user_id`
- `activity_logs_project_id_idx` on `project_id`
- `activity_logs_task_id_idx` on `task_id`
- `activity_logs_created_at_idx` on `created_at`

---

## Relationships

### One-to-Many (1:N)

- `users` ← `projects` (owner_id)
- `projects` ← `columns`
- `columns` ← `tasks`
- `tasks` ← `sub_tasks`
- `tasks` ← `comments`
- `tasks` ← `time_entries`
- `tasks` ← `attachments`
- `users` ← `notifications`
- `users` ← `time_entries`
- `users` ← `comments`

### Many-to-Many (N:M)

- `users` ↔ `projects` (through `project_members`)
- `tasks` ↔ `labels` (through `task_labels`)

### Self-Referencing

- `comments` ← `comments` (parent_comment_id for threaded replies)

## Migrations

### Generate Migration

```bash
cd backend
npm run migration:generate -- -n MigrationName
```

### Run Migrations

```bash
npm run migration:run
```

### Revert Last Migration

```bash
npm run migration:revert
```

## Database Initialization

### Seed Data

Default system labels are created during initial migration:

```sql
INSERT INTO labels (name, color, is_system, project_id) VALUES
  ('Bug', '#EF4444', true, NULL),
  ('Feature', '#10B981', true, NULL),
  ('Design', '#8B5CF6', true, NULL),
  ('Documentation', '#3B82F6', true, NULL),
  ('Improvement', '#F59E0B', true, NULL);
```

### Default Admin User

Created via seed script:

```typescript
{
  email: 'admin@taskboard.com',
  password: bcrypt.hashSync('Admin@123', 10),
  name: 'System Admin',
  role: 'admin',
  email_verified: true
}
```

## Indexes Summary

All foreign keys have indexes for performance.
Additional composite indexes for common queries:
- Tasks by column and position
- Project members by project and user
- Notifications by user and read status
- Activity logs by timestamp for recent activity

## Performance Considerations

### Query Optimization

- Use `SELECT` with specific columns instead of `SELECT *`
- Leverage indexes for WHERE, JOIN, and ORDER BY clauses
- Use pagination for large result sets
- Implement database connection pooling

### Caching Strategy

- Cache project board state in Redis for real-time WebSocket updates
- Invalidate cache on task/column updates
- Cache user permissions for authorization checks

### Soft Delete Queries

Always include `WHERE deleted_at IS NULL` for active records:

```sql
SELECT * FROM tasks WHERE deleted_at IS NULL AND column_id = $1;
```

For trash view:

```sql
SELECT * FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at > NOW() - INTERVAL '30 days';
```

---

**Last Updated**: 2026-02-16
