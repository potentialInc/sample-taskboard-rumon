import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/user.entity';

@Entity('comments')
@Index(['task'])
@Index(['author'])
@Index(['parentComment'])
export class Comment extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @ManyToOne(() => Task, { eager: false })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ name: 'author_id', type: 'uuid' })
    authorId: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ type: 'text' })
    text: string;

    @Column({ name: 'parent_comment_id', type: 'uuid', nullable: true })
    parentCommentId: string | null;

    @ManyToOne(() => Comment, { eager: false, nullable: true })
    @JoinColumn({ name: 'parent_comment_id' })
    parentComment: Comment | null;

    @Column({ type: 'jsonb', default: '[]' })
    mentions: string[]; // Array of user IDs mentioned with @

    // deletedAt is inherited from BaseEntity (@DeleteDateColumn)
}
