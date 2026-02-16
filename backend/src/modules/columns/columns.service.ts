import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Column } from './entities/column.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnDto } from './dto';

@Injectable()
export class ColumnsService {
    constructor(
        @InjectRepository(Column)
        private readonly columnRepo: Repository<Column>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        private readonly dataSource: DataSource,
        private readonly projectsService: ProjectsService,
    ) {}

    /**
     * Get all columns for a project
     */
    async findByProject(projectId: string, userId: string) {
        await this.projectsService.checkProjectMember(projectId, userId);

        const columns = await this.columnRepo.find({
            where: { projectId },
            order: { position: 'ASC' },
        });

        // Add task count for each column
        const result = await Promise.all(
            columns.map(async (col) => {
                const taskCount = await this.taskRepo.count({
                    where: { columnId: col.id, deletedAt: IsNull() },
                });
                return { ...col, taskCount };
            }),
        );

        return result;
    }

    /**
     * Create a new column in a project (owner only)
     */
    async create(
        projectId: string,
        userId: string,
        dto: CreateColumnDto,
    ): Promise<Column> {
        await this.projectsService.checkProjectOwner(projectId, userId);

        // Determine position
        let position = dto.position;
        if (position === undefined || position === null) {
            const maxPosition = await this.columnRepo
                .createQueryBuilder('col')
                .select('MAX(col.position)', 'maxPos')
                .where('col.projectId = :projectId', { projectId })
                .getRawOne();
            position = (maxPosition?.maxPos ?? -1) + 1;
        }

        const column = this.columnRepo.create({
            projectId,
            title: dto.title,
            position,
            wipLimit: dto.wipLimit || null,
        });

        return this.columnRepo.save(column);
    }

    /**
     * Update a column
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateColumnDto,
    ): Promise<Column> {
        const column = await this.columnRepo.findOne({ where: { id } });
        if (!column) {
            throw new NotFoundException('Column not found');
        }

        await this.projectsService.checkProjectOwner(column.projectId, userId);

        Object.assign(column, dto);
        return this.columnRepo.save(column);
    }

    /**
     * Delete a column (owner only)
     */
    async delete(id: string, userId: string): Promise<void> {
        const column = await this.columnRepo.findOne({ where: { id } });
        if (!column) {
            throw new NotFoundException('Column not found');
        }

        await this.projectsService.checkProjectOwner(column.projectId, userId);

        // Check if column has tasks
        const taskCount = await this.taskRepo.count({
            where: { columnId: id, deletedAt: IsNull() },
        });
        if (taskCount > 0) {
            throw new BadRequestException(
                `Cannot delete column with ${taskCount} task(s). Move or delete tasks first.`,
            );
        }

        await this.columnRepo.remove(column);

        // Re-order remaining columns
        const remaining = await this.columnRepo.find({
            where: { projectId: column.projectId },
            order: { position: 'ASC' },
        });
        for (let i = 0; i < remaining.length; i++) {
            remaining[i].position = i;
        }
        await this.columnRepo.save(remaining);
    }

    /**
     * Reorder a column
     */
    async reorder(
        id: string,
        userId: string,
        dto: ReorderColumnDto,
    ): Promise<Column[]> {
        const column = await this.columnRepo.findOne({ where: { id } });
        if (!column) {
            throw new NotFoundException('Column not found');
        }

        await this.projectsService.checkProjectOwner(column.projectId, userId);

        const columns = await this.columnRepo.find({
            where: { projectId: column.projectId },
            order: { position: 'ASC' },
        });

        const oldIndex = columns.findIndex((c) => c.id === id);
        const newIndex = Math.min(dto.newPosition, columns.length - 1);

        if (oldIndex === newIndex) {
            return columns;
        }

        // Reorder
        const [moved] = columns.splice(oldIndex, 1);
        columns.splice(newIndex, 0, moved);

        // Update positions
        for (let i = 0; i < columns.length; i++) {
            columns[i].position = i;
        }

        return this.columnRepo.save(columns);
    }
}
