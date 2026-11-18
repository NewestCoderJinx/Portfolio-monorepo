import { describe, expect, it } from 'vitest';
import { adminInputProblems } from './create-admin';

describe('adminInputProblems', () => {
  it('accepts a valid email and password', () => {
    expect(adminInputProblems('owner@example.com', 'correct horse')).toEqual([]);
  });

  it('rejects a bad email and a short password', () => {
    expect(adminInputProblems('not-an-email', 'short')).toEqual([
      'Give a valid email address.',
      'The password must be at least 8 characters.',
    ]);
  });

  it('rejects passwords bcrypt would cut short', () => {
    expect(adminInputProblems('owner@example.com', 'é'.repeat(40))).toEqual(['The password must be at most 72 bytes.']);
  });
});
