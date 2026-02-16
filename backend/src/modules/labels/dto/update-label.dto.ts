import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLabelDto {
    @ApiPropertyOptional({ description: 'Label name', maxLength: 50 })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @ApiPropertyOptional({ description: 'Hex color code', example: '#10B981' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex code' })
    color?: string;
}
