import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function Loading({ size = 'md', fullScreen = true }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <ArrowPathIcon
      className={`${sizeClasses[size]} animate-spin text-indigo-500`}
      data-testid="loading-spinner"
    />
  );

  if (fullScreen) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-900"
        data-testid="loading-container"
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
