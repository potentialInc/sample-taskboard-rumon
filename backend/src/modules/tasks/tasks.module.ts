import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Column } from '../columns/entities/column.entity';
import { TaskLabel } from '../task-labels/entities/task-label.entity';
import { Label } from '../labels/entities/label.entity';
import { User } from '../users/user.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ProjectsModule } from '../projects/projects.module';
import { WebSocketModule } from 'src/websocket/websocket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Task,
            Column,
            TaskLabel,
            Label,
            User,
            ActivityLog,
            Notification,
            ProjectMember,
        ]),
        forwardRef(() => ProjectsModule),
        WebSocketModule,
    ],
    controllers: [TasksController],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule {}
