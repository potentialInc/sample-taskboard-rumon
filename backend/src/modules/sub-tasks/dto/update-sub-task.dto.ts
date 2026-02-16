import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubTaskDto {
    @ApiPropertyOptional({ description: 'Sub-task title', maxLength: 255 })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ description: 'Completion status' })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}
