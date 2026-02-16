import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    MinLength,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@shared/enums';

export class AdminCreateUserDto {
    @ApiProperty({ description: 'User name', example: 'John Doe' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @ApiProperty({ description: 'User email', example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'User password', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ description: 'Job title' })
    @IsOptional()
    @IsString()
    jobTitle?: string;

    @ApiPropertyOptional({ description: 'User role', enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
