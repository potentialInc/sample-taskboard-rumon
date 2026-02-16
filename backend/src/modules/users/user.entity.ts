import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { UserRole } from '@shared/enums';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['googleId'])
@Index(['role'])
export class User extends BaseEntity {
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password: string | null; // Nullable for OAuth-only users

    @Column({ type: 'varchar', length: 100 })
    name: string; // Full name

    @Column({ name: 'job_title', type: 'varchar', length: 100, nullable: true })
    jobTitle: string | null;

    @Column({ name: 'profile_photo_url', type: 'text', nullable: true })
    profilePhotoUrl: string | null; // S3 URL

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.MEMBER,
    })
    role: UserRole; // admin, owner, member

    @Column({ name: 'email_verified', type: 'boolean', default: false })
    emailVerified: boolean;

    @Column({
        name: 'email_verification_token',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    emailVerificationToken: string | null;

    @Column({
        name: 'password_reset_token',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    passwordResetToken: string | null;

    @Column({
        name: 'password_reset_expires',
        type: 'timestamp',
        nullable: true,
    })
    passwordResetExpires: Date | null;

    @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
    googleId: string | null; // Google OAuth ID

    @Column({
        name: 'notification_preferences',
        type: 'jsonb',
        default: () =>
            `'{"push": true, "email": true, "emailDigest": "daily"}'`,
    })
    notificationPreferences: {
        push: boolean;
        email: boolean;
        emailDigest: 'off' | 'daily' | 'weekly';
        assignments?: boolean;
        deadlines?: boolean;
        comments?: boolean;
        statusChanges?: boolean;
    };

    @Column({ name: 'last_active_at', type: 'timestamp', nullable: true })
    lastActiveAt: Date | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean; // For suspend/deactivate

    @Column({
        name: 'refresh_token',
        type: 'text',
        nullable: true,
        select: false,
    })
    refreshToken: string | null;
}
