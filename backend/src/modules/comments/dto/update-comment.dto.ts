import {
    IsString,
    IsOptional,
    IsArray,
    IsUUID,
    MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
    @ApiPropertyOptional({ description: 'Updated comment text' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    text?: string;

    @ApiPropertyOptional({ description: 'Updated mentions', type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    mentions?: string[];
}
