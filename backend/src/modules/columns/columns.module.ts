import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Column } from './entities/column.entity';
import { Task } from '../tasks/entities/task.entity';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Column, Task]),
        forwardRef(() => ProjectsModule),
    ],
    controllers: [ColumnsController],
    providers: [ColumnsService],
    exports: [ColumnsService],
})
export class ColumnsModule {}
