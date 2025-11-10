import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider } from '../../context/ToastProvider';
import { useToast } from '../../hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    // Reset any timers if needed
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(result.current.toasts).toEqual([]);
  });

  it('should add a success toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Success message', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Success message');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].duration).toBe(5000);
  });

  it('should add an error toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Error message', 'error');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Error message');
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('should add a warning toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Warning message', 'warning');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('should add an info toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Info message', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('should add multiple toasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('First message', 'success');
      result.current.showToast('Second message', 'error');
      result.current.showToast('Third message', 'warning');
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe('First message');
    expect(result.current.toasts[1].message).toBe('Second message');
    expect(result.current.toasts[2].message).toBe('Third message');
  });

  it('should assign unique IDs to toasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('First', 'success');
      result.current.showToast('Second', 'success');
    });

    const ids = result.current.toasts.map((toast) => toast.id);
    expect(new Set(ids).size).toBe(2); // All IDs should be unique
  });

  it('should remove a toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should remove specific toast from multiple toasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('First', 'success');
      result.current.showToast('Second', 'error');
      result.current.showToast('Third', 'warning');
    });

    const secondToastId = result.current.toasts[1].id;

    act(() => {
      result.current.removeToast(secondToastId);
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].message).toBe('First');
    expect(result.current.toasts[1].message).toBe('Third');
  });

  it('should use custom duration when provided', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Custom duration', 'info', 3000);
    });

    expect(result.current.toasts[0].duration).toBe(3000);
  });

  it('should use default duration when not provided', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showToast('Default duration', 'info');
    });

    expect(result.current.toasts[0].duration).toBe(5000);
  });
});
