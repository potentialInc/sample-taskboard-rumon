import { UserRole } from '@shared/enums';

export interface IJwtPayload {
    id: string;
    name: string;
    email: string;
    role: UserRole;

    profilePhotoUrl?: string | null;
    teamName?: string | null;
    isActive?: boolean;
}
