import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { User } from 'src/modules/users/user.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';

@Entity('activity_logs')
@Index(['user'])
@Index(['project'])
@Index(['task'])
@Index(['createdAt'])
export class ActivityLog extends BaseEntity {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'project_id', type: 'uuid', nullable: true })
    projectId: string | null;

    @ManyToOne(() => Project, { eager: false, nullable: true })
    @JoinColumn({ name: 'project_id' })
    project: Project | null;

    @Column({ name: 'task_id', type: 'uuid', nullable: true })
    taskId: string | null;

    @ManyToOne(() => Task, { eager: false, nullable: true })
    @JoinColumn({ name: 'task_id' })
    task: Task | null;

    @Column({ name: 'action_type', type: 'varchar', length: 50 })
    actionType: string; // e.g., "task_created", "status_changed", "comment_added"

    @Column({ type: 'text' })
    description: string; // Human-readable description

    @Column({ type: 'jsonb', default: '{}' })
    metadata: Record<string, any>; // Additional context (old/new values, etc.)
}
