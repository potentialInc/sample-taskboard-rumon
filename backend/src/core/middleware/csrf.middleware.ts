import {
    Injectable,
    NestMiddleware,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * CSRF Protection Middleware for cookie-based authentication.
 *
 * Strategy: Double Submit Cookie Pattern
 * - On GET requests: generates a CSRF token, sets it as a non-httpOnly cookie (XSRF-TOKEN)
 * - On state-changing requests (POST, PUT, PATCH, DELETE):
 *   validates that the X-XSRF-TOKEN header matches the XSRF-TOKEN cookie
 *
 * The frontend must read the XSRF-TOKEN cookie and include it as
 * the X-XSRF-TOKEN header on all mutating requests.
 *
 * Configuration:
 * - Disabled in development mode (MODE=DEV) for easier testing
 * - Skips requests with Authorization header (API clients use Bearer tokens, not cookies)
 * - Skips WebSocket upgrade requests
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    private readonly logger = new Logger(CsrfMiddleware.name);
    private readonly isProduction = process.env.MODE !== 'DEV';
    private readonly cookieName = 'XSRF-TOKEN';
    private readonly headerName = 'x-xsrf-token';

    use(req: Request, res: Response, next: NextFunction) {
        // Skip CSRF protection in development
        if (!this.isProduction) {
            return next();
        }

        // Skip for WebSocket upgrade requests
        if (req.headers.upgrade === 'websocket') {
            return next();
        }

        // Skip for requests using Bearer token auth (non-cookie clients)
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return next();
        }

        const method = req.method.toUpperCase();

        // For safe methods: set or refresh the CSRF token cookie
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            this.setTokenCookie(req, res);
            return next();
        }

        // For state-changing methods: validate the token
        this.validateToken(req);
        next();
    }

    /**
     * Set CSRF token cookie. Generate new token if none exists.
     */
    private setTokenCookie(req: Request, res: Response): void {
        let token = req.cookies?.[this.cookieName];

        if (!token) {
            token = randomBytes(32).toString('hex');
        }

        res.cookie(this.cookieName, token, {
            httpOnly: false, // Must be readable by JavaScript
            secure: this.isProduction,
            sameSite: this.isProduction ? 'strict' : 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }

    /**
     * Validate that the CSRF header matches the cookie.
     */
    private validateToken(req: Request): void {
        const cookieToken = req.cookies?.[this.cookieName];
        const headerToken = req.headers[this.headerName] as string;

        if (!cookieToken || !headerToken) {
            this.logger.warn(
                `CSRF token missing: cookie=${!!cookieToken}, header=${!!headerToken} - ${req.method} ${req.url}`,
            );
            throw new ForbiddenException(
                'CSRF token missing. Include X-XSRF-TOKEN header.',
            );
        }

        if (cookieToken !== headerToken) {
            this.logger.warn(`CSRF token mismatch: ${req.method} ${req.url}`);
            throw new ForbiddenException(
                'CSRF token mismatch. Please refresh and try again.',
            );
        }
    }
}
