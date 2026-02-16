import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { Label } from 'src/modules/labels/entities/label.entity';

@Entity('task_labels')
@Index(['task', 'label'], { unique: true })
@Index(['label'])
export class TaskLabel extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @ManyToOne(() => Task, { eager: false })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ name: 'label_id', type: 'uuid' })
    labelId: string;

    @ManyToOne(() => Label, { eager: false })
    @JoinColumn({ name: 'label_id' })
    label: Label;
}
