import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {
    @ApiProperty({
        description: 'User ID to assign the task to',
        format: 'uuid',
    })
    @IsUUID()
    assigneeId: string;
}
