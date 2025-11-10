import { forwardRef } from 'react';
import type { FormInputProps } from '../types/form';

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, id, ...props }, ref) => {
    return (
      <div data-testid={`form-input-wrapper-${id}`}>
        <label
          htmlFor={id}
          className="block text-sm/6 font-medium text-gray-100"
          data-testid={`form-input-label-${id}`}
        >
          {label}
        </label>
        <div className="mt-2">
          <input
            id={id}
            ref={ref}
            data-testid={`form-input-${id}`}
            className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? 'outline-red-500/50 focus:outline-red-500'
                : 'outline-white/10 focus:outline-indigo-500'
            }`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400" data-testid={`form-input-error-${id}`}>
            {error.message}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-400" data-testid={`form-input-helper-${id}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
