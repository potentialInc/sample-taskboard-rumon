import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Attachment } from './entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Attachment, Task, ActivityLog]),
        MulterModule.register({
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
        }),
    ],
    controllers: [AttachmentsController],
    providers: [AttachmentsService],
    exports: [AttachmentsService],
})
export class AttachmentsModule {}
