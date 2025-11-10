import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import FormError from '../../components/FormError';

describe('FormError', () => {
  it('should render error message', () => {
    render(<FormError message="This is an error message" />);

    expect(screen.getByTestId('form-error')).toHaveTextContent('This is an error message');
  });

  it('should apply correct styling classes', () => {
    render(<FormError message="Error" />);

    const errorElement = screen.getByTestId('form-error');
    expect(errorElement.className).toContain('bg-red-500/10');
    expect(errorElement.className).toContain('text-red-400');
    expect(errorElement.className).toContain('border-red-500/20');
  });

  it('should render different error messages', () => {
    const { rerender } = render(<FormError message="First error" />);
    expect(screen.getByTestId('form-error')).toHaveTextContent('First error');

    rerender(<FormError message="Second error" />);
    expect(screen.getByTestId('form-error')).toHaveTextContent('Second error');
  });
});
