import {
    IsString,
    IsUUID,
    IsOptional,
    IsNumber,
    IsObject,
} from 'class-validator';

/**
 * DTO for joining/leaving a board room
 */
export class JoinBoardDto {
    @IsUUID()
    projectId: string;
}

/**
 * DTO for task moved event (drag-and-drop between columns)
 */
export class TaskMovedDto {
    @IsUUID()
    projectId: string;

    @IsUUID()
    taskId: string;

    @IsUUID()
    fromColumnId: string;

    @IsUUID()
    toColumnId: string;

    @IsNumber()
    newPosition: number;

    @IsOptional()
    @IsNumber()
    oldPosition?: number;
}

/**
 * DTO for task created event
 */
export class TaskCreatedDto {
    @IsUUID()
    projectId: string;

    @IsUUID()
    taskId: string;

    @IsUUID()
    columnId: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    assigneeId?: string;

    @IsOptional()
    @IsString()
    priority?: string;
}

/**
 * DTO for task updated event
 */
export class TaskUpdatedDto {
    @IsUUID()
    projectId: string;

    @IsUUID()
    taskId: string;

    @IsObject()
    changes: Record<string, unknown>;
}

/**
 * DTO for task deleted event (soft delete)
 */
export class TaskDeletedDto {
    @IsUUID()
    projectId: string;

    @IsUUID()
    taskId: string;

    @IsUUID()
    columnId: string;
}

/**
 * DTO for task restored event
 */
export class TaskRestoredDto {
    @IsUUID()
    projectId: string;

    @IsUUID()
    taskId: string;

    @IsUUID()
    columnId: string;
}

/**
 * DTO for comment added event
 */
export class CommentAddedDto {
    @IsUUID()
    projectId: string;

    @IsUUID()
    taskId: string;

    @IsUUID()
    commentId: string;

    @IsString()
    text: string;

    @IsOptional()
    @IsUUID()
    parentCommentId?: string;
}

/**
 * Board user presence payload emitted on join/leave
 */
export interface BoardUserPresence {
    userId: string;
    userName: string;
    timestamp: string;
}

/**
 * Active users list payload
 */
export interface ActiveUsersPayload {
    projectId: string;
    users: BoardUserPresence[];
}
