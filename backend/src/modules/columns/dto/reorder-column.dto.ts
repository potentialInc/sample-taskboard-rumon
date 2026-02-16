import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderColumnDto {
    @ApiProperty({ description: 'New position for the column', example: 2 })
    @IsInt()
    @Min(0)
    newPosition: number;
}
