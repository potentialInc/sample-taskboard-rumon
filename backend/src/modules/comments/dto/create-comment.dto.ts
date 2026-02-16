import {
    IsString,
    IsOptional,
    IsArray,
    IsUUID,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({ description: 'Comment text', example: 'This looks great!' })
    @IsString()
    @MinLength(1)
    text: string;

    @ApiPropertyOptional({
        description: 'Array of mentioned user IDs',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    mentions?: string[];

    @ApiPropertyOptional({
        description: 'Parent comment ID for replies',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    parentCommentId?: string;
}
