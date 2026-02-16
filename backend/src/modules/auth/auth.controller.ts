import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
    UsePipes,
    ValidationPipe,
    Version,
    VERSION_NEUTRAL,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginResponsePayloadDto, ResponsePayloadDto } from 'src/shared/dtos';
import { AuthService } from './auth.service';
import {
    AppleLoginDto,
    ChangePasswordDto,
    ForgotPasswordDto,
    ForgotPasswordResponseDto,
    LoginDto,
    RegisterDto,
    RegisterFcmTokenDto,
    ResetPasswordDto,
    SocialLoginDto,
} from './dtos';
import { ChangeUserPasswordDto } from './dtos/change-user-password.dto';
import { ApiSwagger, CurrentUser, Public } from '@core/decorators';
import * as interfaces from '@shared/interfaces';
import { JwtAuthGuard } from '@core/guards';
import { GoogleOAuthGuard } from '@core/guards/google-oauth.guard';
import { RemoveToken, SetToken } from '@core/interceptors';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) {}

    @Version(VERSION_NEUTRAL)
    @Post('login')
    @Public()
    @UseInterceptors(SetToken)
    @ApiSwagger({
        resourceName: 'Login',
        operation: 'custom',
        summary: 'User login',
        successStatus: 201,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: false,
        errors: [
            { status: 400, description: 'Invalid credentials' },
            {
                status: 401,
                description: 'Unauthorized - incorrect email or password',
            },
            { status: 404, description: 'User not found' },
        ],
    })
    async login(
        @Body() dto: LoginDto,
    ): Promise<ResponsePayloadDto<LoginResponsePayloadDto>> {
        return await this.authService.login(dto);
    }

    @Version(VERSION_NEUTRAL)
    @Post('register')
    @Public()
    @UsePipes(ValidationPipe)
    @ApiSwagger({
        resourceName: 'Register',
        operation: 'custom',
        summary: 'Register a new user account',
        requestDto: RegisterDto,
        responseDto: ResponsePayloadDto,
        requiresAuth: false,
        errors: [
            {
                status: 400,
                description: 'Email already taken or validation error',
            },
            { status: 500, description: 'Internal server error' },
        ],
    })
    async register(
        @Body() dto: RegisterDto,
    ): Promise<ResponsePayloadDto<null>> {
        return await this.authService.register(dto);
    }

    @Version(VERSION_NEUTRAL)
    @Get('verify-email')
    @Public()
    @ApiSwagger({
        resourceName: 'Verify Email',
        operation: 'custom',
        summary: 'Verify user email address with token',
        responseDto: ResponsePayloadDto,
        requiresAuth: false,
        errors: [
            {
                status: 400,
                description: 'Invalid or missing verification token',
            },
            { status: 404, description: 'Token not found or already used' },
        ],
    })
    async verifyEmail(
        @Query('token') token: string,
    ): Promise<ResponsePayloadDto<null>> {
        return await this.authService.verifyEmail(token);
    }

    @Version(VERSION_NEUTRAL)
    @Post('admin-login')
    @Public()
    @UsePipes(ValidationPipe)
    @UseInterceptors(SetToken)
    @ApiSwagger({
        resourceName: 'Admin Login',
        operation: 'custom',
        summary: 'Admin login',
        requestDto: LoginDto,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: false,
        errors: [
            { status: 400, description: 'Invalid credentials' },
            {
                status: 401,
                description: 'Unauthorized - incorrect email or password',
            },
            { status: 403, description: 'Forbidden - not an admin user' },
            { status: 404, description: 'User not found' },
        ],
    })
    async adminLogin(
        @Body() dto: LoginDto,
    ): Promise<ResponsePayloadDto<LoginResponsePayloadDto>> {
        return await this.authService.adminLogin(dto);
    }

    @Version(VERSION_NEUTRAL)
    @Post('social-login')
    @Public()
    @UsePipes(ValidationPipe)
    @UseInterceptors(SetToken)
    @ApiSwagger({
        resourceName: 'Social Login',
        operation: 'custom',
        summary: 'Social login (Google, Kakao, Naver)',
        requestDto: SocialLoginDto,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: false,
        errors: [
            {
                status: 400,
                description: 'Invalid token or missing required fields',
            },
            { status: 401, description: 'Token verification failed' },
        ],
    })
    async socialLogin(
        @Body() dto: SocialLoginDto,
    ): Promise<LoginResponsePayloadDto> {
        return await this.authService.socialLogin(dto);
    }

    @Post('change-password')
    @Public()
    @UsePipes(ValidationPipe)
    @UseGuards(JwtAuthGuard)
    @ApiSwagger({
        resourceName: 'Change Password',
        operation: 'custom',
        summary: 'Change password',
        requestDto: ChangePasswordDto,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: true,
        errors: [
            {
                status: 400,
                description:
                    'Invalid old password or new password does not match confirmation',
            },
            {
                status: 401,
                description: 'Unauthorized - incorrect old password',
            },
            { status: 404, description: 'User not found' },
            { status: 500, description: 'Failed to update password' },
        ],
    })
    async changePassword(
        @CurrentUser() user: interfaces.IJwtPayload,
        @Body() dto: ChangePasswordDto,
    ): Promise<LoginResponsePayloadDto> {
        return await this.authService.changePassword(user, dto);
    }

    @Post('change-user-password')
    @UsePipes(ValidationPipe)
    @UseGuards(JwtAuthGuard)
    @ApiSwagger({
        resourceName: 'Change User Password',
        operation: 'custom',
        summary: 'Change user password (admin)',
        requestDto: ChangeUserPasswordDto,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: true,
        errors: [
            {
                status: 400,
                description: 'Password confirmation does not match',
            },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
            { status: 500, description: 'Failed to update password' },
        ],
    })
    async changeUserPassword(
        @CurrentUser() user: interfaces.IJwtPayload,
        @Body() dto: ChangeUserPasswordDto,
    ): Promise<LoginResponsePayloadDto> {
        return await this.authService.changeUserPassword(user, dto);
    }

    @Post('forgot-password')
    @Public()
    @UsePipes(ValidationPipe)
    @ApiSwagger({
        resourceName: 'Forgot Password',
        operation: 'custom',
        summary: 'Request password reset OTP',
        requestDto: ForgotPasswordDto,
        responseDto: ForgotPasswordResponseDto,
        requiresAuth: false,
        errors: [
            { status: 404, description: 'User not found' },
            {
                status: 429,
                description: 'Too many requests - please try again later',
            },
        ],
    })
    async forgotPassword(
        @Body() dto: ForgotPasswordDto,
    ): Promise<ForgotPasswordResponseDto> {
        return await this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @Public()
    @UsePipes(ValidationPipe)
    @ApiSwagger({
        resourceName: 'Reset Password',
        operation: 'custom',
        summary: 'Reset password with OTP',
        requestDto: ResetPasswordDto,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: false,
        errors: [
            {
                status: 400,
                description: 'Invalid OTP or password confirmation mismatch',
            },
            { status: 404, description: 'User not found' },
            { status: 500, description: 'Failed to update password' },
        ],
    })
    async resetPassword(
        @Body() dto: ResetPasswordDto,
    ): Promise<LoginResponsePayloadDto> {
        return await this.authService.resetPassword(dto);
    }

    @Get('check-login')
    @UsePipes(ValidationPipe)
    @UseGuards(JwtAuthGuard)
    @ApiSwagger({
        resourceName: 'Check Login',
        operation: 'custom',
        summary: 'Check if user is logged in',
        responseDto: LoginResponsePayloadDto,
        requiresAuth: true,
        errors: [
            { status: 401, description: 'Unauthorized - invalid token' },
            { status: 404, description: 'User not found' },
        ],
    })
    async checkUserLogin(
        @CurrentUser() user: interfaces.IJwtPayload | null,
    ): Promise<ResponsePayloadDto<interfaces.IJwtPayload> | null> {
        if (user) {
            return await this.authService.getUserInformation(user);
        }
        return null;
    }

    @Get('refresh-access-token')
    @Public()
    @UsePipes(ValidationPipe)
    @UseInterceptors(SetToken)
    @ApiSwagger({
        resourceName: 'Refresh Token',
        operation: 'custom',
        summary: 'Refresh access token using httpOnly cookie',
        responseDto: LoginResponsePayloadDto,
        requiresAuth: false,
        errors: [
            {
                status: 401,
                description: 'Unauthorized - invalid or expired refresh token',
            },
            { status: 404, description: 'User not found' },
            { status: 500, description: 'Failed to generate new token' },
        ],
    })
    @ApiOperation({
        summary:
            'Refresh access token using refresh token from httpOnly cookie',
    })
    async refreshAccessToken(
        @Req() req: Request,
        @Query('refreshToken') refreshTokenQuery?: string,
    ): Promise<LoginResponsePayloadDto> {
        // Support both cookie-based (preferred) and query-based (fallback) refresh tokens
        const refreshToken = req.cookies?.refreshToken || refreshTokenQuery;
        return await this.authService.refreshAccessToken(refreshToken);
    }

    @Get('logout')
    @UsePipes(ValidationPipe)
    @UseInterceptors(RemoveToken)
    @UseGuards(JwtAuthGuard)
    @ApiSwagger({
        resourceName: 'Logout',
        operation: 'custom',
        summary: 'Logout user',
        responseDto: String,
        requiresAuth: true,
        errors: [{ status: 401, description: 'Unauthorized - invalid token' }],
    })
    async logout(
        @CurrentUser() user: interfaces.IJwtPayload | null,
    ): Promise<ResponsePayloadDto<string> | null> {
        return await this.authService.logout(user);
    }

    @Version(VERSION_NEUTRAL)
    @Post('register-fcm-token')
    @UsePipes(ValidationPipe)
    @UseGuards(JwtAuthGuard)
    @ApiSwagger({
        resourceName: 'FCM Token',
        operation: 'custom',
        summary: 'Register FCM token for push notifications',
        requestDto: RegisterFcmTokenDto,
        responseDto: String,
        requiresAuth: true,
        errors: [
            { status: 400, description: 'Invalid FCM token' },
            { status: 401, description: 'Unauthorized' },
        ],
    })
    async registerFcmToken(
        @CurrentUser() user: interfaces.IJwtPayload,
        @Body() dto: RegisterFcmTokenDto,
    ): Promise<ResponsePayloadDto<string>> {
        return await this.authService.registerFcmToken(user, dto);
    }

    @Post('apple-login')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(SetToken)
    @ApiSwagger({
        resourceName: 'Apple Login',
        operation: 'custom',
        summary: 'Apple token-based login',
        requestDto: AppleLoginDto,
        responseDto: LoginResponsePayloadDto,
        requiresAuth: false,
        errors: [
            { status: 400, description: 'Invalid Apple token or nonce' },
            {
                status: 401,
                description: 'Token verification failed or expired',
            },
        ],
    })
    async appleLogin(
        @Body() dto: AppleLoginDto,
    ): Promise<LoginResponsePayloadDto> {
        return await this.authService.appleLogin(dto);
    }

    @Version(VERSION_NEUTRAL)
    @Get('google')
    @Public()
    @UseGuards(GoogleOAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    async googleAuth() {
        // Guard will redirect to Google
    }

    @Version(VERSION_NEUTRAL)
    @Get('google/callback')
    @Public()
    @UseGuards(GoogleOAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthCallback(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ||
            'http://localhost:5173';
        const isProd =
            this.configService.get<string>('NODE_ENV') === 'production';

        try {
            const result = await this.authService.googleLogin(
                req.user as any,
            );

            const token = result?.data?.token;
            const refreshToken = result?.data?.refreshToken;

            if (token) {
                res.cookie(
                    this.configService.get<string>(
                        'AUTH_TOKEN_COOKIE_NAME',
                    ) || 'accessToken',
                    token,
                    {
                        httpOnly: true,
                        secure: isProd,
                        sameSite: isProd ? 'none' : 'lax',
                        maxAge: 15 * 60 * 1000,
                    },
                );
            }

            if (refreshToken) {
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: isProd ? 'none' : 'lax',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    path: '/api/auth/refresh-access-token',
                });
            }

            return res.redirect(`${frontendUrl}/projects`);
        } catch {
            return res.redirect(
                `${frontendUrl}/login?error=google_auth_failed`,
            );
        }
    }
}
