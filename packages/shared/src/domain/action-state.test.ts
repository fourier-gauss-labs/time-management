/**
 * Tests for action state transitions
 */

import { describe, it, expect } from 'vitest';
import {
  isValidStateTransition,
  validateStateTransition,
  getValidNextStates,
  isTerminalState,
  InvalidStateTransitionError,
} from '../domain/action-state';

describe('isValidStateTransition', () => {
  it('should allow planned -> in-progress', () => {
    expect(isValidStateTransition('planned', 'in-progress')).toBe(true);
  });

  it('should allow planned -> deferred', () => {
    expect(isValidStateTransition('planned', 'deferred')).toBe(true);
  });

  it('should not allow planned -> completed', () => {
    expect(isValidStateTransition('planned', 'completed')).toBe(false);
  });

  it('should allow in-progress -> completed', () => {
    expect(isValidStateTransition('in-progress', 'completed')).toBe(true);
  });

  it('should allow in-progress -> deferred', () => {
    expect(isValidStateTransition('in-progress', 'deferred')).toBe(true);
  });

  it('should allow in-progress -> planned', () => {
    expect(isValidStateTransition('in-progress', 'planned')).toBe(true);
  });

  it('should allow completed -> rolled-over', () => {
    expect(isValidStateTransition('completed', 'rolled-over')).toBe(true);
  });

  it('should not allow completed -> planned', () => {
    expect(isValidStateTransition('completed', 'planned')).toBe(false);
  });

  it('should allow deferred -> planned', () => {
    expect(isValidStateTransition('deferred', 'planned')).toBe(true);
  });

  it('should not allow deferred -> completed', () => {
    expect(isValidStateTransition('deferred', 'completed')).toBe(false);
  });

  it('should not allow any transitions from rolled-over', () => {
    expect(isValidStateTransition('rolled-over', 'planned')).toBe(false);
    expect(isValidStateTransition('rolled-over', 'in-progress')).toBe(false);
    expect(isValidStateTransition('rolled-over', 'completed')).toBe(false);
  });
});

describe('validateStateTransition', () => {
  it('should not throw for valid transitions', () => {
    expect(() => validateStateTransition('planned', 'in-progress')).not.toThrow();
    expect(() => validateStateTransition('in-progress', 'completed')).not.toThrow();
    expect(() => validateStateTransition('completed', 'rolled-over')).not.toThrow();
  });

  it('should throw InvalidStateTransitionError for invalid transitions', () => {
    expect(() => validateStateTransition('planned', 'completed')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('should provide helpful error message', () => {
    try {
      validateStateTransition('planned', 'completed');
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStateTransitionError);
      expect((error as Error).message).toContain('planned');
      expect((error as Error).message).toContain('completed');
      expect((error as Error).message).toContain('in-progress');
      expect((error as Error).message).toContain('deferred');
    }
  });

  it('should include fromState and toState in error', () => {
    try {
      validateStateTransition('completed', 'planned');
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStateTransitionError);
      const err = error as InvalidStateTransitionError;
      expect(err.fromState).toBe('completed');
      expect(err.toState).toBe('planned');
    }
  });
});

describe('getValidNextStates', () => {
  it('should return correct next states for planned', () => {
    const nextStates = getValidNextStates('planned');
    expect(nextStates).toEqual(['in-progress', 'deferred']);
  });

  it('should return correct next states for in-progress', () => {
    const nextStates = getValidNextStates('in-progress');
    expect(nextStates).toEqual(['completed', 'deferred', 'planned']);
  });

  it('should return correct next states for completed', () => {
    const nextStates = getValidNextStates('completed');
    expect(nextStates).toEqual(['rolled-over']);
  });

  it('should return correct next states for deferred', () => {
    const nextStates = getValidNextStates('deferred');
    expect(nextStates).toEqual(['planned']);
  });

  it('should return empty array for rolled-over', () => {
    const nextStates = getValidNextStates('rolled-over');
    expect(nextStates).toEqual([]);
  });
});

describe('isTerminalState', () => {
  it('should return false for non-terminal states', () => {
    expect(isTerminalState('planned')).toBe(false);
    expect(isTerminalState('in-progress')).toBe(false);
    expect(isTerminalState('completed')).toBe(false);
    expect(isTerminalState('deferred')).toBe(false);
  });

  it('should return true for rolled-over', () => {
    expect(isTerminalState('rolled-over')).toBe(true);
  });
});
