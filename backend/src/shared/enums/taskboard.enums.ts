/**
 * TaskBoard-specific enums
 * Based on PROJECT_DATABASE.md specifications
 */

export enum UserRole {
    ADMIN = 'admin',
    OWNER = 'owner',
    MEMBER = 'member',
}

export enum ProjectStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum TimeEntryType {
    TIMER = 'timer',
    MANUAL = 'manual',
}

export enum NotificationType {
    TASK_ASSIGNED = 'task_assigned',
    DUE_DATE_REMINDER = 'due_date_reminder',
    STATUS_CHANGE = 'status_change',
    COMMENT_MENTION = 'comment_mention',
    NEW_COMMENT = 'new_comment',
    INVITATION = 'invitation',
}

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
}

export enum ProjectMemberRole {
    OWNER = 'owner',
    MEMBER = 'member',
}
