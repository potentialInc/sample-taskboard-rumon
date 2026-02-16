import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@shared/enums';

export class AdminUserQueryDto {
    @ApiPropertyOptional({ description: 'Search by name or email' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by role', enum: UserRole })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ description: 'Filter by active status (send "true" or "false")' })
    @IsOptional()
    @IsString()
    isActive?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}

export class AdminProjectQueryDto {
    @ApiPropertyOptional({ description: 'Search by project name' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
