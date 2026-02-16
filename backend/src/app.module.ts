import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

//DB
import { TypeOrmModule } from '@nestjs/typeorm';
import { appDataSource } from './config/db.config';

//Config
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import {
    CorsMiddleware,
    RequestIdMiddleware,
    CsrfMiddleware,
} from './core/middleware';
import { UserModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard, JwtStrategy } from './core/guards';
import { OtpModule } from '@modules/otp/otp.module';
import { FeaturesModule } from './modules/features/features.module';
import { LanguageEnum } from '@shared/enums';

// TaskBoard modules
import { WebSocketModule } from './websocket/websocket.module';
import { CronModule } from './cron/cron.module';
import { S3Module } from './infrastructure/s3/s3.module';
import { MailModule } from './infrastructure/mail/mail.module';

// TaskBoard business modules
import { ProjectsModule } from './modules/projects/projects.module';
import { ColumnsModule } from './modules/columns/columns.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SubTasksModule } from './modules/sub-tasks/sub-tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LabelsModule } from './modules/labels/labels.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { ProjectMembersModule } from './modules/project-members/project-members.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'src/shared/icons'),
            serveRoot: '/diagnosis-icons',
        }),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'src', 'test'),
            serveRoot: '/test',
        }),
        ConfigModule.forRoot({
            load: [jwtConfig],
            isGlobal: true,
        }),
        TypeOrmModule.forRoot(appDataSource.options),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        I18nModule.forRoot({
            fallbackLanguage: LanguageEnum.KOREAN,
            loaderOptions: {
                path: join(process.cwd(), 'src/i18n'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
            ],
            typesOutputPath: join(
                process.cwd(),
                'src/generated/i18n.generated.ts',
            ),
            formatter: (template: string, ...args: any[]) => {
                let result = template;
                if (args[0]) {
                    Object.keys(args[0]).forEach((key) => {
                        result = result.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            args[0][key],
                        );
                        result = result.replace(
                            new RegExp(`\\{${key}\\}`, 'g'),
                            args[0][key],
                        );
                    });
                }
                return result;
            },
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),

        // Core feature modules
        UserModule,
        AuthModule,
        OtpModule,
        FeaturesModule,

        // TaskBoard business modules
        ProjectsModule,
        ColumnsModule,
        TasksModule,
        SubTasksModule,
        CommentsModule,
        TimeEntriesModule,
        AttachmentsModule,
        NotificationsModule,
        LabelsModule,
        ActivityLogsModule,
        ProjectMembersModule,
        AdminModule,

        // Infrastructure modules
        S3Module,
        MailModule,

        // TaskBoard real-time & scheduled tasks
        WebSocketModule,
        CronModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestIdMiddleware).forRoutes('*');
        consumer.apply(CorsMiddleware).forRoutes('*');
        consumer.apply(CsrfMiddleware).forRoutes('*');
    }
}
