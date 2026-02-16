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
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Comments')
@Controller()
@ApiBearerAuth()
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get('tasks/:taskId/comments')
    @ApiOperation({ summary: 'Get comments for a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Comments retrieved' })
    async findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
        const comments = await this.commentsService.findByTask(taskId);
        return new SuccessResponseDto(
            comments,
            'Comments retrieved successfully',
        );
    }

    @Post('tasks/:taskId/comments')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a comment on a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Comment created' })
    async create(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateCommentDto,
    ) {
        const comment = await this.commentsService.create(taskId, user.id, dto);
        return new CreatedResponseDto(comment, 'Comment created successfully');
    }

    @Post('comments/:id/replies')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Reply to a comment' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Reply created' })
    async createReply(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: CreateCommentDto,
    ) {
        const comment = await this.commentsService.createReply(
            id,
            user.id,
            dto,
        );
        return new CreatedResponseDto(comment, 'Reply created successfully');
    }

    @Patch('comments/:id')
    @ApiOperation({ summary: 'Update a comment (author only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Comment updated' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateCommentDto,
    ) {
        const comment = await this.commentsService.update(id, user.id, dto);
        return new SuccessResponseDto(comment, 'Comment updated successfully');
    }

    @Delete('comments/:id')
    @ApiOperation({ summary: 'Delete a comment (author only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Comment deleted' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.commentsService.delete(id, user.id);
        return new SuccessResponseDto(null, 'Comment deleted successfully');
    }
}
