import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Column } from '../columns/entities/column.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/user.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import {
    CreateProjectDto,
    UpdateProjectDto,
    ProjectQueryDto,
    InviteMemberDto,
} from './dto';
import {
    ProjectStatus,
    ProjectMemberRole,
    InvitationStatus,
    NotificationType,
} from '@shared/enums';
import { MailService } from 'src/infrastructure/mail/mail.service';
import { BoardGateway } from 'src/websocket/board.gateway';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_COLUMNS = [
    { title: 'To Do', position: 0, wipLimit: null },
    { title: 'In Progress', position: 1, wipLimit: 5 },
    { title: 'Review', position: 2, wipLimit: 3 },
    { title: 'Done', position: 3, wipLimit: null },
];

const MINIMAL_COLUMNS = [
    { title: 'To Do', position: 0, wipLimit: null },
    { title: 'Done', position: 1, wipLimit: null },
];

@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);

    constructor(
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(Column)
        private readonly columnRepo: Repository<Column>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        private readonly dataSource: DataSource,
        private readonly mailService: MailService,
        private readonly boardGateway: BoardGateway,
    ) {}

    /**
     * Create a new project with default columns and owner membership
     */
    async create(userId: string, dto: CreateProjectDto): Promise<Project> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Create the project
            const project = queryRunner.manager.create(Project, {
                title: dto.title,
                description: dto.description || null,
                ownerId: userId,
                deadline: dto.deadline || null,
                status: ProjectStatus.ACTIVE,
                completionPercentage: 0,
            });
            const savedProject = await queryRunner.manager.save(
                Project,
                project,
            );

            // 2. Add owner as project member
            const ownerMember = queryRunner.manager.create(ProjectMember, {
                projectId: savedProject.id,
                userId,
                role: ProjectMemberRole.OWNER,
                invitationStatus: InvitationStatus.ACCEPTED,
                joinedAt: new Date(),
            });
            await queryRunner.manager.save(ProjectMember, ownerMember);

            // 3. Create columns based on template
            let columnsToCreate = DEFAULT_COLUMNS;
            if (dto.template === 'minimal') {
                columnsToCreate = MINIMAL_COLUMNS;
            } else if (dto.template === 'custom' && dto.customColumns?.length) {
                columnsToCreate = dto.customColumns.map((title, index) => ({
                    title,
                    position: index,
                    wipLimit: null,
                }));
            }

            const columns = columnsToCreate.map((col) =>
                queryRunner.manager.create(Column, {
                    projectId: savedProject.id,
                    title: col.title,
                    position: col.position,
                    wipLimit: col.wipLimit,
                }),
            );
            await queryRunner.manager.save(Column, columns);

            // 4. Log activity
            await queryRunner.manager.save(ActivityLog, {
                userId,
                projectId: savedProject.id,
                actionType: 'project_created',
                description: `Project "${savedProject.title}" was created`,
                metadata: { template: dto.template || 'default' },
            });

            await queryRunner.commitTransaction();

            // 5. Send invitation emails (non-blocking)
            if (dto.inviteEmails?.length) {
                this.sendInvitations(
                    savedProject.id,
                    userId,
                    dto.inviteEmails,
                ).catch((err) =>
                    this.logger.error(
                        `Failed to send invitations: ${err.message}`,
                    ),
                );
            }

            // 6. Return project with relations
            const result = await this.projectRepo.findOne({
                where: { id: savedProject.id },
                relations: ['owner'],
            });
            return result!;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get all projects where user is owner or member
     */
    async findAll(userId: string, query: ProjectQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const qb = this.projectRepo
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.owner', 'owner')
            .innerJoin(
                'project_members',
                'pm',
                'pm.project_id = project.id AND pm.user_id = :userId AND pm.invitation_status = :accepted',
                { userId, accepted: InvitationStatus.ACCEPTED },
            )
            .where('project.deletedAt IS NULL');

        // Filter by status
        if (query.status) {
            qb.andWhere('project.status = :status', { status: query.status });
        }

        // Search by title
        if (query.search) {
            qb.andWhere('project.title ILIKE :search', {
                search: `%${query.search}%`,
            });
        }

        // Filter by deadline range
        if (query.deadlineFrom) {
            qb.andWhere('project.deadline >= :deadlineFrom', {
                deadlineFrom: query.deadlineFrom,
            });
        }
        if (query.deadlineTo) {
            qb.andWhere('project.deadline <= :deadlineTo', {
                deadlineTo: query.deadlineTo,
            });
        }

        // Sorting
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'DESC';
        qb.orderBy(`project.${sortBy}`, sortOrder);

        const [projects, total] = await qb
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            projects,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single project with members and columns
     */
    async findOne(id: string, userId: string): Promise<Project> {
        await this.checkProjectMember(id, userId);

        const project = await this.projectRepo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['owner'],
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    /**
     * Update project (owner only)
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateProjectDto,
    ): Promise<Project> {
        await this.checkProjectOwner(id, userId);

        const project = await this.projectRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        Object.assign(project, dto);
        const updated = await this.projectRepo.save(project);

        // Log activity
        await this.activityLogRepo.save({
            userId,
            projectId: id,
            actionType: 'project_updated',
            description: `Project "${updated.title}" was updated`,
            metadata: { changes: dto },
        });

        return updated;
    }

    /**
     * Archive project (owner only)
     */
    async archive(id: string, userId: string): Promise<Project> {
        await this.checkProjectOwner(id, userId);

        const project = await this.projectRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        project.status = ProjectStatus.ARCHIVED;
        const updated = await this.projectRepo.save(project);

        await this.activityLogRepo.save({
            userId,
            projectId: id,
            actionType: 'project_archived',
            description: `Project "${project.title}" was archived`,
            metadata: {},
        });

        return updated;
    }

    /**
     * Restore archived project (owner only)
     */
    async restore(id: string, userId: string): Promise<Project> {
        await this.checkProjectOwner(id, userId);

        const project = await this.projectRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }
        if (project.status !== ProjectStatus.ARCHIVED) {
            throw new BadRequestException('Project is not archived');
        }

        project.status = ProjectStatus.ACTIVE;
        return this.projectRepo.save(project);
    }

    /**
     * Soft delete project (owner only)
     */
    async delete(id: string, userId: string): Promise<void> {
        await this.checkProjectOwner(id, userId);

        const project = await this.projectRepo.findOne({
            where: { id, deletedAt: IsNull() },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        project.deletedAt = new Date();
        await this.projectRepo.save(project);

        await this.activityLogRepo.save({
            userId,
            projectId: id,
            actionType: 'project_deleted',
            description: `Project "${project.title}" was deleted`,
            metadata: {},
        });
    }

    /**
     * Get project members (mapped for frontend)
     */
    async getMembers(projectId: string, userId: string) {
        await this.checkProjectMember(projectId, userId);

        const members = await this.memberRepo.find({
            where: { projectId, invitationStatus: InvitationStatus.ACCEPTED },
            relations: ['user'],
            order: { joinedAt: 'ASC' },
        });

        return members.map((m) => ({
            id: m.id,
            userId: m.userId,
            fullName: m.user?.name || 'Unknown',
            email: m.user?.email || '',
            avatar: m.user?.profilePhotoUrl || undefined,
            role: m.role,
            joinedAt: m.joinedAt,
        }));
    }

    /**
     * Invite members to project
     */
    async inviteMembers(
        projectId: string,
        userId: string,
        dto: InviteMemberDto,
    ) {
        await this.checkProjectOwner(projectId, userId);

        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        const inviter = await this.userRepo.findOne({ where: { id: userId } });
        const invited: string[] = [];
        const alreadyMembers: string[] = [];

        for (const email of dto.emails) {
            // Check if user exists
            const user = await this.userRepo.findOne({ where: { email } });

            // Check if already a member
            if (user) {
                const existingMember = await this.memberRepo.findOne({
                    where: { projectId, userId: user.id },
                });

                if (existingMember) {
                    alreadyMembers.push(email);
                    continue;
                }
            }

            const invitationToken = uuidv4();

            if (user) {
                // Create member with pending status
                await this.memberRepo.save({
                    projectId,
                    userId: user.id,
                    role: ProjectMemberRole.MEMBER,
                    invitationStatus: InvitationStatus.ACCEPTED,
                    invitationToken,
                    invitedBy: userId,
                    joinedAt: new Date(),
                });
            } else {
                // For non-existing users, we just send an email
                // They will be added when they register and accept
            }

            // Send invitation email
            const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${invitationToken}`;
            try {
                await this.mailService.sendProjectInvitation(
                    email,
                    user?.name || email,
                    project.title,
                    inviter?.name || 'A team member',
                    inviteLink,
                );
            } catch (err) {
                this.logger.error(
                    `Failed to send invitation email to ${email}: ${err.message}`,
                );
            }

            // Create in-app notification for existing users
            if (user) {
                try {
                    await this.notificationRepo.save({
                        userId: user.id,
                        type: NotificationType.INVITATION,
                        title: 'Project Invitation',
                        message: `${inviter?.name || 'A team member'} invited you to join "${project.title}"`,
                        relatedTaskId: null,
                        relatedProjectId: projectId,
                        isRead: false,
                        sentAt: new Date(),
                    });
                } catch (err) {
                    this.logger.error(
                        `Failed to create invitation notification for ${email}: ${err.message}`,
                    );
                }
            }

            invited.push(email);
        }

        return { invited, alreadyMembers };
    }

    /**
     * Remove member from project (owner only)
     */
    async removeMember(
        projectId: string,
        memberId: string,
        userId: string,
    ): Promise<void> {
        await this.checkProjectOwner(projectId, userId);

        const project = await this.projectRepo.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (memberId === project.ownerId) {
            throw new BadRequestException('Cannot remove the project owner');
        }

        const member = await this.memberRepo.findOne({
            where: { projectId, userId: memberId },
        });
        if (!member) {
            throw new NotFoundException('Member not found in project');
        }

        await this.memberRepo.remove(member);

        await this.activityLogRepo.save({
            userId,
            projectId,
            actionType: 'member_removed',
            description: `A member was removed from the project`,
            metadata: { removedUserId: memberId },
        });
    }

    /**
     * Get project dashboard statistics
     */
    async getDashboardStats(projectId: string, userId: string, filters?: any) {
        await this.checkProjectMember(projectId, userId);

        // Get all columns for the project
        const columns = await this.columnRepo.find({ where: { projectId } });
        const columnIds = columns.map((c) => c.id);

        if (columnIds.length === 0) {
            return {
                overdueTasks: 0,
                tasksByStatus: [],
                tasksByPriority: [],
                memberWorkload: [],
                completionTrend: [],
            };
        }

        // Get all tasks in project (not deleted)
        const tasksQb = this.taskRepo
            .createQueryBuilder('task')
            .where('task.columnId IN (:...columnIds)', { columnIds })
            .andWhere('task.deletedAt IS NULL');

        if (filters?.assigneeId) {
            tasksQb.andWhere('task.assigneeId = :assigneeId', {
                assigneeId: filters.assigneeId,
            });
        }
        if (filters?.priority) {
            tasksQb.andWhere('task.priority = :priority', {
                priority: filters.priority,
            });
        }

        const tasks = await tasksQb.getMany();

        const totalTasks = tasks.length;
        // "Done" column tasks count as completed
        const doneColumn = columns.find(
            (c) =>
                c.title.toLowerCase() === 'done' ||
                c.title.toLowerCase() === 'completed',
        );
        const completedTasks = doneColumn
            ? tasks.filter((t) => t.columnId === doneColumn.id).length
            : 0;
        const overdueTasks = tasks.filter((t) => t.isOverdue).length;
        const completionPercentage =
            totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;
        const totalTimeLogged = tasks.reduce(
            (sum, t) => sum + t.totalTimeLogged,
            0,
        );

        // Tasks by status (array format for frontend)
        const tasksByStatus = columns.map((col) => ({
            status: col.title,
            count: tasks.filter((t) => t.columnId === col.id).length,
        }));

        // Tasks by priority (array format for frontend)
        const priorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const task of tasks) {
            if (priorityCounts[task.priority] !== undefined) {
                priorityCounts[task.priority]++;
            }
        }
        const tasksByPriority = Object.entries(priorityCounts).map(
            ([priority, count]) => ({ priority, count }),
        );

        // Member workload (mapped for frontend)
        const members = await this.memberRepo.find({
            where: { projectId, invitationStatus: InvitationStatus.ACCEPTED },
            relations: ['user'],
        });

        const memberWorkload = members.map((m) => {
            const memberTasks = tasks.filter((t) => t.assigneeId === m.userId);
            return {
                memberId: m.userId,
                memberName: m.user?.name || 'Unknown',
                taskCount: memberTasks.length,
            };
        });

        return {
            overdueTasks,
            tasksByStatus,
            tasksByPriority,
            memberWorkload,
            completionTrend: [],
        };
    }

    /**
     * Export project data as CSV
     */
    async exportCsv(projectId: string, userId: string): Promise<string> {
        await this.checkProjectOwner(projectId, userId);

        const columns = await this.columnRepo.find({ where: { projectId } });
        const columnIds = columns.map((c) => c.id);
        const columnMap = new Map(columns.map((c) => [c.id, c.title]));

        if (columnIds.length === 0) {
            return 'Task ID,Title,Status,Priority,Assignee,Due Date,Completed,Time Logged\n';
        }

        const tasks = await this.taskRepo.find({
            where: { columnId: In(columnIds), deletedAt: IsNull() },
            relations: ['assignee'],
            order: { position: 'ASC' },
        });

        const doneColumn = columns.find(
            (c) =>
                c.title.toLowerCase() === 'done' ||
                c.title.toLowerCase() === 'completed',
        );

        let csv =
            'Task ID,Title,Status,Priority,Assignee,Due Date,Completed,Time Logged\n';
        for (const task of tasks) {
            const status = columnMap.get(task.columnId) || 'Unknown';
            const completed = doneColumn
                ? task.columnId === doneColumn.id
                : false;
            csv += `${task.id},"${task.title.replace(/"/g, '""')}",${status},${task.priority},${task.assignee?.name || 'Unassigned'},${task.dueDate || ''},${completed},${task.totalTimeLogged}\n`;
        }

        return csv;
    }

    /**
     * Check if user is the project owner
     */
    async checkProjectOwner(projectId: string, userId: string): Promise<void> {
        const project = await this.projectRepo.findOne({
            where: { id: projectId, deletedAt: IsNull() },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }
        if (project.ownerId !== userId) {
            throw new ForbiddenException(
                'Only the project owner can perform this action',
            );
        }
    }

    /**
     * Check if user is a project member
     */
    async checkProjectMember(projectId: string, userId: string): Promise<void> {
        const member = await this.memberRepo.findOne({
            where: {
                projectId,
                userId,
                invitationStatus: InvitationStatus.ACCEPTED,
            },
        });
        if (!member) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }
    }

    /**
     * Update project completion percentage
     */
    async updateCompletionPercentage(projectId: string): Promise<void> {
        const columns = await this.columnRepo.find({ where: { projectId } });
        const columnIds = columns.map((c) => c.id);

        if (columnIds.length === 0) return;

        const totalTasks = await this.taskRepo.count({
            where: { columnId: In(columnIds), deletedAt: IsNull() },
        });

        const doneColumn = columns.find(
            (c) =>
                c.title.toLowerCase() === 'done' ||
                c.title.toLowerCase() === 'completed',
        );

        let completedTasks = 0;
        if (doneColumn) {
            completedTasks = await this.taskRepo.count({
                where: { columnId: doneColumn.id, deletedAt: IsNull() },
            });
        }

        const percentage =
            totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

        await this.projectRepo.update(projectId, {
            completionPercentage: percentage,
        });
    }

    /**
     * Helper: send invitations in background
     */
    private async sendInvitations(
        projectId: string,
        userId: string,
        emails: string[],
    ): Promise<void> {
        const dto: InviteMemberDto = { emails };
        await this.inviteMembers(projectId, userId, dto);
    }
}
