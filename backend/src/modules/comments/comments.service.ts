import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Column } from '../columns/entities/column.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { NotificationType } from '@shared/enums';
import { BoardGateway } from 'src/websocket/board.gateway';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepo: Repository<Comment>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(Column)
        private readonly columnRepo: Repository<Column>,
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        private readonly boardGateway: BoardGateway,
    ) {}

    /**
     * Get comments for a task
     */
    async findByTask(taskId: string): Promise<Comment[]> {
        await this.verifyTask(taskId);

        return this.commentRepo.find({
            where: { taskId, deletedAt: IsNull() },
            relations: ['author'],
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Create a comment on a task
     */
    async create(
        taskId: string,
        userId: string,
        dto: CreateCommentDto,
    ): Promise<Comment> {
        const task = await this.verifyTask(taskId);

        const comment = this.commentRepo.create({
            taskId,
            authorId: userId,
            text: dto.text,
            mentions: dto.mentions || [],
            parentCommentId: dto.parentCommentId || null,
        });

        const saved = await this.commentRepo.save(comment);

        // Get project context for broadcasting
        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });

        // Notify mentioned users
        if (dto.mentions?.length) {
            for (const mentionedUserId of dto.mentions) {
                if (mentionedUserId !== userId) {
                    await this.notificationRepo.save({
                        userId: mentionedUserId,
                        type: NotificationType.COMMENT_MENTION,
                        title: 'You were mentioned in a comment',
                        message: `You were mentioned in a comment on "${task.title}"`,
                        relatedTaskId: taskId,
                        relatedProjectId: column?.projectId || null,
                        isRead: false,
                        sentAt: new Date(),
                    });
                }
            }
        }

        // Notify task creator/assignee about new comment
        const notifyUserIds = new Set<string>();
        if (task.creatorId && task.creatorId !== userId)
            notifyUserIds.add(task.creatorId);
        if (task.assigneeId && task.assigneeId !== userId)
            notifyUserIds.add(task.assigneeId);

        for (const notifyUserId of notifyUserIds) {
            if (!dto.mentions?.includes(notifyUserId)) {
                await this.notificationRepo.save({
                    userId: notifyUserId,
                    type: NotificationType.NEW_COMMENT,
                    title: 'New comment on your task',
                    message: `A new comment was added to "${task.title}"`,
                    relatedTaskId: taskId,
                    relatedProjectId: column?.projectId || null,
                    isRead: false,
                    sentAt: new Date(),
                });
            }
        }

        // Log activity
        await this.activityLogRepo.save({
            userId,
            projectId: column?.projectId || null,
            taskId,
            actionType: 'comment_added',
            description: `Comment added to task "${task.title}"`,
            metadata: { commentId: saved.id },
        });

        // Broadcast
        if (column) {
            this.boardGateway.broadcastCommentAdded(column.projectId, {
                projectId: column.projectId,
                taskId,
                commentId: saved.id,
                text: dto.text,
                author: { userId, userName: '' },
            });
        }

        const createdResult = await this.commentRepo.findOne({
            where: { id: saved.id },
            relations: ['author'],
        });
        return createdResult!;
    }

    /**
     * Create a reply to a comment
     */
    async createReply(
        commentId: string,
        userId: string,
        dto: CreateCommentDto,
    ): Promise<Comment> {
        const parentComment = await this.commentRepo.findOne({
            where: { id: commentId, deletedAt: IsNull() },
        });
        if (!parentComment) {
            throw new NotFoundException('Parent comment not found');
        }

        dto.parentCommentId = commentId;
        return this.create(parentComment.taskId, userId, dto);
    }

    /**
     * Update a comment (author only)
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateCommentDto,
    ): Promise<Comment> {
        const comment = await this.commentRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        if (comment.authorId !== userId) {
            throw new ForbiddenException('You can only edit your own comments');
        }

        Object.assign(comment, dto);
        await this.commentRepo.save(comment);

        const updatedResult = await this.commentRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        return updatedResult!;
    }

    /**
     * Soft delete a comment (author only)
     */
    async delete(id: string, userId: string): Promise<void> {
        const comment = await this.commentRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        if (comment.authorId !== userId) {
            throw new ForbiddenException(
                'You can only delete your own comments',
            );
        }

        comment.deletedAt = new Date();
        await this.commentRepo.save(comment);
    }

    private async verifyTask(taskId: string): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }
        return task;
    }
}
