import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { TimeEntryType } from '@shared/enums';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/user.entity';

@Entity('time_entries')
@Index(['task'])
@Index(['user'])
@Index(['loggedAt'])
export class TimeEntry extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @ManyToOne(() => Task, { eager: false })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'duration_seconds', type: 'integer', default: 0 })
    durationSeconds: number;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({
        name: 'entry_type',
        type: 'enum',
        enum: TimeEntryType,
        default: TimeEntryType.MANUAL,
    })
    entryType: TimeEntryType;

    @Column({ name: 'started_at', type: 'timestamp', nullable: true })
    startedAt: Date | null;

    @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
    endedAt: Date | null;

    @Column({
        name: 'logged_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    loggedAt: Date;
}
