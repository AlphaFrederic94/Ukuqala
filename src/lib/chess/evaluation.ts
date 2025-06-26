/**
 * Chess Evaluation - Functions for evaluating chess positions
 */

import { Board, GameState, PieceType, Position } from './engine';

// Piece values in centipawns
export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

// Piece-square tables for positional evaluation
// These tables encourage pieces to move to good squares
// Values are in centipawns and are from white's perspective
// For black, the tables are flipped

// Pawns are encouraged to advance and control the center
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

// Knights are encouraged to control the center and avoid the edges
const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50]
];

// Bishops are encouraged to control diagonals and avoid corners
const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20]
];

// Rooks are encouraged to control open files and the 7th rank
const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0]
];

// Queens combine aspects of rooks and bishops
const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20]
];

// Kings are encouraged to stay protected in the early/middle game
const KING_MIDDLE_GAME_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20]
];

// Kings are encouraged to be active in the endgame
const KING_END_GAME_TABLE = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50]
];

// Piece-square tables organized by piece type
export const PIECE_SQUARE_TABLES: Record<PieceType, number[][]> = {
  pawn: PAWN_TABLE,
  knight: KNIGHT_TABLE,
  bishop: BISHOP_TABLE,
  rook: ROOK_TABLE,
  queen: QUEEN_TABLE,
  king: KING_MIDDLE_GAME_TABLE
};

// Endgame piece-square tables
export const ENDGAME_PIECE_SQUARE_TABLES: Record<PieceType, number[][]> = {
  ...PIECE_SQUARE_TABLES,
  king: KING_END_GAME_TABLE
};

/**
 * Evaluate a chess position
 * Returns a score in centipawns from white's perspective
 * Positive score means white is winning, negative means black is winning
 */
export function evaluatePosition(state: GameState): number {
  const { board, checkmate, stalemate } = state;
  
  // Checkmate
  if (checkmate) {
    return state.currentPlayer === 'white' ? -10000 : 10000;
  }
  
  // Stalemate
  if (stalemate) {
    return 0;
  }
  
  // Material and positional evaluation
  let score = 0;
  
  // Count material and evaluate piece positions
  score += evaluateMaterial(board);
  score += evaluatePiecePositions(board, isEndgame(board));
  
  // Additional evaluation factors
  score += evaluatePawnStructure(board);
  score += evaluateMobility(state);
  score += evaluateKingSafety(state);
  
  return score;
}

/**
 * Evaluate material balance
 */
function evaluateMaterial(board: Board): number {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        score += piece.color === 'white' ? value : -value;
      }
    }
  }
  
  return score;
}

/**
 * Evaluate piece positions using piece-square tables
 */
function evaluatePiecePositions(board: Board, isEndgame: boolean): number {
  let score = 0;
  const tables = isEndgame ? ENDGAME_PIECE_SQUARE_TABLES : PIECE_SQUARE_TABLES;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece) {
        const table = tables[piece.type];
        
        if (piece.color === 'white') {
          score += table[row][col];
        } else {
          // Flip the table for black pieces
          score -= table[7 - row][col];
        }
      }
    }
  }
  
  return score;
}

/**
 * Evaluate pawn structure
 * - Doubled pawns (penalty)
 * - Isolated pawns (penalty)
 * - Passed pawns (bonus)
 */
function evaluatePawnStructure(board: Board): number {
  let score = 0;
  
  // Count pawns in each file
  const whitePawnsInFile = Array(8).fill(0);
  const blackPawnsInFile = Array(8).fill(0);
  
  // Track pawn positions
  const whitePawnPositions: Position[] = [];
  const blackPawnPositions: Position[] = [];
  
  // Collect pawn data
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece && piece.type === 'pawn') {
        if (piece.color === 'white') {
          whitePawnsInFile[col]++;
          whitePawnPositions.push([row, col]);
        } else {
          blackPawnsInFile[col]++;
          blackPawnPositions.push([row, col]);
        }
      }
    }
  }
  
  // Evaluate doubled pawns (penalty)
  for (let file = 0; file < 8; file++) {
    if (whitePawnsInFile[file] > 1) {
      score -= 20 * (whitePawnsInFile[file] - 1);
    }
    
    if (blackPawnsInFile[file] > 1) {
      score += 20 * (blackPawnsInFile[file] - 1);
    }
  }
  
  // Evaluate isolated pawns (penalty)
  for (let file = 0; file < 8; file++) {
    const isWhiteIsolated = whitePawnsInFile[file] > 0 && 
                           (file === 0 || whitePawnsInFile[file - 1] === 0) && 
                           (file === 7 || whitePawnsInFile[file + 1] === 0);
    
    const isBlackIsolated = blackPawnsInFile[file] > 0 && 
                           (file === 0 || blackPawnsInFile[file - 1] === 0) && 
                           (file === 7 || blackPawnsInFile[file + 1] === 0);
    
    if (isWhiteIsolated) {
      score -= 10 * whitePawnsInFile[file];
    }
    
    if (isBlackIsolated) {
      score += 10 * blackPawnsInFile[file];
    }
  }
  
  // Evaluate passed pawns (bonus)
  for (const [row, col] of whitePawnPositions) {
    let isPassed = true;
    
    // Check if there are any black pawns that can block or capture
    for (let r = row - 1; r >= 0; r--) {
      for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
        const piece = board[r][c];
        
        if (piece && piece.type === 'pawn' && piece.color === 'black') {
          isPassed = false;
          break;
        }
      }
      
      if (!isPassed) break;
    }
    
    if (isPassed) {
      // Bonus increases as the pawn advances
      score += 20 + (7 - row) * 10;
    }
  }
  
  for (const [row, col] of blackPawnPositions) {
    let isPassed = true;
    
    // Check if there are any white pawns that can block or capture
    for (let r = row + 1; r < 8; r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
        const piece = board[r][c];
        
        if (piece && piece.type === 'pawn' && piece.color === 'white') {
          isPassed = false;
          break;
        }
      }
      
      if (!isPassed) break;
    }
    
    if (isPassed) {
      // Bonus increases as the pawn advances
      score -= 20 + row * 10;
    }
  }
  
  return score;
}

/**
 * Evaluate piece mobility
 * More available moves = better position
 */
function evaluateMobility(state: GameState): number {
  // This is a simplified mobility evaluation
  // In a real chess engine, we would count legal moves for each piece
  
  // Save the current player
  const currentPlayer = state.currentPlayer;
  
  // Count white's moves
  state.currentPlayer = 'white';
  const whiteMoves = countLegalMoves(state);
  
  // Count black's moves
  state.currentPlayer = 'black';
  const blackMoves = countLegalMoves(state);
  
  // Restore the current player
  state.currentPlayer = currentPlayer;
  
  // Each legal move is worth about 5 centipawns
  return (whiteMoves - blackMoves) * 5;
}

/**
 * Count legal moves for the current player
 */
function countLegalMoves(state: GameState): number {
  let moveCount = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      
      if (piece && piece.color === state.currentPlayer) {
        // This is a simplified approach - in a real engine we would
        // use a more efficient move generation algorithm
        const validMoves = getPseudoLegalMoves(state, [row, col]);
        moveCount += validMoves.length;
      }
    }
  }
  
  return moveCount;
}

/**
 * Get pseudo-legal moves for a piece (not checking for check)
 */
function getPseudoLegalMoves(state: GameState, position: Position): Position[] {
  // This is a simplified version that doesn't check if moves put the king in check
  // In a real chess engine, we would use a more efficient algorithm
  
  const [row, col] = position;
  const piece = state.board[row][col];
  
  if (!piece || piece.color !== state.currentPlayer) return [];
  
  const moves: Position[] = [];
  
  // Simplified move generation based on piece type
  switch (piece.type) {
    case 'pawn':
      const direction = piece.color === 'white' ? -1 : 1;
      
      // Move forward one square
      if (row + direction >= 0 && row + direction < 8 && !state.board[row + direction][col]) {
        moves.push([row + direction, col]);
        
        // Move forward two squares on first move
        if (!piece.hasMoved && row + 2 * direction >= 0 && row + 2 * direction < 8 && 
            !state.board[row + 2 * direction][col]) {
          moves.push([row + 2 * direction, col]);
        }
      }
      
      // Capture diagonally
      for (const diagCol of [col - 1, col + 1]) {
        if (diagCol >= 0 && diagCol < 8 && row + direction >= 0 && row + direction < 8) {
          const targetPiece = state.board[row + direction][diagCol];
          
          if (targetPiece && targetPiece.color !== piece.color) {
            moves.push([row + direction, diagCol]);
          }
          
          // En passant
          if (state.enPassantTarget && 
              state.enPassantTarget[0] === row + direction && 
              state.enPassantTarget[1] === diagCol) {
            moves.push([row + direction, diagCol]);
          }
        }
      }
      break;
      
    case 'knight':
      const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      
      for (const [dRow, dCol] of knightMoves) {
        const r = row + dRow;
        const c = col + dCol;
        
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = state.board[r][c];
          
          if (!targetPiece || targetPiece.color !== piece.color) {
            moves.push([r, c]);
          }
        }
      }
      break;
      
    case 'bishop':
      const bishopDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      
      for (const [dRow, dCol] of bishopDirections) {
        let r = row + dRow;
        let c = col + dCol;
        
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = state.board[r][c];
          
          if (!targetPiece) {
            moves.push([r, c]);
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push([r, c]);
            }
            break;
          }
          
          r += dRow;
          c += dCol;
        }
      }
      break;
      
    case 'rook':
      const rookDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      
      for (const [dRow, dCol] of rookDirections) {
        let r = row + dRow;
        let c = col + dCol;
        
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = state.board[r][c];
          
          if (!targetPiece) {
            moves.push([r, c]);
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push([r, c]);
            }
            break;
          }
          
          r += dRow;
          c += dCol;
        }
      }
      break;
      
    case 'queen':
      const queenDirections = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      
      for (const [dRow, dCol] of queenDirections) {
        let r = row + dRow;
        let c = col + dCol;
        
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = state.board[r][c];
          
          if (!targetPiece) {
            moves.push([r, c]);
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push([r, c]);
            }
            break;
          }
          
          r += dRow;
          c += dCol;
        }
      }
      break;
      
    case 'king':
      const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      
      for (const [dRow, dCol] of kingMoves) {
        const r = row + dRow;
        const c = col + dCol;
        
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const targetPiece = state.board[r][c];
          
          if (!targetPiece || targetPiece.color !== piece.color) {
            moves.push([r, c]);
          }
        }
      }
      
      // Castling (simplified)
      if (!piece.hasMoved) {
        // Kingside castling
        if (!state.board[row][col + 1] && !state.board[row][col + 2] &&
            state.board[row][7]?.type === 'rook' && !state.board[row][7]?.hasMoved) {
          moves.push([row, col + 2]);
        }
        
        // Queenside castling
        if (!state.board[row][col - 1] && !state.board[row][col - 2] && !state.board[row][col - 3] &&
            state.board[row][0]?.type === 'rook' && !state.board[row][0]?.hasMoved) {
          moves.push([row, col - 2]);
        }
      }
      break;
  }
  
  return moves;
}

/**
 * Evaluate king safety
 */
function evaluateKingSafety(state: GameState): number {
  let score = 0;
  
  // Find kings
  let whiteKingPos: Position | null = null;
  let blackKingPos: Position | null = null;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      
      if (piece && piece.type === 'king') {
        if (piece.color === 'white') {
          whiteKingPos = [row, col];
        } else {
          blackKingPos = [row, col];
        }
      }
    }
  }
  
  if (!whiteKingPos || !blackKingPos) return 0;
  
  // Evaluate pawn shield for white king
  score += evaluatePawnShield(state.board, whiteKingPos, 'white');
  
  // Evaluate pawn shield for black king
  score -= evaluatePawnShield(state.board, blackKingPos, 'black');
  
  // Evaluate king tropism (enemy pieces close to king)
  score -= evaluateKingTropism(state.board, whiteKingPos, 'black');
  score += evaluateKingTropism(state.board, blackKingPos, 'white');
  
  return score;
}

/**
 * Evaluate pawn shield in front of king
 */
function evaluatePawnShield(board: Board, kingPos: Position, color: 'white' | 'black'): number {
  const [kingRow, kingCol] = kingPos;
  let score = 0;
  
  // Only evaluate pawn shield if king is on the back rank
  if ((color === 'white' && kingRow !== 7) || (color === 'black' && kingRow !== 0)) {
    return 0;
  }
  
  // Check for pawns in front of the king
  const direction = color === 'white' ? -1 : 1;
  const pawnRow = kingRow + direction;
  
  // Check the three files in front of the king
  for (let c = Math.max(0, kingCol - 1); c <= Math.min(7, kingCol + 1); c++) {
    const piece = board[pawnRow][c];
    
    if (piece && piece.type === 'pawn' && piece.color === color) {
      // Pawn directly in front of king is worth more
      score += c === kingCol ? 20 : 10;
    } else {
      // Penalty for missing pawn shield
      score -= 10;
    }
  }
  
  return score;
}

/**
 * Evaluate enemy pieces close to king (king tropism)
 */
function evaluateKingTropism(board: Board, kingPos: Position, enemyColor: 'white' | 'black'): number {
  const [kingRow, kingCol] = kingPos;
  let score = 0;
  
  // Find enemy pieces and calculate their distance to the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color === enemyColor) {
        // Calculate Manhattan distance
        const distance = Math.abs(row - kingRow) + Math.abs(col - kingCol);
        
        // Closer pieces are more dangerous
        // Weight by piece value (queens and rooks are more dangerous)
        let dangerFactor = 0;
        
        switch (piece.type) {
          case 'queen':
            dangerFactor = 5;
            break;
          case 'rook':
            dangerFactor = 3;
            break;
          case 'bishop':
          case 'knight':
            dangerFactor = 2;
            break;
          case 'pawn':
            dangerFactor = 1;
            break;
          default:
            dangerFactor = 0;
        }
        
        // Closer pieces are more dangerous
        score += dangerFactor * (8 - distance);
      }
    }
  }
  
  return score;
}

/**
 * Determine if the position is in the endgame
 */
export function isEndgame(board: Board): boolean {
  // Count material
  let whiteMaterial = 0;
  let blackMaterial = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece && piece.type !== 'king' && piece.type !== 'pawn') {
        if (piece.color === 'white') {
          whiteMaterial += PIECE_VALUES[piece.type];
        } else {
          blackMaterial += PIECE_VALUES[piece.type];
        }
      }
    }
  }
  
  // Endgame if both sides have less than a queen + rook worth of material
  return whiteMaterial <= 1400 && blackMaterial <= 1400;
}
