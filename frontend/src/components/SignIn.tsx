import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import FormInput from '@/components/FormInput';
import FormError from '@/components/FormError';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import LoginWallpaper from '@/assets/bookshelf-wallpaper.avif';
import Logo from '@/assets/logo.webp';
import type { LoginCredentials } from '@/types/auth';
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const MIN_PASSWORD_LENGTH = 6;

interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

function isAxiosError(err: unknown): err is AxiosError {
  return err !== null && typeof err === 'object' && 'response' in err;
}

export default function SignIn() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
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

  const handleLoginSuccess = (response: { user?: { name?: string } }) => {
    const firstName = response?.user?.name?.split(' ')[0] || 'User';
    showToast(`Welcome back, ${firstName}!`, 'success');
    navigate('/dashboard', { replace: true });
  };

  const handleLoginError = (err: unknown) => {
    if (!isAxiosError(err)) {
      showToast('An error occurred. Please try again.', 'error');
      return;
    }

    const status = err.response?.status;
    const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';

    if (status === 422) {
      setError(errorMessage);
    } else {
      showToast(errorMessage, 'error');
    }
  };

  const onSubmit = async (data: LoginCredentials) => {
    setError('');
    setLoading(true);

    try {
      const response = await login(data);
      handleLoginSuccess(response);
    } catch (err) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" data-testid="signin-page">
      {/* Left side - Wallpaper */}
      <div className="hidden lg:block lg:flex-1 relative">
        <img
          src={LoginWallpaper}
          alt="Library bookshelf"
          className="h-full w-full object-cover"
          data-testid="signin-wallpaper"
        />
        <div className="absolute inset-0 bg-indigo-900/20" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            alt="Library Management Service"
            src={Logo}
            className="mx-auto h-32 w-auto"
            data-testid="signin-logo"
            draggable={false}
          />
          <h2
            className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white"
            data-testid="signin-title"
          >
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          {error && <FormError message={error} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="signin-form">
            <FormInput
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              disabled={loading}
              error={errors.email}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: EMAIL_PATTERN,
                  message: 'Invalid email address',
                },
              })}
            />

            <FormInput
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              disabled={loading}
              error={errors.password}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: MIN_PASSWORD_LENGTH,
                  message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
                },
              })}
            />

            <div>
              <button
                type="submit"
                disabled={loading || !isValid || !isDirty}
                data-testid="signin-submit-button"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
