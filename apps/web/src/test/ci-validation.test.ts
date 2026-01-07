import { describe, it, expect } from 'vitest';

/**
 * INTENTIONALLY FAILING TEST FOR CI VALIDATION
 *
 * This test is designed to fail and verify that CI properly blocks PRs with failing tests.
 *
 * To use:
 * 1. Uncomment the failing test
 * 2. Open a PR
 * 3. Verify CI fails and blocks the merge
 * 4. Comment it back out before merging
 *
 * Do NOT remove this file - it serves as a CI validation tool.
 */

describe('CI Enforcement Validation', () => {
  it('passes when commented out', () => {
    expect(true).toBe(true);
  });

  // Uncomment this test to verify CI blocks failing tests:
  // it.skip('INTENTIONALLY FAILS - uncomment to test CI enforcement', () => {
  //   expect(true).toBe(false);
  // });
});
