import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeEntryDto {
    @ApiProperty({ description: 'Duration in seconds', example: 3600 })
    @IsInt()
    @Min(1)
    durationSeconds: number;

    @ApiPropertyOptional({ description: 'Description of work done' })
    @IsOptional()
    @IsString()
    description?: string;
}
