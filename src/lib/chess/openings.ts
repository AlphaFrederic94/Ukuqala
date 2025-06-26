/**
 * Chess Openings - Opening book for the chess AI
 */

import { GameState, Move, Position } from './engine';

// Opening move in algebraic notation
interface OpeningPosition {
  moves: string[];
  responses: string[];
}

// Common chess openings
const OPENING_BOOK: Record<string, OpeningPosition> = {
  // Starting position
  'start': {
    moves: [],
    responses: ['e4', 'd4', 'Nf3', 'c4'] // Most common first moves
  },
  
  // After 1. e4
  'e4': {
    moves: ['e4'],
    responses: ['e5', 'c5', 'e6', 'c6', 'd6'] // Responses to e4
  },
  
  // After 1. e4 e5
  'e4 e5': {
    moves: ['e4', 'e5'],
    responses: ['Nf3', 'Nc3', 'd4', 'Bc4'] // Responses to e4 e5
  },
  
  // After 1. e4 e5 2. Nf3
  'e4 e5 Nf3': {
    moves: ['e4', 'e5', 'Nf3'],
    responses: ['Nc6', 'Nf6', 'd6'] // Responses to e4 e5 Nf3
  },
  
  // After 1. e4 e5 2. Nf3 Nc6
  'e4 e5 Nf3 Nc6': {
    moves: ['e4', 'e5', 'Nf3', 'Nc6'],
    responses: ['Bb5', 'Bc4', 'd4', 'Nc3'] // Responses to e4 e5 Nf3 Nc6
  },
  
  // After 1. d4
  'd4': {
    moves: ['d4'],
    responses: ['d5', 'Nf6', 'e6', 'c5'] // Responses to d4
  },
  
  // After 1. d4 d5
  'd4 d5': {
    moves: ['d4', 'd5'],
    responses: ['c4', 'Nf3', 'e3', 'Bf4'] // Responses to d4 d5
  },
  
  // After 1. d4 Nf6
  'd4 Nf6': {
    moves: ['d4', 'Nf6'],
    responses: ['c4', 'Nf3', 'Bg5', 'g3'] // Responses to d4 Nf6
  },
  
  // Sicilian Defense
  'e4 c5': {
    moves: ['e4', 'c5'],
    responses: ['Nf3', 'Nc3', 'd4', 'c3'] // Responses to e4 c5
  },
  
  // French Defense
  'e4 e6': {
    moves: ['e4', 'e6'],
    responses: ['d4', 'Nc3', 'd3', 'Nf3'] // Responses to e4 e6
  },
  
  // Caro-Kann Defense
  'e4 c6': {
    moves: ['e4', 'c6'],
    responses: ['d4', 'Nc3', 'd3', 'Nf3'] // Responses to e4 c6
  },
  
  // Queen's Gambit
  'd4 d5 c4': {
    moves: ['d4', 'd5', 'c4'],
    responses: ['e3', 'Nc3', 'Nf3', 'cxd5'] // Responses to d4 d5 c4
  },
  
  // Indian Defenses
  'd4 Nf6 c4': {
    moves: ['d4', 'Nf6', 'c4'],
    responses: ['Nc3', 'Nf3', 'g3', 'e3'] // Responses to d4 Nf6 c4
  }
};

/**
 * Convert algebraic notation to a move
 */
function algebraicToMove(state: GameState, notation: string): Move | null {
  // This is a simplified conversion that only handles basic moves
  // In a real chess engine, we would need a more robust parser
  
  // Special case for castling
  if (notation === 'O-O' || notation === '0-0') {
    // Kingside castling
    const row = state.currentPlayer === 'white' ? 7 : 0;
    return {
      from: [row, 4],
      to: [row, 6],
      piece: { type: 'king', color: state.currentPlayer, hasMoved: false },
      isCastle: true
    };
  } else if (notation === 'O-O-O' || notation === '0-0-0') {
    // Queenside castling
    const row = state.currentPlayer === 'white' ? 7 : 0;
    return {
      from: [row, 4],
      to: [row, 2],
      piece: { type: 'king', color: state.currentPlayer, hasMoved: false },
      isCastle: true
    };
  }
  
  // Regular moves
  let pieceType: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king' = 'pawn';
  let fromFile: number | null = null;
  let fromRank: number | null = null;
  let toFile: number | null = null;
  let toRank: number | null = null;
  let isCapture = false;
  let promotionPiece: 'queen' | 'rook' | 'bishop' | 'knight' | null = null;
  
  // Parse the notation
  let i = 0;
  
  // Piece type
  if (notation[i] >= 'A' && notation[i] <= 'Z') {
    switch (notation[i]) {
      case 'R': pieceType = 'rook'; break;
      case 'N': pieceType = 'knight'; break;
      case 'B': pieceType = 'bishop'; break;
      case 'Q': pieceType = 'queen'; break;
      case 'K': pieceType = 'king'; break;
    }
    i++;
  }
  
  // From file/rank (disambiguation)
  while (i < notation.length && notation[i] !== 'x' && (notation[i] < 'a' || notation[i] > 'h')) {
    if (notation[i] >= 'a' && notation[i] <= 'h') {
      fromFile = notation.charCodeAt(i) - 97;
    } else if (notation[i] >= '1' && notation[i] <= '8') {
      fromRank = 8 - parseInt(notation[i]);
    }
    i++;
  }
  
  // Capture
  if (i < notation.length && notation[i] === 'x') {
    isCapture = true;
    i++;
  }
  
  // To file
  if (i < notation.length && notation[i] >= 'a' && notation[i] <= 'h') {
    toFile = notation.charCodeAt(i) - 97;
    i++;
  }
  
  // To rank
  if (i < notation.length && notation[i] >= '1' && notation[i] <= '8') {
    toRank = 8 - parseInt(notation[i]);
    i++;
  }
  
  // Promotion
  if (i < notation.length && notation[i] === '=') {
    i++;
    if (i < notation.length) {
      switch (notation[i]) {
        case 'Q': promotionPiece = 'queen'; break;
        case 'R': promotionPiece = 'rook'; break;
        case 'B': promotionPiece = 'bishop'; break;
        case 'N': promotionPiece = 'knight'; break;
      }
      i++;
    }
  }
  
  // Check and checkmate are ignored for move generation
  
  // Find the piece and make the move
  if (toFile !== null && toRank !== null) {
    // Find candidate pieces
    const candidates: Position[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        
        if (piece && piece.type === pieceType && piece.color === state.currentPlayer) {
          // Check if this piece matches the disambiguation
          if ((fromFile === null || fromFile === col) && (fromRank === null || fromRank === row)) {
            // Check if this piece can move to the target square
            const validMoves = getPseudoLegalMoves(state, [row, col]);
            
            if (validMoves.some(([r, c]) => r === toRank && c === toFile)) {
              candidates.push([row, col]);
            }
          }
        }
      }
    }
    
    // If there's exactly one candidate, make the move
    if (candidates.length === 1) {
      const [fromRow, fromCol] = candidates[0];
      const piece = state.board[fromRow][fromCol];
      
      if (piece) {
        return {
          from: [fromRow, fromCol],
          to: [toRank, toFile],
          piece: piece,
          isPromotion: promotionPiece !== null,
          promotionPiece: promotionPiece || undefined
        };
      }
    }
  }
  
  return null;
}

/**
 * Get pseudo-legal moves for a piece (simplified)
 */
function getPseudoLegalMoves(state: GameState, position: Position): Position[] {
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
 * Get the move history in algebraic notation
 */
function getMoveHistory(state: GameState): string[] {
  // This is a simplified version that just returns the moves
  // In a real chess engine, we would convert the moves to algebraic notation
  return state.moveHistory.map((move, index) => {
    // For simplicity, just return the from and to squares
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    
    const fromSquare = String.fromCharCode(97 + fromCol) + (8 - fromRow);
    const toSquare = String.fromCharCode(97 + toCol) + (8 - toRow);
    
    return `${fromSquare}-${toSquare}`;
  });
}

/**
 * Get a move from the opening book
 */
export function getOpeningMove(state: GameState): Move | null {
  // Convert the move history to a string key
  const moveHistory = getMoveHistory(state);
  
  // Check if we're in a known opening position
  let position: OpeningPosition | null = null;
  
  // Try to find the exact position in the opening book
  const key = moveHistory.join(' ');
  if (OPENING_BOOK[key]) {
    position = OPENING_BOOK[key];
  } else if (moveHistory.length === 0) {
    // Starting position
    position = OPENING_BOOK['start'];
  }
  
  if (position) {
    // Choose a random response from the opening book
    const responses = position.responses;
    
    if (responses.length > 0) {
      const randomIndex = Math.floor(Math.random() * responses.length);
      const response = responses[randomIndex];
      
      // Convert the algebraic notation to a move
      return algebraicToMove(state, response);
    }
  }
  
  return null;
}
