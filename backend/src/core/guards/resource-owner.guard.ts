import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to check if user owns the resource
 * Use with @ResourceType() decorator to specify resource type
 * Expects resource to be loaded in request.resource by the controller
 */
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const resource = request.resource; // Should be set by controller

        if (!user || !user.id) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!resource) {
            throw new ForbiddenException('Resource not found');
        }

        // Check various owner field names
        const ownerId =
            resource.ownerId ||
            resource.creatorId ||
            resource.userId ||
            resource.authorId ||
            resource.uploadedBy;

        if (!ownerId) {
            throw new ForbiddenException('Cannot determine resource owner');
        }

        if (ownerId !== user.id) {
            throw new ForbiddenException(
                'You can only modify your own resources',
            );
        }

        return true;
    }
}
