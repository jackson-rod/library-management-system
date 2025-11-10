import axios, { type AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const response = (error as AxiosError<ErrorResponse>).response?.data;

    if (response?.message) {
      return response.message;
    }

    const firstError = response?.errors && Object.values(response.errors)[0]?.[0];
    if (firstError) {
      return firstError;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
