import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, throwError } from 'rxjs';

/**
 * Interceptor to set JWT tokens as httpOnly cookies
 * Sets both access token and refresh token in secure cookies
 * PRD Requirement: 3.2.1 Security
 */
@Injectable()
export class SetToken implements NestInterceptor {
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse();
        return next.handle().pipe(
            map((value) => {
                if (value.success && value.data?.token) {
                    const isProd =
                        this.configService.get<string>('NODE_ENV') ===
                        'production';

                    // Set access token cookie
                    res.cookie(
                        this.configService.get<string>(
                            'AUTH_TOKEN_COOKIE_NAME',
                        ) || 'accessToken',
                        value.data.token,
                        {
                            httpOnly: true,
                            secure: isProd,
                            sameSite: isProd ? 'none' : 'lax',
                            maxAge: 15 * 60 * 1000, // 15 minutes
                        },
                    );

                    // Set refresh token cookie if present
                    if (value.data.refreshToken) {
                        res.cookie('refreshToken', value.data.refreshToken, {
                            httpOnly: true,
                            secure: isProd,
                            sameSite: isProd ? 'none' : 'lax',
                            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                            path: '/auth/refresh-access-token',
                        });
                    }

                    // Remove tokens from response body for security
                    const sanitizedValue = {
                        ...value,
                        data: {
                            ...value.data,
                            token: undefined,
                            refreshToken: undefined,
                        },
                    };

                    return sanitizedValue;
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
