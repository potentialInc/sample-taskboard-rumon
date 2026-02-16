import {
    IsString,
    IsOptional,
    IsInt,
    Min,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubTaskDto {
    @ApiProperty({
        description: 'Sub-task title',
        example: 'Write unit tests',
        maxLength: 255,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ description: 'Position in the list', example: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    position?: number;
}
