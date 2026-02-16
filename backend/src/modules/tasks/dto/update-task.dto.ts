import {
    IsString,
    IsOptional,
    IsEnum,
    IsDate,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';

export class UpdateTaskDto {
    @ApiPropertyOptional({ description: 'Task title', maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ description: 'Task description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Task priority', enum: TaskPriority })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ description: 'Task due date' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dueDate?: Date;
}
