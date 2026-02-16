import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@shared/enums';

export class ProjectQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: ProjectStatus,
        example: ProjectStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @ApiPropertyOptional({
        description: 'Search by project name',
        example: 'TaskBoard',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by deadline from date',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString()
    deadlineFrom?: string;

    @ApiPropertyOptional({
        description: 'Filter by deadline to date',
        example: '2026-12-31',
    })
    @IsOptional()
    @IsDateString()
    deadlineTo?: string;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: ['createdAt', 'title', 'deadline', 'completionPercentage'],
        example: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt' | 'title' | 'deadline' | 'completionPercentage';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
        example: 'DESC',
    })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';

    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({
        description: 'Items per page',
        example: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    limit?: number;
}
