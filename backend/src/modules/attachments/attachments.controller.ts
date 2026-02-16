import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiConsumes,
} from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Attachments')
@Controller()
@ApiBearerAuth()
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) {}

    @Get('tasks/:taskId/attachments')
    @ApiOperation({ summary: 'Get attachments for a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Attachments retrieved' })
    async findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
        const attachments = await this.attachmentsService.findByTask(taskId);
        return new SuccessResponseDto(
            attachments,
            'Attachments retrieved successfully',
        );
    }

    @Post('tasks/:taskId/attachments')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload a file attachment to a task' })
    @ApiParam({ name: 'taskId', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Attachment uploaded' })
    async create(
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @CurrentUser() user: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const attachment = await this.attachmentsService.create(
            taskId,
            user.id,
            file,
        );
        return new CreatedResponseDto(
            attachment,
            'Attachment uploaded successfully',
        );
    }

    @Delete('attachments/:id')
    @ApiOperation({ summary: 'Delete an attachment' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Attachment deleted' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.attachmentsService.delete(id, user.id);
        return new SuccessResponseDto(null, 'Attachment deleted successfully');
    }

    @Get('attachments/:id/presigned-url')
    @ApiOperation({ summary: 'Get presigned URL for attachment download' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Presigned URL generated' })
    async getPresignedUrl(@Param('id', ParseUUIDPipe) id: string) {
        const url = await this.attachmentsService.getPresignedUrl(id);
        return new SuccessResponseDto({ url }, 'Presigned URL generated');
    }
}
