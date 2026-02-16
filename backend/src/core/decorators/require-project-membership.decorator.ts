import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PROJECT_MEMBERSHIP_KEY = 'requireProjectMembership';

/**
 * Decorator to require project membership
 * Use with ProjectMemberGuard
 */
export const RequireProjectMembership = () =>
    SetMetadata(REQUIRE_PROJECT_MEMBERSHIP_KEY, true);

export const REQUIRE_PROJECT_OWNER_KEY = 'requireProjectOwner';

/**
 * Decorator to require project ownership
 * Use with ProjectOwnerGuard
 */
export const RequireProjectOwner = () =>
    SetMetadata(REQUIRE_PROJECT_OWNER_KEY, true);
