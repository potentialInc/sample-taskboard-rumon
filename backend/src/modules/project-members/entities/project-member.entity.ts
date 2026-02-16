import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { ProjectMemberRole, InvitationStatus } from '@shared/enums';
import { Project } from 'src/modules/projects/entities/project.entity';
import { User } from 'src/modules/users/user.entity';

@Entity('project_members')
@Index(['project', 'user'], { unique: true })
@Index(['user'])
@Index(['invitationToken'])
export class ProjectMember extends BaseEntity {
    @Column({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @ManyToOne(() => Project, { eager: false })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'enum',
        enum: ProjectMemberRole,
        default: ProjectMemberRole.MEMBER,
    })
    role: ProjectMemberRole;

    @Column({
        name: 'invitation_status',
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.ACCEPTED,
    })
    invitationStatus: InvitationStatus;

    @Column({
        name: 'invitation_token',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    invitationToken: string | null;

    @Column({
        name: 'joined_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    joinedAt: Date;

    @Column({ name: 'invited_by', type: 'uuid', nullable: true })
    invitedBy: string | null;

    @ManyToOne(() => User, { eager: false, nullable: true })
    @JoinColumn({ name: 'invited_by' })
    inviter: User | null;
}
