import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse, ErrorResponse } from '~/types/httpService';

// URLs that should NOT trigger a redirect on 401
const AUTH_CHECK_URLS = ['/auth/check-login', '/auth/refresh-access-token'];

export const createErrorResponse = (error: AxiosError<ApiErrorResponse>): ErrorResponse => {
  const errorResponse: ErrorResponse = {
    message: 'An unexpected error occurred',
    status: 500,
  };

  if (error.response) {
    errorResponse.status = error.response.status;
    const serverMessage = error.response.data?.message;
    errorResponse.message = Array.isArray(serverMessage)
      ? serverMessage.join(', ')
      : serverMessage || error.message;

    switch (error.response.status) {
      case 401: {
        const requestUrl = error.config?.url || '';
        const isAuthCheck = AUTH_CHECK_URLS.some((url) => requestUrl.includes(url));
        if (!isAuthCheck) {
          handleUnauthorized();
        }
        break;
      }
      case 403:
        errorResponse.message = 'Access denied';
        break;
      case 404:
        errorResponse.message = 'Resource not found';
        break;
      case 422:
        errorResponse.message = 'Validation failed';
        break;
      case 500:
        errorResponse.message = 'Server error';
        break;
    }
  } else if (error.request) {
    errorResponse.message = 'No response from server';
    errorResponse.status = 503;
  }

  return errorResponse;
};

export const handleUnauthorized = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const handleAxiosError = (error: unknown): ErrorResponse => {
  if (axios.isAxiosError(error)) {
    return error.response?.data || {
      message: error.message,
      status: error.response?.status || 500,
    };
  }
  // Handle errors already transformed by the axios response interceptor
  if (error && typeof error === 'object' && 'message' in error && 'status' in error) {
    return error as ErrorResponse;
  }
  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
};