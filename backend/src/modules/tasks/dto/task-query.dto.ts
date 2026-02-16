import {
    IsOptional,
    IsEnum,
    IsUUID,
    IsString,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';

export class TaskQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by project ID',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiPropertyOptional({ description: 'Filter by column ID', format: 'uuid' })
    @IsOptional()
    @IsUUID()
    columnId?: string;

    @ApiPropertyOptional({
        description: 'Filter by assignee ID',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Filter by assignee shorthand (use "me" for current user)',
    })
    @IsOptional()
    @IsString()
    assignee?: string;

    @ApiPropertyOptional({
        description: 'Filter by priority',
        enum: TaskPriority,
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ description: 'Search by title' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Due date from' })
    @IsOptional()
    @IsDateString()
    dueDateFrom?: string;

    @ApiPropertyOptional({ description: 'Due date to' })
    @IsOptional()
    @IsDateString()
    dueDateTo?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number;

    @ApiPropertyOptional({ description: 'Sort by', example: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}
