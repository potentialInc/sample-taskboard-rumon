import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SubTask } from './entities/sub-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateSubTaskDto, UpdateSubTaskDto, ReorderSubTaskDto } from './dto';

@Injectable()
export class SubTasksService {
    constructor(
        @InjectRepository(SubTask)
        private readonly subTaskRepo: Repository<SubTask>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
    ) {}

    /**
     * Get all sub-tasks for a task
     */
    async findByTask(taskId: string): Promise<SubTask[]> {
        await this.verifyTask(taskId);
        return this.subTaskRepo.find({
            where: { taskId },
            order: { position: 'ASC' },
        });
    }

    /**
     * Create a sub-task
     */
    async create(taskId: string, dto: CreateSubTaskDto): Promise<SubTask> {
        await this.verifyTask(taskId);

        let position = dto.position;
        if (position === undefined || position === null) {
            const maxPos = await this.subTaskRepo
                .createQueryBuilder('st')
                .select('MAX(st.position)', 'maxPos')
                .where('st.taskId = :taskId', { taskId })
                .getRawOne();
            position = (maxPos?.maxPos ?? -1) + 1;
        }

        const subTask = this.subTaskRepo.create({
            taskId,
            title: dto.title,
            position,
            completed: false,
        });

        const saved = await this.subTaskRepo.save(subTask);
        await this.updateTaskProgress(taskId);
        return saved;
    }

    /**
     * Update a sub-task
     */
    async update(id: string, dto: UpdateSubTaskDto): Promise<SubTask> {
        const subTask = await this.subTaskRepo.findOne({ where: { id } });
        if (!subTask) {
            throw new NotFoundException('Sub-task not found');
        }

        Object.assign(subTask, dto);
        const updated = await this.subTaskRepo.save(subTask);
        await this.updateTaskProgress(subTask.taskId);
        return updated;
    }

    /**
     * Delete a sub-task
     */
    async delete(id: string): Promise<void> {
        const subTask = await this.subTaskRepo.findOne({ where: { id } });
        if (!subTask) {
            throw new NotFoundException('Sub-task not found');
        }

        const taskId = subTask.taskId;
        await this.subTaskRepo.remove(subTask);
        await this.updateTaskProgress(taskId);
    }

    /**
     * Toggle sub-task completion
     */
    async toggle(id: string): Promise<SubTask> {
        const subTask = await this.subTaskRepo.findOne({ where: { id } });
        if (!subTask) {
            throw new NotFoundException('Sub-task not found');
        }

        subTask.completed = !subTask.completed;
        const updated = await this.subTaskRepo.save(subTask);
        await this.updateTaskProgress(subTask.taskId);
        return updated;
    }

    /**
     * Reorder sub-tasks
     */
    async reorder(id: string, dto: ReorderSubTaskDto): Promise<SubTask[]> {
        const subTask = await this.subTaskRepo.findOne({ where: { id } });
        if (!subTask) {
            throw new NotFoundException('Sub-task not found');
        }

        const subTasks = await this.subTaskRepo.find({
            where: { taskId: subTask.taskId },
            order: { position: 'ASC' },
        });

        const oldIndex = subTasks.findIndex((st) => st.id === id);
        const newIndex = Math.min(dto.newPosition, subTasks.length - 1);

        if (oldIndex === newIndex) return subTasks;

        const [moved] = subTasks.splice(oldIndex, 1);
        subTasks.splice(newIndex, 0, moved);

        for (let i = 0; i < subTasks.length; i++) {
            subTasks[i].position = i;
        }

        return this.subTaskRepo.save(subTasks);
    }

    /**
     * Update parent task progress_percentage based on sub-task completion
     */
    private async updateTaskProgress(taskId: string): Promise<void> {
        const subTasks = await this.subTaskRepo.find({ where: { taskId } });
        if (subTasks.length === 0) {
            await this.taskRepo.update(taskId, { progressPercentage: 0 });
            return;
        }

        const completed = subTasks.filter((st) => st.completed).length;
        const percentage = Math.round((completed / subTasks.length) * 100);
        await this.taskRepo.update(taskId, { progressPercentage: percentage });
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
