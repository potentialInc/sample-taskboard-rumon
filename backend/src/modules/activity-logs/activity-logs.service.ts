import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogsService {
    constructor(
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
    ) {}

    /**
     * Get activity logs for a task
     */
    async findByTask(
        taskId: string,
        page = 1,
        limit = 20,
    ): Promise<ActivityLog[]> {
        return this.activityLogRepo.find({
            where: { taskId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    /**
     * Get activity logs for a project
     */
    async findByProject(
        projectId: string,
        page = 1,
        limit = 20,
    ): Promise<ActivityLog[]> {
        return this.activityLogRepo.find({
            where: { projectId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }

    /**
     * Get recent activity across all projects for a user
     */
    async findRecent(userId: string, limit = 20): Promise<ActivityLog[]> {
        return this.activityLogRepo
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.user', 'user')
            .innerJoin(
                'project_members',
                'pm',
                'pm.project_id = log.project_id AND pm.user_id = :userId',
                { userId },
            )
            .orderBy('log.createdAt', 'DESC')
            .take(limit)
            .getMany();
    }

    /**
     * Create an activity log entry (used by other services)
     */
    async create(data: Partial<ActivityLog>): Promise<ActivityLog> {
        const log = this.activityLogRepo.create(data);
        return this.activityLogRepo.save(log);
    }
}
