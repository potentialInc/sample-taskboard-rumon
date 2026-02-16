import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationDto } from 'src/shared/dtos/pagination.dto';

/**
 * @Paginate() parameter decorator
 *
 * Extracts pagination parameters from the request query string
 * and returns a validated PaginationDto object.
 *
 * Usage:
 * ```typescript
 * @Get()
 * async findAll(@Paginate() pagination: PaginationDto) {
 *   return this.service.findAll(pagination);
 * }
 * ```
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * - sortBy: string (field name)
 * - sortOrder: 'ASC' | 'DESC' (default: 'DESC')
 */
export const Paginate = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): PaginationDto => {
        const request = ctx.switchToHttp().getRequest();
        const query = request.query;

        const dto = new PaginationDto();

        dto.page = Math.max(1, parseInt(query.page, 10) || 1);
        dto.limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));

        if (query.sortBy && typeof query.sortBy === 'string') {
            // Sanitize sortBy to prevent SQL injection (only allow alphanumeric and underscores)
            dto.sortBy = query.sortBy.replace(/[^a-zA-Z0-9_]/g, '');
        }

        if (
            query.sortOrder &&
            ['ASC', 'DESC'].includes(query.sortOrder.toUpperCase())
        ) {
            dto.sortOrder = query.sortOrder.toUpperCase() as 'ASC' | 'DESC';
        } else {
            dto.sortOrder = 'DESC';
        }

        return dto;
    },
);
