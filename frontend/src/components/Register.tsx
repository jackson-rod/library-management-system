import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import FormInput from '@/components/FormInput';
import FormError from '@/components/FormError';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import LoginWallpaper from '@/assets/bookshelf-wallpaper.avif';
import Logo from '@/assets/logo.webp';
import type { RegisterData } from '@/types/auth';

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;

interface RegisterFormData extends RegisterData {
  password_confirmation: string;
}

interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
}

function isAxiosError(err: unknown): err is AxiosError {
  return err !== null && typeof err === 'object' && 'response' in err;
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<RegisterFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  const password = watch('password');

  const handleRegisterSuccess = (response: { user?: { name?: string } }) => {
    const firstName = response?.user?.name?.split(' ')[0] || 'User';
    showToast(`Welcome, ${firstName}! Your account has been created.`, 'success');
    // Navigate to dashboard after successful registration
    navigate('/dashboard', { replace: true });
  };

  const handleRegisterError = (err: unknown) => {
    if (!isAxiosError(err)) {
      showToast('An error occurred. Please try again.', 'error');
      return;
    }

    const status = err.response?.status;
    const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
    const validationErrors = err.response?.data?.errors;

    if (status === 422) {
      // Handle validation errors
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0] || errorMessage;
        setError(firstError);
      } else {
        setError(errorMessage);
      }
    } else {
      showToast(errorMessage, 'error');
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setLoading(true);

    try {
      // Prepare data for API (exclude password_confirmation, set default role)
      const registerData: RegisterData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'User',
      };

      const response = await registerUser(registerData);
      handleRegisterSuccess(response);
    } catch (err) {
      handleRegisterError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" data-testid="register-page">
      {/* Left side - Wallpaper */}
      <div className="hidden lg:block lg:flex-1 relative">
        <img
          src={LoginWallpaper}
          alt="Library bookshelf"
          className="h-full w-full object-cover"
          data-testid="register-wallpaper"
        />
        <div className="absolute inset-0 bg-indigo-900/20" />
      </div>

      {/* Right side - Register Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900 overflow-y-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            alt="Library Management Service"
            src={Logo}
            className="mx-auto h-32 w-auto"
            data-testid="register-logo"
          />
          <h2
            className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white"
            data-testid="register-title"
          >
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          {error && <FormError message={error} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="register-form">
            <FormInput
              id="name"
              label="Full name"
              type="text"
              autoComplete="name"
              disabled={loading}
              error={errors.name}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: MIN_NAME_LENGTH,
                  message: `Name must be at least ${MIN_NAME_LENGTH} characters`,
                },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: 'Name can only contain letters and spaces',
                },
              })}
            />

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
              autoComplete="new-password"
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

            <FormInput
              id="password_confirmation"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              disabled={loading}
              error={errors.password_confirmation}
              {...register('password_confirmation', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />

            <div>
              <button
                type="submit"
                disabled={loading || !isValid || !isDirty}
                data-testid="register-submit-button"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

