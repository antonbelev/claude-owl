import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewCard } from '@/renderer/components/year-review/ReviewCard';

describe('ReviewCard', () => {
  const defaultProps = {
    children: <div data-testid="card-content">Test Content</div>,
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    currentIndex: 0,
    totalCards: 5,
  };

  it('renders children content', () => {
    render(<ReviewCard {...defaultProps} />);

    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows correct progress indicator', () => {
    render(<ReviewCard {...defaultProps} currentIndex={2} totalCards={5} />);

    // Should have 5 progress dots
    const dots = document.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(5);
  });

  it('calls onNext when Next button is clicked', () => {
    const onNext = vi.fn();
    render(<ReviewCard {...defaultProps} onNext={onNext} />);

    fireEvent.click(screen.getByText('Next'));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious when Back button is clicked', () => {
    const onPrevious = vi.fn();
    render(<ReviewCard {...defaultProps} currentIndex={2} onPrevious={onPrevious} />);

    fireEvent.click(screen.getByText('Back'));

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('disables Back button on first card', () => {
    render(<ReviewCard {...defaultProps} currentIndex={0} />);

    const backButton = screen.getByText('Back');
    expect(backButton).toHaveClass('opacity-0');
    expect(backButton).toBeDisabled();
  });

  it('shows Back button on subsequent cards', () => {
    render(<ReviewCard {...defaultProps} currentIndex={1} />);

    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('shows Finish on last card', () => {
    render(<ReviewCard {...defaultProps} currentIndex={4} totalCards={5} />);

    expect(screen.getByText('Finish')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation with ArrowRight', () => {
    const onNext = vi.fn();
    render(<ReviewCard {...defaultProps} onNext={onNext} />);

    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with ArrowLeft', () => {
    const onPrevious = vi.fn();
    render(<ReviewCard {...defaultProps} currentIndex={2} onPrevious={onPrevious} />);

    fireEvent.keyDown(document, { key: 'ArrowLeft' });

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('does not call onPrevious with ArrowLeft on first card', () => {
    const onPrevious = vi.fn();
    render(<ReviewCard {...defaultProps} currentIndex={0} onPrevious={onPrevious} />);

    fireEvent.keyDown(document, { key: 'ArrowLeft' });

    expect(onPrevious).not.toHaveBeenCalled();
  });
});
