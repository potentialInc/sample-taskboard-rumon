import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Column } from '../columns/entities/column.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/user.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MailModule } from 'src/infrastructure/mail/mail.module';
import { WebSocketModule } from 'src/websocket/websocket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Project,
            ProjectMember,
            Column,
            Task,
            User,
            ActivityLog,
            Notification,
        ]),
        MailModule,
        WebSocketModule,
    ],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule {}
