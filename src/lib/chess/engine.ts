/**
 * Chess Engine - Core functionality for chess move generation and validation
 */

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export type Board = (ChessPiece | null)[][];
export type Position = [number, number]; // [row, col]
export type Move = {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece | null;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
  isCastle?: boolean;
  isEnPassant?: boolean;
};

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  moveHistory: Move[];
  capturedPieces: { white: ChessPiece[], black: ChessPiece[] };
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  halfMoveClock: number; // For 50-move rule
  fullMoveNumber: number; // Incremented after black's move
  enPassantTarget: Position | null;
}

/**
 * Create a new chess board with pieces in starting positions
 */
export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Set up pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
  }

  // Set up other pieces
  const backRowPieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: backRowPieces[i], color: 'black', hasMoved: false };
    board[7][i] = { type: backRowPieces[i], color: 'white', hasMoved: false };
  }

  return board;
}

/**
 * Create a new game state
 */
export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    check: false,
    checkmate: false,
    stalemate: false,
    halfMoveClock: 0,
    fullMoveNumber: 1,
    enPassantTarget: null
  };
}

/**
 * Clone a game state
 */
export function cloneGameState(state: GameState): GameState {
  return {
    board: state.board.map(row => [...row]),
    currentPlayer: state.currentPlayer,
    moveHistory: [...state.moveHistory],
    capturedPieces: {
      white: [...state.capturedPieces.white],
      black: [...state.capturedPieces.black]
    },
    check: state.check,
    checkmate: state.checkmate,
    stalemate: state.stalemate,
    halfMoveClock: state.halfMoveClock,
    fullMoveNumber: state.fullMoveNumber,
    enPassantTarget: state.enPassantTarget
  };
}

/**
 * Get all valid moves for a piece at a given position
 */
export function getValidMovesForPiece(state: GameState, position: Position): Position[] {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece || piece.color !== state.currentPlayer) return [];

  const potentialMoves = getPotentialMovesForPiece(state, position);

  // Filter out moves that would put or leave the king in check
  return potentialMoves.filter(([toRow, toCol]) => {
    const newState = makeMove(state, {
      from: position,
      to: [toRow, toCol],
      piece: piece
    });

    return !isKingInCheck(newState, piece.color);
  });
}

/**
 * Get all potential moves for a piece without considering check
 */
export function getPotentialMovesForPiece(state: GameState, position: Position): Position[] {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece) return [];

  const moves: Position[] = [];

  switch (piece.type) {
    case 'pawn':
      addPawnMoves(state, position, moves);
      break;
    case 'rook':
      addSlidingMoves(state, position, [[-1, 0], [1, 0], [0, -1], [0, 1]], moves);
      break;
    case 'knight':
      addKnightMoves(state, position, moves);
      break;
    case 'bishop':
      addSlidingMoves(state, position, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves);
      break;
    case 'queen':
      addSlidingMoves(state, position, [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], moves);
      break;
    case 'king':
      addKingMoves(state, position, moves);
      break;
  }

  return moves;
}

/**
 * Add pawn moves to the moves array
 */
function addPawnMoves(state: GameState, position: Position, moves: Position[]) {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece || piece.type !== 'pawn') return;

  const direction = piece.color === 'white' ? -1 : 1;

  // Move forward one square
  if (row + direction >= 0 && row + direction < 8 && !state.board[row + direction][col]) {
    moves.push([row + direction, col]);

    // Move forward two squares on first move
    if (!piece.hasMoved && row + 2 * direction >= 0 && row + 2 * direction < 8 && !state.board[row + 2 * direction][col]) {
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
}

/**
 * Add sliding moves (for rook, bishop, queen) to the moves array
 */
function addSlidingMoves(state: GameState, position: Position, directions: [number, number][], moves: Position[]) {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece) return;

  for (const [dRow, dCol] of directions) {
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
}

/**
 * Add knight moves to the moves array
 */
function addKnightMoves(state: GameState, position: Position, moves: Position[]) {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece || piece.type !== 'knight') return;

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
}

/**
 * Add king moves to the moves array
 */
function addKingMoves(state: GameState, position: Position, moves: Position[]) {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece || piece.type !== 'king') return;

  // Regular king moves
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

  // Castling
  if (!piece.hasMoved && !state.check) {
    // Kingside castling
    if (canCastle(state, position, 'kingside')) {
      moves.push([row, col + 2]);
    }

    // Queenside castling
    if (canCastle(state, position, 'queenside')) {
      moves.push([row, col - 2]);
    }
  }
}

/**
 * Check if castling is possible
 */
function canCastle(state: GameState, kingPosition: Position, side: 'kingside' | 'queenside'): boolean {
  const [row, col] = kingPosition;
  const king = state.board[row][col];

  if (!king || king.type !== 'king' || king.hasMoved) return false;

  const rookCol = side === 'kingside' ? 7 : 0;
  const rook = state.board[row][rookCol];

  if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;

  // Check if squares between king and rook are empty
  const direction = side === 'kingside' ? 1 : -1;
  const distance = side === 'kingside' ? 2 : 3;

  for (let i = 1; i <= distance; i++) {
    const c = col + i * direction;

    if (c === rookCol) continue;

    if (state.board[row][c]) return false;

    // Check if king passes through check
    if (i <= 2) {
      const tempState = cloneGameState(state);
      tempState.board[row][col] = null;
      tempState.board[row][col + i * direction] = king;

      if (isSquareAttacked(tempState, [row, col + i * direction], king.color === 'white' ? 'black' : 'white')) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Make a move and return the new game state
 */
export function makeMove(state: GameState, move: Move): GameState {
  const newState = cloneGameState(state);
  const { from, to, piece } = move;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  // Capture piece if present
  const capturedPiece = newState.board[toRow][toCol];
  if (capturedPiece) {
    newState.capturedPieces[piece.color].push(capturedPiece);
    move.capturedPiece = capturedPiece;
  }

  // Handle en passant capture
  if (piece.type === 'pawn' && newState.enPassantTarget &&
      toRow === newState.enPassantTarget[0] && toCol === newState.enPassantTarget[1]) {
    const captureRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
    const enPassantPiece = newState.board[captureRow][toCol];

    if (enPassantPiece) {
      newState.capturedPieces[piece.color].push(enPassantPiece);
      newState.board[captureRow][toCol] = null;
      move.isEnPassant = true;
      move.capturedPiece = enPassantPiece;
    }
  }

  // Set en passant target for next move
  newState.enPassantTarget = null;
  if (piece.type === 'pawn' && Math.abs(fromRow - toRow) === 2) {
    newState.enPassantTarget = [piece.color === 'white' ? toRow + 1 : toRow - 1, toCol];
  }

  // Handle castling
  if (piece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
    const rookCol = toCol > fromCol ? 7 : 0;
    const newRookCol = toCol > fromCol ? toCol - 1 : toCol + 1;
    const rook = newState.board[fromRow][rookCol];

    if (rook && rook.type === 'rook') {
      newState.board[fromRow][rookCol] = null;
      newState.board[fromRow][newRookCol] = { ...rook, hasMoved: true };
      move.isCastle = true;
    }
  }

  // Move the piece
  newState.board[toRow][toCol] = { ...piece, hasMoved: true };
  newState.board[fromRow][fromCol] = null;

  // Handle pawn promotion
  if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
    const promotionPiece = move.promotionPiece || 'queen';
    newState.board[toRow][toCol] = { type: promotionPiece, color: piece.color, hasMoved: true };
    move.isPromotion = true;
    move.promotionPiece = promotionPiece;
  }

  // Update half move clock (reset on pawn move or capture)
  if (piece.type === 'pawn' || capturedPiece) {
    newState.halfMoveClock = 0;
  } else {
    newState.halfMoveClock++;
  }

  // Add move to history
  newState.moveHistory.push(move);

  // Switch player
  newState.currentPlayer = newState.currentPlayer === 'white' ? 'black' : 'white';

  // Update full move number
  if (newState.currentPlayer === 'white') {
    newState.fullMoveNumber++;
  }

  // Check for check, checkmate, stalemate
  const inCheck = isKingInCheck(newState, newState.currentPlayer);
  newState.check = inCheck;

  const hasValidMoves = hasAnyValidMoves(newState);
  newState.checkmate = inCheck && !hasValidMoves;
  newState.stalemate = !inCheck && !hasValidMoves;

  return newState;
}

/**
 * Check if a king is in check
 */
export function isKingInCheck(state: GameState, color: PieceColor): boolean {
  // Find the king
  let kingPosition: Position | null = null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];

      if (piece && piece.type === 'king' && piece.color === color) {
        kingPosition = [row, col];
        break;
      }
    }

    if (kingPosition) break;
  }

  if (!kingPosition) return false;

  // Check if the king is attacked
  return isSquareAttacked(state, kingPosition, color === 'white' ? 'black' : 'white');
}

/**
 * Check if a square is attacked by any piece of the given color
 */
export function isSquareAttacked(state: GameState, position: Position, attackerColor: PieceColor): boolean {
  const [row, col] = position;

  // Check for pawn attacks
  const pawnDirection = attackerColor === 'white' ? -1 : 1;
  for (const diagCol of [col - 1, col + 1]) {
    if (diagCol >= 0 && diagCol < 8) {
      const attackRow = row - pawnDirection;

      if (attackRow >= 0 && attackRow < 8) {
        const piece = state.board[attackRow][diagCol];

        if (piece && piece.type === 'pawn' && piece.color === attackerColor) {
          return true;
        }
      }
    }
  }

  // Check for knight attacks
  const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

  for (const [dRow, dCol] of knightMoves) {
    const r = row + dRow;
    const c = col + dCol;

    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = state.board[r][c];

      if (piece && piece.type === 'knight' && piece.color === attackerColor) {
        return true;
      }
    }
  }

  // Check for sliding piece attacks (rook, bishop, queen)
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // Rook/Queen
    [-1, -1], [-1, 1], [1, -1], [1, 1] // Bishop/Queen
  ];

  for (const [dRow, dCol] of directions) {
    let r = row + dRow;
    let c = col + dCol;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = state.board[r][c];

      if (piece) {
        if (piece.color === attackerColor) {
          const isDiagonal = dRow !== 0 && dCol !== 0;

          if ((isDiagonal && (piece.type === 'bishop' || piece.type === 'queen')) ||
              (!isDiagonal && (piece.type === 'rook' || piece.type === 'queen'))) {
            return true;
          }
        }

        break;
      }

      r += dRow;
      c += dCol;
    }
  }

  // Check for king attacks
  const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  for (const [dRow, dCol] of kingMoves) {
    const r = row + dRow;
    const c = col + dCol;

    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = state.board[r][c];

      if (piece && piece.type === 'king' && piece.color === attackerColor) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get valid moves for a piece without checking if they would put the king in check
 * This is used to avoid circular dependencies in hasAnyValidMoves
 */
export function getValidMovesWithoutCheckCheck(state: GameState, position: Position): Position[] {
  const [row, col] = position;
  const piece = state.board[row][col];

  if (!piece || piece.color !== state.currentPlayer) return [];

  return getPotentialMovesForPiece(state, position);
}

/**
 * Check if a player has any valid moves
 */
export function hasAnyValidMoves(state: GameState): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];

      if (piece && piece.color === state.currentPlayer) {
        // Use the simplified version that doesn't check for check
        const potentialMoves = getValidMovesWithoutCheckCheck(state, [row, col]);

        // For each potential move, check if it would leave the king in check
        for (const [toRow, toCol] of potentialMoves) {
          // Make a copy of the board to simulate the move
          const newBoard = state.board.map(row => [...row]);

          // Move the piece
          newBoard[toRow][toCol] = piece;
          newBoard[row][col] = null;

          // Create a new state with the updated board
          const newState = {
            ...state,
            board: newBoard
          };

          // Check if the king is in check after the move
          if (!isKingInCheck(newState, piece.color)) {
            return true; // Found at least one valid move
          }
        }
      }
    }
  }

  return false;
}

/**
 * Get all valid moves for the current player
 */
export function getAllValidMoves(state: GameState): Move[] {
  const moves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];

      if (piece && piece.color === state.currentPlayer) {
        const validPositions = getValidMovesForPiece(state, [row, col]);

        for (const [toRow, toCol] of validPositions) {
          moves.push({
            from: [row, col],
            to: [toRow, toCol],
            piece: piece
          });
        }
      }
    }
  }

  return moves;
}

/**
 * Convert a move to algebraic notation
 */
export function moveToAlgebraic(state: GameState, move: Move): string {
  const { from, to, piece, capturedPiece, isPromotion, promotionPiece, isCastle } = move;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;

  // Castling
  if (isCastle) {
    return toCol > fromCol ? 'O-O' : 'O-O-O';
  }

  let notation = '';

  // Piece letter (except for pawns)
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase();
  }

  // Disambiguation
  if (piece.type !== 'pawn' && piece.type !== 'king') {
    const ambiguousPieces = findAmbiguousPieces(state, move);

    if (ambiguousPieces.length > 0) {
      if (ambiguousPieces.every(p => p[1] !== fromCol)) {
        notation += String.fromCharCode(97 + fromCol); // File (a-h)
      } else if (ambiguousPieces.every(p => p[0] !== fromRow)) {
        notation += (8 - fromRow); // Rank (1-8)
      } else {
        notation += String.fromCharCode(97 + fromCol) + (8 - fromRow);
      }
    }
  }

  // Capture
  if (capturedPiece || move.isEnPassant) {
    if (piece.type === 'pawn') {
      notation += String.fromCharCode(97 + fromCol); // File (a-h)
    }

    notation += 'x';
  }

  // Destination square
  notation += String.fromCharCode(97 + toCol) + (8 - toRow);

  // Promotion
  if (isPromotion && promotionPiece) {
    notation += '=' + promotionPiece.charAt(0).toUpperCase();
  }

  // Check and checkmate
  const newState = makeMove(state, move);

  if (newState.checkmate) {
    notation += '#';
  } else if (newState.check) {
    notation += '+';
  }

  return notation;
}

/**
 * Find pieces that could also move to the same square
 */
function findAmbiguousPieces(state: GameState, move: Move): Position[] {
  const { from, to, piece } = move;
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const ambiguousPieces: Position[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (row === fromRow && col === fromCol) continue;

      const otherPiece = state.board[row][col];

      if (otherPiece && otherPiece.type === piece.type && otherPiece.color === piece.color) {
        const validMoves = getValidMovesForPiece(state, [row, col]);

        if (validMoves.some(([r, c]) => r === toRow && c === toCol)) {
          ambiguousPieces.push([row, col]);
        }
      }
    }
  }

  return ambiguousPieces;
}

/**
 * Convert algebraic notation to a move
 */
export function algebraicToMove(state: GameState, notation: string): Move | null {
  // TODO: Implement this if needed
  return null;
}
