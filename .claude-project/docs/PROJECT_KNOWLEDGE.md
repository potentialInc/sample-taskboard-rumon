# Project Knowledge: TaskBoard

## Overview

TaskBoard is a lightweight, mobile-first project management platform centered around Kanban boards. It enables project owners to organize work visually, assign tasks to team members, and track progress in real-time. The platform focuses on simplicity and real-time collaboration without the complexity of traditional enterprise PM tools.

### Goals

1. Provide a simple, intuitive Kanban board experience with real-time synchronization across all users
2. Enable project owners to track team progress through automated dashboards and completion metrics
3. Facilitate team collaboration through task comments, file attachments, and notification-driven workflows

### Key Features

- **Real-Time Kanban Boards**: Drag-and-drop task management with WebSocket synchronization
- **Task Management**: Full task lifecycle with sub-tasks, time tracking, comments, and attachments
- **Multiple Views**: Board view, Calendar view for different workflows
- **Progress Tracking**: Automated dashboards with completion metrics and analytics
- **Team Collaboration**: Comments with @mentions, file attachments (up to 10MB), and threaded discussions
- **Notifications**: Push and email notifications for assignments, deadlines, and activity
- **Time Tracking**: Built-in timer and manual time entry per task
- **Soft Delete**: 30-day trash recovery for deleted tasks

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Frontend**: React (Web App)
- **Mobile**: React Native (iOS & Android)
- **Admin Dashboard**: React
- **Database**: PostgreSQL with TypeORM
- **Real-Time**: WebSocket (Socket.io)
- **Authentication**: JWT with httpOnly cookies, Google OAuth
- **File Storage**: AWS S3
- **Email Service**: SendGrid
- **Deployment**: Docker

## Architecture

```
taskboard-by-rumon/
├── backend/                    # NestJS API server (port 3000)
│   ├── src/
│   │   ├── modules/           # Feature modules (auth, projects, tasks, users, etc.)
│   │   ├── entities/          # TypeORM entities
│   │   ├── dto/               # Data transfer objects
│   │   ├── guards/            # Auth guards and permissions
│   │   ├── websocket/         # WebSocket gateway for real-time sync
│   │   └── services/          # Business logic
│   └── uploads/               # Temporary file uploads (before S3)
├── frontend/                   # React web application (port 5173)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components (Projects, Tasks, Calendar, etc.)
│   │   ├── services/          # API service layer (axios)
│   │   ├── contexts/          # React contexts (Auth, WebSocket)
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript interfaces
│   └── public/                # Static assets
├── mobile/                     # React Native mobile app
│   ├── src/
│   │   ├── screens/           # Mobile screens
│   │   ├── components/        # React Native components
│   │   ├── navigation/        # React Navigation setup
│   │   └── services/          # API services
│   └── android/ & ios/        # Native platform code
├── dashboard/                  # Admin dashboard (React, port 5174)
│   ├── src/
│   │   ├── pages/             # Admin pages (Users, Projects, Settings, etc.)
│   │   ├── components/        # Admin UI components
│   │   └── services/          # Admin API services
│   └── public/
├── .claude/                    # Framework-specific skills & agents
├── .claude-project/            # Project documentation
│   ├── docs/                  # Technical documentation
│   ├── prd/                   # Product requirements
│   └── resources/HTML/        # HTML prototypes
└── docker-compose.yml          # Service orchestration
```

## User Types

### Project Owner
- Creates and manages projects
- Builds Kanban boards with custom columns
- Creates and assigns tasks to team members
- Invites team members via email
- Monitors project progress via dashboard
- Full edit and delete permissions

### Team Member
- Views projects they're invited to
- Creates tasks
- Edits own tasks
- Drags cards between columns
- Adds comments, attachments, and logs time
- Cannot manage project settings or members

### Admin
- Manages all users and projects
- Monitors system usage analytics
- Configures system settings (labels, file limits, notifications)
- Exports system-wide data

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| httpOnly Cookie Authentication | Prevents XSS token theft, more secure than localStorage | 2026-02-09 |
| Soft Delete with 30-Day Trash | Allows recovery from accidental deletions, user safety | 2026-02-09 |
| WebSocket for Real-Time Sync | Enables instant board updates across all connected users | 2026-02-09 |
| Mobile-First Design | Primary use case is mobile task management on-the-go | 2026-02-09 |
| No WIP Limit Enforcement | Warning only, not blocking - keeps UX simple | 2026-02-09 |
| Team Members Can Create Tasks | Reduces bottleneck, enables faster task capture | 2026-02-09 |
| AWS S3 for File Storage | Scalable, reliable, industry-standard file storage | 2026-02-09 |
| SendGrid for Emails | Reliable email delivery with templates and analytics | 2026-02-09 |
| PostgreSQL Database | ACID compliance, complex queries, JSON support | 2026-02-09 |

## Development Setup

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>

# Start services
docker-compose up -d
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | Database connection string | Yes | - | `postgresql://user:pass@localhost:5432/db` |
| `AUTH_JWT_SECRET` | JWT signing secret (use strong random string) | Yes | - | `your-secure-secret-key-min-32-chars` |
| `AUTH_TOKEN_COOKIE_NAME` | Access token cookie name | No | `accessToken` | `accessToken` |
| `AUTH_TOKEN_EXPIRE_TIME` | Access token expiration | No | `24h` | `24h`, `1d`, `3600s` |
| `AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME` | Extended expiration for "remember me" | No | `30d` | `30d`, `720h` |
| `AUTH_REFRESH_TOKEN_COOKIE_NAME` | Refresh token cookie name | No | `refreshToken` | `refreshToken` |
| `AUTH_REFRESH_TOKEN_EXPIRE_TIME` | Refresh token expiration | No | `7d` | `7d`, `168h` |
| `FRONTEND_URL` | Frontend URL for CORS allowlist | Yes | `http://localhost:5173` | `https://app.example.com` |
| `MODE` | Environment mode (affects cookie security) | Yes | `DEV` | `DEV`, `PROD` |

### Frontend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | `http://localhost:3000/api` | `https://api.example.com` |

### Cookie Security Configuration

**Automatically configured based on `MODE` environment variable:**

| Setting | Development (`MODE=DEV`) | Production (`MODE=PROD`) |
|---------|--------------------------|--------------------------|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` (HTTPS only) |
| `sameSite` | `'lax'` | `'strict'` |
| `path` | `'/'` | `'/'` |

**Cookie Expiration:**
- **Access Token**: 24 hours (or extended to 30 days with "Remember Me")
- **Refresh Token**: 7 days

**Security Notes:**

1. **httpOnly Flag**: Prevents JavaScript access to cookies (XSS protection)
2. **Secure Flag**: Ensures cookies only sent over HTTPS in production
3. **SameSite Policy**: Prevents CSRF attacks (`strict` in production, `lax` in dev for easier testing)
4. **Short-lived Access Tokens**: Reduces exposure window if token compromised
5. **Long-lived Refresh Tokens**: Enables automatic token refresh without re-login

### Authentication Environment Variables Explained

**`AUTH_JWT_SECRET`:**
- Used to sign JWT tokens
- Must be a strong, random string (minimum 32 characters recommended)
- NEVER commit this to version control
- Use different secrets for dev/staging/production

**`AUTH_TOKEN_EXPIRE_TIME`:**
- How long access token remains valid
- Shorter = more secure but more frequent refreshes
- Recommended: 15min-24h range
- Format: `1h`, `24h`, `1d`, `86400s`

**`AUTH_REFRESH_TOKEN_EXPIRE_TIME`:**
- How long refresh token remains valid
- Longer = less frequent re-logins needed
- Recommended: 7d-30d range
- User must re-login after this expires

**`MODE`:**
- Controls cookie security flags
- `DEV`: Allows http, relaxed sameSite for local development
- `PROD`: Enforces https, strict sameSite for production security

**`FRONTEND_URL`:**
- CORS allowlist for cookie-based auth
- Must match exact origin (protocol + domain + port)
- Multiple origins: Use comma-separated list or array

## Security Architecture

### Authentication Security Model

This project uses **httpOnly cookie-based authentication** to prevent XSS token theft.

#### Why httpOnly Cookies Over localStorage?

| Attack Vector | localStorage | httpOnly Cookie | Winner |
|---------------|--------------|-----------------|--------|
| **XSS (Cross-Site Scripting)** | ❌ VULNERABLE - JS can access tokens | ✅ PROTECTED - JS cannot access | Cookie |
| **CSRF (Cross-Site Request Forgery)** | ✅ Not applicable | ⚠️ Possible (mitigated with SameSite) | Tie with mitigation |
| **Man-in-the-Middle** | ❌ Vulnerable without HTTPS | ✅ Protected with Secure flag | Cookie |
| **Token Theft via DevTools** | ❌ Visible in Application tab | ✅ Hidden from JavaScript | Cookie |

**Verdict**: httpOnly cookies are significantly more secure for web applications.

#### Security Features Implemented

1. **httpOnly Cookies**
   - Tokens inaccessible to JavaScript
   - Prevents XSS token theft
   - Automatic browser management

2. **Secure Flag (Production)**
   - Cookies only sent over HTTPS
   - Prevents man-in-the-middle token interception
   - Automatically enabled when `MODE=PROD`

3. **SameSite Policy**
   - `strict` in production: Blocks all cross-site requests
   - `lax` in development: Allows top-level navigation
   - Prevents CSRF attacks

4. **Short-lived Access Tokens**
   - 24-hour expiration (default)
   - Reduces exposure window if compromised
   - Automatic refresh via refresh token

5. **Long-lived Refresh Tokens**
   - 7-day expiration (default)
   - Enables seamless token refresh
   - Stored as httpOnly cookie

6. **CORS with Credentials**
   - Explicit origin allowlist
   - Credentials required for cookie transmission
   - Prevents unauthorized cross-origin requests

#### Threat Model & Mitigations

| Threat | Mitigation |
|--------|------------|
| XSS injects malicious script | httpOnly cookies prevent token access |
| CSRF forces unwanted actions | SameSite policy blocks cross-site requests |
| MITM intercepts tokens | Secure flag + HTTPS enforcement |
| Token stolen from localStorage | Tokens never stored in localStorage |
| Replay attack with old token | Short-lived tokens with expiration |
| Session hijacking | Token refresh rotation + device tracking (optional) |

#### Security Best Practices

**✅ DO:**
- Use httpOnly cookies for all authentication tokens
- Enable Secure flag in production (HTTPS)
- Use SameSite=Strict in production
- Implement short-lived access tokens (15min-24h)
- Implement automatic token refresh
- Log and monitor authentication failures
- Use HTTPS in production
- Rotate JWT secret regularly

**❌ DON'T:**
- Store tokens in localStorage or sessionStorage
- Return tokens in response body (use Set-Cookie headers)
- Disable httpOnly flag
- Use long-lived access tokens (>24h)
- Ignore CORS configuration
- Use SameSite=None without good reason
- Allow credentials from all origins (*)

#### Compliance Considerations

- **GDPR**: Cookies require user consent in EU
- **OWASP Top 10**: Mitigates A02:2021 (Cryptographic Failures), A07:2021 (Identification and Authentication Failures)
- **PCI DSS**: Supports secure authentication requirements
- **SOC 2**: Demonstrates security controls for authentication

#### Further Reading

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)

---

## Core Modules

### Module 1: Project Management
- Project creation with customizable Kanban templates
- Team member invitation via email or link
- Project settings (title, description, deadline, columns)
- Archive and delete functionality

### Module 2: Task Management
- Create tasks with rich details (title, description, assignee, priority, due date, labels)
- Drag-and-drop between columns
- Sub-tasks with checklist and progress tracking
- Time tracking (timer and manual entry)
- File attachments (PDF, PNG, JPG, DOCX, XLSX - max 10MB)
- Threaded comments with @mentions
- Activity log for task history

### Module 3: Real-Time Collaboration
- WebSocket synchronization for instant updates
- Live board updates when cards are dragged
- Real-time notifications for assignments and comments
- Multi-user concurrent editing

### Module 4: Progress Tracking
- Project dashboard with completion metrics
- Charts: Tasks per status, Tasks per priority, Member workload, Completion trend
- Overdue task tracking
- Time logged per project
- CSV export for reports

### Module 5: Views
- **Board View**: Kanban columns with drag-and-drop cards
- **Calendar View**: Monthly/weekly calendar with tasks on due dates
- **My Tasks**: Personal task list across all projects
- **Trash View**: 30-day recoverable deleted tasks

### Module 6: Notifications
- Push notifications (mobile)
- Email notifications (invitations, deadline reminders, daily digest)
- In-app notification center with types:
  - Task assignments
  - Due date reminders
  - Status changes
  - Comment mentions
  - New comments
  - Project invitations

### Module 7: Admin Management
- User management (CRUD, suspend/activate, role changes)
- Project management (view, archive, delete)
- System analytics and dashboards
- Configuration (labels, file limits, notification defaults)
- Data export (users, projects, tasks)

## External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| **Google OAuth** | Social login authentication for user signup/login | [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2) |
| **SendGrid** | Email notifications for invitations, deadline reminders, and daily digest | [SendGrid API Docs](https://docs.sendgrid.com/) |
| **AWS S3** | File attachment storage for documents and images uploaded to tasks | [AWS S3 Docs](https://docs.aws.amazon.com/s3/) |
| **Socket.io** | WebSocket library for real-time board synchronization | [Socket.io Docs](https://socket.io/docs/) |

## Technical Constraints

### File Upload Limits
- **Maximum File Size**: 10MB per file
- **Allowed File Types**: PDF, PNG, JPG, DOCX, XLSX
- **Storage**: AWS S3 with presigned URLs for secure access

### Real-Time Requirements
- WebSocket connections must handle concurrent users on same board
- Board updates must propagate within 100ms
- Graceful fallback if WebSocket connection fails

### Soft Delete System
- Deleted tasks remain in database for 30 days
- Auto-cleanup job runs daily to permanently delete expired tasks
- Restore functionality available to Project Owners

### Notification System
- Push notifications for mobile (iOS & Android)
- Email notifications configurable per user
- Batch notifications to prevent spam (max 1 email per 15 minutes for non-critical)

### Performance Requirements
- Board loading: < 2 seconds for boards with 100+ tasks
- Task creation: < 500ms response time
- File upload: Progress indicator for files > 1MB
- Calendar view: Lazy loading for months not in current view

## Terminology

| Term | Definition |
|------|------------|
| **Board** | A Kanban-style project workspace containing columns and task cards |
| **Column** | A vertical list on the board representing a task status (e.g., To Do, In Progress, Done) |
| **Card** | A task item displayed on the board that can be dragged between columns |
| **Label** | A color-coded tag attached to tasks for categorization (Bug, Feature, Design, Documentation, Improvement) |
| **Assignee** | The team member responsible for completing a task |
| **WIP Limit** | Work In Progress limit - maximum number of cards allowed in a column (warning only, not enforced) |
| **Backlog** | A holding area for tasks that are planned but not yet moved to the active board |
| **Sub-Task** | Checklist-style items within a task with checkboxes and progress tracking |
| **Time Entry** | Logged time spent on a task (from timer or manual entry) |
| **Soft Delete** | Tasks moved to Trash with 30-day recovery period before permanent deletion |
