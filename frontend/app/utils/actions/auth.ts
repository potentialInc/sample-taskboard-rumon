import { authService } from '~/services/httpServices/authService';
import { loginSuccess } from '~/redux/features/authSlice';
import type { AppDispatch } from '~/redux/store/store';
import type { LoginFormData, RegisterFormData, ForgotPasswordFormData, ResetPasswordFormData } from '~/utils/validations/auth';

/**
 * Login action - calls authService.login and dispatches user to Redux store.
 * Returns the AuthUser on success, throws on failure.
 */
export async function loginAction(data: LoginFormData, dispatch: AppDispatch) {
  const response = await authService.login({
    email: data.email,
    password: data.password,
    rememberMe: data.rememberMe,
  });
  dispatch(loginSuccess(response.user));
  return response.user;
}

/**
 * Register action - calls authService.register with the correct field mapping.
 * Backend RegisterDto: { name, email, password, jobTitle? } → returns null.
 */
export async function registerAction(data: RegisterFormData) {
  const { confirmPassword, agreeToTerms, fullName, ...rest } = data;
  await authService.register({
    ...rest,
    name: fullName,
  });
}

/**
 * Forgot password action - sends reset link to email.
 */
export async function forgotPasswordAction(data: ForgotPasswordFormData) {
  await authService.forgotPassword({ email: data.email });
}

/**
 * Reset password action - resets password using email + OTP + new password.
 * Backend ResetPasswordDto: { email, otp, password }.
 */
export async function resetPasswordAction(data: ResetPasswordFormData & { email: string; otp: string }) {
  await authService.resetPassword({
    email: data.email,
    otp: data.otp,
    password: data.password,
  });
}
