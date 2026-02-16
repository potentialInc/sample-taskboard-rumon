import {
    IsString,
    IsOptional,
    IsUUID,
    IsEnum,
    IsDate,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';

export class CreateTaskDto {
    @ApiProperty({
        description: 'Column ID where task will be created',
        format: 'uuid',
    })
    @IsUUID()
    columnId: string;

    @ApiProperty({
        description: 'Task title',
        example: 'Implement login page',
        maxLength: 255,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ description: 'Task description (rich text)' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Assignee user ID', format: 'uuid' })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Task priority',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({
        description: 'Task due date',
        example: '2026-03-15',
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dueDate?: Date;
}
