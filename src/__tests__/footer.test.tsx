import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from '../dashboard/components/Footer';

describe('Footer', () => {
  it('links to the bare feedback form without local runtime metadata', () => {
    render(<Footer tabCount={42} />);

    const feedback = screen.getByRole('link', { name: 'Give feedback' });
    const href = feedback.getAttribute('href') ?? '';

    expect(href).toBe('https://docs.google.com/forms/d/e/1FAIpQLSfXJ6osy2J84TLpyLE-DYA-NcWMcjRAZbcTHBOZV9RnQ7WEfA/viewform');
    expect(href).not.toContain('entry.');
    expect(href).not.toContain('42');
  });
});
