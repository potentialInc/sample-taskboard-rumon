import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationDto } from 'src/shared/dtos/pagination.dto';
import {
    PaginatedResponseDto,
    PaginationMetaDto,
} from 'src/shared/dtos/response.dto';

/**
 * Pagination result interface for raw usage
 */
export interface PaginationResult<T> {
    data: T[];
    meta: PaginationMetaDto;
}

/**
 * Advanced pagination helper for TypeORM QueryBuilder queries.
 *
 * Features:
 * - Supports any SelectQueryBuilder instance
 * - Automatic offset/limit calculation
 * - Dynamic sorting with field validation
 * - Returns PaginatedResponseDto compatible structure
 *
 * Usage:
 * ```typescript
 * const qb = this.taskRepository
 *   .createQueryBuilder('task')
 *   .leftJoinAndSelect('task.assignee', 'assignee')
 *   .where('task.deleted_at IS NULL');
 *
 * return paginate(qb, paginationDto, 'task', ['title', 'createdAt', 'priority', 'dueDate']);
 * ```
 */
export async function paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    alias: string,
    allowedSortFields: string[] = [],
): Promise<PaginatedResponseDto<T>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;

    // Apply sorting
    if (sortBy && allowedSortFields.length > 0) {
        if (allowedSortFields.includes(sortBy)) {
            queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
        }
    } else if (
        !queryBuilder.expressionMap.orderBys ||
        Object.keys(queryBuilder.expressionMap.orderBys).length === 0
    ) {
        // Default sort by createdAt if no ordering is set
        queryBuilder.orderBy(`${alias}.createdAt`, 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query with count
    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto<T>(data, page, limit, total);
}

/**
 * Simple pagination for Repository.find() style queries.
 *
 * Usage:
 * ```typescript
 * const result = await paginateFind(
 *   this.taskRepository,
 *   paginationDto,
 *   {
 *     where: { deletedAt: IsNull() },
 *     relations: ['assignee', 'column'],
 *   },
 * );
 * ```
 */
export async function paginateFind<T extends ObjectLiteral>(
    repository: { findAndCount: (options: any) => Promise<[T[], number]> },
    paginationDto: PaginationDto,
    findOptions: Record<string, any> = {},
): Promise<PaginatedResponseDto<T>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;

    const skip = (page - 1) * limit;

    const order: Record<string, 'ASC' | 'DESC'> = {};
    if (sortBy) {
        order[sortBy] = sortOrder;
    } else {
        order['createdAt'] = 'DESC';
    }

    const [data, total] = await repository.findAndCount({
        ...findOptions,
        skip,
        take: limit,
        order: { ...order, ...(findOptions.order || {}) },
    });

    return new PaginatedResponseDto<T>(data, page, limit, total);
}

/**
 * Build cursor-based pagination for high-performance scenarios.
 * Useful for infinite scroll / real-time feeds.
 *
 * Usage:
 * ```typescript
 * const result = await paginateCursor(
 *   qb,
 *   { cursor: 'uuid-of-last-item', limit: 20 },
 *   'task',
 *   'createdAt',
 * );
 * ```
 */
export async function paginateCursor<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: { cursor?: string; limit?: number },
    alias: string,
    cursorField: string = 'createdAt',
): Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
}> {
    const limit = options.limit || 20;

    if (options.cursor) {
        queryBuilder.andWhere(`${alias}.${cursorField} < :cursor`, {
            cursor: options.cursor,
        });
    }

    queryBuilder.orderBy(`${alias}.${cursorField}`, 'DESC').take(limit + 1); // Fetch one extra to detect if more items exist

    const results = await queryBuilder.getMany();
    const hasMore = results.length > limit;

    if (hasMore) {
        results.pop(); // Remove the extra item
    }

    const lastItem = results[results.length - 1];
    const nextCursor =
        hasMore && lastItem
            ? (lastItem as any)[cursorField]?.toISOString?.() ||
              String((lastItem as any)[cursorField])
            : null;

    return {
        data: results,
        nextCursor,
        hasMore,
    };
}
