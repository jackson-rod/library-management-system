import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  helperText?: string;
}

export interface FormErrorProps {
  message: string;
}
