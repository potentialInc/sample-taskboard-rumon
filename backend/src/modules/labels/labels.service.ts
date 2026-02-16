import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    OnModuleInit,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { CreateLabelDto, UpdateLabelDto } from './dto';

const SYSTEM_LABELS = [
    { name: 'Bug', color: '#EF4444' },
    { name: 'Feature', color: '#10B981' },
    { name: 'Design', color: '#8B5CF6' },
    { name: 'Documentation', color: '#3B82F6' },
    { name: 'Improvement', color: '#F59E0B' },
];

@Injectable()
export class LabelsService implements OnModuleInit {
    private readonly logger = new Logger(LabelsService.name);

    constructor(
        @InjectRepository(Label)
        private readonly labelRepo: Repository<Label>,
    ) {}

    /**
     * Seed system labels on module initialization
     */
    async onModuleInit(): Promise<void> {
        try {
            const existingSystemLabels = await this.labelRepo.count({
                where: { isSystem: true },
            });

            if (existingSystemLabels === 0) {
                for (const label of SYSTEM_LABELS) {
                    await this.labelRepo.save({
                        name: label.name,
                        color: label.color,
                        isSystem: true,
                        projectId: null,
                    });
                }
                this.logger.log(`Seeded ${SYSTEM_LABELS.length} system labels`);
            }
        } catch (error) {
            this.logger.warn(`Failed to seed system labels: ${error.message}`);
        }
    }

    /**
     * Get all labels (system + project-specific)
     */
    async findAll(projectId?: string): Promise<Label[]> {
        const qb = this.labelRepo.createQueryBuilder('label');

        if (projectId) {
            qb.where(
                'label.isSystem = :isSystem OR label.projectId = :projectId',
                {
                    isSystem: true,
                    projectId,
                },
            );
        } else {
            qb.where('label.isSystem = :isSystem', { isSystem: true });
        }

        return qb.orderBy('label.name', 'ASC').getMany();
    }

    /**
     * Create a project-specific label
     */
    async create(projectId: string, dto: CreateLabelDto): Promise<Label> {
        const label = this.labelRepo.create({
            name: dto.name,
            color: dto.color || '#808080',
            isSystem: false,
            projectId,
        });

        return this.labelRepo.save(label);
    }

    /**
     * Update a label (custom labels only)
     */
    async update(id: string, dto: UpdateLabelDto): Promise<Label> {
        const label = await this.labelRepo.findOne({ where: { id } });
        if (!label) {
            throw new NotFoundException('Label not found');
        }
        if (label.isSystem) {
            throw new ForbiddenException('System labels cannot be modified');
        }

        Object.assign(label, dto);
        return this.labelRepo.save(label);
    }

    /**
     * Delete a label (custom labels only)
     */
    async delete(id: string): Promise<void> {
        const label = await this.labelRepo.findOne({ where: { id } });
        if (!label) {
            throw new NotFoundException('Label not found');
        }
        if (label.isSystem) {
            throw new ForbiddenException('System labels cannot be deleted');
        }

        await this.labelRepo.remove(label);
    }
}
