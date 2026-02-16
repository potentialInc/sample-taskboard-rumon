import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
    Length,
} from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'example@gmail.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: '1234', description: '4-digit OTP from email' })
    @IsNotEmpty()
    @IsString()
    @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
    otp: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(17)
    password: string;
}
