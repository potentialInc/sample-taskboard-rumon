import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@shared/enums';

export class AdminUpdateUserDto {
    @ApiPropertyOptional({ description: 'User name', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ description: 'Job title' })
    @IsOptional()
    @IsString()
    jobTitle?: string;

    @ApiPropertyOptional({ description: 'User role', enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ description: 'Active status' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
