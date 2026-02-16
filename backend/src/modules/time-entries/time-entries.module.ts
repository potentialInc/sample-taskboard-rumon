import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from '../tasks/entities/task.entity';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesController } from './time-entries.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TimeEntry, Task])],
    controllers: [TimeEntriesController],
    providers: [TimeEntriesService],
    exports: [TimeEntriesService],
})
export class TimeEntriesModule {}
