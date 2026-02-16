import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddLabelDto {
    @ApiProperty({
        description: 'Label ID to attach to the task',
        format: 'uuid',
    })
    @IsUUID()
    labelId: string;
}
