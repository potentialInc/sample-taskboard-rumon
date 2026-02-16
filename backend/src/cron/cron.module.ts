import { Logger, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskCronService } from './task-cron.service';
import { MailModule } from 'src/infrastructure/mail/mail.module';

/**
 * CronModule registers all scheduled background tasks for TaskBoard.
 *
 * Uses @nestjs/schedule which is built on node-cron.
 *
 * Registered Jobs:
 * - TaskCronService: daily digest, deadline reminders, trash cleanup, overdue detection
 */
@Module({
    imports: [ScheduleModule.forRoot(), MailModule],
    providers: [TaskCronService, Logger],
    exports: [TaskCronService],
})
export class CronModule {}
