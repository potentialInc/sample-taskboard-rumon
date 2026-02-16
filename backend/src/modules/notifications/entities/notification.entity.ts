import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { NotificationType } from '@shared/enums';
import { User } from 'src/modules/users/user.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { Project } from 'src/modules/projects/entities/project.entity';

@Entity('notifications')
@Index(['user'])
@Index(['user', 'isRead'])
@Index(['type'])
export class Notification extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    link: string | null;

    @Column({ name: 'related_task_id', type: 'uuid', nullable: true })
    relatedTaskId: string | null;

    @ManyToOne(() => Task, { eager: false, nullable: true })
    @JoinColumn({ name: 'related_task_id' })
    relatedTask: Task | null;

    @Column({ name: 'related_project_id', type: 'uuid', nullable: true })
    relatedProjectId: string | null;

    @ManyToOne(() => Project, { eager: false, nullable: true })
    @JoinColumn({ name: 'related_project_id' })
    relatedProject: Project | null;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    @Column({
        name: 'sent_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    sentAt: Date;

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date | null;
}
