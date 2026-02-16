import dotenv from 'dotenv';
dotenv.config();

class EnvConfigService {
    constructor(private env: { [k: string]: string | undefined }) {}

    getValue(key: string, throwOnMissing = true): string {
        const value = this.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`config error - missing env.${key}`);
        }
        return value as string;
    }

    public ensureValues(keys: string[]) {
        keys.forEach((k) => this.getValue(k, true));
        return this;
    }

    public getPort(): string {
        return this.getValue('PORT', true);
    }

    public isProduction(): boolean {
        const mode = this.getValue('MODE', false);
        return mode !== 'DEV';
    }

    public getFrontendUrl(): string {
        return (
            this.getValue('FRONTEND_URL', false) || 'http://localhost:5173'
        );
    }

    public getAdminDashboardUrl(): string {
        return (
            this.getValue('ADMIN_DASHBOARD_URL', false) ||
            'http://localhost:5174'
        );
    }

    public getOrigins(): string[] {
        try {
            return this.getValue('ALLOW_ORIGINS')
                .split(',')
                .map((origin) => origin.trim());
        } catch {
            return [];
        }
    }

    public getTypeOrmConfig() {
        return {
            host: this.getValue('POSTGRES_HOST'),
            port: parseInt(this.getValue('POSTGRES_PORT')),
            username: this.getValue('POSTGRES_USER'),
            password: this.getValue('POSTGRES_PASSWORD'),
            database: this.getValue('POSTGRES_DATABASE'),

            synchronize: false,
        };
    }

    public getAwsConfig() {
        return {
            AWS_REGION: this.getValue('AWS_REGION', false) || 'us-east-1',
            AWS_ACCESS_KEY_ID: this.getValue('AWS_ACCESS_KEY_ID', false) || '',
            AWS_SECRET_ACCESS_KEY:
                this.getValue('AWS_SECRET_ACCESS_KEY', false) || '',
            AWS_S3_BUCKET:
                this.getValue('AWS_S3_BUCKET', false) || 'taskboard-uploads',
        };
    }

    public getMailConfig() {
        return {
            MAIL_HOST: this.getValue('MAIL_HOST', false) || 'smtp.gmail.com',
            MAIL_PORT: parseInt(this.getValue('MAIL_PORT', false)) || 465,
            MAIL_FROM: this.getValue('MAIL_FROM', false) || 'demo@example.com',
            GOOGLE_CLIENT_ID:
                this.getValue('GOOGLE_CLIENT_ID', false) || 'demo-id',
            GOOGLE_CLIENT_SECRET:
                this.getValue('GOOGLE_CLIENT_SECRET', false) || 'demo-secret',
            GOOGLE_CLIENT_REFRESH_TOKEN:
                this.getValue('GOOGLE_CLIENT_REFRESH_TOKEN', false) ||
                'demo-refresh-token',
            GOOGLE_CLIENT_ACCESS_TOKEN:
                this.getValue('GOOGLE_CLIENT_ACCESS_TOKEN', false) ||
                'demo-access-token',
        };
    }

    public getSendGridConfig() {
        return {
            SENDGRID_API_KEY: this.getValue('SENDGRID_API_KEY', false) || '',
            SENDGRID_FROM_EMAIL:
                this.getValue('SENDGRID_FROM_EMAIL', false) ||
                'noreply@taskboard.com',
        };
    }

    public getRedisConfig() {
        return {
            REDIS_HOST: this.getValue('REDIS_HOST', false) || 'localhost',
            REDIS_PORT: parseInt(this.getValue('REDIS_PORT', false)) || 6379,
            REDIS_PASSWORD: this.getValue('REDIS_PASSWORD', false) || '',
        };
    }

    public getAppleConfig() {
        return {
            APPLE_TEAM_ID:
                this.getValue('APPLE_TEAM_ID', false) ||
                'demo-apple-team-id',
            APPLE_CLIENT_ID:
                this.getValue('APPLE_CLIENT_ID', false) ||
                'demo-apple-client-id',
            APPLE_KEY_ID:
                this.getValue('APPLE_KEY_ID', false) || 'demo-apple-key-id',
            APPLE_PRIVATE_KEY: (
                this.getValue('APPLE_PRIVATE_KEY', false) ||
                'demo-apple-private-key'
            ).replace(/\\n/g, '\n'),
        };
    }

    public getTossConfig() {
        return {
            TOSS_CLIENT_KEY:
                this.getValue('TOSS_CLIENT_KEY', false) || 'test_client_key',
            TOSS_SECRET_KEY:
                this.getValue('TOSS_SECRET_KEY', false) || 'test_secret_key',
            TOSS_API_URL:
                this.getValue('TOSS_API_URL', false) ||
                'https://api.tosspayments.com',
        };
    }

    public getPushNotificationConfig() {
        return {
            PROJECT_ID: this.getValue('PROJECT_ID', false) || '',
            PRIVATE_KEY_ID: this.getValue('PRIVATE_KEY_ID', false) || '',
            PRIVATE_KEY: this.getValue('PRIVATE_KEY', false) || '',
            CLIENT_EMAIL: this.getValue('CLIENT_EMAIL', false) || '',
        };
    }

    public getAuthJWTConfig() {
        return {
            AUTH_JWT_SECRET: this.getValue('AUTH_JWT_SECRET'),
            AUTH_TOKEN_COOKIE_NAME: this.getValue('AUTH_TOKEN_COOKIE_NAME'),
            AUTH_TOKEN_EXPIRED_TIME: this.getValue('AUTH_TOKEN_EXPIRED_TIME'),
            AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME: this.getValue(
                'AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME',
            ),
            AUTH_REFRESH_TOKEN_COOKIE_NAME: this.getValue(
                'AUTH_REFRESH_TOKEN_COOKIE_NAME',
            ),
            AUTH_REFRESH_TOKEN_EXPIRED_TIME: this.getValue(
                'AUTH_REFRESH_TOKEN_EXPIRED_TIME',
            ),
        };
    }
}

const envConfigService = new EnvConfigService(process.env).ensureValues([
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
]);

export { envConfigService };
