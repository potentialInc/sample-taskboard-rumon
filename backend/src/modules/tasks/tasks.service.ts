import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { Task } from './entities/task.entity';
import { Column } from '../columns/entities/column.entity';
import { TaskLabel } from '../task-labels/entities/task-label.entity';
import { Label } from '../labels/entities/label.entity';
import { User } from '../users/user.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import {
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    AssignTaskDto,
    TaskQueryDto,
    AddLabelDto,
} from './dto';
import {
    TaskPriority,
    NotificationType,
    InvitationStatus,
} from '@shared/enums';
import { BoardGateway } from 'src/websocket/board.gateway';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(Column)
        private readonly columnRepo: Repository<Column>,
        @InjectRepository(TaskLabel)
        private readonly taskLabelRepo: Repository<TaskLabel>,
        @InjectRepository(Label)
        private readonly labelRepo: Repository<Label>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        private readonly dataSource: DataSource,
        private readonly boardGateway: BoardGateway,
        private readonly projectsService: ProjectsService,
    ) {}

    /**
     * Create a new task
     */
    async create(userId: string, dto: CreateTaskDto): Promise<Task> {
        // Verify column exists and get project context
        const column = await this.columnRepo.findOne({
            where: { id: dto.columnId },
        });
        if (!column) {
            throw new NotFoundException('Column not found');
        }

        // Check user is member of the project
        await this.projectsService.checkProjectMember(column.projectId, userId);

        // Get next position
        const maxPosition = await this.taskRepo
            .createQueryBuilder('task')
            .select('MAX(task.position)', 'maxPos')
            .where('task.columnId = :columnId', { columnId: dto.columnId })
            .andWhere('task.deletedAt IS NULL')
            .getRawOne();
        const position = (maxPosition?.maxPos ?? -1) + 1;

        // Check is_overdue
        const isOverdue = dto.dueDate
            ? new Date(dto.dueDate) < new Date()
            : false;

        const task = this.taskRepo.create({
            columnId: dto.columnId,
            title: dto.title,
            description: dto.description || null,
            assigneeId: dto.assigneeId || null,
            creatorId: userId,
            priority: dto.priority || TaskPriority.MEDIUM,
            dueDate: dto.dueDate || null,
            position,
            isOverdue,
        });

        const saved = await this.taskRepo.save(task);

        // Log activity
        await this.activityLogRepo.save({
            userId,
            projectId: column.projectId,
            taskId: saved.id,
            actionType: 'task_created',
            description: `Task "${saved.title}" was created`,
            metadata: { columnId: dto.columnId },
        });

        // Notify assignee
        if (dto.assigneeId && dto.assigneeId !== userId) {
            await this.createNotification(
                dto.assigneeId,
                NotificationType.TASK_ASSIGNED,
                'New Task Assigned',
                `You have been assigned to "${saved.title}"`,
                saved.id,
                column.projectId,
            );
        }

        // Broadcast via WebSocket
        this.boardGateway.broadcastTaskCreated(column.projectId, {
            projectId: column.projectId,
            taskId: saved.id,
            columnId: dto.columnId,
            title: saved.title,
            assigneeId: saved.assigneeId || undefined,
            priority: saved.priority,
            createdBy: { userId, userName: '' },
        });

        // Update project completion
        await this.projectsService.updateCompletionPercentage(column.projectId);

        const result = await this.taskRepo.findOne({
            where: { id: saved.id },
            relations: ['assignee', 'creator'],
        });
        return result!;
    }

    /**
     * Get tasks with filters
     */
    async findAll(userId: string, query: TaskQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const qb = this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.creator', 'creator')
            .innerJoin('columns', 'col', 'col.id = task.column_id')
            .innerJoin(
                'project_members',
                'pm',
                'pm.project_id = col.project_id AND pm.user_id = :userId AND pm.invitation_status = :accepted',
                { userId, accepted: InvitationStatus.ACCEPTED },
            )
            .where('task.deletedAt IS NULL');

        if (query.projectId) {
            qb.andWhere('col.project_id = :projectId', {
                projectId: query.projectId,
            });
        }
        if (query.columnId) {
            qb.andWhere('task.columnId = :columnId', {
                columnId: query.columnId,
            });
        }
        if (query.assignee === 'me') {
            qb.andWhere('task.assigneeId = :assigneeId', {
                assigneeId: userId,
            });
        } else if (query.assigneeId) {
            qb.andWhere('task.assigneeId = :assigneeId', {
                assigneeId: query.assigneeId,
            });
        }
        if (query.priority) {
            qb.andWhere('task.priority = :priority', {
                priority: query.priority,
            });
        }
        if (query.search) {
            qb.andWhere('task.title ILIKE :search', {
                search: `%${query.search}%`,
            });
        }
        if (query.dueDateFrom) {
            qb.andWhere('task.dueDate >= :dueDateFrom', {
                dueDateFrom: query.dueDateFrom,
            });
        }
        if (query.dueDateTo) {
            qb.andWhere('task.dueDate <= :dueDateTo', {
                dueDateTo: query.dueDateTo,
            });
        }

        const sortBy = query.sortBy || 'position';
        const sortOrder = query.sortOrder || 'ASC';
        qb.orderBy(`task.${sortBy}`, sortOrder);

        const [tasks, total] = await qb
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            tasks,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single task with relations
     */
    async findOne(id: string, userId: string): Promise<Task & { projectId?: string }> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['assignee', 'creator'],
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        // Check membership through column -> project
        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
        }

        // Include projectId from column for frontend navigation
        return Object.assign(task, { projectId: column?.projectId ?? undefined });
    }

    /**
     * Update task
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateTaskDto,
    ): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
        }

        const oldValues: Record<string, any> = {};
        if (dto.title !== undefined) oldValues.title = task.title;
        if (dto.priority !== undefined) oldValues.priority = task.priority;
        if (dto.dueDate !== undefined) oldValues.dueDate = task.dueDate;

        Object.assign(task, dto);

        // Recalculate is_overdue
        if (task.dueDate) {
            task.isOverdue = new Date(task.dueDate) < new Date();
        }

        const updated = await this.taskRepo.save(task);

        // Log activity
        await this.activityLogRepo.save({
            userId,
            projectId: column?.projectId || null,
            taskId: id,
            actionType: 'task_updated',
            description: `Task "${updated.title}" was updated`,
            metadata: { changes: dto, oldValues },
        });

        // Broadcast
        if (column) {
            this.boardGateway.broadcastTaskUpdated(column.projectId, {
                projectId: column.projectId,
                taskId: id,
                changes: dto as unknown as Record<string, unknown>,
                updatedBy: { userId, userName: '' },
            });
        }

        const updatedResult = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignee', 'creator'],
        });
        return updatedResult!;
    }

    /**
     * Soft delete a task
     */
    async softDelete(id: string, userId: string): Promise<void> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
        }

        task.deletedAt = new Date();
        task.deletedBy = userId;
        await this.taskRepo.save(task);

        await this.activityLogRepo.save({
            userId,
            projectId: column?.projectId || null,
            taskId: id,
            actionType: 'task_deleted',
            description: `Task "${task.title}" was moved to trash`,
            metadata: {},
        });

        if (column) {
            this.boardGateway.broadcastTaskDeleted(column.projectId, {
                projectId: column.projectId,
                taskId: id,
                columnId: task.columnId,
                deletedBy: { userId, userName: '' },
            });
            await this.projectsService.updateCompletionPercentage(
                column.projectId,
            );
        }
    }

    /**
     * Move task between columns
     */
    async move(id: string, userId: string, dto: MoveTaskDto): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const targetColumn = await this.columnRepo.findOne({
            where: { id: dto.targetColumnId },
        });
        if (!targetColumn) {
            throw new NotFoundException('Target column not found');
        }

        const sourceColumn = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        await this.projectsService.checkProjectMember(
            targetColumn.projectId,
            userId,
        );

        const oldColumnId = task.columnId;
        task.columnId = dto.targetColumnId;
        task.position = dto.newPosition;

        await this.taskRepo.save(task);

        // Log activity
        await this.activityLogRepo.save({
            userId,
            projectId: targetColumn.projectId,
            taskId: id,
            actionType: 'task_moved',
            description: `Task "${task.title}" was moved to "${targetColumn.title}"`,
            metadata: {
                fromColumnId: oldColumnId,
                toColumnId: dto.targetColumnId,
                fromColumn: sourceColumn?.title,
                toColumn: targetColumn.title,
            },
        });

        // Notify assignee of status change
        if (task.assigneeId && task.assigneeId !== userId) {
            await this.createNotification(
                task.assigneeId,
                NotificationType.STATUS_CHANGE,
                'Task Status Changed',
                `Task "${task.title}" was moved from "${sourceColumn?.title || 'Unknown'}" to "${targetColumn.title}"`,
                task.id,
                targetColumn.projectId,
            );
        }

        // Broadcast
        this.boardGateway.broadcastTaskMoved(targetColumn.projectId, {
            projectId: targetColumn.projectId,
            taskId: id,
            fromColumnId: oldColumnId,
            toColumnId: dto.targetColumnId,
            newPosition: dto.newPosition,
            movedBy: { userId, userName: '' },
        });

        // Update completion
        await this.projectsService.updateCompletionPercentage(
            targetColumn.projectId,
        );

        const movedResult = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignee', 'creator'],
        });
        return movedResult!;
    }

    /**
     * Assign task to a user
     */
    async assign(
        id: string,
        userId: string,
        dto: AssignTaskDto,
    ): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
            // Verify assignee is also a member
            await this.projectsService.checkProjectMember(
                column.projectId,
                dto.assigneeId,
            );
        }

        task.assigneeId = dto.assigneeId;
        await this.taskRepo.save(task);

        // Notify assignee
        if (dto.assigneeId !== userId) {
            const assigner = await this.userRepo.findOne({
                where: { id: userId },
            });
            await this.createNotification(
                dto.assigneeId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                `${assigner?.name || 'Someone'} assigned you to "${task.title}"`,
                task.id,
                column?.projectId || undefined,
            );
        }

        await this.activityLogRepo.save({
            userId,
            projectId: column?.projectId || null,
            taskId: id,
            actionType: 'task_assigned',
            description: `Task "${task.title}" was assigned`,
            metadata: { assigneeId: dto.assigneeId },
        });

        const assignedResult = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignee', 'creator'],
        });
        return assignedResult!;
    }

    /**
     * Unassign task
     */
    async unassign(id: string, userId: string): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
        }

        task.assigneeId = null;
        await this.taskRepo.save(task);

        const unassignedResult = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignee', 'creator'],
        });
        return unassignedResult!;
    }

    /**
     * Add label to task
     */
    async addLabel(
        id: string,
        userId: string,
        dto: AddLabelDto,
    ): Promise<TaskLabel> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const label = await this.labelRepo.findOne({
            where: { id: dto.labelId },
        });
        if (!label) {
            throw new NotFoundException('Label not found');
        }

        // Check for duplicate
        const existing = await this.taskLabelRepo.findOne({
            where: { taskId: id, labelId: dto.labelId },
        });
        if (existing) {
            throw new BadRequestException(
                'Label already attached to this task',
            );
        }

        const taskLabel = this.taskLabelRepo.create({
            taskId: id,
            labelId: dto.labelId,
        });

        return this.taskLabelRepo.save(taskLabel);
    }

    /**
     * Remove label from task
     */
    async removeLabel(
        taskId: string,
        labelId: string,
        userId: string,
    ): Promise<void> {
        const taskLabel = await this.taskLabelRepo.findOne({
            where: { taskId, labelId },
        });
        if (!taskLabel) {
            throw new NotFoundException('Label not found on this task');
        }

        await this.taskLabelRepo.remove(taskLabel);
    }

    /**
     * Get trashed tasks
     */
    async getTrash(userId: string, projectId?: string) {
        const qb = this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.creator', 'creator')
            .leftJoinAndSelect('task.deletedByUser', 'deletedByUser')
            .innerJoin('columns', 'col', 'col.id = task.column_id')
            .innerJoin(
                'project_members',
                'pm',
                'pm.project_id = col.project_id AND pm.user_id = :userId AND pm.invitation_status = :accepted',
                { userId, accepted: InvitationStatus.ACCEPTED },
            )
            .where('task.deletedAt IS NOT NULL');

        if (projectId) {
            qb.andWhere('col.project_id = :projectId', { projectId });
        }

        qb.orderBy('task.deletedAt', 'DESC');

        return qb.getMany();
    }

    /**
     * Restore a soft-deleted task
     */
    async restore(id: string, userId: string): Promise<Task> {
        const task = await this.taskRepo.findOne({
            where: { id, deletedAt: Not(IsNull()) },
        });
        if (!task) {
            throw new NotFoundException('Task not found in trash');
        }

        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
        }

        task.deletedAt = null as any;
        task.deletedBy = null;
        await this.taskRepo.save(task);

        // Log
        await this.activityLogRepo.save({
            userId,
            projectId: column?.projectId || null,
            taskId: id,
            actionType: 'task_restored',
            description: `Task "${task.title}" was restored from trash`,
            metadata: {},
        });

        // Broadcast
        if (column) {
            this.boardGateway.broadcastTaskRestored(column.projectId, {
                projectId: column.projectId,
                taskId: id,
                columnId: task.columnId,
                restoredBy: { userId, userName: '' },
            });
            await this.projectsService.updateCompletionPercentage(
                column.projectId,
            );
        }

        const restoredResult = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignee', 'creator'],
        });
        return restoredResult!;
    }

    /**
     * Permanently delete a task
     */
    async permanentDelete(id: string, userId: string): Promise<void> {
        const task = await this.taskRepo.findOne({ where: { id } });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const column = await this.columnRepo.findOne({
            where: { id: task.columnId },
        });
        if (column) {
            await this.projectsService.checkProjectMember(
                column.projectId,
                userId,
            );
        }

        await this.taskRepo.remove(task);
    }

    /**
     * Get overdue tasks for current user
     */
    async getOverdue(userId: string) {
        return this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .innerJoin('columns', 'col', 'col.id = task.column_id')
            .innerJoin(
                'project_members',
                'pm',
                'pm.project_id = col.project_id AND pm.user_id = :userId AND pm.invitation_status = :accepted',
                { userId, accepted: InvitationStatus.ACCEPTED },
            )
            .where('task.deletedAt IS NULL')
            .andWhere('task.isOverdue = :isOverdue', { isOverdue: true })
            .orderBy('task.dueDate', 'ASC')
            .getMany();
    }

    /**
     * Get tasks for calendar view
     */
    async getCalendar(userId: string, startDate?: string, endDate?: string) {
        const qb = this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .innerJoin('columns', 'col', 'col.id = task.column_id')
            .innerJoin(
                'project_members',
                'pm',
                'pm.project_id = col.project_id AND pm.user_id = :userId AND pm.invitation_status = :accepted',
                { userId, accepted: InvitationStatus.ACCEPTED },
            )
            .where('task.deletedAt IS NULL')
            .andWhere('task.dueDate IS NOT NULL');

        if (startDate) {
            qb.andWhere('task.dueDate >= :startDate', { startDate });
        }
        if (endDate) {
            qb.andWhere('task.dueDate <= :endDate', { endDate });
        }

        return qb.orderBy('task.dueDate', 'ASC').getMany();
    }

    /**
     * Helper: create notification
     */
    private async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        taskId?: string,
        projectId?: string,
    ): Promise<void> {
        await this.notificationRepo.save({
            userId,
            type,
            title,
            message,
            relatedTaskId: taskId || null,
            relatedProjectId: projectId || null,
            isRead: false,
            sentAt: new Date(),
        });
    }
}
