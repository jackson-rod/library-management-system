import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { useForm } from 'react-hook-form';
import FormInput from '../../components/FormInput';

// Wrapper component to use FormInput with react-hook-form
function FormInputWrapper() {
  const {
    register,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
  });

  return (
    <FormInput
      id="email"
      label="Email Address"
      type="email"
      error={errors.email}
      {...register('email', { required: 'Email is required' })}
    />
  );
}

describe('FormInput', () => {
  it('should render input with label', () => {
    render(<FormInputWrapper />);

    expect(screen.getByTestId('form-input-label-email')).toHaveTextContent('Email Address');
    expect(screen.getByTestId('form-input-email')).toBeInTheDocument();
  });

  it('should render with correct id and type', () => {
    render(<FormInputWrapper />);

    const input = screen.getByTestId('form-input-email');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should apply disabled state correctly', () => {
    function DisabledWrapper() {
      const { register } = useForm();
      return (
        <FormInput
          id="disabled-input"
          label="Disabled Field"
          disabled
          {...register('disabled-input')}
        />
      );
    }

    render(<DisabledWrapper />);

    const input = screen.getByTestId('form-input-disabled-input');
    expect(input).toBeDisabled();
  });

  it('should display error message when error prop is provided', () => {
    function ErrorWrapper() {
      const { register } = useForm();
      const error = { message: 'This field is required', type: 'required' };

      return (
        <FormInput
          id="test-input"
          label="Test Field"
          error={error}
          {...register('test-input')}
        />
      );
    }

    render(<ErrorWrapper />);

    expect(screen.getByTestId('form-input-error-test-input')).toHaveTextContent('This field is required');
  });

  it('should display helper text when provided and no error', () => {
    function HelperWrapper() {
      const { register } = useForm();

      return (
        <FormInput
          id="helper-input"
          label="Helper Field"
          helperText="This is helpful information"
          {...register('helper-input')}
        />
      );
    }

    render(<HelperWrapper />);

    expect(screen.getByTestId('form-input-helper-helper-input')).toHaveTextContent('This is helpful information');
  });

  it('should not display helper text when error is present', () => {
    function ErrorWithHelperWrapper() {
      const { register } = useForm();
      const error = { message: 'Error message', type: 'required' };

      return (
        <FormInput
          id="error-input"
          label="Error Field"
          helperText="This should not appear"
          error={error}
          {...register('error-input')}
        />
      );
    }

    render(<ErrorWithHelperWrapper />);

    expect(screen.queryByTestId('form-input-helper-error-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('form-input-error-error-input')).toBeInTheDocument();
  });

  it('should apply error styling when error prop is provided', () => {
    function StyledErrorWrapper() {
      const { register } = useForm();
      const error = { message: 'Error', type: 'required' };

      return (
        <FormInput
          id="styled-input"
          label="Styled Field"
          error={error}
          {...register('styled-input')}
        />
      );
    }

    render(<StyledErrorWrapper />);

    const input = screen.getByTestId('form-input-styled-input');
    expect(input.className).toContain('outline-red-500');
  });

  it('should forward ref correctly', () => {
    const refCallback = vi.fn();

    function RefWrapper() {
      const { register } = useForm();
      const { ref: hookRef, ...rest } = register('ref-input');

      return (
        <FormInput
          id="ref-input"
          label="Ref Field"
          ref={(el) => {
            hookRef(el);
            refCallback(el);
          }}
          {...rest}
        />
      );
    }

    render(<RefWrapper />);

    expect(refCallback).toHaveBeenCalled();
  });
});
