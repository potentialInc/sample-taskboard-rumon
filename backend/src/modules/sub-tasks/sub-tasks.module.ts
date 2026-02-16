import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubTask } from './entities/sub-task.entity';
import { Task } from '../tasks/entities/task.entity';
import { SubTasksService } from './sub-tasks.service';
import { SubTasksController } from './sub-tasks.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SubTask, Task])],
    controllers: [SubTasksController],
    providers: [SubTasksService],
    exports: [SubTasksService],
})
export class SubTasksModule {}
