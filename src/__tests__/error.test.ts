import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../utils/error';

describe('getErrorMessage', () => {
  it('returns message from Error object', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns fallback for non-Error values', () => {
    expect(getErrorMessage('boom')).toBe('Unexpected error');
    expect(getErrorMessage('boom', 'failed')).toBe('failed');
    expect(getErrorMessage(null, 'failed')).toBe('failed');
  });
});
