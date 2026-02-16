import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { Project } from 'src/modules/projects/entities/project.entity';

@Entity('labels')
@Index(['project'])
@Index(['isSystem'])
export class Label extends BaseEntity {
    @Column({ type: 'varchar', length: 50 })
    name: string;

    @Column({ type: 'varchar', length: 7, default: '#808080' })
    color: string;

    @Column({ name: 'is_system', type: 'boolean', default: true })
    isSystem: boolean;

    @Column({ name: 'project_id', type: 'uuid', nullable: true })
    projectId: string | null;

    @ManyToOne(() => Project, { eager: false, nullable: true })
    @JoinColumn({ name: 'project_id' })
    project: Project | null;
}
