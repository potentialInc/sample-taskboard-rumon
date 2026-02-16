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
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnDto } from './dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Columns')
@Controller()
@ApiBearerAuth()
export class ColumnsController {
    constructor(private readonly columnsService: ColumnsService) {}

    @Get('projects/:projectId/columns')
    @ApiOperation({ summary: 'Get all columns for a project' })
    @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Columns retrieved successfully' })
    async findByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @CurrentUser() user: any,
    ) {
        const columns = await this.columnsService.findByProject(
            projectId,
            user.id,
        );
        return new SuccessResponseDto(
            columns,
            'Columns retrieved successfully',
        );
    }

    @Post('projects/:projectId/columns')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new column (owner only)' })
    @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Column created successfully' })
    async create(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @CurrentUser() user: any,
        @Body() dto: CreateColumnDto,
    ) {
        const column = await this.columnsService.create(
            projectId,
            user.id,
            dto,
        );
        return new CreatedResponseDto(column, 'Column created successfully');
    }

    @Patch('columns/:id')
    @ApiOperation({ summary: 'Update a column' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Column updated successfully' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateColumnDto,
    ) {
        const column = await this.columnsService.update(id, user.id, dto);
        return new SuccessResponseDto(column, 'Column updated successfully');
    }

    @Delete('columns/:id')
    @ApiOperation({ summary: 'Delete a column (owner only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Column deleted successfully' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
    ) {
        await this.columnsService.delete(id, user.id);
        return new SuccessResponseDto(null, 'Column deleted successfully');
    }

    @Post('columns/:id/reorder')
    @ApiOperation({ summary: 'Reorder a column' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Column reordered successfully' })
    async reorder(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,
        @Body() dto: ReorderColumnDto,
    ) {
        const columns = await this.columnsService.reorder(id, user.id, dto);
        return new SuccessResponseDto(columns, 'Column reordered successfully');
    }
}
