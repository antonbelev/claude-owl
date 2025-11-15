import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/renderer/components/common/EmptyState';
import { FileX } from 'lucide-react';

describe('EmptyState', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState
        icon={FileX}
        title="No files found"
        description="There are no files in this directory"
      />
    );

    expect(screen.getByText('No files found')).toBeInTheDocument();
    expect(screen.getByText('There are no files in this directory')).toBeInTheDocument();
  });

  it('should render the provided icon', () => {
    const { container } = render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
      />
    );

    // Check that an SVG icon is present
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('should render without action button by default', () => {
    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
      />
    );

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should render with action button when provided', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
        action={{
          label: 'Add Item',
          onClick: mockOnClick,
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('should call action onClick when button is clicked', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
        action={{
          label: 'Create New',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create New' });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render action button with default variant', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
        action={{
          label: 'Add',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveClass('bg-primary-600'); // default variant
  });

  it('should render action button with secondary variant', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
        action={{
          label: 'Add',
          onClick: mockOnClick,
          variant: 'secondary',
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveClass('bg-neutral-200'); // secondary variant
  });

  it('should render action button with outline variant', () => {
    const mockOnClick = vi.fn();

    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
        action={{
          label: 'Add',
          onClick: mockOnClick,
          variant: 'outline',
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveClass('border-neutral-200'); // outline variant
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
        className="custom-empty-state"
      />
    );

    expect(container.firstChild).toHaveClass('custom-empty-state');
  });

  it('should render with correct default styling', () => {
    const { container } = render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="Nothing to show"
      />
    );

    expect(container.firstChild).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'py-12',
      'text-center'
    );
  });

  it('should render title with correct styling', () => {
    render(
      <EmptyState
        icon={FileX}
        title="No Results"
        description="Try adjusting your filters"
      />
    );

    const title = screen.getByText('No Results');
    expect(title).toHaveClass('mb-2', 'text-lg', 'font-medium');
  });

  it('should render description with correct styling', () => {
    render(
      <EmptyState
        icon={FileX}
        title="Empty"
        description="No data available"
      />
    );

    const description = screen.getByText('No data available');
    expect(description).toHaveClass('mb-6', 'max-w-md', 'text-sm', 'text-neutral-600');
  });
});
