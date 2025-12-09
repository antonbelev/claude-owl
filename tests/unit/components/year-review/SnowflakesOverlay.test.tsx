import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SnowflakesOverlay } from '@/renderer/components/year-review/SnowflakesOverlay';

describe('SnowflakesOverlay', () => {
  it('renders with default count', () => {
    render(<SnowflakesOverlay />);

    // Check that the container exists
    const container = document.querySelector('.pointer-events-none.fixed');
    expect(container).toBeInTheDocument();
  });

  it('renders correct number of snowflakes', () => {
    const count = 10;
    render(<SnowflakesOverlay count={count} />);

    // Count snowflake elements (they have animate-snowfall class)
    const snowflakes = document.querySelectorAll('.animate-snowfall');
    expect(snowflakes.length).toBe(count);
  });

  it('renders zero snowflakes when count is 0', () => {
    render(<SnowflakesOverlay count={0} />);

    const snowflakes = document.querySelectorAll('.animate-snowfall');
    expect(snowflakes.length).toBe(0);
  });

  it('has correct container styles', () => {
    render(<SnowflakesOverlay />);

    const container = document.querySelector('.pointer-events-none.fixed.inset-0');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('overflow-hidden');
    expect(container).toHaveClass('z-50');
  });
});
