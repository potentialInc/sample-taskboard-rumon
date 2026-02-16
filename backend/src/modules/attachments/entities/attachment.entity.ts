import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/user.entity';

@Entity('attachments')
@Index(['task'])
@Index(['uploadedBy'])
export class Attachment extends BaseEntity {
    @Column({ name: 'task_id', type: 'uuid' })
    taskId: string;

    @ManyToOne(() => Task, { eager: false })
    @JoinColumn({ name: 'task_id' })
    task: Task;

    @Column({ name: 'uploaded_by', type: 'uuid' })
    uploadedBy: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'uploaded_by' })
    uploader: User;

    @Column({ name: 'file_name', type: 'varchar', length: 255 })
    fileName: string;

    @Column({ name: 'file_url', type: 'text' })
    fileUrl: string; // S3 key, not full URL

    @Column({ name: 'file_size', type: 'integer', default: 0 })
    fileSize: number;

    @Column({ name: 'file_type', type: 'varchar', length: 50 })
    fileType: string; // MIME type
}
