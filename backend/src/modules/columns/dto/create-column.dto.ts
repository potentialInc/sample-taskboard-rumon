import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColumnDto {
    @ApiProperty({
        description: 'Column title',
        example: 'In Progress',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100)
    title: string;

    @ApiPropertyOptional({ description: 'Work-in-progress limit', example: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    wipLimit?: number;

    @ApiPropertyOptional({ description: 'Position in the board', example: 2 })
    @IsOptional()
    @IsInt()
    @Min(0)
    position?: number;
}
