export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle?: string;
  avatar?: File;
  agreeToTerms: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  jobTitle?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  message?: string;
  error?: string;
  data?: {
    user: AuthUser;
  };
}

export interface ActionResponse {
  message?: string;
  error?: string;
}
