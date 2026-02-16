import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateTimeEntryDto, UpdateTimeEntryDto, StartTimerDto } from './dto';
import { TimeEntryType } from '@shared/enums';

@Injectable()
export class TimeEntriesService {
    constructor(
        @InjectRepository(TimeEntry)
        private readonly timeEntryRepo: Repository<TimeEntry>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
    ) {}

    /**
     * Get time entries for a task
     */
    async findByTask(taskId: string): Promise<TimeEntry[]> {
        await this.verifyTask(taskId);
        return this.timeEntryRepo.find({
            where: { taskId },
            relations: ['user'],
            order: { loggedAt: 'DESC' },
        });
    }

    /**
     * Create a manual time entry
     */
    async create(
        taskId: string,
        userId: string,
        dto: CreateTimeEntryDto,
    ): Promise<TimeEntry> {
        await this.verifyTask(taskId);

        const entry = this.timeEntryRepo.create({
            taskId,
            userId,
            durationSeconds: dto.durationSeconds,
            description: dto.description || null,
            entryType: TimeEntryType.MANUAL,
            loggedAt: new Date(),
        });

        const saved = await this.timeEntryRepo.save(entry);

        // Update task total time logged
        await this.updateTaskTimeLogged(taskId);

        const createdResult = await this.timeEntryRepo.findOne({
            where: { id: saved.id },
            relations: ['user'],
        });
        return createdResult!;
    }

    /**
     * Update a time entry (owner only)
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateTimeEntryDto,
    ): Promise<TimeEntry> {
        const entry = await this.timeEntryRepo.findOne({ where: { id } });
        if (!entry) {
            throw new NotFoundException('Time entry not found');
        }
        if (entry.userId !== userId) {
            throw new ForbiddenException(
                'You can only edit your own time entries',
            );
        }

        Object.assign(entry, dto);
        await this.timeEntryRepo.save(entry);

        // Update task total time
        await this.updateTaskTimeLogged(entry.taskId);

        const updatedResult = await this.timeEntryRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        return updatedResult!;
    }

    /**
     * Delete a time entry (owner only)
     */
    async delete(id: string, userId: string): Promise<void> {
        const entry = await this.timeEntryRepo.findOne({ where: { id } });
        if (!entry) {
            throw new NotFoundException('Time entry not found');
        }
        if (entry.userId !== userId) {
            throw new ForbiddenException(
                'You can only delete your own time entries',
            );
        }

        const taskId = entry.taskId;
        await this.timeEntryRepo.remove(entry);

        // Update task total time
        await this.updateTaskTimeLogged(taskId);
    }

    /**
     * Start a timer (creates a timer-type entry with startedAt, no duration yet)
     */
    async startTimer(userId: string, dto: StartTimerDto): Promise<TimeEntry> {
        await this.verifyTask(dto.taskId);

        // Check if user already has a running timer
        const running = await this.timeEntryRepo.findOne({
            where: {
                userId,
                entryType: TimeEntryType.TIMER,
                endedAt: IsNull(),
            },
        });

        if (running) {
            throw new BadRequestException(
                'You already have a running timer. Stop it before starting a new one.',
            );
        }

        const entry = this.timeEntryRepo.create({
            taskId: dto.taskId,
            userId,
            durationSeconds: 0,
            description: dto.description || null,
            entryType: TimeEntryType.TIMER,
            startedAt: new Date(),
            loggedAt: new Date(),
        });

        return this.timeEntryRepo.save(entry);
    }

    /**
     * Stop the running timer
     */
    async stopTimer(userId: string): Promise<TimeEntry> {
        const running = await this.timeEntryRepo.findOne({
            where: {
                userId,
                entryType: TimeEntryType.TIMER,
                endedAt: IsNull(),
            },
        });

        if (!running) {
            throw new BadRequestException('No running timer found');
        }

        const now = new Date();
        const startedAt = new Date(running.startedAt!);
        const durationSeconds = Math.floor(
            (now.getTime() - startedAt.getTime()) / 1000,
        );

        running.endedAt = now;
        running.durationSeconds = durationSeconds;

        const updated = await this.timeEntryRepo.save(running);

        // Update task total time
        await this.updateTaskTimeLogged(running.taskId);

        const stoppedResult = await this.timeEntryRepo.findOne({
            where: { id: updated.id },
            relations: ['user'],
        });
        return stoppedResult!;
    }

    /**
     * Get current user's time entries
     */
    async findByUser(userId: string): Promise<TimeEntry[]> {
        return this.timeEntryRepo.find({
            where: { userId },
            relations: ['task'],
            order: { loggedAt: 'DESC' },
            take: 50,
        });
    }

    /**
     * Update task.total_time_logged
     */
    private async updateTaskTimeLogged(taskId: string): Promise<void> {
        const result = await this.timeEntryRepo
            .createQueryBuilder('te')
            .select('COALESCE(SUM(te.duration_seconds), 0)', 'total')
            .where('te.task_id = :taskId', { taskId })
            .getRawOne();

        await this.taskRepo.update(taskId, {
            totalTimeLogged: parseInt(result?.total || '0', 10),
        });
    }

    private async verifyTask(taskId: string): Promise<void> {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, deletedAt: IsNull() },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }
    }
}
