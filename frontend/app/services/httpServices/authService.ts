import { httpService } from '~/services/httpService';
import type { AuthUser, LoginRequest, ForgotPasswordRequest } from '~/types/auth';

export const authService = {
  login: (data: LoginRequest) =>
    httpService.post<{ user: AuthUser }>('/auth/login', data),

  register: (data: { name: string; email: string; password: string; jobTitle?: string }) =>
    httpService.post<null>('/auth/register', data),

  logout: () =>
    httpService.get<string>('/auth/logout'),

  refreshToken: () =>
    httpService.get<{ user: AuthUser }>('/auth/refresh-access-token'),

  checkLogin: () =>
    httpService.get<AuthUser>('/auth/check-login'),

  forgotPassword: (data: ForgotPasswordRequest) =>
    httpService.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: { email: string; otp: string; password: string }) =>
    httpService.post<{ user: AuthUser }>('/auth/reset-password', data),

  changePassword: (data: { newPassword: string; confirmNewPassword: string }) =>
    httpService.post<{ user: AuthUser }>('/auth/change-password', data),

  verifyEmail: (token: string) =>
    httpService.get<null>('/auth/verify-email', { params: { token } }),

  socialLogin: (data: { token: string; provider: string; name?: string; email?: string }) =>
    httpService.post<{ user: AuthUser }>('/auth/social-login', data),

  googleAuth: () =>
    httpService.get<void>('/auth/google'),

  getMe: () =>
    httpService.get<AuthUser>('/users/me'),
};
