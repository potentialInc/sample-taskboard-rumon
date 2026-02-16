import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { TaskPriority } from '@shared/enums';
import { User } from 'src/modules/users/user.entity';

@Entity('tasks')
@Index(['columnId'])
@Index(['assigneeId'])
@Index(['creatorId'])
@Index(['deletedAt'])
@Index(['dueDate'])
export class Task extends BaseEntity {
    @Column({ name: 'column_id', type: 'uuid' })
    columnId: string;

    // @ManyToOne(() => Column, column => column.tasks)
    // @JoinColumn({ name: 'column_id' })
    // column: Column;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
    assigneeId: string | null;

    @ManyToOne(() => User, { eager: false, nullable: true })
    @JoinColumn({ name: 'assignee_id' })
    assignee: User | null;

    @Column({ name: 'creator_id', type: 'uuid' })
    creatorId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'creator_id' })
    creator: User;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    priority: TaskPriority;

    @Column({ name: 'due_date', type: 'date', nullable: true })
    dueDate: Date | null;

    @Column({ type: 'integer', default: 0 })
    position: number;

    @Column({
        name: 'progress_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 0,
    })
    progressPercentage: number;

    @Column({ name: 'total_time_logged', type: 'integer', default: 0 })
    totalTimeLogged: number;

    @Column({ name: 'is_overdue', type: 'boolean', default: false })
    isOverdue: boolean;

    // deletedAt is inherited from BaseEntity (@DeleteDateColumn)

    @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
    deletedBy: string | null;

    @ManyToOne(() => User, { eager: false, nullable: true })
    @JoinColumn({ name: 'deleted_by' })
    deletedByUser: User | null;

    // Relations to be uncommented when entities are created
    // @OneToMany(() => SubTask, subTask => subTask.task)
    // subTasks: SubTask[];

    // @OneToMany(() => Comment, comment => comment.task)
    // comments: Comment[];

    // @OneToMany(() => TimeEntry, entry => entry.task)
    // timeEntries: TimeEntry[];

    // @OneToMany(() => Attachment, attachment => attachment.task)
    // attachments: Attachment[];

    // @ManyToMany(() => Label)
    // @JoinTable({
    //     name: 'task_labels',
    //     joinColumn: { name: 'task_id' },
    //     inverseJoinColumn: { name: 'label_id' },
    // })
    // labels: Label[];
}
