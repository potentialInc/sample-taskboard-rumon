import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { mailFrom, mailTransporter } from 'src/config/mail.config';
import { EmailOptions } from 'src/shared/dtos';
import {
    getRegistrationOtpEmailTemplate,
    getResetPasswordEmailTemplate,
} from 'src/shared/templates';
import {
    getProjectInvitationTemplate,
    getDeadlineReminderTemplate,
    getDailyDigestTemplate,
    getPasswordResetTemplate,
    getEmailVerificationTemplate,
    getTaskAssignedTemplate,
} from 'src/shared/templates';

/**
 * Mail delivery strategy
 * - 'nodemailer' uses the existing Gmail OAuth2 nodemailer transport
 * - 'sendgrid' uses SendGrid API (set SENDGRID_API_KEY env var)
 */
type MailStrategy = 'nodemailer' | 'sendgrid';

@Injectable()
export class MailService implements OnModuleInit {
    private transporter: Transporter = mailTransporter;
    private strategy: MailStrategy;
    private sendgridApiKey: string | undefined;
    private sendgridFromEmail: string;

    constructor(private readonly logger: Logger) {
        // Determine strategy based on available configuration
        this.sendgridApiKey = process.env.SENDGRID_API_KEY;
        this.sendgridFromEmail =
            process.env.SENDGRID_FROM_EMAIL || 'noreply@taskboard.com';

        if (this.sendgridApiKey) {
            this.strategy = 'sendgrid';
            this.logger.log('MailService initialized with SendGrid strategy');
        } else {
            this.strategy = 'nodemailer';
            this.logger.log('MailService initialized with Nodemailer strategy');
        }
    }

    onModuleInit() {
        if (this.strategy === 'nodemailer') {
            void this.verifyConnection();
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            this.logger.warn(
                `Mail server connection failed: ${error.message}. Email sending will be unavailable until configured.`,
            );
            return false;
        }
    }

    // ──────────────────────────────────────────────
    // Core send methods
    // ──────────────────────────────────────────────

    async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
        if (this.strategy === 'sendgrid') {
            return this.sendViaSendGrid({ to, subject, html });
        }
        return this.sendViaNodemailer({ to, subject, html });
    }

    private async sendViaNodemailer({
        to,
        subject,
        html,
    }: EmailOptions): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: mailFrom,
                to,
                subject,
                html,
            });

            this.logger.log(
                `Email sent successfully via Nodemailer: ${info.messageId} to ${to}`,
            );
        } catch (error) {
            this.logger.error(`Nodemailer send failed: ${error.message}`);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    private async sendViaSendGrid({
        to,
        subject,
        html,
    }: EmailOptions): Promise<void> {
        try {
            // Dynamic import to avoid requiring @sendgrid/mail when not used
            const sgMail = await import('@sendgrid/mail');
            sgMail.default.setApiKey(this.sendgridApiKey!);

            const msg = {
                to,
                from: this.sendgridFromEmail,
                subject,
                html,
            };

            await sgMail.default.send(msg);

            this.logger.log(
                `Email sent successfully via SendGrid to ${to}: ${subject}`,
            );
        } catch (error: any) {
            const errorBody = error?.response?.body || error.message;
            this.logger.error(
                `SendGrid send failed: ${JSON.stringify(errorBody)}`,
            );
            throw new Error(
                `Failed to send email via SendGrid: ${error.message}`,
            );
        }
    }

    // ──────────────────────────────────────────────
    // Legacy methods (OTP-based, preserved from starter kit)
    // ──────────────────────────────────────────────

    async sendRegistrationOtpEmail(email: string, otp: number): Promise<void> {
        try {
            const emailContent = getRegistrationOtpEmailTemplate(otp);
            await this.sendEmail({
                to: email,
                subject: 'Verify Your Email Address',
                html: emailContent,
            });
        } catch (error) {
            this.logger.error(error);
            throw new Error(
                `Failed to send registration OTP email: ${error.message}`,
            );
        }
    }

    async sendResetPasswordEmail(
        email: string,
        otp: number,
        resetUrl?: string,
    ): Promise<void> {
        try {
            const emailContent = getResetPasswordEmailTemplate(otp, resetUrl);
            await this.sendEmail({
                to: email,
                subject: 'Reset Your Password',
                html: emailContent,
            });
        } catch (error) {
            this.logger.error(error);
            throw new Error(
                `Failed to send reset password email: ${error.message}`,
            );
        }
    }

    // ──────────────────────────────────────────────
    // TaskBoard-specific email methods
    // ──────────────────────────────────────────────

    /**
     * Send project invitation email
     */
    async sendProjectInvitation(
        to: string,
        recipientName: string,
        projectName: string,
        inviterName: string,
        inviteLink: string,
    ): Promise<void> {
        try {
            const html = getProjectInvitationTemplate(
                recipientName,
                projectName,
                inviterName,
                inviteLink,
            );
            await this.sendEmail({
                to,
                subject: `You've been invited to join "${projectName}" on TaskBoard`,
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send project invitation to ${to}: ${error.message}`,
            );
            throw new Error(
                `Failed to send project invitation: ${error.message}`,
            );
        }
    }

    /**
     * Send deadline reminder email (task due within 24 hours)
     */
    async sendDeadlineReminder(
        to: string,
        recipientName: string,
        taskTitle: string,
        projectName: string,
        dueDate: Date,
        taskLink: string,
    ): Promise<void> {
        try {
            const html = getDeadlineReminderTemplate(
                recipientName,
                taskTitle,
                projectName,
                dueDate,
                taskLink,
            );
            await this.sendEmail({
                to,
                subject: `Reminder: "${taskTitle}" is due soon`,
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send deadline reminder to ${to}: ${error.message}`,
            );
            throw new Error(
                `Failed to send deadline reminder: ${error.message}`,
            );
        }
    }

    /**
     * Send daily digest email with user's upcoming and overdue tasks
     */
    async sendDailyDigest(
        to: string,
        recipientName: string,
        tasks: Array<{
            title: string;
            projectName: string;
            priority: string;
            dueDate?: Date | null;
        }>,
        overdueTasks: Array<{
            title: string;
            projectName: string;
            dueDate?: Date | null;
        }>,
    ): Promise<void> {
        try {
            const html = getDailyDigestTemplate(
                recipientName,
                tasks,
                overdueTasks,
            );
            await this.sendEmail({
                to,
                subject: `Your TaskBoard Daily Digest - ${tasks.length} task${tasks.length !== 1 ? 's' : ''} today`,
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send daily digest to ${to}: ${error.message}`,
            );
            throw new Error(`Failed to send daily digest: ${error.message}`);
        }
    }

    /**
     * Send password reset email with reset link
     */
    async sendPasswordResetLink(
        to: string,
        recipientName: string,
        resetLink: string,
        expiresInMinutes: number = 60,
    ): Promise<void> {
        try {
            const html = getPasswordResetTemplate(
                recipientName,
                resetLink,
                expiresInMinutes,
            );
            await this.sendEmail({
                to,
                subject: 'Reset Your TaskBoard Password',
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send password reset to ${to}: ${error.message}`,
            );
            throw new Error(
                `Failed to send password reset email: ${error.message}`,
            );
        }
    }

    /**
     * Send email verification link
     */
    async sendEmailVerification(
        to: string,
        recipientName: string,
        verificationLink: string,
    ): Promise<void> {
        try {
            const html = getEmailVerificationTemplate(
                recipientName,
                verificationLink,
            );
            await this.sendEmail({
                to,
                subject: 'Verify Your TaskBoard Email',
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send email verification to ${to}: ${error.message}`,
            );
            throw new Error(
                `Failed to send email verification: ${error.message}`,
            );
        }
    }

    /**
     * Send task assigned notification
     */
    async sendTaskAssigned(
        to: string,
        recipientName: string,
        taskTitle: string,
        projectName: string,
        assignedBy: string,
        priority: string,
        dueDate: Date | null,
        taskLink: string,
    ): Promise<void> {
        try {
            const html = getTaskAssignedTemplate(
                recipientName,
                taskTitle,
                projectName,
                assignedBy,
                priority,
                dueDate,
                taskLink,
            );
            await this.sendEmail({
                to,
                subject: `New task assigned: "${taskTitle}"`,
                html,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send task assignment to ${to}: ${error.message}`,
            );
            throw new Error(
                `Failed to send task assigned email: ${error.message}`,
            );
        }
    }
}
