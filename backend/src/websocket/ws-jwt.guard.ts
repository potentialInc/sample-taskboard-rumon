import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { envConfigService } from 'src/config/env-config.service';

/**
 * WebSocket JWT Authentication Guard
 *
 * Extracts JWT from:
 * 1. Socket handshake auth.token
 * 2. Socket handshake headers cookie (httpOnly cookie fallback)
 * 3. Socket handshake query.token
 *
 * Attaches decoded user payload to client.data.user
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const client: Socket = context.switchToWs().getClient();

        try {
            const token = this.extractToken(client);
            if (!token) {
                throw new WsException('Authentication token not provided');
            }

            const payload = this.jwtService.verify(token, {
                secret: envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET,
            });

            // Attach user data to socket for downstream usage
            client.data.user = {
                id: payload.sub || payload.id,
                email: payload.email,
                role: payload.role,
                name: payload.firstName
                    ? `${payload.firstName} ${payload.lastName || ''}`.trim()
                    : payload.fullName || 'Unknown',
            };

            return true;
        } catch (error) {
            this.logger.warn(
                `WebSocket authentication failed for socket ${client.id}: ${error.message}`,
            );
            throw new WsException('Unauthorized: Invalid or expired token');
        }
    }

    /**
     * Extract JWT token from multiple sources in priority order
     */
    private extractToken(client: Socket): string | null {
        // 1. Auth object (recommended for Socket.IO clients)
        const authToken = client.handshake?.auth?.token;
        if (authToken) {
            return authToken;
        }

        // 2. Cookie-based token (httpOnly cookie from browser)
        const cookies = client.handshake?.headers?.cookie;
        if (cookies) {
            const cookieName =
                envConfigService.getAuthJWTConfig().AUTH_TOKEN_COOKIE_NAME ||
                'accessToken';
            const tokenCookie = cookies
                .split(';')
                .map((c: string) => c.trim())
                .find((c: string) => c.startsWith(`${cookieName}=`));
            if (tokenCookie) {
                return tokenCookie.split('=')[1];
            }
        }

        // 3. Query parameter fallback
        const queryToken = client.handshake?.query?.token;
        if (queryToken && typeof queryToken === 'string') {
            return queryToken;
        }

        return null;
    }
}
