import type { FormErrorProps } from '../types/form';

export default function FormError({ message }: FormErrorProps) {
  return (
    <div 
      className="mb-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20"
      data-testid="form-error"
    >
      {message}
    </div>
  );
}
