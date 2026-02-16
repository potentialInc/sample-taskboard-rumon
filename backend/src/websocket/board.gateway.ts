import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
    WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';
import {
    JoinBoardDto,
    TaskMovedDto,
    TaskCreatedDto,
    TaskUpdatedDto,
    TaskDeletedDto,
    TaskRestoredDto,
    CommentAddedDto,
    BoardUserPresence,
} from './dto';
import { envConfigService } from 'src/config/env-config.service';

/**
 * BoardGateway handles real-time WebSocket communication for Kanban board sync.
 *
 * Namespace: /board
 * Room pattern: project:{projectId}
 *
 * Events emitted to clients:
 *   - task:moved        Task dragged between columns
 *   - task:created      New task added
 *   - task:updated      Task details changed
 *   - task:deleted      Task soft-deleted
 *   - task:restored     Task restored from trash
 *   - comment:added     New comment on a task
 *   - user:joined       A user connected to the board
 *   - user:left         A user disconnected from the board
 *   - board:active-users  Current active users on board (sent on join)
 *
 * Events received from clients:
 *   - join:board        Join a project board room
 *   - leave:board       Leave a project board room
 *   - task:move         Notify task movement (drag-and-drop)
 *   - task:create       Notify new task creation
 *   - task:update       Notify task update
 *   - task:delete       Notify task deletion
 *   - task:restore      Notify task restoration
 *   - comment:add       Notify new comment
 */
@WebSocketGateway({
    namespace: '/board',
    cors: {
        origin: (() => {
            try {
                return envConfigService.getOrigins();
            } catch {
                return ['http://localhost:5173', 'http://localhost:5174'];
            }
        })(),
        credentials: true,
    },
    transports: ['websocket', 'polling'],
})
@UseGuards(WsJwtGuard)
export class BoardGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(BoardGateway.name);

    /**
     * Track active users per project room.
     * Map<projectId, Map<socketId, BoardUserPresence>>
     */
    private activeUsers = new Map<string, Map<string, BoardUserPresence>>();

    // ──────────────────────────────────────────────
    // Lifecycle Hooks
    // ──────────────────────────────────────────────

    afterInit() {
        this.logger.log('BoardGateway initialized on namespace /board');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove user from all project rooms they were in
        for (const [projectId, users] of this.activeUsers.entries()) {
            const userPresence = users.get(client.id);
            if (userPresence) {
                users.delete(client.id);

                // Broadcast user:left to remaining room members
                this.server.to(`project:${projectId}`).emit('user:left', {
                    userId: userPresence.userId,
                    userName: userPresence.userName,
                    timestamp: new Date().toISOString(),
                });

                // Clean up empty rooms
                if (users.size === 0) {
                    this.activeUsers.delete(projectId);
                }
            }
        }
    }

    // ──────────────────────────────────────────────
    // Room Management
    // ──────────────────────────────────────────────

    @SubscribeMessage('join:board')
    handleJoinBoard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: JoinBoardDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const { projectId } = data;
        const roomName = `project:${projectId}`;

        // Join the Socket.IO room
        void client.join(roomName);

        // Track user presence
        if (!this.activeUsers.has(projectId)) {
            this.activeUsers.set(projectId, new Map());
        }

        const userPresence: BoardUserPresence = {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
        };

        this.activeUsers.get(projectId)!.set(client.id, userPresence);

        // Notify other room members
        client.to(roomName).emit('user:joined', userPresence);

        // Send current active users list to the joining client
        const activeUsersList = Array.from(
            this.activeUsers.get(projectId)!.values(),
        );
        client.emit('board:active-users', {
            projectId,
            users: activeUsersList,
        });

        this.logger.log(
            `User ${user.name} (${user.id}) joined board ${projectId}`,
        );

        return { event: 'join:board', data: { success: true, projectId } };
    }

    @SubscribeMessage('leave:board')
    handleLeaveBoard(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: JoinBoardDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const { projectId } = data;
        const roomName = `project:${projectId}`;

        // Leave the Socket.IO room
        void client.leave(roomName);

        // Remove from tracking
        const roomUsers = this.activeUsers.get(projectId);
        if (roomUsers) {
            roomUsers.delete(client.id);

            if (roomUsers.size === 0) {
                this.activeUsers.delete(projectId);
            }
        }

        // Notify remaining room members
        this.server.to(roomName).emit('user:left', {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
        });

        this.logger.log(
            `User ${user.name} (${user.id}) left board ${projectId}`,
        );

        return { event: 'leave:board', data: { success: true, projectId } };
    }

    // ──────────────────────────────────────────────
    // Task Events (client -> server -> broadcast)
    // ──────────────────────────────────────────────

    @SubscribeMessage('task:move')
    handleTaskMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: TaskMovedDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const roomName = `project:${data.projectId}`;

        // Broadcast to all other clients in the room (excluding sender)
        client.to(roomName).emit('task:moved', {
            ...data,
            movedBy: {
                userId: user.id,
                userName: user.name,
            },
            timestamp: new Date().toISOString(),
        });

        this.logger.debug(
            `Task ${data.taskId} moved by ${user.name} in project ${data.projectId}`,
        );

        return { event: 'task:move', data: { success: true } };
    }

    @SubscribeMessage('task:create')
    handleTaskCreate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: TaskCreatedDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const roomName = `project:${data.projectId}`;

        client.to(roomName).emit('task:created', {
            ...data,
            createdBy: {
                userId: user.id,
                userName: user.name,
            },
            timestamp: new Date().toISOString(),
        });

        this.logger.debug(
            `Task ${data.taskId} created by ${user.name} in project ${data.projectId}`,
        );

        return { event: 'task:create', data: { success: true } };
    }

    @SubscribeMessage('task:update')
    handleTaskUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: TaskUpdatedDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const roomName = `project:${data.projectId}`;

        client.to(roomName).emit('task:updated', {
            ...data,
            updatedBy: {
                userId: user.id,
                userName: user.name,
            },
            timestamp: new Date().toISOString(),
        });

        this.logger.debug(
            `Task ${data.taskId} updated by ${user.name} in project ${data.projectId}`,
        );

        return { event: 'task:update', data: { success: true } };
    }

    @SubscribeMessage('task:delete')
    handleTaskDelete(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: TaskDeletedDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const roomName = `project:${data.projectId}`;

        client.to(roomName).emit('task:deleted', {
            ...data,
            deletedBy: {
                userId: user.id,
                userName: user.name,
            },
            timestamp: new Date().toISOString(),
        });

        this.logger.debug(
            `Task ${data.taskId} soft-deleted by ${user.name} in project ${data.projectId}`,
        );

        return { event: 'task:delete', data: { success: true } };
    }

    @SubscribeMessage('task:restore')
    handleTaskRestore(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: TaskRestoredDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const roomName = `project:${data.projectId}`;

        client.to(roomName).emit('task:restored', {
            ...data,
            restoredBy: {
                userId: user.id,
                userName: user.name,
            },
            timestamp: new Date().toISOString(),
        });

        this.logger.debug(
            `Task ${data.taskId} restored by ${user.name} in project ${data.projectId}`,
        );

        return { event: 'task:restore', data: { success: true } };
    }

    // ──────────────────────────────────────────────
    // Comment Events
    // ──────────────────────────────────────────────

    @SubscribeMessage('comment:add')
    handleCommentAdd(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: CommentAddedDto,
    ) {
        const user = client.data.user;
        if (!user) {
            throw new WsException('Unauthorized');
        }

        const roomName = `project:${data.projectId}`;

        client.to(roomName).emit('comment:added', {
            ...data,
            author: {
                userId: user.id,
                userName: user.name,
            },
            timestamp: new Date().toISOString(),
        });

        this.logger.debug(
            `Comment ${data.commentId} added by ${user.name} on task ${data.taskId}`,
        );

        return { event: 'comment:add', data: { success: true } };
    }

    // ──────────────────────────────────────────────
    // Server-Side Broadcast Methods
    // (Called by REST controllers/services via injection)
    // ──────────────────────────────────────────────

    /**
     * Broadcast task moved event from server-side (e.g., after REST API call)
     */
    broadcastTaskMoved(
        projectId: string,
        payload: TaskMovedDto & {
            movedBy: { userId: string; userName: string };
        },
    ) {
        this.server.to(`project:${projectId}`).emit('task:moved', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast task created event from server-side
     */
    broadcastTaskCreated(
        projectId: string,
        payload: TaskCreatedDto & {
            createdBy: { userId: string; userName: string };
        },
    ) {
        this.server.to(`project:${projectId}`).emit('task:created', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast task updated event from server-side
     */
    broadcastTaskUpdated(
        projectId: string,
        payload: TaskUpdatedDto & {
            updatedBy: { userId: string; userName: string };
        },
    ) {
        this.server.to(`project:${projectId}`).emit('task:updated', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast task deleted event from server-side
     */
    broadcastTaskDeleted(
        projectId: string,
        payload: TaskDeletedDto & {
            deletedBy: { userId: string; userName: string };
        },
    ) {
        this.server.to(`project:${projectId}`).emit('task:deleted', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast task restored event from server-side
     */
    broadcastTaskRestored(
        projectId: string,
        payload: TaskRestoredDto & {
            restoredBy: { userId: string; userName: string };
        },
    ) {
        this.server.to(`project:${projectId}`).emit('task:restored', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast comment added event from server-side
     */
    broadcastCommentAdded(
        projectId: string,
        payload: CommentAddedDto & {
            author: { userId: string; userName: string };
        },
    ) {
        this.server.to(`project:${projectId}`).emit('comment:added', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }

    // ──────────────────────────────────────────────
    // Utility Methods
    // ──────────────────────────────────────────────

    /**
     * Get count of active users in a project board
     */
    getActiveUsersCount(projectId: string): number {
        return this.activeUsers.get(projectId)?.size || 0;
    }

    /**
     * Get list of active users in a project board
     */
    getActiveUsers(projectId: string): BoardUserPresence[] {
        const users = this.activeUsers.get(projectId);
        return users ? Array.from(users.values()) : [];
    }
}
