import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) {}

    /**
     * Get all notifications for a user
     */
    async findByUser(
        userId: string,
        page = 1,
        limit = 20,
    ): Promise<{ notifications: Notification[]; total: number }> {
        const skip = (page - 1) * limit;

        const [notifications, total] = await this.notificationRepo.findAndCount(
            {
                where: { userId },
                order: { sentAt: 'DESC' },
                skip,
                take: limit,
            },
        );

        return { notifications, total };
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string, userId: string): Promise<Notification> {
        const notification = await this.notificationRepo.findOne({
            where: { id, userId },
        });
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        notification.isRead = true;
        notification.readAt = new Date();
        return this.notificationRepo.save(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepo.update(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() },
        );
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Create a notification (used by other services)
     */
    async create(data: Partial<Notification>): Promise<Notification> {
        const notification = this.notificationRepo.create({
            ...data,
            isRead: false,
            sentAt: new Date(),
        });
        return this.notificationRepo.save(notification);
    }
}
