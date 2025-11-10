import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils/test-utils';
import ToastContainer from '../../components/ToastContainer';
import type { Toast } from '../../types/toast';

describe('ToastContainer', () => {
  const mockOnRemove = vi.fn();

  const createToast = (id: string, type: Toast['type'], message: string): Toast => ({
    id,
    message,
    type,
    duration: 5000,
  });

  it('should render nothing when toasts array is empty', () => {
    render(<ToastContainer toasts={[]} onRemove={mockOnRemove} />);

    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('should render toast container with single toast', () => {
    const toasts = [createToast('1', 'success', 'Success message')];
    render(<ToastContainer toasts={toasts} onRemove={mockOnRemove} />);

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      createToast('1', 'success', 'First message'),
      createToast('2', 'error', 'Second message'),
      createToast('3', 'warning', 'Third message'),
    ];
    render(<ToastContainer toasts={toasts} onRemove={mockOnRemove} />);

    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByText('Third message')).toBeInTheDocument();
  });

  it('should render different toast types correctly', () => {
    const toasts = [
      createToast('1', 'success', 'Success'),
      createToast('2', 'error', 'Error'),
      createToast('3', 'warning', 'Warning'),
      createToast('4', 'info', 'Info'),
    ];
    render(<ToastContainer toasts={toasts} onRemove={mockOnRemove} />);

    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    expect(screen.getByTestId('toast-warning')).toBeInTheDocument();
    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
  });

  it('should position container in top-right corner', () => {
    const toasts = [createToast('1', 'info', 'Message')];
    render(<ToastContainer toasts={toasts} onRemove={mockOnRemove} />);

    const container = screen.getByTestId('toast-container');
    expect(container.className).toContain('fixed');
    expect(container.className).toContain('top-4');
    expect(container.className).toContain('right-4');
  });
});
