import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveTaskDto {
    @ApiProperty({ description: 'Target column ID', format: 'uuid' })
    @IsUUID()
    targetColumnId: string;

    @ApiProperty({
        description: 'New position within target column',
        example: 0,
    })
    @IsInt()
    @Min(0)
    newPosition: number;
}
