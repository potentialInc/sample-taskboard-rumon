import { IsEmail, IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteMemberDto {
    @ApiProperty({
        description: 'Email addresses to invite',
        example: ['user1@example.com', 'user2@example.com'],
        type: [String],
    })
    @IsArray()
    @IsEmail({}, { each: true })
    emails: string[];

    @ApiPropertyOptional({
        description: 'Optional invitation message',
        example: 'Join our TaskBoard project!',
    })
    @IsOptional()
    @IsString()
    message?: string;
}

export class AcceptInvitationDto {
    @ApiProperty({
        description: 'Invitation token from email',
        example: 'abc123xyz789',
    })
    @IsString()
    token: string;
}
