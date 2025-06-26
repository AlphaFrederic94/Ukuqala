/**
 * Chess module exports
 */

export * from './engine';
export * from './evaluation';
export * from './ai';
export * from './openings';

// Re-export the main functions for convenience
import { createInitialGameState, makeMove, getValidMovesForPiece } from './engine';
import { evaluatePosition } from './evaluation';
import { makeComputerMove, findBestMove, DIFFICULTY_LEVELS } from './ai';
import { getOpeningMove } from './openings';

export {
  createInitialGameState,
  makeMove,
  getValidMovesForPiece,
  evaluatePosition,
  makeComputerMove,
  findBestMove,
  DIFFICULTY_LEVELS,
  getOpeningMove
};
