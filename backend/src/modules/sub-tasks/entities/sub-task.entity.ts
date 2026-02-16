import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { Task } from 'src/modules/tasks/entities/task.entity';

@Entity('sub_tasks')
@Index(['task'])
@Index(['task', 'position'])
export class SubTask extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @ManyToOne(() => Task, { eager: false })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'boolean', default: false })
    completed: boolean;

    @Column({ type: 'integer', default: 0 })
    position: number;
}
