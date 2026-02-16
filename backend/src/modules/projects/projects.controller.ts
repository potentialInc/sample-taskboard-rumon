import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    Res,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ProjectsService } from './projects.service';
import {
    CreateProjectDto,
    UpdateProjectDto,
    ProjectQueryDto,
    InviteMemberDto,
} from './dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Projects')
@Controller('projects')
@ApiBearerAuth()
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new project' })
    @ApiResponse({ status: 201, description: 'Project created successfully' })
    async create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
        const project = await this.projectsService.create(user.id, dto);
        return new CreatedResponseDto(project, 'Project created successfully');
    }

    @Get()
    @ApiOperation({ summary: 'List all projects for current user' })
    @ApiResponse({
        status: 200,
        description: 'Projects retrieved successfully',
    })
    async findAll(@CurrentUser() user: any, @Query() query: ProjectQueryDto) {
        const result = await this.projectsService.findAll(user.id, query);
        return new SuccessResponseDto(
            result,
            'Projects retrieved successfully',
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project details' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const project = await this.projectsService.findOne(id, user.id);
        return new SuccessResponseDto(
            project,
            'Project retrieved successfully',
        );
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update project (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Project updated successfully' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateProjectDto,
    ) {
        const project = await this.projectsService.update(id, user.id, dto);
        return new SuccessResponseDto(project, 'Project updated successfully');
    }

    @Post(':id/archive')
    @ApiOperation({ summary: 'Archive project (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Project archived successfully' })
    async archive(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const project = await this.projectsService.archive(id, user.id);
        return new SuccessResponseDto(project, 'Project archived successfully');
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'Restore archived project (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Project restored successfully' })
    async restore(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const project = await this.projectsService.restore(id, user.id);
        return new SuccessResponseDto(project, 'Project restored successfully');
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete project (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Project deleted successfully' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.projectsService.delete(id, user.id);
        return new SuccessResponseDto(null, 'Project deleted permanently');
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Get project members' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
    async getMembers(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const members = await this.projectsService.getMembers(id, user.id);
        return new SuccessResponseDto(
            members,
            'Members retrieved successfully',
        );
    }

    @Post(':id/members')
    @ApiOperation({ summary: 'Invite members to project (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Invitations sent successfully' })
    async inviteMembers(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: InviteMemberDto,
    ) {
        const result = await this.projectsService.inviteMembers(
            id,
            user.id,
            dto,
        );
        return new SuccessResponseDto(result, 'Invitations sent successfully');
    }

    @Delete(':id/members/:userId')
    @ApiOperation({ summary: 'Remove member from project (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiParam({ name: 'userId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Member removed from project' })
    async removeMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('userId', ParseUUIDPipe) memberId: string,
        @CurrentUser() user: any,
    ) {
        await this.projectsService.removeMember(id, memberId, user.id);
        return new SuccessResponseDto(null, 'Member removed from project');
    }

    @Get(':id/dashboard')
    @ApiOperation({ summary: 'Get project dashboard statistics' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'assigneeId', required: false })
    @ApiQuery({ name: 'priority', required: false })
    @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
    async getDashboard(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Query() filters: any,
    ) {
        const stats = await this.projectsService.getDashboardStats(
            id,
            user.id,
            filters,
        );
        return new SuccessResponseDto(stats, 'Dashboard statistics retrieved');
    }

    @Get(':id/export')
    @ApiOperation({ summary: 'Export project data as CSV (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'CSV file generated' })
    async exportCsv(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const csv = await this.projectsService.exportCsv(id, user.id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="project-export-${id}-${new Date().toISOString().split('T')[0]}.csv"`,
        );
        res.send(csv);
    }
}
