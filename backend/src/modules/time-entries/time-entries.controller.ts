import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto, StartTimerDto } from './dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Time Entries')
@Controller()
@ApiBearerAuth()
export class TimeEntriesController {
    constructor(private readonly timeEntriesService: TimeEntriesService) {}

    @Get('tasks/:taskId/time-entries')
    @ApiOperation({ summary: 'Get time entries for a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Time entries retrieved' })
    async findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
        const entries = await this.timeEntriesService.findByTask(taskId);
        return new SuccessResponseDto(
            entries,
            'Time entries retrieved successfully',
        );
    }

    @Post('tasks/:taskId/time-entries')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a manual time entry' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Time entry created' })
    async create(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateTimeEntryDto,
    ) {
        const entry = await this.timeEntriesService.create(
            taskId,
            user.id,
            dto,
        );
        return new CreatedResponseDto(entry, 'Time entry created successfully');
    }

    @Patch('time-entries/:id')
    @ApiOperation({ summary: 'Update a time entry' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Time entry updated' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateTimeEntryDto,
    ) {
        const entry = await this.timeEntriesService.update(id, user.id, dto);
        return new SuccessResponseDto(entry, 'Time entry updated successfully');
    }

    @Delete('time-entries/:id')
    @ApiOperation({ summary: 'Delete a time entry' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Time entry deleted' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.timeEntriesService.delete(id, user.id);
        return new SuccessResponseDto(null, 'Time entry deleted successfully');
    }

    @Post('time-entries/start')
    @ApiOperation({ summary: 'Start a timer' })
    @ApiResponse({ status: 200, description: 'Timer started' })
    async startTimer(@CurrentUser() user: any, @Body() dto: StartTimerDto) {
        const entry = await this.timeEntriesService.startTimer(user.id, dto);
        return new SuccessResponseDto(entry, 'Timer started');
    }

    @Post('time-entries/stop')
    @ApiOperation({ summary: 'Stop the running timer' })
    @ApiResponse({ status: 200, description: 'Timer stopped' })
    async stopTimer(@CurrentUser() user: any) {
        const entry = await this.timeEntriesService.stopTimer(user.id);
        return new SuccessResponseDto(entry, 'Timer stopped');
    }

    @Get('users/me/time-entries')
    @ApiOperation({ summary: 'Get current user time entries' })
    @ApiResponse({ status: 200, description: 'User time entries retrieved' })
    async findByUser(@CurrentUser() user: any) {
        const entries = await this.timeEntriesService.findByUser(user.id);
        return new SuccessResponseDto(
            entries,
            'Time entries retrieved successfully',
        );
    }
}
