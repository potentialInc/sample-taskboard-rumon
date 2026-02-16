import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from 'src/modules/projects/entities/project.entity';

/**
 * Guard to check if user is the owner of the project
 * Expects projectId in request params
 */
@Injectable()
export class ProjectOwnerGuard implements CanActivate {
    constructor(
        @InjectRepository(Project)
        private projectRepo: Repository<Project>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const projectId = request.params.projectId || request.params.id;

        if (!projectId) {
            throw new NotFoundException('Project ID not found in request');
        }

        if (!user || !user.id) {
            throw new ForbiddenException('User not authenticated');
        }

        // Check if user is the owner of the project
        const project = await this.projectRepo.findOne({
            where: { id: projectId },
            select: ['id', 'ownerId'],
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.ownerId !== user.id) {
            throw new ForbiddenException(
                'Only the project owner can perform this action',
            );
        }

        // Attach project to request for later use
        request.project = project;

        return true;
    }
}
