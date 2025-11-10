import { useState } from 'react';
import { useForm } from 'react-hook-form';

import FormInput from './FormInput';
import FormError from './FormError';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { LoginCredentials } from '../types/auth';

export default function SignIn() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<LoginCredentials>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setError('');
    setLoading(true);

    try {
      const response = await login(data);
      const firstName = response?.user?.name?.split(' ')[0] || 'User';
      showToast(`Welcome back, ${firstName}!`, 'success');
      // Redirect or handle successful login
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosError.response?.status;
        const errorMessage = axiosError.response?.data?.message || 'An error occurred. Please try again.';

        if (status === 422) {
          // Validation errors - show in form
          setError(errorMessage);
        } else {
          // Other errors - show in toast
          showToast(errorMessage, 'error');
        }
      } else {
        // Unknown errors - show in toast
        showToast('An error occurred. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8" data-testid="signin-page">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Library Management Service"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
          className="mx-auto h-10 w-auto"
          data-testid="signin-logo"
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white" data-testid="signin-title">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        {error && <FormError message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="signin-form">
          <FormInput
            id="email"
            label="Email address"
            type="email"
            autoComplete="off"
            disabled={loading}
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <div data-testid="form-input-wrapper-password">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100" data-testid="form-input-label-password">
                Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                type="password"
                autoComplete="off"
                disabled={loading}
                data-testid="form-input-password"
                className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed ${errors.password
                  ? 'outline-red-500/50 focus:outline-red-500'
                  : 'outline-white/10 focus:outline-indigo-500'
                  }`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-400" data-testid="form-input-error-password">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isValid || !isDirty}
              data-testid="signin-submit-button"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
