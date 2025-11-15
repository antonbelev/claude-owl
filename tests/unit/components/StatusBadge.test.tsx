import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/renderer/components/common/StatusBadge';

describe('StatusBadge', () => {
  it('should render with success status', () => {
    render(<StatusBadge status="success">Success message</StatusBadge>);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    // StatusBadge uses shadcn/ui Badge component with variants
    const badge = screen.getByText('Success message').parentElement;
    expect(badge).toBeInTheDocument();
  });

  it('should render with error status', () => {
    render(<StatusBadge status="error">Error message</StatusBadge>);

    expect(screen.getByText('Error message')).toBeInTheDocument();
    // StatusBadge uses shadcn/ui Badge component with destructive variant
    const badge = screen.getByText('Error message').parentElement;
    expect(badge).toBeInTheDocument();
  });

  it('should render with warning status', () => {
    render(<StatusBadge status="warning">Warning message</StatusBadge>);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
    // StatusBadge uses shadcn/ui Badge component with warning variant
    const badge = screen.getByText('Warning message').parentElement;
    expect(badge).toBeInTheDocument();
  });

  it('should render with info status', () => {
    render(<StatusBadge status="info">Info message</StatusBadge>);

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should show icon by default', () => {
    const { container } = render(<StatusBadge status="success">With icon</StatusBadge>);

    // Check that an SVG icon is present
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(
      <StatusBadge status="success" showIcon={false}>
        Without icon
      </StatusBadge>
    );

    expect(screen.getByText('Without icon')).toBeInTheDocument();
    // Check that no SVG icon is present
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <StatusBadge status="success" className="custom-class">
        Custom styled
      </StatusBadge>
    );

    const badge = screen.getByText('Custom styled').parentElement;
    expect(badge).toHaveClass('custom-class');
  });

  it('should render all status variants correctly', () => {
    const statuses: Array<'success' | 'error' | 'warning' | 'info'> = [
      'success',
      'error',
      'warning',
      'info',
    ];

    statuses.forEach(status => {
      const { unmount } = render(<StatusBadge status={status}>{status} status</StatusBadge>);

      expect(screen.getByText(`${status} status`)).toBeInTheDocument();
      unmount();
    });
  });
});
