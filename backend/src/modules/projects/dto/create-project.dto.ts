import {
    IsString,
    IsOptional,
    IsDate,
    IsArray,
    IsEnum,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
    @ApiProperty({
        description: 'Project title',
        example: 'TaskBoard Development',
        minLength: 1,
        maxLength: 255,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({
        description: 'Project description (supports rich text)',
        example: 'Main project for developing the TaskBoard platform',
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
        description: 'Board template to use (default, minimal, or custom)',
        example: 'default',
        enum: ['default', 'minimal', 'custom'],
    })
    @IsOptional()
    @IsEnum(['default', 'minimal', 'custom'])
    template?: 'default' | 'minimal' | 'custom';

    @ApiPropertyOptional({
        description: 'Custom column names (only if template is "custom")',
        example: ['To Do', 'In Progress', 'Review', 'Done'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    customColumns?: string[];

    @ApiPropertyOptional({
        description: 'Email addresses to invite as members',
        example: ['member1@example.com', 'member2@example.com'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    inviteEmails?: string[];
}
