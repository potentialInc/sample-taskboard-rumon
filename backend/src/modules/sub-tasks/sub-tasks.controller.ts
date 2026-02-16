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
import { SubTasksService } from './sub-tasks.service';
import { CreateSubTaskDto, UpdateSubTaskDto, ReorderSubTaskDto } from './dto';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Sub-Tasks')
@Controller()
@ApiBearerAuth()
export class SubTasksController {
    constructor(private readonly subTasksService: SubTasksService) {}

    @Get('tasks/:taskId/subtasks')
    @ApiOperation({ summary: 'Get all sub-tasks for a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Sub-tasks retrieved' })
    async findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
        const subTasks = await this.subTasksService.findByTask(taskId);
        return new SuccessResponseDto(
            subTasks,
            'Sub-tasks retrieved successfully',
        );
    }

    @Post('tasks/:taskId/subtasks')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a sub-task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Sub-task created' })
    async create(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: CreateSubTaskDto,
    ) {
        const subTask = await this.subTasksService.create(taskId, dto);
        return new CreatedResponseDto(subTask, 'Sub-task created successfully');
    }

    @Patch('subtasks/:id')
    @ApiOperation({ summary: 'Update a sub-task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Sub-task updated' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSubTaskDto,
    ) {
        const subTask = await this.subTasksService.update(id, dto);
        return new SuccessResponseDto(subTask, 'Sub-task updated successfully');
    }

    @Delete('subtasks/:id')
    @ApiOperation({ summary: 'Delete a sub-task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Sub-task deleted' })
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        await this.subTasksService.delete(id);
        return new SuccessResponseDto(null, 'Sub-task deleted successfully');
    }

    @Post('subtasks/:id/toggle')
    @ApiOperation({ summary: 'Toggle sub-task completion' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Sub-task toggled' })
    async toggle(@Param('id', ParseUUIDPipe) id: string) {
        const subTask = await this.subTasksService.toggle(id);
        return new SuccessResponseDto(subTask, 'Sub-task toggled successfully');
    }

    @Post('subtasks/:id/reorder')
    @ApiOperation({ summary: 'Reorder sub-tasks' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Sub-tasks reordered' })
    async reorder(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReorderSubTaskDto,
    ) {
        const subTasks = await this.subTasksService.reorder(id, dto);
        return new SuccessResponseDto(
            subTasks,
            'Sub-tasks reordered successfully',
        );
    }
}
