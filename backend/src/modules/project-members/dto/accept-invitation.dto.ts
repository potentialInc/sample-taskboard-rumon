import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
    @ApiProperty({
        description: 'Invitation token from email',
        example: 'abc123xyz789',
    })
    @IsString()
    token: string;
}
