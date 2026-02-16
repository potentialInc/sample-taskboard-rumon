/**
 * Base email template wrapper for TaskBoard
 * Provides consistent branding and styling across all emails
 */
export const wrapInBaseTemplate = (
    title: string,
    bodyContent: string,
): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f9fc;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">TaskBoard</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            ${bodyContent}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                                This email was sent by TaskBoard. If you did not expect this email, please ignore it.
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                &copy; ${new Date().getFullYear()} TaskBoard. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};
