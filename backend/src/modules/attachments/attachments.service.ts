import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { S3Service } from 'src/infrastructure/s3/s3.service';

@Injectable()
export class AttachmentsService {
    constructor(
        @InjectRepository(Attachment)
        private readonly attachmentRepo: Repository<Attachment>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ActivityLog)
        private readonly activityLogRepo: Repository<ActivityLog>,
        private readonly s3Service: S3Service,
    ) {}

    /**
     * Get attachments for a task
     */
    async findByTask(taskId: string): Promise<Attachment[]> {
        await this.verifyTask(taskId);
        return this.attachmentRepo.find({
            where: { taskId },
            relations: ['uploader'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Upload a file attachment to a task
     */
    async create(
        taskId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<Attachment> {
        const task = await this.verifyTask(taskId);

        // Upload to S3
        const s3Key = await this.s3Service.uploadFile(file, 'attachments');

        const attachment = this.attachmentRepo.create({
            taskId,
            uploadedBy: userId,
            fileName: file.originalname,
            fileUrl: s3Key,
            fileSize: file.size,
            fileType: file.mimetype,
        });

        const saved = await this.attachmentRepo.save(attachment);

        // Log activity
        const column = await this.taskRepo
            .createQueryBuilder('task')
            .innerJoin('columns', 'col', 'col.id = task.column_id')
            .select('col.project_id', 'projectId')
            .where('task.id = :taskId', { taskId })
            .getRawOne();

        await this.activityLogRepo.save({
            userId,
            projectId: column?.projectId || null,
            taskId,
            actionType: 'attachment_added',
            description: `File "${file.originalname}" was attached to task "${task.title}"`,
            metadata: { fileName: file.originalname, fileSize: file.size },
        });

        const result = await this.attachmentRepo.findOne({
            where: { id: saved.id },
            relations: ['uploader'],
        });

        if (!result) {
            throw new NotFoundException('Attachment not found after creation');
        }

        return result;
    }

    /**
     * Delete an attachment
     */
    async delete(id: string, userId: string): Promise<void> {
        const attachment = await this.attachmentRepo.findOne({ where: { id } });
        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        // Only uploader can delete (or project owner, handled by caller)
        if (attachment.uploadedBy !== userId) {
            throw new ForbiddenException(
                'You can only delete your own attachments',
            );
        }

        // Delete from S3
        try {
            await this.s3Service.deleteFile(attachment.fileUrl);
        } catch (err) {
            // Log but don't fail the operation
        }

        await this.attachmentRepo.remove(attachment);
    }

    /**
     * Get presigned URL for downloading an attachment
     */
    async getPresignedUrl(id: string): Promise<string> {
        const attachment = await this.attachmentRepo.findOne({ where: { id } });
        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        return this.s3Service.getPresignedUrl(attachment.fileUrl);
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
