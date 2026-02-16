import {
    IsString,
    IsOptional,
    IsDate,
    IsEnum,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@shared/enums';

export class UpdateProjectDto {
    @ApiPropertyOptional({
        description: 'Project title',
        example: 'TaskBoard Development v2',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({
        description: 'Project description',
        example: 'Updated project description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Project deadline',
        example: '2026-12-31',
        type: String,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    deadline?: Date;

    @ApiPropertyOptional({
        description: 'Project status',
        enum: ProjectStatus,
        example: ProjectStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;
}
