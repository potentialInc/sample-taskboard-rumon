import {
    Controller,
    Get,
    Patch,
    Post,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto } from '@shared/dtos';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiOperation({ summary: 'Get notifications for current user' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Notifications retrieved' })
    async findAll(
        @CurrentUser() user: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        const result = await this.notificationsService.findByUser(
            user.id,
            page || 1,
            limit || 20,
        );
        return new SuccessResponseDto(
            result,
            'Notifications retrieved successfully',
        );
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Notification marked as read' })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        const notification = await this.notificationsService.markAsRead(
            id,
            user.id,
        );
        return new SuccessResponseDto(
            notification,
            'Notification marked as read',
        );
    }

    @Post('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({
        status: 200,
        description: 'All notifications marked as read',
    })
    async markAllAsRead(@CurrentUser() user: any) {
        await this.notificationsService.markAllAsRead(user.id);
        return new SuccessResponseDto(null, 'All notifications marked as read');
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Unread count retrieved' })
    async getUnreadCount(@CurrentUser() user: any) {
        const count = await this.notificationsService.getUnreadCount(user.id);
        return new SuccessResponseDto({ count }, 'Unread count retrieved');
    }
}
