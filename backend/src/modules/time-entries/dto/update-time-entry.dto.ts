import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTimeEntryDto {
    @ApiPropertyOptional({ description: 'Duration in seconds', example: 7200 })
    @IsOptional()
    @IsInt()
    @Min(0)
    durationSeconds?: number;

    @ApiPropertyOptional({ description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;
}
