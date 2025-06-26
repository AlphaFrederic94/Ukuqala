/**
 * Chess AI - Algorithms for computer chess play at different difficulty levels
 */

import { GameState, Move, getAllValidMoves, makeMove } from './engine';
import { evaluatePosition } from './evaluation';
import { getOpeningMove } from './openings';

// Difficulty settings
export interface DifficultySettings {
  searchDepth: number;
  useOpeningBook: boolean;
  randomizeMoves: boolean;
  randomChance: number;
  evaluationNoise: number;
  usePruning: boolean;
}

// Predefined difficulty levels
export const DIFFICULTY_LEVELS: Record<string, DifficultySettings> = {
  easy: {
    searchDepth: 2,
    useOpeningBook: false,
    randomizeMoves: true,
    randomChance: 0.3,
    evaluationNoise: 100,
    usePruning: false
  },
  medium: {
    searchDepth: 3,
    useOpeningBook: true,
    randomizeMoves: true,
    randomChance: 0.15,
    evaluationNoise: 50,
    usePruning: true
  },
  hard: {
    searchDepth: 4,
    useOpeningBook: true,
    randomizeMoves: false,
    randomChance: 0,
    evaluationNoise: 0,
    usePruning: true
  }
};

/**
 * Find the best move for the current player
 */
export function findBestMove(state: GameState, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Move | null {
  const settings = DIFFICULTY_LEVELS[difficulty];

  // Try to get a move from the opening book
  if (settings.useOpeningBook) {
    const openingMove = getOpeningMove(state);
    if (openingMove) return openingMove;
  }

  // Get all valid moves
  const validMoves = getAllValidMoves(state);

  if (validMoves.length === 0) return null;

  // For easy difficulty, sometimes make a random move
  if (settings.randomizeMoves && Math.random() < settings.randomChance) {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  // Evaluate each move using minimax with alpha-beta pruning
  let bestMove: Move | null = null;
  let bestScore = state.currentPlayer === 'white' ? -Infinity : Infinity;

  for (const move of validMoves) {
    // Make the move
    const newState = makeMove(state, move);

    // Evaluate the position
    let score: number;

    if (settings.usePruning) {
      score = minimax(newState, settings.searchDepth - 1, -Infinity, Infinity, state.currentPlayer === 'white' ? false : true);
    } else {
      score = minimaxWithoutPruning(newState, settings.searchDepth - 1, state.currentPlayer === 'white' ? false : true);
    }

    // Add noise to the evaluation for lower difficulties
    if (settings.evaluationNoise > 0) {
      score += (Math.random() * 2 - 1) * settings.evaluationNoise;
    }

    // Update best move
    if ((state.currentPlayer === 'white' && score > bestScore) ||
        (state.currentPlayer === 'black' && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(state: GameState, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {
  // Base case: leaf node or terminal position
  if (depth === 0 || state.checkmate || state.stalemate) {
    return evaluatePosition(state);
  }

  const validMoves = getAllValidMoves(state);

  if (maximizingPlayer) {
    let maxEval = -Infinity;

    for (const move of validMoves) {
      const newState = makeMove(state, move);
      const evalScore = minimax(newState, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);

      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const move of validMoves) {
      const newState = makeMove(state, move);
      const evalScore = minimax(newState, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);

      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }

    return minEval;
  }
}

/**
 * Minimax algorithm without pruning (for easier difficulty)
 */
function minimaxWithoutPruning(state: GameState, depth: number, maximizingPlayer: boolean): number {
  // Base case: leaf node or terminal position
  if (depth === 0 || state.checkmate || state.stalemate) {
    return evaluatePosition(state);
  }

  const validMoves = getAllValidMoves(state);

  if (maximizingPlayer) {
    let maxEval = -Infinity;

    for (const move of validMoves) {
      const newState = makeMove(state, move);
      const evalScore = minimaxWithoutPruning(newState, depth - 1, false);
      maxEval = Math.max(maxEval, evalScore);
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const move of validMoves) {
      const newState = makeMove(state, move);
      const evalScore = minimaxWithoutPruning(newState, depth - 1, true);
      minEval = Math.min(minEval, evalScore);
    }

    return minEval;
  }
}

/**
 * Make a computer move based on the current game state and difficulty
 */
export function makeComputerMove(state: GameState, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameState {
  const bestMove = findBestMove(state, difficulty);

  if (bestMove) {
    return makeMove(state, bestMove);
  }

  return state;
}
