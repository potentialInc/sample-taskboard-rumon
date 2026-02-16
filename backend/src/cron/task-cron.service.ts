import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { MailService } from 'src/infrastructure/mail/mail.service';

/**
 * TaskCronService handles all scheduled background jobs for TaskBoard.
 *
 * Jobs:
 * 1. Daily Digest       - Send task summary at 8 AM daily
 * 2. Deadline Reminder   - Check for tasks due in 24h, every 6 hours
 * 3. Trash Cleanup       - Permanently delete tasks in trash > 30 days, daily at midnight
 * 4. Overdue Detection   - Mark tasks past due date as overdue, every hour
 *
 * Note: These cron jobs use raw SQL queries via DataSource to avoid
 * circular dependencies with module services. Once the Task/Project/User
 * services are fully implemented, these should be refactored to use
 * the respective service methods.
 */
@Injectable()
export class TaskCronService {
    private readonly logger = new Logger(TaskCronService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly mailService: MailService,
    ) {}

    // ──────────────────────────────────────────────
    // Job 1: Daily Digest (8 AM UTC daily)
    // ──────────────────────────────────────────────

    @Cron('0 8 * * *', {
        name: 'daily-digest',
        timeZone: 'UTC',
    })
    async sendDailyDigests(): Promise<void> {
        this.logger.log('[CRON] Starting daily digest job');

        try {
            // Get all active users
            const users = await this.dataSource.query(`
                SELECT id, email, name
                FROM users
                WHERE is_active = true
                  AND email_verified = true
            `);

            if (!users || users.length === 0) {
                this.logger.log(
                    '[CRON] No active users found for daily digest',
                );
                return;
            }

            let sentCount = 0;

            for (const user of users) {
                try {
                    const userName = user.name || 'Team Member';

                    // Get tasks due today for this user
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date();
                    todayEnd.setHours(23, 59, 59, 999);

                    const tasksDueToday = await this.dataSource.query(
                        `
                        SELECT t.title, t.priority, t.due_date,
                               p.title as project_name
                        FROM tasks t
                        JOIN columns c ON t.column_id = c.id
                        JOIN projects p ON c.project_id = p.id
                        WHERE t.assignee_id = $1
                          AND t.deleted_at IS NULL
                          AND t.due_date BETWEEN $2 AND $3
                        ORDER BY t.priority DESC, t.due_date ASC
                    `,
                        [user.id, todayStart, todayEnd],
                    );

                    // Get overdue tasks for this user
                    const overdueTasks = await this.dataSource.query(
                        `
                        SELECT t.title, t.due_date,
                               p.title as project_name
                        FROM tasks t
                        JOIN columns c ON t.column_id = c.id
                        JOIN projects p ON c.project_id = p.id
                        WHERE t.assignee_id = $1
                          AND t.deleted_at IS NULL
                          AND t.due_date < $2
                          AND t.is_overdue = true
                        ORDER BY t.due_date ASC
                        LIMIT 20
                    `,
                        [user.id, todayStart],
                    );

                    // Only send if there are tasks to report
                    if (tasksDueToday.length > 0 || overdueTasks.length > 0) {
                        const formattedTasks = tasksDueToday.map((t: any) => ({
                            title: t.title,
                            projectName: t.project_name,
                            priority: t.priority,
                            dueDate: t.due_date,
                        }));

                        const formattedOverdue = overdueTasks.map((t: any) => ({
                            title: t.title,
                            projectName: t.project_name,
                            dueDate: t.due_date,
                        }));

                        await this.mailService.sendDailyDigest(
                            user.email,
                            userName,
                            formattedTasks,
                            formattedOverdue,
                        );

                        sentCount++;
                    }
                } catch (userError: any) {
                    this.logger.error(
                        `[CRON] Failed to send daily digest to ${user.email}: ${userError.message}`,
                    );
                    // Continue with next user, don't fail the whole job
                }
            }

            this.logger.log(
                `[CRON] Daily digest completed. Sent to ${sentCount} users.`,
            );
        } catch (error: any) {
            this.logger.error(
                `[CRON] Daily digest job failed: ${error.message}`,
                error.stack,
            );
        }
    }

    // ──────────────────────────────────────────────
    // Job 2: Deadline Reminder (every 6 hours)
    // ──────────────────────────────────────────────

    @Cron('0 */6 * * *', {
        name: 'deadline-reminders',
        timeZone: 'UTC',
    })
    async sendDeadlineReminders(): Promise<void> {
        this.logger.log('[CRON] Starting deadline reminder job');

        try {
            const now = new Date();
            const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Find tasks due in the next 24 hours that have assignees
            const tasksDueSoon = await this.dataSource.query(
                `
                SELECT t.id, t.title, t.due_date, t.assignee_id,
                       u.email, u.name,
                       p.title as project_name, p.id as project_id
                FROM tasks t
                JOIN users u ON t.assignee_id = u.id
                JOIN columns c ON t.column_id = c.id
                JOIN projects p ON c.project_id = p.id
                WHERE t.assignee_id IS NOT NULL
                  AND t.deleted_at IS NULL
                  AND t.due_date BETWEEN $1 AND $2
                  AND t.is_overdue = false
                ORDER BY t.due_date ASC
            `,
                [now, in24Hours],
            );

            if (!tasksDueSoon || tasksDueSoon.length === 0) {
                this.logger.log('[CRON] No tasks due in next 24 hours');
                return;
            }

            let sentCount = 0;
            const frontendUrl =
                process.env.FRONTEND_URL || 'http://localhost:5173';

            for (const task of tasksDueSoon) {
                try {
                    const userName = task.name || 'Team Member';

                    const taskLink = `${frontendUrl}/projects/${task.project_id}/tasks/${task.id}`;

                    await this.mailService.sendDeadlineReminder(
                        task.email,
                        userName,
                        task.title,
                        task.project_name,
                        task.due_date,
                        taskLink,
                    );

                    // Create in-app notification for due date reminder
                    try {
                        await this.dataSource.query(
                            `INSERT INTO notifications (id, user_id, type, title, message, related_task_id, related_project_id, is_read, sent_at)
                             VALUES (uuid_generate_v4(), $1, 'due_date_reminder', $2, $3, $4, $5, false, NOW())`,
                            [
                                task.assignee_id,
                                'Upcoming Deadline',
                                `Task "${task.title}" in project "${task.project_name}" is due on ${new Date(task.due_date).toLocaleDateString()}`,
                                task.id,
                                task.project_id,
                            ],
                        );
                    } catch (notifError: any) {
                        this.logger.error(
                            `[CRON] Failed to create due date notification for task ${task.id}: ${notifError.message}`,
                        );
                    }

                    sentCount++;
                } catch (taskError: any) {
                    this.logger.error(
                        `[CRON] Failed to send deadline reminder for task ${task.id}: ${taskError.message}`,
                    );
                }
            }

            this.logger.log(
                `[CRON] Deadline reminders completed. Sent ${sentCount} reminders.`,
            );
        } catch (error: any) {
            this.logger.error(
                `[CRON] Deadline reminder job failed: ${error.message}`,
                error.stack,
            );
        }
    }

    // ──────────────────────────────────────────────
    // Job 3: Trash Cleanup (midnight UTC daily)
    // ──────────────────────────────────────────────

    @Cron('0 0 * * *', {
        name: 'trash-cleanup',
        timeZone: 'UTC',
    })
    async cleanupOldTrash(): Promise<void> {
        this.logger.log('[CRON] Starting trash cleanup job');

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Permanently delete tasks that have been in trash for over 30 days
            // This performs a hard DELETE (not soft delete)
            const result = await this.dataSource.query(
                `
                DELETE FROM tasks
                WHERE deleted_at IS NOT NULL
                  AND deleted_at < $1
                RETURNING id
            `,
                [thirtyDaysAgo],
            );

            const deletedCount = result?.length || 0;

            if (deletedCount > 0) {
                this.logger.log(
                    `[CRON] Trash cleanup completed. Permanently deleted ${deletedCount} tasks.`,
                );
            } else {
                this.logger.log(
                    '[CRON] Trash cleanup completed. No tasks to clean up.',
                );
            }
        } catch (error: any) {
            this.logger.error(
                `[CRON] Trash cleanup job failed: ${error.message}`,
                error.stack,
            );
        }
    }

    // ──────────────────────────────────────────────
    // Job 4: Overdue Task Detection (every hour)
    // ──────────────────────────────────────────────

    @Cron(CronExpression.EVERY_HOUR, {
        name: 'overdue-detection',
        timeZone: 'UTC',
    })
    async detectOverdueTasks(): Promise<void> {
        this.logger.log('[CRON] Starting overdue task detection');

        try {
            const now = new Date();

            // Mark tasks as overdue where due_date has passed and is_overdue is false
            const result = await this.dataSource.query(
                `
                UPDATE tasks
                SET is_overdue = true,
                    updated_at = NOW()
                WHERE due_date IS NOT NULL
                  AND due_date < $1
                  AND is_overdue = false
                  AND deleted_at IS NULL
                RETURNING id
            `,
                [now],
            );

            const overdueCount = result?.length || 0;

            if (overdueCount > 0) {
                this.logger.log(
                    `[CRON] Overdue detection completed. Marked ${overdueCount} tasks as overdue.`,
                );
            } else {
                this.logger.debug(
                    '[CRON] Overdue detection completed. No new overdue tasks.',
                );
            }

            // Also un-mark tasks that are no longer overdue
            // (e.g., due date was extended)
            const unmarkedResult = await this.dataSource.query(
                `
                UPDATE tasks
                SET is_overdue = false,
                    updated_at = NOW()
                WHERE is_overdue = true
                  AND deleted_at IS NULL
                  AND (due_date IS NULL OR due_date >= $1)
                RETURNING id
            `,
                [now],
            );

            const unmarkedCount = unmarkedResult?.length || 0;
            if (unmarkedCount > 0) {
                this.logger.log(
                    `[CRON] Un-marked ${unmarkedCount} tasks that are no longer overdue.`,
                );
            }
        } catch (error: any) {
            this.logger.error(
                `[CRON] Overdue detection job failed: ${error.message}`,
                error.stack,
            );
        }
    }
}
