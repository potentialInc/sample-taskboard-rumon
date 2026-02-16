import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'Email address',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'securePass123',
        description: 'Password (minimum 8 characters)',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({
        example: 'Software Engineer',
        description: 'Job title (optional)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    jobTitle?: string;
}
