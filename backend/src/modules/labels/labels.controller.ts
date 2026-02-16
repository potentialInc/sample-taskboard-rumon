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
import { LabelsService } from './labels.service';
import { CreateLabelDto, UpdateLabelDto } from './dto';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Labels')
@Controller()
@ApiBearerAuth()
export class LabelsController {
    constructor(private readonly labelsService: LabelsService) {}

    @Get('labels')
    @ApiOperation({ summary: 'Get all labels (system + project-specific)' })
    @ApiQuery({
        name: 'projectId',
        required: false,
        description: 'Include project-specific labels',
    })
    @ApiResponse({ status: 200, description: 'Labels retrieved' })
    async findAll(@Query('projectId') projectId?: string) {
        const labels = await this.labelsService.findAll(projectId);
        return new SuccessResponseDto(labels, 'Labels retrieved successfully');
    }

    @Post('projects/:projectId/labels')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a project-specific label' })
    @ApiParam({ name: 'projectId', type: String, format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Label created' })
    async create(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: CreateLabelDto,
    ) {
        const label = await this.labelsService.create(projectId, dto);
        return new CreatedResponseDto(label, 'Label created successfully');
    }

    @Patch('labels/:id')
    @ApiOperation({ summary: 'Update a custom label' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Label updated' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateLabelDto,
    ) {
        const label = await this.labelsService.update(id, dto);
        return new SuccessResponseDto(label, 'Label updated successfully');
    }

    @Delete('labels/:id')
    @ApiOperation({ summary: 'Delete a custom label' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Label deleted' })
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        await this.labelsService.delete(id);
        return new SuccessResponseDto(null, 'Label deleted successfully');
    }
}
