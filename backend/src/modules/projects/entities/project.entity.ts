import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { ProjectStatus } from '@shared/enums';
import { User } from 'src/modules/users/user.entity';

@Entity('projects')
@Index(['owner'])
@Index(['status'])
@Index(['deletedAt'])
export class Project extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column({ type: 'date', nullable: true })
    deadline: Date | null;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.ACTIVE,
    })
    status: ProjectStatus;

    @Column({
        name: 'completion_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
    })
    completionPercentage: number;

    // deletedAt is inherited from BaseEntity (@DeleteDateColumn)

    // Relations will be added as we create other entities
    // @OneToMany(() => Column, column => column.project)
    // columns: Column[];

    // @OneToMany(() => ProjectMember, member => member.project)
    // members: ProjectMember[];
}
