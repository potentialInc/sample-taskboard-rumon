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
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    AssignTaskDto,
    TaskQueryDto,
    AddLabelDto,
} from './dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Tasks')
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new task' })
    @ApiResponse({ status: 201, description: 'Task created successfully' })
    async create(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
        const task = await this.tasksService.create(user.id, dto);
        return new CreatedResponseDto(task, 'Task created successfully');
    }

    @Get()
    @ApiOperation({ summary: 'Get tasks with filters' })
    @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
    async findAll(@CurrentUser() user: any, @Query() query: TaskQueryDto) {
        const result = await this.tasksService.findAll(user.id, query);
        return new SuccessResponseDto(result, 'Tasks retrieved successfully');
    }

    @Get('trash')
    @ApiOperation({ summary: 'Get trashed tasks' })
    @ApiQuery({ name: 'projectId', required: false })
    @ApiResponse({ status: 200, description: 'Trashed tasks retrieved' })
    async getTrash(
        @CurrentUser() user: any,
        @Query('projectId') projectId?: string,
    ) {
        const tasks = await this.tasksService.getTrash(user.id, projectId);
        return new SuccessResponseDto(tasks, 'Trashed tasks retrieved');
    }

    @Get('overdue')
    @ApiOperation({ summary: 'Get overdue tasks' })
    @ApiResponse({ status: 200, description: 'Overdue tasks retrieved' })
    async getOverdue(@CurrentUser() user: any) {
        const tasks = await this.tasksService.getOverdue(user.id);
        return new SuccessResponseDto(tasks, 'Overdue tasks retrieved');
    }

    @Get('calendar')
    @ApiOperation({ summary: 'Get tasks for calendar view' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiResponse({ status: 200, description: 'Calendar tasks retrieved' })
    async getCalendar(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const tasks = await this.tasksService.getCalendar(
            user.id,
            startDate,
            endDate,
        );
        return new SuccessResponseDto(tasks, 'Calendar tasks retrieved');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get task details' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const task = await this.tasksService.findOne(id, user.id);
        return new SuccessResponseDto(task, 'Task retrieved successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task updated successfully' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateTaskDto,
    ) {
        const task = await this.tasksService.update(id, user.id, dto);
        return new SuccessResponseDto(task, 'Task updated successfully');
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete task (move to trash)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task moved to trash' })
    async softDelete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.tasksService.softDelete(id, user.id);
        return new SuccessResponseDto(null, 'Task moved to trash');
    }

    @Post(':id/move')
    @ApiOperation({ summary: 'Move task to another column' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task moved successfully' })
    async move(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: MoveTaskDto,
    ) {
        const task = await this.tasksService.move(id, user.id, dto);
        return new SuccessResponseDto(task, 'Task moved successfully');
    }

    @Post(':id/assign')
    @ApiOperation({ summary: 'Assign task to a user' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task assigned successfully' })
    async assign(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: AssignTaskDto,
    ) {
        const task = await this.tasksService.assign(id, user.id, dto);
        return new SuccessResponseDto(task, 'Task assigned successfully');
    }

    @Delete(':id/assign')
    @ApiOperation({ summary: 'Unassign task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task unassigned successfully' })
    async unassign(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const task = await this.tasksService.unassign(id, user.id);
        return new SuccessResponseDto(task, 'Task unassigned successfully');
    }

    @Post(':id/labels')
    @ApiOperation({ summary: 'Add label to task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Label added to task' })
    async addLabel(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: AddLabelDto,
    ) {
        const taskLabel = await this.tasksService.addLabel(id, user.id, dto);
        return new SuccessResponseDto(taskLabel, 'Label added to task');
    }

    @Delete(':id/labels/:labelId')
    @ApiOperation({ summary: 'Remove label from task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiParam({ name: 'labelId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Label removed from task' })
    async removeLabel(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('labelId', ParseUUIDPipe) labelId: string,
        @CurrentUser() user: any,
    ) {
        await this.tasksService.removeLabel(id, labelId, user.id);
        return new SuccessResponseDto(null, 'Label removed from task');
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'Restore task from trash' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task restored successfully' })
    async restore(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const task = await this.tasksService.restore(id, user.id);
        return new SuccessResponseDto(task, 'Task restored successfully');
    }

    @Delete(':id/permanent')
    @ApiOperation({ summary: 'Permanently delete task' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Task permanently deleted' })
    async permanentDelete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.tasksService.permanentDelete(id, user.id);
        return new SuccessResponseDto(null, 'Task permanently deleted');
    }
}
