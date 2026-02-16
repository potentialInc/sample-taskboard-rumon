import { wrapInBaseTemplate } from './taskboard-email-base.template';

/**
 * Primary button style used across all templates
 */
const primaryButtonStyle =
    'display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;';

/**
 * Project invitation email template
 */
export const getProjectInvitationTemplate = (
    recipientName: string,
    projectName: string,
    inviterName: string,
    inviteLink: string,
): string => {
    const body = `
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">You've been invited!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            Hi ${recipientName},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            <strong>${inviterName}</strong> has invited you to collaborate on the project <strong>"${projectName}"</strong> on TaskBoard.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="${primaryButtonStyle}">Accept Invitation</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: #4F46E5; word-break: break-all;">${inviteLink}</a>
        </p>
    `;
    return wrapInBaseTemplate(`Invitation to ${projectName}`, body);
};

/**
 * Deadline reminder email template
 */
export const getDeadlineReminderTemplate = (
    recipientName: string,
    taskTitle: string,
    projectName: string,
    dueDate: Date,
    taskLink: string,
): string => {
    const formattedDate = dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const body = `
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Deadline Reminder</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            Hi ${recipientName},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Your task is due soon:
        </p>
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
            <p style="color: #92400E; font-weight: 600; font-size: 16px; margin: 0 0 4px 0;">${taskTitle}</p>
            <p style="color: #92400E; font-size: 14px; margin: 0 0 4px 0;">Project: ${projectName}</p>
            <p style="color: #92400E; font-size: 14px; margin: 0;">Due: ${formattedDate}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${taskLink}" style="${primaryButtonStyle}">View Task</a>
        </div>
    `;
    return wrapInBaseTemplate('Deadline Reminder', body);
};

/**
 * Daily digest email template
 */
export const getDailyDigestTemplate = (
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
): string => {
    const formatDate = (date?: Date | null): string => {
        if (!date) return 'No due date';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const priorityColors: Record<string, string> = {
        urgent: '#DC2626',
        high: '#F59E0B',
        medium: '#3B82F6',
        low: '#10B981',
    };

    const overdueSection =
        overdueTasks.length > 0
            ? `
        <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
            <p style="color: #991B1B; font-weight: 600; font-size: 14px; margin: 0 0 12px 0;">
                Overdue Tasks (${overdueTasks.length})
            </p>
            ${overdueTasks
                .map(
                    (task) => `
                <p style="color: #991B1B; font-size: 14px; margin: 0 0 6px 0;">
                    - ${task.title} <span style="color: #B91C1C; font-size: 12px;">(${task.projectName} | was due ${formatDate(task.dueDate)})</span>
                </p>
            `,
                )
                .join('')}
        </div>
    `
            : '';

    const taskRows = tasks
        .map(
            (task) => `
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
                <p style="color: #1f2937; font-size: 14px; margin: 0; font-weight: 500;">${task.title}</p>
                <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0 0;">${task.projectName}</p>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center;">
                <span style="background-color: ${priorityColors[task.priority] || '#6B7280'}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    ${task.priority}
                </span>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #6b7280; font-size: 13px;">
                ${formatDate(task.dueDate)}
            </td>
        </tr>
    `,
        )
        .join('');

    const body = `
        <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 20px;">Your Daily Digest</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
            ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Hi ${recipientName}, here is your task summary for today:
        </p>
        ${overdueSection}
        ${
            tasks.length > 0
                ? `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 16px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Task</th>
                <th style="padding: 10px 16px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Priority</th>
                <th style="padding: 10px 16px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Due</th>
            </tr>
            ${taskRows}
        </table>
        `
                : '<p style="color: #6b7280; text-align: center; padding: 24px 0;">No tasks due today. Nice work!</p>'
        }
    `;
    return wrapInBaseTemplate('Daily Digest', body);
};

/**
 * Password reset email template
 */
export const getPasswordResetTemplate = (
    recipientName: string,
    resetLink: string,
    expiresInMinutes: number = 60,
): string => {
    const body = `
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Reset Your Password</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            Hi ${recipientName},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="${primaryButtonStyle}">Reset Password</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
            This link will expire in <strong>${expiresInMinutes} minutes</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
    `;
    return wrapInBaseTemplate('Reset Your Password', body);
};

/**
 * Email verification template
 */
export const getEmailVerificationTemplate = (
    recipientName: string,
    verificationLink: string,
): string => {
    const body = `
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Verify Your Email</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            Hi ${recipientName},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Welcome to TaskBoard! Please verify your email address to get started:
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" style="${primaryButtonStyle}">Verify Email</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #4F46E5; word-break: break-all;">${verificationLink}</a>
        </p>
    `;
    return wrapInBaseTemplate('Verify Your Email', body);
};

/**
 * Task assigned notification template
 */
export const getTaskAssignedTemplate = (
    recipientName: string,
    taskTitle: string,
    projectName: string,
    assignedBy: string,
    priority: string,
    dueDate: Date | null,
    taskLink: string,
): string => {
    const priorityColors: Record<string, string> = {
        urgent: '#DC2626',
        high: '#F59E0B',
        medium: '#3B82F6',
        low: '#10B981',
    };

    const formattedDue = dueDate
        ? new Date(dueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
          })
        : 'No due date';

    const body = `
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">New Task Assigned</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            Hi ${recipientName},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            <strong>${assignedBy}</strong> has assigned you a new task:
        </p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
            <p style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">${taskTitle}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Project:</td>
                    <td style="color: #1f2937; font-size: 14px; padding: 4px 0; font-weight: 500;">${projectName}</td>
                </tr>
                <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Priority:</td>
                    <td style="padding: 4px 0;">
                        <span style="background-color: ${priorityColors[priority] || '#6B7280'}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                            ${priority.toUpperCase()}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 4px 0;">Due:</td>
                    <td style="color: #1f2937; font-size: 14px; padding: 4px 0; font-weight: 500;">${formattedDue}</td>
                </tr>
            </table>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${taskLink}" style="${primaryButtonStyle}">View Task</a>
        </div>
    `;
    return wrapInBaseTemplate('New Task Assigned', body);
};
