import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartTimerDto {
    @ApiProperty({ description: 'Task ID to start timer for', format: 'uuid' })
    @IsUUID()
    taskId: string;

    @ApiPropertyOptional({ description: 'Description of work' })
    @IsOptional()
    @IsString()
    description?: string;
}
