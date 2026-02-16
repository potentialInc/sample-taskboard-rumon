import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, throwError } from 'rxjs';

/**
 * Interceptor to remove JWT tokens from httpOnly cookies
 * Clears both access token and refresh token cookies on logout
 * PRD Requirement: 3.2.1 Security
 */
@Injectable()
export class RemoveToken implements NestInterceptor {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse();
        return next.handle().pipe(
            map((value) => {
                if (value.success) {
                    const isProd =
                        this.configService.get<string>('NODE_ENV') ===
                        'production';

                    // Clear access token cookie
                    res.clearCookie(
                        this.configService.get<string>(
                            'AUTH_TOKEN_COOKIE_NAME',
                        ) || 'accessToken',
                        {
                            httpOnly: true,
                            secure: isProd,
                            sameSite: isProd ? 'none' : 'lax',
                        },
                    );

                    // Clear refresh token cookie
                    res.clearCookie('refreshToken', {
                        httpOnly: true,
                        secure: isProd,
                        sameSite: isProd ? 'none' : 'lax',
                        path: '/auth/refresh-access-token',
                    });

                    return {
                        success: true,
                        message: value.message,
                    };
                } else {
                    return value;
                }
            }),
            catchError((err) => {
                return throwError(() => err);
            }),
        );
    }
}
