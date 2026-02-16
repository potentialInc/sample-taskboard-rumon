import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateColumnDto {
    @ApiPropertyOptional({
        description: 'Column title',
        example: 'In Review',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @ApiPropertyOptional({ description: 'Work-in-progress limit', example: 3 })
    @IsOptional()
    @IsInt()
    @Min(0)
    wipLimit?: number;
}
