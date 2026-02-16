export const getResetPasswordEmailTemplate = (
    otp: number,
    resetUrl?: string,
): string => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested to reset your password. Use the following OTP code:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
                ${otp}
            </div>
            ${
                resetUrl
                    ? `<p style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #4A90D9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                            Reset Password
                        </a>
                    </p>
                    <p style="color: #666; font-size: 12px; text-align: center;">Or copy this link: <a href="${resetUrl}" style="color: #4A90D9;">${resetUrl}</a></p>`
                    : ''
            }
            <p style="color: #666; font-size: 14px;">This OTP is valid for 2 minutes. If you did not request this, please ignore this email.</p>
        </div>
    `;
};
