import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto } from '@shared/dtos';

@ApiTags('Activity Logs')
@Controller()
@ApiBearerAuth()
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) {}

    @Get('tasks/:taskId/activities')
    @ApiOperation({ summary: 'Get activity logs for a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Activity logs retrieved' })
    async findByTask(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const logs = await this.activityLogsService.findByTask(
            taskId,
            page || 1,
            limit || 20,
        );
        return new SuccessResponseDto(
            logs,
            'Activity logs retrieved successfully',
        );
    }

    @Get('projects/:projectId/activities')
    @ApiOperation({ summary: 'Get activity logs for a project' })
    @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Activity logs retrieved' })
    async findByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const logs = await this.activityLogsService.findByProject(
            projectId,
            page || 1,
            limit || 20,
        );
        return new SuccessResponseDto(
            logs,
            'Activity logs retrieved successfully',
        );
    }

    @Get('activities/recent')
    @ApiOperation({ summary: 'Get recent activity across all projects' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, description: 'Recent activities retrieved' })
    async findRecent(@CurrentUser() user: any, @Query('limit') limit?: number) {
        const logs = await this.activityLogsService.findRecent(
            user.id,
            limit || 20,
        );
        return new SuccessResponseDto(
            logs,
            'Recent activities retrieved successfully',
        );
    }
}
