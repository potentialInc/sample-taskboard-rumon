import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 *
 * Generates a unique request ID for every incoming request.
 * - Checks for existing X-Request-Id header (forwarded from load balancer/proxy)
 * - Generates a new UUID if none present
 * - Attaches to both request and response headers
 *
 * This enables request tracing across logs and services.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    private readonly headerName = 'X-Request-Id';

    use(req: Request, res: Response, next: NextFunction) {
        const existingId = req.headers['x-request-id'] as string;
        const requestId = existingId || uuidv4();

        // Attach to request for downstream access
        req.headers['x-request-id'] = requestId;
        (req as any).requestId = requestId;

        // Include in response headers for client-side tracing
        res.setHeader(this.headerName, requestId);

        next();
    }
}
