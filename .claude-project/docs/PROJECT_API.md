# API Reference: taskboard-by-rumon

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.taskboard-by-rumon.com`

## Authentication

This API uses **httpOnly cookie-based authentication** for secure session management.

### 🍪 For Browser/Web Clients (PRIMARY METHOD)

Authentication is handled automatically via httpOnly cookies:

**Flow:**
1. Client calls `POST /auth/login` with credentials
2. Backend validates and sets `accessToken` and `refreshToken` as httpOnly cookies via `Set-Cookie` header
3. All subsequent requests automatically include cookies (browser handles this)
4. Frontend uses `withCredentials: true` in axios/fetch configuration
5. **NO tokens stored in localStorage or sessionStorage**

**Cookie Configuration:**
```
HttpOnly: true       # JavaScript cannot access (XSS protection)
Secure: true         # HTTPS only (production)
SameSite: Strict     # CSRF protection (production)
Path: /
Max-Age: 86400       # 24 hours (access token)
```

**Frontend Setup:**
```javascript
// axios configuration
axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,  // REQUIRED to include cookies
})
```

**Backend CORS:**
```javascript
// NestJS main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true  // REQUIRED to allow cookies
})
```

### 🔑 For API Clients/External Services (FALLBACK)

Bearer token authentication is supported for non-browser clients:

```
Authorization: Bearer <token>
```

Obtain token via login endpoint, then pass in Authorization header for subsequent requests.

**When to use:**
- Mobile apps (non-web views)
- External API clients (Postman, curl, third-party)
- Server-to-server communication
- Command-line tools

**Note**: Web browsers should ALWAYS use cookies for security.

---

## Endpoints Overview

### Authentication
- [POST /auth/register](#post-authregister)
- [POST /auth/login](#post-authlogin)
- [POST /auth/logout](#post-authlogout)
- [POST /auth/refresh](#post-authrefresh)
- [POST /auth/forgot-password](#post-authforgot-password)
- [POST /auth/reset-password](#post-authreset-password)
- [POST /auth/verify-email](#post-authverify-email)
- [POST /auth/google](#post-authgoogle)

### Users
- [GET /users/me](#get-usersme)
- [GET /users/:id](#get-usersid)
- [PATCH /users/me](#patch-usersme)
- [PATCH /users/me/preferences](#patch-usersmepreferences)

### Projects
- [GET /projects](#get-projects)
- [POST /projects](#post-projects)
- [GET /projects/:id](#get-projectsid)
- [PATCH /projects/:id](#patch-projectsid)
- [DELETE /projects/:id](#delete-projectsid)
- [POST /projects/:id/archive](#post-projectsidarchive)
- [POST /projects/:id/restore](#post-projectsidrestore)
- [GET /projects/:id/members](#get-projectsidmembers)
- [POST /projects/:id/members](#post-projectsidmembers)
- [DELETE /projects/:id/members/:userId](#delete-projectsidmembersuserid)
- [GET /projects/:id/dashboard](#get-projectsiddashboard)
- [GET /projects/:id/export](#get-projectsidexport)

### Columns
- [GET /projects/:projectId/columns](#get-projectsprojectidcolumns)
- [POST /projects/:projectId/columns](#post-projectsprojectidcolumns)
- [PATCH /columns/:id](#patch-columnsid)
- [DELETE /columns/:id](#delete-columnsid)
- [POST /columns/:id/reorder](#post-columnsidreorder)

### Tasks
- [GET /tasks](#get-tasks)
- [POST /tasks](#post-tasks)
- [GET /tasks/:id](#get-tasksid)
- [PATCH /tasks/:id](#patch-tasksid)
- [DELETE /tasks/:id](#delete-tasksid)
- [POST /tasks/:id/move](#post-tasksidmove)
- [POST /tasks/:id/assign](#post-tasksidassign)
- [DELETE /tasks/:id/assign](#delete-tasksidassign)
- [POST /tasks/:id/labels](#post-tasksidlabels)
- [DELETE /tasks/:id/labels/:labelId](#delete-tasksidlabelslabelid)
- [GET /tasks/trash](#get-taskstrash)
- [POST /tasks/:id/restore](#post-tasksidrestore)
- [DELETE /tasks/:id/permanent](#delete-tasksidpermanent)
- [GET /tasks/overdue](#get-tasksoverdue)
- [GET /tasks/calendar](#get-taskscalendar)

### Sub-Tasks
- [GET /tasks/:taskId/subtasks](#get-taskstaskidsubtasks)
- [POST /tasks/:taskId/subtasks](#post-taskstaskidsubtasks)
- [PATCH /subtasks/:id](#patch-subtasksid)
- [DELETE /subtasks/:id](#delete-subtasksid)
- [POST /subtasks/:id/toggle](#post-subtasksidtoggle)
- [POST /subtasks/:id/reorder](#post-subtasksidreorder)

### Comments
- [GET /tasks/:taskId/comments](#get-taskstaskidcomments)
- [POST /tasks/:taskId/comments](#post-taskstaskidcomments)
- [PATCH /comments/:id](#patch-commentsid)
- [DELETE /comments/:id](#delete-commentsid)
- [POST /comments/:id/replies](#post-commentsidoeplies)

### Time Entries
- [GET /tasks/:taskId/time-entries](#get-taskstaskidtime-entries)
- [POST /tasks/:taskId/time-entries](#post-taskstaskidtime-entries)
- [PATCH /time-entries/:id](#patch-time-entriesid)
- [DELETE /time-entries/:id](#delete-time-entriesid)
- [POST /time-entries/start](#post-time-entriesstart)
- [POST /time-entries/stop](#post-time-entriesstop)
- [GET /users/me/time-entries](#get-usersmetime-entries)

### Attachments
- [GET /tasks/:taskId/attachments](#get-taskstaskidattachments)
- [POST /tasks/:taskId/attachments](#post-taskstaskidattachments)
- [DELETE /attachments/:id](#delete-attachmentsid)
- [GET /attachments/:id/presigned-url](#get-attachmentsidpresigned-url)

### Notifications
- [GET /notifications](#get-notifications)
- [PATCH /notifications/:id/read](#patch-notificationsidread)
- [POST /notifications/mark-all-read](#post-notificationsmark-all-read)
- [GET /notifications/unread-count](#get-notificationsunread-count)

### Labels
- [GET /labels](#get-labels)
- [POST /projects/:projectId/labels](#post-projectsprojectidlabels)
- [PATCH /labels/:id](#patch-labelsid)
- [DELETE /labels/:id](#delete-labelsid)

### Activity Logs
- [GET /tasks/:taskId/activities](#get-taskstaskidactivities)
- [GET /projects/:projectId/activities](#get-projectsprojectidactivities)
- [GET /activities/recent](#get-activitiesrecent)

### Admin Endpoints
- [GET /admin/users](#get-adminusers)
- [POST /admin/users](#post-adminusers)
- [PATCH /admin/users/:id](#patch-adminusersid)
- [DELETE /admin/users/:id](#delete-adminusersid)
- [POST /admin/users/:id/suspend](#post-adminusersidsuspend)
- [POST /admin/users/:id/activate](#post-adminusersidactivate)
- [GET /admin/projects](#get-adminprojects)
- [DELETE /admin/projects/:id](#delete-adminprojectsid)
- [GET /admin/settings](#get-adminsettings)
- [PATCH /admin/settings](#patch-adminsettings)
- [GET /admin/export](#get-adminexport)
- [GET /admin/dashboard](#get-admindashboard)

---

## Detailed Endpoint Documentation

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "jobTitle": "Project Manager"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "jobTitle": "Project Manager",
      "role": "USER",
      "isEmailVerified": false,
      "createdAt": "2026-02-16T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid input data
  ```json
  {
    "success": false,
    "message": "Email already exists",
    "statusCode": 400
  }
  ```
- **422 Unprocessable Entity:** Validation errors
  ```json
  {
    "success": false,
    "message": "Password must be at least 8 characters",
    "statusCode": 422
  }
  ```

---

### POST /auth/login

Login user with email and password.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "jobTitle": "Project Manager",
      "role": "USER",
      "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg",
      "isEmailVerified": true
    }
  }
}
```

**Response Headers (Set-Cookie):**
```http
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
```

**Error Responses:**
- **401 Unauthorized:** Invalid credentials
  ```json
  {
    "success": false,
    "message": "Invalid email or password",
    "statusCode": 401
  }
  ```
- **403 Forbidden:** Email not verified
  ```json
  {
    "success": false,
    "message": "Please verify your email before logging in",
    "statusCode": 403
  }
  ```

---

### POST /auth/logout

Logout current user and clear auth cookies.

**Auth Required:** Yes

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response Headers:**
```http
Set-Cookie: accessToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Auth Required:** Yes (Refresh Token)

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Response Headers:**
```http
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

**Error Responses:**
- **401 Unauthorized:** Invalid or expired refresh token
  ```json
  {
    "success": false,
    "message": "Invalid refresh token",
    "statusCode": 401
  }
  ```

---

### POST /auth/forgot-password

Send password reset email.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

**Note:** Always returns success to prevent email enumeration attacks.

---

### POST /auth/reset-password

Reset password using token from email.

**Auth Required:** No

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
- **400 Bad Request:** Invalid or expired token
  ```json
  {
    "success": false,
    "message": "Invalid or expired reset token",
    "statusCode": 400
  }
  ```

---

### POST /auth/verify-email

Verify email address using token.

**Auth Required:** No

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

**Error Responses:**
- **400 Bad Request:** Invalid or expired token
  ```json
  {
    "success": false,
    "message": "Invalid or expired verification token",
    "statusCode": 400
  }
  ```

---

### POST /auth/google

Authenticate using Google OAuth.

**Auth Required:** No

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0M..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@gmail.com",
      "profilePhoto": "https://lh3.googleusercontent.com/...",
      "role": "USER",
      "isEmailVerified": true
    },
    "isNewUser": false
  }
}
```

**Response Headers:** Same as login (Set-Cookie)

---

## User Endpoints

### GET /users/me

Get current user profile.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "jobTitle": "Project Manager",
      "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg",
      "role": "USER",
      "isEmailVerified": true,
      "preferences": {
        "pushNotifications": true,
        "emailDigest": "daily",
        "notificationTypes": {
          "taskAssigned": true,
          "dueDateReminder": true,
          "statusChange": true,
          "commentMention": true,
          "newComment": false,
          "invitation": true
        }
      },
      "createdAt": "2026-01-15T10:30:00.000Z",
      "lastActive": "2026-02-16T14:22:00.000Z"
    }
  }
}
```

---

### GET /users/:id

Get user by ID (for assignment dropdowns).

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - User ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg",
      "jobTitle": "Project Manager"
    }
  }
}
```

**Error Responses:**
- **404 Not Found:** User not found

---

### PATCH /users/me

Update current user profile.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "John Smith",
  "jobTitle": "Senior Project Manager",
  "profilePhoto": "https://s3.amazonaws.com/bucket/new-profile.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Smith",
      "email": "john.doe@example.com",
      "jobTitle": "Senior Project Manager",
      "profilePhoto": "https://s3.amazonaws.com/bucket/new-profile.jpg",
      "role": "USER",
      "updatedAt": "2026-02-16T14:30:00.000Z"
    }
  }
}
```

---

### PATCH /users/me/preferences

Update user notification preferences.

**Auth Required:** Yes

**Request Body:**
```json
{
  "pushNotifications": true,
  "emailDigest": "weekly",
  "notificationTypes": {
    "taskAssigned": true,
    "dueDateReminder": true,
    "statusChange": false,
    "commentMention": true,
    "newComment": false,
    "invitation": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "pushNotifications": true,
      "emailDigest": "weekly",
      "notificationTypes": {
        "taskAssigned": true,
        "dueDateReminder": true,
        "statusChange": false,
        "commentMention": true,
        "newComment": false,
        "invitation": true
      }
    }
  }
}
```

---

## Project Endpoints

### GET /projects

List all projects for current user.

**Auth Required:** Yes

**Query Parameters:**
- `filter` (string, optional): `all`, `active`, `completed`, `archived` (default: `all`)
- `search` (string, optional): Search by project name
- `sort` (string, optional): `recent`, `deadline`, `name` (default: `recent`)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440000",
        "title": "Website Redesign",
        "description": "Complete redesign of company website",
        "deadline": "2026-03-31T23:59:59.000Z",
        "status": "active",
        "completionPercentage": 67,
        "totalTasks": 45,
        "completedTasks": 30,
        "overdueTasks": 3,
        "memberCount": 5,
        "owner": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe",
          "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg"
        },
        "members": [
          {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "name": "Jane Smith",
            "profilePhoto": "https://s3.amazonaws.com/bucket/jane.jpg"
          }
        ],
        "createdAt": "2026-01-10T10:00:00.000Z",
        "updatedAt": "2026-02-16T14:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### POST /projects

Create new project (Project Owner only).

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Mobile App Development",
  "description": "Build new mobile application for iOS and Android",
  "deadline": "2026-06-30T23:59:59.000Z",
  "template": "default",
  "customColumns": [
    {
      "name": "To Do",
      "position": 0,
      "wipLimit": null
    },
    {
      "name": "In Progress",
      "position": 1,
      "wipLimit": 5
    },
    {
      "name": "Review",
      "position": 2,
      "wipLimit": 3
    },
    {
      "name": "Done",
      "position": 3,
      "wipLimit": null
    }
  ],
  "inviteEmails": ["alice@example.com", "bob@example.com"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully. Invitations sent.",
  "data": {
    "project": {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "title": "Mobile App Development",
      "description": "Build new mobile application for iOS and Android",
      "deadline": "2026-06-30T23:59:59.000Z",
      "status": "active",
      "ownerId": "550e8400-e29b-41d4-a716-446655440000",
      "columns": [
        {
          "id": "col-1",
          "name": "To Do",
          "position": 0,
          "wipLimit": null
        },
        {
          "id": "col-2",
          "name": "In Progress",
          "position": 1,
          "wipLimit": 5
        },
        {
          "id": "col-3",
          "name": "Review",
          "position": 2,
          "wipLimit": 3
        },
        {
          "id": "col-4",
          "name": "Done",
          "position": 3,
          "wipLimit": null
        }
      ],
      "createdAt": "2026-02-16T15:00:00.000Z"
    }
  }
}
```

**Templates:**
- `default`: To Do → In Progress → Review → Done
- `minimal`: To Do → Done
- `custom`: User-defined columns (provide `customColumns` array)

---

### GET /projects/:id

Get project details.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "title": "Website Redesign",
      "description": "Complete redesign of company website",
      "deadline": "2026-03-31T23:59:59.000Z",
      "status": "active",
      "completionPercentage": 67,
      "totalTasks": 45,
      "completedTasks": 30,
      "overdueTasks": 3,
      "owner": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg"
      },
      "members": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Jane Smith",
          "email": "jane.smith@example.com",
          "profilePhoto": "https://s3.amazonaws.com/bucket/jane.jpg",
          "role": "MEMBER"
        }
      ],
      "columns": [
        {
          "id": "col-1",
          "name": "To Do",
          "position": 0,
          "wipLimit": null,
          "taskCount": 12
        },
        {
          "id": "col-2",
          "name": "In Progress",
          "position": 1,
          "wipLimit": 5,
          "taskCount": 4
        }
      ],
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-02-16T14:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- **403 Forbidden:** User not a member of project
- **404 Not Found:** Project not found

---

### PATCH /projects/:id

Update project details (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID

**Request Body:**
```json
{
  "title": "Website Redesign v2",
  "description": "Updated description",
  "deadline": "2026-04-30T23:59:59.000Z"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "title": "Website Redesign v2",
      "description": "Updated description",
      "deadline": "2026-04-30T23:59:59.000Z",
      "updatedAt": "2026-02-16T15:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **403 Forbidden:** User is not project owner

---

### DELETE /projects/:id

Permanently delete project (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted permanently"
}
```

**Error Responses:**
- **403 Forbidden:** User is not project owner

---

### POST /projects/:id/archive

Archive project (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project archived successfully",
  "data": {
    "project": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "status": "archived",
      "archivedAt": "2026-02-16T15:45:00.000Z"
    }
  }
}
```

---

### POST /projects/:id/restore

Restore archived project (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project restored successfully",
  "data": {
    "project": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "archivedAt": null
    }
  }
}
```

---

### GET /projects/:id/members

Get project members list.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg",
        "role": "OWNER",
        "joinedAt": "2026-01-10T10:00:00.000Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "profilePhoto": "https://s3.amazonaws.com/bucket/jane.jpg",
        "role": "MEMBER",
        "joinedAt": "2026-01-11T09:30:00.000Z"
      }
    ]
  }
}
```

---

### POST /projects/:id/members

Invite members to project (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID

**Request Body:**
```json
{
  "emails": ["alice@example.com", "bob@example.com"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitations sent successfully",
  "data": {
    "invited": ["alice@example.com", "bob@example.com"],
    "alreadyMembers": [],
    "invitationLink": "https://taskboard.com/invite/abc123xyz"
  }
}
```

---

### DELETE /projects/:id/members/:userId

Remove member from project (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID
- `userId` (UUID) - User ID to remove

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member removed from project"
}
```

**Error Responses:**
- **400 Bad Request:** Cannot remove project owner
- **403 Forbidden:** User is not project owner

---

### GET /projects/:id/dashboard

Get project dashboard statistics.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Project ID

**Query Parameters:**
- `startDate` (ISO date, optional): Filter start date
- `endDate` (ISO date, optional): Filter end date
- `assigneeId` (UUID, optional): Filter by assignee
- `priority` (string, optional): Filter by priority

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTasks": 45,
      "completedTasks": 30,
      "overdueTasks": 3,
      "completionPercentage": 67,
      "totalTimeLogged": 18540
    },
    "tasksByStatus": {
      "To Do": 12,
      "In Progress": 4,
      "Review": 2,
      "Done": 30
    },
    "tasksByPriority": {
      "low": 10,
      "medium": 20,
      "high": 12,
      "urgent": 3
    },
    "memberWorkload": [
      {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "assignedTasks": 15,
        "completedTasks": 10,
        "timeLogged": 7200
      }
    ],
    "completionTrend": [
      {
        "date": "2026-02-10",
        "completed": 5
      },
      {
        "date": "2026-02-11",
        "completed": 3
      }
    ]
  }
}
```

---

### GET /projects/:id/export

Export project data as CSV (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Project ID

**Query Parameters:**
- `format` (string, optional): `csv` (default)
- `include` (string[], optional): `tasks`, `members`, `time-entries`

**Success Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="project-website-redesign-2026-02-16.csv"

Task ID,Title,Status,Priority,Assignee,Due Date,Completed,Time Logged
task-1,Design homepage,Done,high,John Doe,2026-02-15,true,3600
task-2,Setup backend,In Progress,medium,Jane Smith,2026-02-20,false,7200
```

---

## Column Endpoints

### GET /projects/:projectId/columns

Get all columns for a project.

**Auth Required:** Yes

**URL Parameters:**
- `projectId` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": "col-1",
        "name": "To Do",
        "position": 0,
        "wipLimit": null,
        "taskCount": 12,
        "projectId": "650e8400-e29b-41d4-a716-446655440000"
      },
      {
        "id": "col-2",
        "name": "In Progress",
        "position": 1,
        "wipLimit": 5,
        "taskCount": 4,
        "projectId": "650e8400-e29b-41d4-a716-446655440000"
      }
    ]
  }
}
```

---

### POST /projects/:projectId/columns

Create new column (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `projectId` (UUID) - Project ID

**Request Body:**
```json
{
  "name": "Testing",
  "position": 2,
  "wipLimit": 3
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "column": {
      "id": "col-5",
      "name": "Testing",
      "position": 2,
      "wipLimit": 3,
      "taskCount": 0,
      "projectId": "650e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-02-16T16:00:00.000Z"
    }
  }
}
```

---

### PATCH /columns/:id

Update column (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Column ID

**Request Body:**
```json
{
  "name": "QA Testing",
  "wipLimit": 5
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "column": {
      "id": "col-5",
      "name": "QA Testing",
      "position": 2,
      "wipLimit": 5,
      "updatedAt": "2026-02-16T16:10:00.000Z"
    }
  }
}
```

---

### DELETE /columns/:id

Delete column (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Column ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Column deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request:** Cannot delete column with tasks
  ```json
  {
    "success": false,
    "message": "Cannot delete column with tasks. Move tasks first.",
    "statusCode": 400
  }
  ```

---

### POST /columns/:id/reorder

Reorder column position (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Column ID

**Request Body:**
```json
{
  "newPosition": 1
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Column reordered successfully",
  "data": {
    "columns": [
      {
        "id": "col-1",
        "name": "To Do",
        "position": 0
      },
      {
        "id": "col-5",
        "name": "Testing",
        "position": 1
      },
      {
        "id": "col-2",
        "name": "In Progress",
        "position": 2
      }
    ]
  }
}
```

---

## Task Endpoints

### GET /tasks

Get tasks with filters.

**Auth Required:** Yes

**Query Parameters:**
- `projectId` (UUID, optional): Filter by project
- `assigneeId` (UUID, optional): Filter by assignee
- `status` (string, optional): Filter by status/column
- `priority` (string, optional): `low`, `medium`, `high`, `urgent`
- `search` (string, optional): Search by title
- `dueDate` (string, optional): `overdue`, `today`, `week`, `month`
- `labels` (UUID[], optional): Filter by label IDs
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `sort` (string, optional): `dueDate`, `priority`, `createdAt` (default: `createdAt`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-1",
        "title": "Design homepage mockup",
        "description": "Create high-fidelity mockup for homepage redesign",
        "status": "In Progress",
        "priority": "high",
        "dueDate": "2026-02-20T23:59:59.000Z",
        "isOverdue": false,
        "columnId": "col-2",
        "projectId": "650e8400-e29b-41d4-a716-446655440000",
        "project": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "title": "Website Redesign"
        },
        "assignee": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe",
          "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg"
        },
        "labels": [
          {
            "id": "label-1",
            "name": "Design",
            "color": "#FF6B6B"
          }
        ],
        "commentCount": 5,
        "attachmentCount": 2,
        "subtaskCount": 8,
        "subtaskCompletedCount": 3,
        "totalTimeLogged": 3600,
        "createdAt": "2026-02-10T09:00:00.000Z",
        "updatedAt": "2026-02-16T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

### POST /tasks

Create new task.

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Set up JWT authentication with refresh tokens",
  "columnId": "col-1",
  "projectId": "650e8400-e29b-41d4-a716-446655440000",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440000",
  "priority": "high",
  "dueDate": "2026-02-25T23:59:59.000Z",
  "labelIds": ["label-2", "label-5"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "task-46",
      "title": "Implement user authentication",
      "description": "Set up JWT authentication with refresh tokens",
      "status": "To Do",
      "priority": "high",
      "dueDate": "2026-02-25T23:59:59.000Z",
      "columnId": "col-1",
      "projectId": "650e8400-e29b-41d4-a716-446655440000",
      "assignee": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      },
      "labels": [
        {
          "id": "label-2",
          "name": "Feature",
          "color": "#4ECDC4"
        }
      ],
      "createdAt": "2026-02-16T16:30:00.000Z"
    }
  }
}
```

---

### GET /tasks/:id

Get task details.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-1",
      "title": "Design homepage mockup",
      "description": "Create high-fidelity mockup for homepage redesign",
      "status": "In Progress",
      "priority": "high",
      "dueDate": "2026-02-20T23:59:59.000Z",
      "isOverdue": false,
      "columnId": "col-2",
      "projectId": "650e8400-e29b-41d4-a716-446655440000",
      "project": {
        "id": "650e8400-e29b-41d4-a716-446655440000",
        "title": "Website Redesign"
      },
      "assignee": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg"
      },
      "labels": [
        {
          "id": "label-1",
          "name": "Design",
          "color": "#FF6B6B"
        }
      ],
      "subtasks": [
        {
          "id": "subtask-1",
          "title": "Research competitor websites",
          "isCompleted": true,
          "position": 0
        },
        {
          "id": "subtask-2",
          "title": "Create wireframes",
          "isCompleted": true,
          "position": 1
        },
        {
          "id": "subtask-3",
          "title": "Design color scheme",
          "isCompleted": false,
          "position": 2
        }
      ],
      "totalTimeLogged": 3600,
      "createdBy": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      },
      "createdAt": "2026-02-10T09:00:00.000Z",
      "updatedAt": "2026-02-16T14:30:00.000Z"
    }
  }
}
```

---

### PATCH /tasks/:id

Update task details.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID

**Request Body:**
```json
{
  "title": "Design homepage and landing page mockups",
  "description": "Updated description with more details",
  "priority": "urgent",
  "dueDate": "2026-02-18T23:59:59.000Z",
  "assigneeId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-1",
      "title": "Design homepage and landing page mockups",
      "description": "Updated description with more details",
      "priority": "urgent",
      "dueDate": "2026-02-18T23:59:59.000Z",
      "assignee": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith"
      },
      "updatedAt": "2026-02-16T16:45:00.000Z"
    }
  }
}
```

**Permissions:**
- Owner: Can edit all tasks
- Member: Can only edit own tasks (where assigneeId = currentUserId)

---

### DELETE /tasks/:id

Soft delete task (move to trash, Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task moved to trash. Will be permanently deleted after 30 days.",
  "data": {
    "task": {
      "id": "task-1",
      "isDeleted": true,
      "deletedAt": "2026-02-16T17:00:00.000Z",
      "permanentDeleteAt": "2026-03-18T17:00:00.000Z"
    }
  }
}
```

---

### POST /tasks/:id/move

Move task to different column.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID

**Request Body:**
```json
{
  "columnId": "col-3",
  "position": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task moved successfully",
  "data": {
    "task": {
      "id": "task-1",
      "columnId": "col-3",
      "status": "Review",
      "position": 2,
      "updatedAt": "2026-02-16T17:10:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** WIP limit reached
  ```json
  {
    "success": false,
    "message": "Cannot move task. Column 'In Progress' has reached WIP limit of 5.",
    "statusCode": 400
  }
  ```

---

### POST /tasks/:id/assign

Assign task to user.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID

**Request Body:**
```json
{
  "assigneeId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task assigned successfully",
  "data": {
    "task": {
      "id": "task-1",
      "assignee": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith",
        "profilePhoto": "https://s3.amazonaws.com/bucket/jane.jpg"
      },
      "updatedAt": "2026-02-16T17:15:00.000Z"
    }
  }
}
```

---

### DELETE /tasks/:id/assign

Unassign task.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task unassigned successfully",
  "data": {
    "task": {
      "id": "task-1",
      "assignee": null,
      "updatedAt": "2026-02-16T17:20:00.000Z"
    }
  }
}
```

---

### POST /tasks/:id/labels

Add label to task.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID

**Request Body:**
```json
{
  "labelId": "label-3"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Label added to task",
  "data": {
    "task": {
      "id": "task-1",
      "labels": [
        {
          "id": "label-1",
          "name": "Design",
          "color": "#FF6B6B"
        },
        {
          "id": "label-3",
          "name": "Bug",
          "color": "#E74C3C"
        }
      ]
    }
  }
}
```

---

### DELETE /tasks/:id/labels/:labelId

Remove label from task.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Task ID
- `labelId` (UUID) - Label ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Label removed from task"
}
```

---

### GET /tasks/trash

Get soft-deleted tasks (Owner only).

**Auth Required:** Yes (Owner)

**Query Parameters:**
- `projectId` (UUID, required): Project ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-20",
        "title": "Old feature",
        "deletedAt": "2026-02-10T10:00:00.000Z",
        "permanentDeleteAt": "2026-03-12T10:00:00.000Z",
        "daysUntilPermanentDelete": 24
      }
    ]
  }
}
```

---

### POST /tasks/:id/restore

Restore task from trash (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task restored successfully",
  "data": {
    "task": {
      "id": "task-20",
      "isDeleted": false,
      "deletedAt": null,
      "permanentDeleteAt": null
    }
  }
}
```

---

### DELETE /tasks/:id/permanent

Permanently delete task (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task permanently deleted"
}
```

---

### GET /tasks/overdue

Get overdue tasks.

**Auth Required:** Yes

**Query Parameters:**
- `projectId` (UUID, optional): Filter by project
- `assigneeId` (UUID, optional): Filter by assignee

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-5",
        "title": "Update documentation",
        "dueDate": "2026-02-14T23:59:59.000Z",
        "daysOverdue": 2,
        "priority": "medium",
        "project": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "title": "Website Redesign"
        }
      }
    ],
    "count": 3
  }
}
```

---

### GET /tasks/calendar

Get tasks for calendar view.

**Auth Required:** Yes

**Query Parameters:**
- `projectId` (UUID, optional): Filter by project
- `startDate` (ISO date, required): Calendar start date
- `endDate` (ISO date, required): Calendar end date

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-1",
        "title": "Design homepage mockup",
        "dueDate": "2026-02-20T23:59:59.000Z",
        "priority": "high",
        "status": "In Progress",
        "project": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "title": "Website Redesign"
        }
      },
      {
        "id": "task-3",
        "title": "Backend API setup",
        "dueDate": "2026-02-22T23:59:59.000Z",
        "priority": "urgent",
        "status": "To Do",
        "project": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "title": "Website Redesign"
        }
      }
    ],
    "groupedByDate": {
      "2026-02-20": [
        {
          "id": "task-1",
          "title": "Design homepage mockup",
          "priority": "high"
        }
      ],
      "2026-02-22": [
        {
          "id": "task-3",
          "title": "Backend API setup",
          "priority": "urgent"
        }
      ]
    }
  }
}
```

---

## Sub-Task Endpoints

### GET /tasks/:taskId/subtasks

Get all subtasks for a task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "subtasks": [
      {
        "id": "subtask-1",
        "title": "Research competitor websites",
        "isCompleted": true,
        "position": 0,
        "taskId": "task-1",
        "createdAt": "2026-02-10T09:30:00.000Z",
        "completedAt": "2026-02-11T14:00:00.000Z"
      },
      {
        "id": "subtask-2",
        "title": "Create wireframes",
        "isCompleted": false,
        "position": 1,
        "taskId": "task-1",
        "createdAt": "2026-02-10T09:30:00.000Z"
      }
    ],
    "progress": {
      "total": 8,
      "completed": 3,
      "percentage": 37.5
    }
  }
}
```

---

### POST /tasks/:taskId/subtasks

Create new subtask.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Request Body:**
```json
{
  "title": "Review design with stakeholders"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "subtask": {
      "id": "subtask-9",
      "title": "Review design with stakeholders",
      "isCompleted": false,
      "position": 8,
      "taskId": "task-1",
      "createdAt": "2026-02-16T17:30:00.000Z"
    }
  }
}
```

---

### PATCH /subtasks/:id

Update subtask.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Subtask ID

**Request Body:**
```json
{
  "title": "Review design with key stakeholders"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "subtask": {
      "id": "subtask-9",
      "title": "Review design with key stakeholders",
      "updatedAt": "2026-02-16T17:35:00.000Z"
    }
  }
}
```

---

### DELETE /subtasks/:id

Delete subtask.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Subtask ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subtask deleted successfully"
}
```

---

### POST /subtasks/:id/toggle

Toggle subtask completion status.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Subtask ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "subtask": {
      "id": "subtask-3",
      "title": "Design color scheme",
      "isCompleted": true,
      "completedAt": "2026-02-16T17:40:00.000Z"
    }
  }
}
```

---

### POST /subtasks/:id/reorder

Reorder subtask position.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Subtask ID

**Request Body:**
```json
{
  "newPosition": 0
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subtask reordered successfully"
}
```

---

## Comment Endpoints

### GET /tasks/:taskId/comments

Get all comments for a task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-1",
        "content": "Great progress! @JohnDoe please review the latest mockups.",
        "taskId": "task-1",
        "author": {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Jane Smith",
          "profilePhoto": "https://s3.amazonaws.com/bucket/jane.jpg"
        },
        "mentions": [
          {
            "userId": "550e8400-e29b-41d4-a716-446655440000",
            "name": "John Doe"
          }
        ],
        "parentId": null,
        "replies": [
          {
            "id": "comment-2",
            "content": "Will do! Thanks for the update.",
            "author": {
              "id": "550e8400-e29b-41d4-a716-446655440000",
              "name": "John Doe"
            },
            "parentId": "comment-1",
            "createdAt": "2026-02-16T11:30:00.000Z"
          }
        ],
        "createdAt": "2026-02-16T11:00:00.000Z",
        "updatedAt": "2026-02-16T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### POST /tasks/:taskId/comments

Add comment to task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Request Body:**
```json
{
  "content": "I've completed the wireframes. @JaneSmith please review.",
  "mentions": ["660e8400-e29b-41d4-a716-446655440001"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment-6",
      "content": "I've completed the wireframes. @JaneSmith please review.",
      "taskId": "task-1",
      "author": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg"
      },
      "mentions": [
        {
          "userId": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Jane Smith"
        }
      ],
      "createdAt": "2026-02-16T17:50:00.000Z"
    }
  }
}
```

---

### PATCH /comments/:id

Update comment (author only).

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Comment ID

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment-6",
      "content": "Updated comment content",
      "updatedAt": "2026-02-16T17:55:00.000Z"
    }
  }
}
```

**Error Responses:**
- **403 Forbidden:** User is not comment author

---

### DELETE /comments/:id

Delete comment (author only).

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Comment ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

### POST /comments/:id/replies

Reply to comment (threaded).

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Parent comment ID

**Request Body:**
```json
{
  "content": "Thanks for the review!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment-7",
      "content": "Thanks for the review!",
      "parentId": "comment-1",
      "author": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      },
      "createdAt": "2026-02-16T18:00:00.000Z"
    }
  }
}
```

---

## Time Entry Endpoints

### GET /tasks/:taskId/time-entries

Get all time entries for a task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "timeEntries": [
      {
        "id": "time-1",
        "taskId": "task-1",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "duration": 3600,
        "description": "Worked on homepage wireframes",
        "startTime": "2026-02-16T09:00:00.000Z",
        "endTime": "2026-02-16T10:00:00.000Z",
        "isManual": false,
        "createdAt": "2026-02-16T10:00:00.000Z"
      },
      {
        "id": "time-2",
        "taskId": "task-1",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "duration": 7200,
        "description": "Manual time entry for yesterday",
        "startTime": null,
        "endTime": null,
        "isManual": true,
        "createdAt": "2026-02-16T11:00:00.000Z"
      }
    ],
    "totalTime": 10800
  }
}
```

---

### POST /tasks/:taskId/time-entries

Create manual time entry.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Request Body:**
```json
{
  "duration": 7200,
  "description": "Worked on design iterations",
  "date": "2026-02-15"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "timeEntry": {
      "id": "time-3",
      "taskId": "task-1",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "duration": 7200,
      "description": "Worked on design iterations",
      "isManual": true,
      "createdAt": "2026-02-16T18:10:00.000Z"
    }
  }
}
```

---

### PATCH /time-entries/:id

Update time entry.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Time entry ID

**Request Body:**
```json
{
  "duration": 5400,
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "timeEntry": {
      "id": "time-3",
      "duration": 5400,
      "description": "Updated description",
      "updatedAt": "2026-02-16T18:15:00.000Z"
    }
  }
}
```

---

### DELETE /time-entries/:id

Delete time entry.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Time entry ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Time entry deleted successfully"
}
```

---

### POST /time-entries/start

Start timer for a task.

**Auth Required:** Yes

**Request Body:**
```json
{
  "taskId": "task-1",
  "description": "Working on mockups"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "timeEntry": {
      "id": "time-4",
      "taskId": "task-1",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "description": "Working on mockups",
      "startTime": "2026-02-16T18:20:00.000Z",
      "isRunning": true
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Timer already running
  ```json
  {
    "success": false,
    "message": "You already have a running timer for another task",
    "statusCode": 400
  }
  ```

---

### POST /time-entries/stop

Stop running timer.

**Auth Required:** Yes

**Request Body:**
```json
{
  "timeEntryId": "time-4"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "timeEntry": {
      "id": "time-4",
      "taskId": "task-1",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "description": "Working on mockups",
      "startTime": "2026-02-16T18:20:00.000Z",
      "endTime": "2026-02-16T19:05:00.000Z",
      "duration": 2700,
      "isRunning": false
    }
  }
}
```

---

### GET /users/me/time-entries

Get current user's time entries.

**Auth Required:** Yes

**Query Parameters:**
- `startDate` (ISO date, optional): Filter start date
- `endDate` (ISO date, optional): Filter end date
- `taskId` (UUID, optional): Filter by task

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "timeEntries": [
      {
        "id": "time-1",
        "task": {
          "id": "task-1",
          "title": "Design homepage mockup",
          "project": {
            "id": "650e8400-e29b-41d4-a716-446655440000",
            "title": "Website Redesign"
          }
        },
        "duration": 3600,
        "description": "Worked on homepage wireframes",
        "startTime": "2026-02-16T09:00:00.000Z",
        "endTime": "2026-02-16T10:00:00.000Z",
        "createdAt": "2026-02-16T10:00:00.000Z"
      }
    ],
    "totalTime": 18540
  }
}
```

---

## Attachment Endpoints

### GET /tasks/:taskId/attachments

Get all attachments for a task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "id": "attach-1",
        "fileName": "homepage-mockup.pdf",
        "fileSize": 2457600,
        "mimeType": "application/pdf",
        "url": "https://s3.amazonaws.com/bucket/attachments/homepage-mockup.pdf",
        "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/homepage-mockup-thumb.jpg",
        "taskId": "task-1",
        "uploadedBy": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "createdAt": "2026-02-16T10:30:00.000Z"
      },
      {
        "id": "attach-2",
        "fileName": "wireframe.png",
        "fileSize": 856342,
        "mimeType": "image/png",
        "url": "https://s3.amazonaws.com/bucket/attachments/wireframe.png",
        "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/wireframe-thumb.png",
        "taskId": "task-1",
        "uploadedBy": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "createdAt": "2026-02-16T11:15:00.000Z"
      }
    ]
  }
}
```

---

### POST /tasks/:taskId/attachments

Upload attachment to task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Request Body:** `multipart/form-data`
- `file` (File): File to upload

**Request Headers:**
```
Content-Type: multipart/form-data
```

**File Constraints:**
- Maximum size: 10MB
- Allowed types: PDF, PNG, JPG, JPEG, DOCX, XLSX

**Success Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "attachment": {
      "id": "attach-3",
      "fileName": "requirements.docx",
      "fileSize": 1234567,
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "url": "https://s3.amazonaws.com/bucket/attachments/requirements.docx",
      "taskId": "task-1",
      "uploadedBy": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      },
      "createdAt": "2026-02-16T18:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** File too large
  ```json
  {
    "success": false,
    "message": "File size exceeds 10MB limit",
    "statusCode": 400
  }
  ```
- **400 Bad Request:** Invalid file type
  ```json
  {
    "success": false,
    "message": "File type not allowed. Allowed types: PDF, PNG, JPG, DOCX, XLSX",
    "statusCode": 400
  }
  ```

---

### DELETE /attachments/:id

Delete attachment.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Attachment ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

---

### GET /attachments/:id/presigned-url

Get presigned URL for secure file download.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Attachment ID

**Query Parameters:**
- `expiresIn` (number, optional): URL expiration in seconds (default: 3600)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/attachments/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "expiresAt": "2026-02-16T19:30:00.000Z"
  }
}
```

---

## Notification Endpoints

### GET /notifications

Get user notifications.

**Auth Required:** Yes

**Query Parameters:**
- `filter` (string, optional): `all`, `unread`, `assignments`, `comments`, `deadlines` (default: `all`)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-1",
        "type": "task_assigned",
        "title": "New task assigned",
        "message": "John Doe assigned you to 'Design homepage mockup'",
        "isRead": false,
        "data": {
          "taskId": "task-1",
          "taskTitle": "Design homepage mockup",
          "projectId": "650e8400-e29b-41d4-a716-446655440000",
          "projectTitle": "Website Redesign",
          "assignedBy": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "John Doe"
          }
        },
        "createdAt": "2026-02-16T10:00:00.000Z"
      },
      {
        "id": "notif-2",
        "type": "comment_mention",
        "title": "You were mentioned",
        "message": "Jane Smith mentioned you in a comment",
        "isRead": true,
        "data": {
          "taskId": "task-1",
          "taskTitle": "Design homepage mockup",
          "commentId": "comment-1",
          "mentionedBy": {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "name": "Jane Smith"
          }
        },
        "createdAt": "2026-02-16T11:00:00.000Z",
        "readAt": "2026-02-16T11:30:00.000Z"
      },
      {
        "id": "notif-3",
        "type": "due_date_reminder",
        "title": "Task due soon",
        "message": "'Backend API setup' is due in 2 days",
        "isRead": false,
        "data": {
          "taskId": "task-3",
          "taskTitle": "Backend API setup",
          "dueDate": "2026-02-18T23:59:59.000Z"
        },
        "createdAt": "2026-02-16T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

**Notification Types:**
- `task_assigned`: Task assigned to user
- `status_change`: Task status changed
- `comment_mention`: User mentioned in comment
- `new_comment`: New comment on user's task
- `due_date_reminder`: Task due soon
- `invitation`: Project invitation

---

### PATCH /notifications/:id/read

Mark notification as read.

**Auth Required:** Yes

**URL Parameters:**
- `id` (UUID) - Notification ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "notif-1",
      "isRead": true,
      "readAt": "2026-02-16T18:40:00.000Z"
    }
  }
}
```

---

### POST /notifications/mark-all-read

Mark all notifications as read.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 12
  }
}
```

---

### GET /notifications/unread-count

Get unread notification count.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 8,
    "byType": {
      "task_assigned": 2,
      "comment_mention": 3,
      "due_date_reminder": 3
    }
  }
}
```

---

## Label Endpoints

### GET /labels

Get all labels (system + project-specific).

**Auth Required:** Yes

**Query Parameters:**
- `projectId` (UUID, optional): Filter by project (includes system labels + project labels)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "labels": [
      {
        "id": "label-1",
        "name": "Bug",
        "color": "#E74C3C",
        "isSystem": true,
        "projectId": null
      },
      {
        "id": "label-2",
        "name": "Feature",
        "color": "#4ECDC4",
        "isSystem": true,
        "projectId": null
      },
      {
        "id": "label-3",
        "name": "Design",
        "color": "#FF6B6B",
        "isSystem": true,
        "projectId": null
      },
      {
        "id": "label-4",
        "name": "Documentation",
        "color": "#95A5A6",
        "isSystem": true,
        "projectId": null
      },
      {
        "id": "label-5",
        "name": "Improvement",
        "color": "#F39C12",
        "isSystem": true,
        "projectId": null
      },
      {
        "id": "label-6",
        "name": "Frontend",
        "color": "#9B59B6",
        "isSystem": false,
        "projectId": "650e8400-e29b-41d4-a716-446655440000"
      }
    ]
  }
}
```

---

### POST /projects/:projectId/labels

Create custom label for project (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `projectId` (UUID) - Project ID

**Request Body:**
```json
{
  "name": "Backend",
  "color": "#3498DB"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "label": {
      "id": "label-7",
      "name": "Backend",
      "color": "#3498DB",
      "isSystem": false,
      "projectId": "650e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-02-16T18:50:00.000Z"
    }
  }
}
```

---

### PATCH /labels/:id

Update label (Owner only for project labels, Admin for system labels).

**Auth Required:** Yes (Owner/Admin)

**URL Parameters:**
- `id` (UUID) - Label ID

**Request Body:**
```json
{
  "name": "Backend Development",
  "color": "#2980B9"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "label": {
      "id": "label-7",
      "name": "Backend Development",
      "color": "#2980B9",
      "updatedAt": "2026-02-16T18:55:00.000Z"
    }
  }
}
```

---

### DELETE /labels/:id

Delete custom label (Owner only).

**Auth Required:** Yes (Owner)

**URL Parameters:**
- `id` (UUID) - Label ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Label deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request:** Cannot delete system label
  ```json
  {
    "success": false,
    "message": "Cannot delete system labels",
    "statusCode": 400
  }
  ```

---

## Activity Log Endpoints

### GET /tasks/:taskId/activities

Get activity log for a task.

**Auth Required:** Yes

**URL Parameters:**
- `taskId` (UUID) - Task ID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-1",
        "type": "task_created",
        "message": "John Doe created this task",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe",
          "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg"
        },
        "metadata": {},
        "createdAt": "2026-02-10T09:00:00.000Z"
      },
      {
        "id": "activity-2",
        "type": "task_assigned",
        "message": "John Doe assigned this task to Jane Smith",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "metadata": {
          "assigneeId": "660e8400-e29b-41d4-a716-446655440001",
          "assigneeName": "Jane Smith"
        },
        "createdAt": "2026-02-10T09:15:00.000Z"
      },
      {
        "id": "activity-3",
        "type": "task_moved",
        "message": "Jane Smith moved this task from 'To Do' to 'In Progress'",
        "user": {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Jane Smith"
        },
        "metadata": {
          "fromColumn": "To Do",
          "toColumn": "In Progress"
        },
        "createdAt": "2026-02-11T10:00:00.000Z"
      },
      {
        "id": "activity-4",
        "type": "comment_added",
        "message": "Jane Smith added a comment",
        "user": {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "Jane Smith"
        },
        "metadata": {
          "commentId": "comment-1"
        },
        "createdAt": "2026-02-16T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

**Activity Types:**
- `task_created`: Task created
- `task_updated`: Task details updated
- `task_assigned`: Task assigned to user
- `task_moved`: Task moved between columns
- `task_deleted`: Task soft deleted
- `task_restored`: Task restored from trash
- `comment_added`: Comment added
- `attachment_added`: File attached
- `label_added`: Label added
- `label_removed`: Label removed
- `subtask_added`: Subtask added
- `subtask_completed`: Subtask completed
- `time_logged`: Time entry added

---

### GET /projects/:projectId/activities

Get activity log for a project.

**Auth Required:** Yes

**URL Parameters:**
- `projectId` (UUID) - Project ID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)
- `type` (string, optional): Filter by activity type

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-10",
        "type": "task_created",
        "message": "John Doe created task 'Design homepage mockup'",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "task": {
          "id": "task-1",
          "title": "Design homepage mockup"
        },
        "createdAt": "2026-02-10T09:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 125,
      "page": 1,
      "limit": 50,
      "totalPages": 3
    }
  }
}
```

---

### GET /activities/recent

Get recent activities across all user's projects.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (number, optional): Items to return (default: 20, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-50",
        "type": "task_assigned",
        "message": "You were assigned to 'Design homepage mockup'",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe"
        },
        "task": {
          "id": "task-1",
          "title": "Design homepage mockup"
        },
        "project": {
          "id": "650e8400-e29b-41d4-a716-446655440000",
          "title": "Website Redesign"
        },
        "createdAt": "2026-02-16T14:30:00.000Z"
      }
    ]
  }
}
```

---

## Admin Endpoints

### GET /admin/users

List all users (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `search` (string, optional): Search by name or email
- `role` (string, optional): Filter by role (`USER`, `ADMIN`)
- `status` (string, optional): Filter by status (`active`, `suspended`)
- `sort` (string, optional): `name`, `email`, `createdAt`, `lastActive` (default: `createdAt`)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "USER",
        "status": "active",
        "profilePhoto": "https://s3.amazonaws.com/bucket/profile.jpg",
        "projectCount": 5,
        "taskCount": 32,
        "createdAt": "2026-01-15T10:30:00.000Z",
        "lastActive": "2026-02-16T18:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

---

### POST /admin/users

Create new user (Admin only).

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "TempPassword123!",
  "role": "USER",
  "jobTitle": "Developer"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "name": "New User",
      "email": "newuser@example.com",
      "role": "USER",
      "jobTitle": "Developer",
      "status": "active",
      "createdAt": "2026-02-16T19:00:00.000Z"
    }
  }
}
```

---

### PATCH /admin/users/:id

Update user (Admin only).

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id` (UUID) - User ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "ADMIN",
  "status": "active"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Updated Name",
      "role": "ADMIN",
      "status": "active",
      "updatedAt": "2026-02-16T19:10:00.000Z"
    }
  }
}
```

---

### DELETE /admin/users/:id

Delete user (Admin only).

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id` (UUID) - User ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### POST /admin/users/:id/suspend

Suspend user account (Admin only).

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id` (UUID) - User ID

**Request Body:**
```json
{
  "reason": "Policy violation"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "suspended",
      "suspendedAt": "2026-02-16T19:20:00.000Z",
      "suspensionReason": "Policy violation"
    }
  }
}
```

---

### POST /admin/users/:id/activate

Activate suspended user (Admin only).

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id` (UUID) - User ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "suspendedAt": null,
      "suspensionReason": null
    }
  }
}
```

---

### GET /admin/projects

List all projects (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `search` (string, optional): Search by project name or owner
- `status` (string, optional): Filter by status (`active`, `archived`)
- `sort` (string, optional): `name`, `createdAt`, `deadline` (default: `createdAt`)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440000",
        "title": "Website Redesign",
        "status": "active",
        "owner": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "memberCount": 5,
        "totalTasks": 45,
        "completedTasks": 30,
        "completionPercentage": 67,
        "deadline": "2026-03-31T23:59:59.000Z",
        "createdAt": "2026-01-10T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 85,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

### DELETE /admin/projects/:id

Delete project (Admin only).

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `id` (UUID) - Project ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### GET /admin/settings

Get system settings (Admin only).

**Auth Required:** Yes (Admin)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "settings": {
      "general": {
        "appName": "TaskBoard",
        "defaultKanbanTemplate": "default",
        "maxFileSize": 10485760,
        "allowedFileTypes": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"]
      },
      "notifications": {
        "emailEnabled": true,
        "defaultDigestFrequency": "daily",
        "dueDateReminderDays": 2
      },
      "labels": [
        {
          "id": "label-1",
          "name": "Bug",
          "color": "#E74C3C"
        },
        {
          "id": "label-2",
          "name": "Feature",
          "color": "#4ECDC4"
        }
      ]
    }
  }
}
```

---

### PATCH /admin/settings

Update system settings (Admin only).

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "general": {
    "maxFileSize": 15728640,
    "allowedFileTypes": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "mp4"]
  },
  "notifications": {
    "dueDateReminderDays": 3
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": {
      "general": {
        "maxFileSize": 15728640,
        "allowedFileTypes": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "mp4"]
      },
      "notifications": {
        "emailEnabled": true,
        "defaultDigestFrequency": "daily",
        "dueDateReminderDays": 3
      }
    }
  }
}
```

---

### GET /admin/export

Export system data (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `type` (string, required): `users`, `projects`, `tasks`
- `format` (string, optional): `csv`, `json` (default: `csv`)
- `startDate` (ISO date, optional): Filter start date
- `endDate` (ISO date, optional): Filter end date

**Success Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="users-export-2026-02-16.csv"

User ID,Name,Email,Role,Status,Projects,Tasks,Created,Last Active
550e8400...,John Doe,john.doe@example.com,USER,active,5,32,2026-01-15,2026-02-16
660e8400...,Jane Smith,jane.smith@example.com,USER,active,3,18,2026-01-20,2026-02-16
```

---

### GET /admin/dashboard

Get admin dashboard statistics (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `period` (string, optional): `today`, `7d`, `30d`, `custom` (default: `30d`)
- `startDate` (ISO date, optional): Required if period=custom
- `endDate` (ISO date, optional): Required if period=custom

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalUsers": 150,
      "activeUsersToday": 42,
      "totalProjects": 85,
      "totalTasks": 1245,
      "newUsersThisPeriod": 12,
      "newProjectsThisPeriod": 8,
      "taskCompletionRate": 67.5
    },
    "charts": {
      "userRegistrationTrend": [
        {
          "date": "2026-02-10",
          "count": 3
        },
        {
          "date": "2026-02-11",
          "count": 1
        }
      ],
      "projectCreationTrend": [
        {
          "date": "2026-02-10",
          "count": 2
        }
      ],
      "taskCompletionRate": [
        {
          "date": "2026-02-10",
          "rate": 65.2
        },
        {
          "date": "2026-02-11",
          "rate": 67.5
        }
      ],
      "topActiveProjects": [
        {
          "projectId": "650e8400-e29b-41d4-a716-446655440000",
          "projectTitle": "Website Redesign",
          "activityCount": 125
        }
      ]
    },
    "recentActivity": [
      {
        "type": "user_registered",
        "message": "New user registered: Alice Johnson",
        "timestamp": "2026-02-16T15:00:00.000Z"
      },
      {
        "type": "project_created",
        "message": "John Doe created project 'Mobile App'",
        "timestamp": "2026-02-16T14:30:00.000Z"
      }
    ]
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes

| Status | Description | Common Use Cases |
|--------|-------------|------------------|
| 200 | OK | Successful GET, PATCH, DELETE requests |
| 201 | Created | Successful POST requests creating resources |
| 400 | Bad Request | Invalid input, validation errors, business logic errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the action |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors with detailed field-level feedback |
| 500 | Internal Server Error | Unexpected server errors |

---

## WebSocket Events

Real-time synchronization is handled via WebSocket connections.

**Connection URL:**
- `ws://localhost:3000` (Development)
- `wss://api.taskboard-by-rumon.com` (Production)

**Authentication:**
- Send JWT token on connection
- Automatically subscribe to user's projects

**Events:**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `task:created` | Server → Client | Task object | New task created on board |
| `task:updated` | Server → Client | Task object | Task details updated |
| `task:moved` | Server → Client | `{ taskId, fromColumnId, toColumnId, position }` | Task moved between columns |
| `task:deleted` | Server → Client | `{ taskId }` | Task soft deleted |
| `comment:added` | Server → Client | Comment object | New comment added |
| `board:updated` | Server → Client | Board state | Board structure changed |

**Example Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: accessToken
  }
});

socket.on('task:moved', (data) => {
  console.log('Task moved:', data);
  // Update UI in real-time
});
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 1 minute |
| File Upload | 10 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645024800
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "statusCode": 429,
  "retryAfter": 60
}
```

---

## Pagination

List endpoints support pagination with consistent query parameters:

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "page": 2,
      "limit": 20,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

---

## Date/Time Format

All timestamps use ISO 8601 format in UTC:

```
2026-02-16T14:30:00.000Z
```

---

**Last Updated:** 2026-02-16
**API Version:** 1.0
