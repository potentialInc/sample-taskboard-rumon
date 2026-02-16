import {
    Controller,
    Post,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { ProjectMembersService } from './project-members.service';
import { AcceptInvitationDto } from './dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto } from '@shared/dtos';

@ApiTags('Project Members')
@Controller('project-members')
@ApiBearerAuth()
export class ProjectMembersController {
    constructor(
        private readonly projectMembersService: ProjectMembersService,
    ) {}

    @Post('accept-invitation')
    @ApiOperation({ summary: 'Accept a project invitation' })
    @ApiResponse({ status: 200, description: 'Invitation accepted' })
    async acceptInvitation(
        @CurrentUser() user: any,
        @Body() dto: AcceptInvitationDto,
    ) {
        const member = await this.projectMembersService.acceptInvitation(
            dto.token,
            user.id,
        );
        return new SuccessResponseDto(
            member,
            'Invitation accepted successfully',
        );
    }

    @Post('decline-invitation')
    @ApiOperation({ summary: 'Decline a project invitation' })
    @ApiResponse({ status: 200, description: 'Invitation declined' })
    async declineInvitation(@Body() dto: AcceptInvitationDto) {
        await this.projectMembersService.declineInvitation(dto.token);
        return new SuccessResponseDto(null, 'Invitation declined');
    }

    @Delete('projects/:projectId/leave')
    @ApiOperation({ summary: 'Leave a project' })
    @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Left the project' })
    async leaveProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @CurrentUser() user: any,
    ) {
        await this.projectMembersService.leaveProject(projectId, user.id);
        return new SuccessResponseDto(null, 'You have left the project');
    }
}
