import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import Loading from '../../components/Loading';

describe('Loading', () => {
  it('should render spinner', () => {
    render(<Loading />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should render full screen by default', () => {
    render(<Loading />);

    const container = screen.getByTestId('loading-container');
    expect(container).toBeInTheDocument();
    const classAttr = container.getAttribute('class') || '';
    expect(classAttr).toContain('min-h-screen');
  });

  it('should render inline when fullScreen is false', () => {
    render(<Loading fullScreen={false} />);

    expect(screen.queryByTestId('loading-container')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should render small size', () => {
    render(<Loading size="sm" fullScreen={false} />);

    const spinner = screen.getByTestId('loading-spinner');
    const classAttr = spinner.getAttribute('class') || '';
    expect(classAttr).toContain('h-6');
    expect(classAttr).toContain('w-6');
  });

  it('should render medium size by default', () => {
    render(<Loading fullScreen={false} />);

    const spinner = screen.getByTestId('loading-spinner');
    const classAttr = spinner.getAttribute('class') || '';
    expect(classAttr).toContain('h-12');
    expect(classAttr).toContain('w-12');
  });

  it('should render large size', () => {
    render(<Loading size="lg" fullScreen={false} />);

    const spinner = screen.getByTestId('loading-spinner');
    const classAttr = spinner.getAttribute('class') || '';
    expect(classAttr).toContain('h-16');
    expect(classAttr).toContain('w-16');
  });

  it('should apply animation class', () => {
    render(<Loading fullScreen={false} />);

    const spinner = screen.getByTestId('loading-spinner');
    // Check class attribute which contains all the classes
    const classAttr = spinner.getAttribute('class') || '';
    expect(classAttr).toContain('animate-spin');
  });
});
