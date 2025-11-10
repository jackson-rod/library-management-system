import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../utils/test-utils';
import ToastItem from '../../components/ToastItem';
import type { Toast } from '../../types/toast';

describe('ToastItem', () => {
  const mockOnRemove = vi.fn();
  
  beforeEach(() => {
    vi.useFakeTimers();
    mockOnRemove.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createToast = (type: Toast['type'], message = 'Test message', duration = 5000): Toast => ({
    id: 'test-toast-id',
    message,
    type,
    duration,
  });

  it('should render success toast with correct styling', () => {
    const toast = createToast('success', 'Operation successful');
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    const toastElement = screen.getByTestId('toast-success');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement.className).toContain('bg-green-500/10');
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should render error toast with correct styling', () => {
    const toast = createToast('error', 'Something went wrong');
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    const toastElement = screen.getByTestId('toast-error');
    expect(toastElement.className).toContain('bg-red-500/10');
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render warning toast with correct styling', () => {
    const toast = createToast('warning', 'Warning message');
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    const toastElement = screen.getByTestId('toast-warning');
    expect(toastElement.className).toContain('bg-yellow-500/10');
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should render info toast with correct styling', () => {
    const toast = createToast('info', 'Info message');
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    const toastElement = screen.getByTestId('toast-info');
    expect(toastElement.className).toContain('bg-blue-500/10');
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should call onRemove when close button is clicked', () => {
    const toast = createToast('success');
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    const closeButton = screen.getByTestId('toast-close-button');
    fireEvent.click(closeButton);

    expect(mockOnRemove).toHaveBeenCalledWith('test-toast-id');
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after duration', () => {
    const toast = createToast('success', 'Auto dismiss', 3000);
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    expect(mockOnRemove).not.toHaveBeenCalled();

    // Fast-forward time to trigger the timer
    vi.advanceTimersByTime(3000);

    expect(mockOnRemove).toHaveBeenCalledWith('test-toast-id');
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it('should not auto-dismiss when duration is 0', () => {
    const toast = createToast('success', 'No auto dismiss', 0);
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    vi.advanceTimersByTime(10000);

    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('should clean up timer on unmount', () => {
    const onRemove = vi.fn();
    const toast = createToast('success');
    const { unmount } = render(<ToastItem toast={toast} onRemove={onRemove} />);

    // Unmount before timer completes
    unmount();
    
    // Advance time to when timer would have fired
    vi.advanceTimersByTime(5000);

    // onRemove should not be called because timer was cleaned up
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('should have correct accessibility attributes', () => {
    const toast = createToast('success');
    render(<ToastItem toast={toast} onRemove={mockOnRemove} />);

    const toastElement = screen.getByRole('alert');
    expect(toastElement).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
  });
});
