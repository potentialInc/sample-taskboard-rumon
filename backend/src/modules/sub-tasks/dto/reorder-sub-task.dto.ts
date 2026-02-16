import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderSubTaskDto {
    @ApiProperty({ description: 'New position', example: 2 })
    @IsInt()
    @Min(0)
    newPosition: number;
}
