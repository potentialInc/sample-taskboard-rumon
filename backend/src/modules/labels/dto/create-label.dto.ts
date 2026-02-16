import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLabelDto {
    @ApiProperty({ description: 'Label name', example: 'Bug', maxLength: 50 })
    @IsString()
    @MaxLength(50)
    name: string;

    @ApiPropertyOptional({ description: 'Hex color code', example: '#EF4444' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color must be a valid hex code (e.g., #FF5733)',
    })
    color?: string;
}
