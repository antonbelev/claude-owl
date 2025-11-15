import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/renderer/components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default size (md)', () => {
    const { container } = render(<LoadingSpinner />);

    // Check for the Loader2 icon
    const spinner = container.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8'); // md size
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-4', 'w-4'); // sm size
  });

  it('should render with medium size', () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8'); // md size
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-12', 'w-12'); // lg size
  });

  it('should render without text by default', () => {
    const { container } = render(<LoadingSpinner />);

    const text = container.querySelector('p');
    expect(text).not.toBeInTheDocument();
  });

  it('should render with text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should have animate-spin class', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LoadingSpinner className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should apply custom className to wrapper div', () => {
    const { container } = render(
      <LoadingSpinner className="my-custom-class" />
    );

    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('should render text with correct styling', () => {
    render(<LoadingSpinner text="Please wait..." />);

    const text = screen.getByText('Please wait...');
    expect(text).toHaveClass('text-sm', 'text-neutral-600');
  });
});
