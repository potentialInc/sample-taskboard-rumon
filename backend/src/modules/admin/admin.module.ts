import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Column } from '../columns/entities/column.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Project,
            Task,
            Column,
            ProjectMember,
            ActivityLog,
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
