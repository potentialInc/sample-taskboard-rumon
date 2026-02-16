import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@shared/enums';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint
 * Usage: @Roles(UserRole.ADMIN, UserRole.OWNER)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to allow only admins
 */
export const AdminOnly = () => Roles(UserRole.ADMIN);

/**
 * Decorator to allow owners and admins
 */
export const OwnerOrAdmin = () => Roles(UserRole.OWNER, UserRole.ADMIN);
