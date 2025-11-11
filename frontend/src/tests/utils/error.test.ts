import { describe, it, expect } from 'vitest';
import type { AxiosError } from 'axios';
import { extractErrorMessage } from '@/utils/error';

type ErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const buildAxiosError = (data: ErrorResponse): AxiosError<ErrorResponse> => {
  const error = new Error('Axios error') as AxiosError<ErrorResponse>;
  error.isAxiosError = true;
  error.config = {};
  error.toJSON = () => ({});
  error.response = {
    status: data.message ? 400 : 422,
    statusText: 'Bad Request',
    headers: {},
    config: {},
    data,
  };
  return error;
};

describe('extractErrorMessage', () => {
  it('returns message from axios error body', () => {
    const error = buildAxiosError({ message: 'Forbidden' });
    expect(extractErrorMessage(error, 'Fallback')).toBe('Forbidden');
  });

  it('returns first validation error when message is missing', () => {
    const error = buildAxiosError({ errors: { email: ['Email invalid'], name: ['Name required'] } });
    expect(extractErrorMessage(error, 'Fallback')).toBe('Email invalid');
  });

  it('falls back to Error.message when not an axios error', () => {
    const generic = new Error('Unexpected failure');
    expect(extractErrorMessage(generic, 'Fallback')).toBe('Unexpected failure');
  });

  it('uses fallback when no message can be derived', () => {
    const unknownValue = { foo: 'bar' };
    expect(extractErrorMessage(unknownValue, 'Fallback message')).toBe('Fallback message');
  });
});
