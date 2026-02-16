import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from 'src/modules/project-members/entities/project-member.entity';
import { InvitationStatus } from '@shared/enums';

/**
 * Guard to check if user is a member of the project
 * Expects projectId in request params
 */
@Injectable()
export class ProjectMemberGuard implements CanActivate {
    constructor(
        @InjectRepository(ProjectMember)
        private projectMemberRepo: Repository<ProjectMember>,
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

        // Check if user is a member of the project
        const membership = await this.projectMemberRepo.findOne({
            where: {
                projectId,
                userId: user.id,
                invitationStatus: InvitationStatus.ACCEPTED,
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You must be a project member to access this resource',
            );
        }

        // Attach membership to request for later use
        request.projectMembership = membership;

        return true;
    }
}
