import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { InvitationStatus } from '@shared/enums';

@Injectable()
export class ProjectMembersService {
    constructor(
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
    ) {}

    /**
     * Accept an invitation by token
     */
    async acceptInvitation(
        token: string,
        userId: string,
    ): Promise<ProjectMember> {
        const member = await this.memberRepo.findOne({
            where: { invitationToken: token },
        });
        if (!member) {
            throw new NotFoundException('Invitation not found or already used');
        }
        if (member.invitationStatus === InvitationStatus.ACCEPTED) {
            throw new BadRequestException('Invitation already accepted');
        }

        member.invitationStatus = InvitationStatus.ACCEPTED;
        member.userId = userId;
        member.joinedAt = new Date();
        member.invitationToken = null;

        return this.memberRepo.save(member);
    }

    /**
     * Decline an invitation
     */
    async declineInvitation(token: string): Promise<void> {
        const member = await this.memberRepo.findOne({
            where: { invitationToken: token },
        });
        if (!member) {
            throw new NotFoundException('Invitation not found');
        }

        member.invitationStatus = InvitationStatus.DECLINED;
        member.invitationToken = null;
        await this.memberRepo.save(member);
    }

    /**
     * Leave a project
     */
    async leaveProject(projectId: string, userId: string): Promise<void> {
        const member = await this.memberRepo.findOne({
            where: { projectId, userId },
        });
        if (!member) {
            throw new NotFoundException('You are not a member of this project');
        }

        // Cannot leave if you're the owner
        if (member.role === 'owner') {
            throw new BadRequestException(
                'Project owner cannot leave. Transfer ownership first.',
            );
        }

        await this.memberRepo.remove(member);
    }
}
