import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * Protects routes that require Google OAuth authentication
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const activate = (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        return activate;
    }
}
