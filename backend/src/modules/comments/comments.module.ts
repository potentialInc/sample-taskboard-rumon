import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { Column } from '../columns/entities/column.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { WebSocketModule } from 'src/websocket/websocket.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Comment,
            Task,
            Column,
            Notification,
            ActivityLog,
        ]),
        WebSocketModule,
    ],
    controllers: [CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule {}
