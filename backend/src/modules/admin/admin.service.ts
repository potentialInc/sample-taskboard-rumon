import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Column } from '../columns/entities/column.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import {
    AdminCreateUserDto,
    AdminUpdateUserDto,
    AdminUserQueryDto,
    AdminProjectQueryDto,
} from './dto';
import { UserRole } from '@shared/enums';
import { PasswordUtil } from 'src/core/utils/password.util';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(Column)
        private readonly columnRepo: Repository<Column>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
    ) {}

    // ──────────────────────────────────────────────
    // User Management
    // ──────────────────────────────────────────────

    /**
     * Get all users with filters
     */
    async getUsers(query: AdminUserQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const qb = this.userRepo.createQueryBuilder('user');

        if (query.search) {
            qb.andWhere(
                '(user.name ILIKE :search OR user.email ILIKE :search)',
                {
                    search: `%${query.search}%`,
                },
            );
        }
        if (query.role) {
            qb.andWhere('user.role = :role', { role: query.role });
        }
        if (query.isActive === 'true' || query.isActive === 'false') {
            qb.andWhere('user.isActive = :isActive', {
                isActive: query.isActive === 'true',
            });
        }

        qb.orderBy('user.createdAt', 'DESC');

        const [users, total] = await qb
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        // Remove sensitive fields
        const sanitized = users.map((u) => {
            const {
                password,
                refreshToken,
                passwordResetToken,
                emailVerificationToken,
                ...rest
            } = u as any;
            return rest;
        });

        return {
            users: sanitized,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Create a new user (admin)
     */
    async createUser(dto: AdminCreateUserDto): Promise<User> {
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await PasswordUtil.hash(dto.password);

        const user = this.userRepo.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            jobTitle: dto.jobTitle || null,
            role: dto.role || UserRole.MEMBER,
            emailVerified: true, // Admin-created users are verified
            isActive: true,
        });

        const saved = await this.userRepo.save(user);
        const { password, refreshToken, ...result } = saved as any;
        return result;
    }

    /**
     * Update user (admin)
     */
    async updateUser(id: string, dto: AdminUpdateUserDto): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        Object.assign(user, dto);
        const saved = await this.userRepo.save(user);
        const { password, refreshToken, ...result } = saved as any;
        return result;
    }

    /**
     * Delete user (admin)
     */
    async deleteUser(id: string): Promise<void> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.role === UserRole.ADMIN) {
            throw new BadRequestException('Cannot delete admin users');
        }

        await this.userRepo.softRemove(user);
    }

    /**
     * Suspend a user
     */
    async suspendUser(id: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isActive = false;
        const saved = await this.userRepo.save(user);
        const { password, refreshToken, ...result } = saved as any;
        return result;
    }

    /**
     * Activate a user
     */
    async activateUser(id: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isActive = true;
        const saved = await this.userRepo.save(user);
        const { password, refreshToken, ...result } = saved as any;
        return result;
    }

    // ──────────────────────────────────────────────
    // Project Management
    // ──────────────────────────────────────────────

    /**
     * Get all projects (admin bypass)
     */
    async getProjects(query: AdminProjectQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const qb = this.projectRepo
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.owner', 'owner')
            .where('project.deletedAt IS NULL');

        if (query.search) {
            qb.andWhere('project.title ILIKE :search', {
                search: `%${query.search}%`,
            });
        }

        qb.orderBy('project.createdAt', 'DESC');

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
     * Delete any project (admin)
     */
    async deleteProject(id: string): Promise<void> {
        const project = await this.projectRepo.findOne({ where: { id } });
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        project.deletedAt = new Date();
        await this.projectRepo.save(project);
    }

    // ──────────────────────────────────────────────
    // Dashboard & Settings
    // ──────────────────────────────────────────────

    /**
     * Get admin dashboard stats + trends + activity
     */
    async getDashboard() {
        // --- Summary counts ---
        const [totalUsers, activeUsers, totalProjects, totalTasks] =
            await Promise.all([
                this.userRepo.count(),
                this.userRepo.count({ where: { isActive: true } }),
                this.projectRepo.count({ where: { deletedAt: IsNull() } }),
                this.taskRepo.count({ where: { deletedAt: IsNull() } }),
            ]);

        // --- 6-month trends (grouped by month) ---
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Use ISO date string for reliable SQL parameter binding
        const sixMonthsAgoStr = sixMonthsAgo.toISOString();

        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const monthLabels: string[] = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(sixMonthsAgo);
            d.setMonth(d.getMonth() + i);
            monthLabels.push(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            );
        }

        const fillTrend = (
            raw: { date: string; count: number }[],
        ): { label: string; date: string; value: number }[] => {
            const map = new Map(raw.map((r) => [r.date, Number(r.count)]));
            return monthLabels.map((date) => {
                const monthIdx = parseInt(date.split('-')[1], 10) - 1;
                return {
                    label: monthNames[monthIdx],
                    date,
                    value: map.get(date) || 0,
                };
            });
        };

        // Query trends with string date parameter for reliable binding
        let userTrend: { date: string; count: number }[] = [];
        let projectTrend: { date: string; count: number }[] = [];
        let taskTrend: { date: string; count: number }[] = [];

        try {
            [userTrend, projectTrend, taskTrend] = await Promise.all([
                this.userRepo.query(
                    `SELECT TO_CHAR(created_at, 'YYYY-MM') AS date, COUNT(*)::int AS count
                     FROM users
                     WHERE created_at >= $1::timestamp
                     GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                     ORDER BY date ASC`,
                    [sixMonthsAgoStr],
                ),
                this.projectRepo.query(
                    `SELECT TO_CHAR(created_at, 'YYYY-MM') AS date, COUNT(*)::int AS count
                     FROM projects
                     WHERE deleted_at IS NULL AND created_at >= $1::timestamp
                     GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                     ORDER BY date ASC`,
                    [sixMonthsAgoStr],
                ),
                this.taskRepo.query(
                    `SELECT TO_CHAR(created_at, 'YYYY-MM') AS date, COUNT(*)::int AS count
                     FROM tasks
                     WHERE deleted_at IS NULL AND created_at >= $1::timestamp
                     GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                     ORDER BY date ASC`,
                    [sixMonthsAgoStr],
                ),
            ]);
        } catch {
            // Tables may not exist yet — keep empty arrays
        }

        // --- Top 5 projects by task count ---
        let topProjectsResult: {
            id: string;
            name: string;
            completionPercentage: number;
            taskCount: number;
        }[] = [];

        try {
            const topProjects: {
                id: string;
                title: string;
                completion_percentage: number;
                taskCount: number;
            }[] = await this.projectRepo.query(
                `SELECT p.id, p.title, p.completion_percentage,
                        COALESCE((
                            SELECT COUNT(*)::int FROM tasks t
                            INNER JOIN columns c ON c.id = t.column_id
                            WHERE c.project_id = p.id AND t.deleted_at IS NULL
                        ), 0) AS "taskCount"
                 FROM projects p
                 WHERE p.deleted_at IS NULL
                 ORDER BY "taskCount" DESC
                 LIMIT 5`,
            );

            topProjectsResult = topProjects.map((p) => ({
                id: p.id,
                name: p.title,
                completionPercentage: Number(p.completion_percentage) || 0,
                taskCount: Number(p.taskCount) || 0,
            }));
        } catch {
            // Tables may not exist yet
        }

        // --- Recent activity (last 10) ---
        let activityItems: {
            id: string;
            actionType: string;
            description: string;
            userName: string;
            createdAt: string;
        }[] = [];

        try {
            const recentActivity: {
                id: string;
                action_type: string;
                description: string;
                created_at: string;
                user_name: string | null;
            }[] = await this.activityLogRepo.query(
                `SELECT al.id, al.action_type, al.description, al.created_at,
                        u.name AS user_name
                 FROM activity_logs al
                 LEFT JOIN users u ON u.id = al.user_id
                 ORDER BY al.created_at DESC
                 LIMIT 10`,
            );

            activityItems = recentActivity.map((log) => ({
                id: log.id,
                actionType: log.action_type,
                description: log.description,
                userName: log.user_name || 'System',
                createdAt: log.created_at,
            }));
        } catch {
            // activity_logs table may not exist yet
        }

        return {
            totalUsers,
            activeUsers,
            suspendedUsers: totalUsers - activeUsers,
            totalProjects,
            totalTasks,
            userRegistrationTrend: fillTrend(userTrend),
            projectCreationTrend: fillTrend(projectTrend),
            taskCreationTrend: fillTrend(taskTrend),
            topProjects: topProjectsResult,
            recentActivity: activityItems,
        };
    }

    /**
     * Get admin settings (placeholder)
     */
    getSettings() {
        return {
            maxFileSize: 10 * 1024 * 1024, // 10 MB
            allowedFileTypes: ['pdf', 'png', 'jpg', 'gif', 'docx', 'xlsx'],
            maxProjectsPerUser: 50,
            maxMembersPerProject: 100,
            trashRetentionDays: 30,
        };
    }

    /**
     * Update admin settings (placeholder)
     */
    updateSettings(settings: any) {
        // In production, this would be stored in a settings table
        return { ...settings, updatedAt: new Date() };
    }

    /**
     * Export system data
     */
    async exportData() {
        const users = await this.userRepo.find({
            select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
        });
        const projects = await this.projectRepo.find({
            where: { deletedAt: IsNull() },
            select: [
                'id',
                'title',
                'status',
                'completionPercentage',
                'createdAt',
            ],
        });

        return { users, projects, exportedAt: new Date() };
    }
}
