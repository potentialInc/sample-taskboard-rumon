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
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
    AdminCreateUserDto,
    AdminUpdateUserDto,
    AdminUserQueryDto,
    AdminProjectQueryDto,
} from './dto';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { AdminOnly } from 'src/core/decorators/roles.decorator';
import { SuccessResponseDto, CreatedResponseDto } from '@shared/dtos';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@AdminOnly()
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // ──────────────────────────────────────────────
    // User Management
    // ──────────────────────────────────────────────

    @Get('users')
    @ApiOperation({ summary: 'Get all users (admin only)' })
    @ApiResponse({ status: 200, description: 'Users retrieved' })
    async getUsers(@Query() query: AdminUserQueryDto) {
        const result = await this.adminService.getUsers(query);
        return new SuccessResponseDto(result, 'Users retrieved successfully');
    }

    @Post('users')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new user (admin only)' })
    @ApiResponse({ status: 201, description: 'User created' })
    async createUser(@Body() dto: AdminCreateUserDto) {
        const user = await this.adminService.createUser(dto);
        return new CreatedResponseDto(user, 'User created successfully');
    }

    @Patch('users/:id')
    @ApiOperation({ summary: 'Update user (admin only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'User updated' })
    async updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AdminUpdateUserDto,
    ) {
        const user = await this.adminService.updateUser(id, dto);
        return new SuccessResponseDto(user, 'User updated successfully');
    }

    @Delete('users/:id')
    @ApiOperation({ summary: 'Delete user (admin only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
        await this.adminService.deleteUser(id);
        return new SuccessResponseDto(null, 'User deleted successfully');
    }

    @Post('users/:id/suspend')
    @ApiOperation({ summary: 'Suspend a user (admin only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'User suspended' })
    async suspendUser(@Param('id', ParseUUIDPipe) id: string) {
        const user = await this.adminService.suspendUser(id);
        return new SuccessResponseDto(user, 'User suspended successfully');
    }

    @Post('users/:id/activate')
    @ApiOperation({ summary: 'Activate a user (admin only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'User activated' })
    async activateUser(@Param('id', ParseUUIDPipe) id: string) {
        const user = await this.adminService.activateUser(id);
        return new SuccessResponseDto(user, 'User activated successfully');
    }

    // ──────────────────────────────────────────────
    // Project Management
    // ──────────────────────────────────────────────

    @Get('projects')
    @ApiOperation({ summary: 'Get all projects (admin only)' })
    @ApiResponse({ status: 200, description: 'Projects retrieved' })
    async getProjects(@Query() query: AdminProjectQueryDto) {
        const result = await this.adminService.getProjects(query);
        return new SuccessResponseDto(
            result,
            'Projects retrieved successfully',
        );
    }

    @Delete('projects/:id')
    @ApiOperation({ summary: 'Delete any project (admin only)' })
    @ApiParam({ name: 'id', type: String, format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Project deleted' })
    async deleteProject(@Param('id', ParseUUIDPipe) id: string) {
        await this.adminService.deleteProject(id);
        return new SuccessResponseDto(null, 'Project deleted successfully');
    }

    // ──────────────────────────────────────────────
    // Settings & Dashboard
    // ──────────────────────────────────────────────

    @Get('dashboard')
    @ApiOperation({ summary: 'Get admin dashboard stats' })
    @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
    async getDashboard() {
        const stats = await this.adminService.getDashboard();
        return new SuccessResponseDto(stats, 'Dashboard statistics retrieved');
    }

    @Get('settings')
    @ApiOperation({ summary: 'Get admin settings' })
    @ApiResponse({ status: 200, description: 'Settings retrieved' })
    getSettings() {
        const settings = this.adminService.getSettings();
        return new SuccessResponseDto(
            settings,
            'Settings retrieved successfully',
        );
    }

    @Patch('settings')
    @ApiOperation({ summary: 'Update admin settings' })
    @ApiResponse({ status: 200, description: 'Settings updated' })
    updateSettings(@Body() settings: any) {
        const updated = this.adminService.updateSettings(settings);
        return new SuccessResponseDto(updated, 'Settings updated successfully');
    }

    @Get('export')
    @ApiOperation({ summary: 'Export system data' })
    @ApiResponse({ status: 200, description: 'Data exported' })
    async exportData() {
        const data = await this.adminService.exportData();
        return new SuccessResponseDto(data, 'Data exported successfully');
    }
}
