import {
    Entity,
    Column as TypeORMColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { Project } from 'src/modules/projects/entities/project.entity';

@Entity('columns')
@Index(['project'])
@Index(['project', 'position'])
export class Column extends BaseEntity {
    @TypeORMColumn({ name: 'project_id', type: 'uuid' })
    projectId: string;

    @ManyToOne(() => Project, { eager: false })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @TypeORMColumn({ type: 'varchar', length: 100 })
    title: string;

    @TypeORMColumn({ type: 'integer', default: 0 })
    position: number;

    @TypeORMColumn({ name: 'wip_limit', type: 'integer', nullable: true })
    wipLimit: number | null;

    // @OneToMany(() => Task, task => task.column)
    // tasks: Task[];
}
