/**
 * Action state transition logic and validation
 */

import { ActionState } from '../types/domain';

/**
 * Valid state transitions for actions
 */
const STATE_TRANSITIONS: Record<ActionState, ActionState[]> = {
  planned: ['in-progress', 'deferred'],
  'in-progress': ['completed', 'deferred', 'planned'],
  completed: ['rolled-over'],
  deferred: ['planned'],
  'rolled-over': [], // Terminal state for the original action
};

/**
 * Custom error for invalid state transitions
 */
export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly fromState: ActionState,
    public readonly toState: ActionState
  ) {
    super(
      `Invalid state transition from '${fromState}' to '${toState}'. ` +
        `Valid transitions from '${fromState}': ${STATE_TRANSITIONS[fromState].join(', ') || 'none'}`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Validates if a state transition is valid
 *
 * @param fromState - The current state
 * @param toState - The desired new state
 * @returns true if the transition is valid
 */
export function isValidStateTransition(fromState: ActionState, toState: ActionState): boolean {
  return STATE_TRANSITIONS[fromState].includes(toState);
}

/**
 * Validates and performs a state transition
 *
 * @param fromState - The current state
 * @param toState - The desired new state
 * @throws {InvalidStateTransitionError} If the transition is invalid
 */
export function validateStateTransition(fromState: ActionState, toState: ActionState): void {
  if (!isValidStateTransition(fromState, toState)) {
    throw new InvalidStateTransitionError(fromState, toState);
  }
}

/**
 * Gets valid next states for a given state
 *
 * @param currentState - The current state
 * @returns Array of valid next states
 */
export function getValidNextStates(currentState: ActionState): ActionState[] {
  return STATE_TRANSITIONS[currentState];
}

/**
 * Checks if a state is terminal (no further transitions allowed)
 *
 * @param state - The state to check
 * @returns true if the state is terminal
 */
export function isTerminalState(state: ActionState): boolean {
  return STATE_TRANSITIONS[state].length === 0;
}
