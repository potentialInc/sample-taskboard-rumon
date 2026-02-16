import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseService } from 'src/core/base';
import { I18nHelper, PasswordUtil } from 'src/core/utils';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { ResponsePayloadDto } from '@shared/dtos/response.dto';
import { UserRole, InvitationStatus } from '@shared/enums';

@Injectable()
export class UserService extends BaseService<User> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nHelper: I18nHelper,
        private readonly dataSource: DataSource,
    ) {
        super(userRepository, 'User');
    }

    async createUser(
        createUserDto: CreateUserDto,
    ): Promise<ResponsePayloadDto<User>> {
        const existingUser = await this.userRepository.findByEmail(
            createUserDto.email,
        );
        if (existingUser) {
            if (process.env.MODE === 'DEV') {
                console.log(
                    '[UserService] Throwing conflict with email:',
                    createUserDto.email,
                );
            }

            throw new ConflictException(
                this.i18nHelper.t('translation.users.errors.email_exists', {
                    email: createUserDto.email,
                }),
            );
        }

        const hashedPassword = await PasswordUtil.hash(createUserDto.password);

        const user = await this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });

        return new ResponsePayloadDto({
            success: true,
            statusCode: 201,
            message: this.i18nHelper.t('translation.users.success.created'),
            data: user,
            timestamp: new Date().toISOString(),
        });
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        if (updateUserDto.password) {
            updateUserDto.password = await PasswordUtil.hash(
                updateUserDto.password,
            );
        }

        const updated = await this.update(id, updateUserDto);
        if (!updated) {
            return this.findByIdOrFail(id);
        }
        return updated;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    /**
     * Get all active users
     */
    async getActiveUsers(): Promise<User[]> {
        return this.userRepository.findActiveUsers();
    }

    /**
     * Get current user profile with stats
     */
    async getProfile(userId: string) {
        const user = await this.findByIdOrFail(userId);

        // Get profile stats using raw queries
        const [projectCount, taskStats, totalTimeLogged] = await Promise.all([
            this.dataSource
                .createQueryBuilder()
                .select('COUNT(*)', 'count')
                .from('project_members', 'pm')
                .where('pm.user_id = :userId', { userId })
                .andWhere('pm.invitation_status = :status', { status: InvitationStatus.ACCEPTED })
                .getRawOne()
                .then((r) => parseInt(r?.count || '0', 10)),

            this.dataSource
                .createQueryBuilder()
                .select('COUNT(*)', 'total')
                .addSelect(
                    `COUNT(*) FILTER (WHERE t.deleted_at IS NOT NULL)`,
                    'completed',
                )
                .from('tasks', 't')
                .where('t.assignee_id = :userId', { userId })
                .getRawOne()
                .then((r) => ({
                    total: parseInt(r?.total || '0', 10),
                    completed: parseInt(r?.completed || '0', 10),
                })),

            this.dataSource
                .createQueryBuilder()
                .select('COALESCE(SUM(te.duration_seconds), 0)', 'total')
                .from('time_entries', 'te')
                .where('te.user_id = :userId', { userId })
                .getRawOne()
                .then((r) => parseInt(r?.total || '0', 10)),
        ]);

        return {
            id: user.id,
            fullName: user.name,
            email: user.email,
            avatar: user.profilePhotoUrl || undefined,
            jobTitle: user.jobTitle || undefined,
            role: user.role === UserRole.ADMIN ? 'admin' : 'user',
            status: user.isActive ? 'active' : 'suspended',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastActiveAt || undefined,
            projectCount: projectCount,
            taskCount: taskStats.total,
            completedTaskCount: taskStats.completed,
            totalTimeLogged,
        };
    }

    /**
     * Update current user profile
     */
    async updateProfile(userId: string, data: {
        fullName?: string;
        jobTitle?: string;
        bio?: string;
        phone?: string;
        timezone?: string;
    }) {
        const user = await this.findByIdOrFail(userId);

        if (data.fullName !== undefined) user.name = data.fullName;
        if (data.jobTitle !== undefined) user.jobTitle = data.jobTitle;

        const saved = await this.dataSource.getRepository(User).save(user);

        return {
            id: saved.id,
            fullName: saved.name,
            email: saved.email,
            avatar: saved.profilePhotoUrl || undefined,
            jobTitle: saved.jobTitle || undefined,
            role: saved.role === UserRole.ADMIN ? 'admin' : 'user',
            status: saved.isActive ? 'active' : 'suspended',
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        };
    }

    /**
     * Get user notification preferences
     */
    async getPreferences(userId: string) {
        const user = await this.findByIdOrFail(userId);
        const prefs = user.notificationPreferences || {};

        return {
            emailNotifications: prefs.email ?? true,
            pushNotifications: prefs.push ?? true,
            dailyDigest: (prefs.emailDigest ?? 'daily') !== 'off',
            theme: 'light' as const,
        };
    }

    /**
     * Update user notification preferences
     */
    async updatePreferences(userId: string, data: {
        emailNotifications?: boolean;
        pushNotifications?: boolean;
        dailyDigest?: boolean;
        theme?: string;
    }) {
        const user = await this.findByIdOrFail(userId);
        const prefs = user.notificationPreferences || { push: true, email: true, emailDigest: 'daily' as const };

        if (data.emailNotifications !== undefined) prefs.email = data.emailNotifications;
        if (data.pushNotifications !== undefined) prefs.push = data.pushNotifications;
        if (data.dailyDigest !== undefined) prefs.emailDigest = data.dailyDigest ? 'daily' : 'off';

        user.notificationPreferences = prefs;
        await this.dataSource.getRepository(User).save(user);

        return {
            emailNotifications: prefs.email,
            pushNotifications: prefs.push,
            dailyDigest: prefs.emailDigest !== 'off',
            theme: 'light' as const,
        };
    }
}
