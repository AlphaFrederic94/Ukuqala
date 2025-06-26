import React from 'react';
import { motion } from 'framer-motion';
import { GameState, Position } from '../../../lib/chess/engine';

// Chess piece symbols
const PIECE_SYMBOLS: Record<string, string> = {
  'white-pawn': '♙',
  'white-knight': '♘',
  'white-bishop': '♗',
  'white-rook': '♖',
  'white-queen': '♕',
  'white-king': '♔',
  'black-pawn': '♟',
  'black-knight': '♞',
  'black-bishop': '♝',
  'black-rook': '♜',
  'black-queen': '♛',
  'black-king': '♚',
};

interface CellProps {
  row: number;
  col: number;
  piece: { type: string; color: string } | null;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  onClick: () => void;
  showCoordinates: boolean;
  animationsEnabled: boolean;
}

const Cell: React.FC<CellProps> = ({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isLastMove,
  isCheck,
  onClick,
  showCoordinates,
  animationsEnabled
}) => {
  const isDark = (row + col) % 2 === 1;
  const pieceKey = piece ? `${piece.color}-${piece.type}` : null;
  const pieceSymbol = pieceKey ? PIECE_SYMBOLS[pieceKey] : null;
  
  // Determine cell background color
  let bgColor = isDark ? 'bg-blue-800' : 'bg-blue-200';
  
  if (isSelected) {
    bgColor = 'bg-yellow-400 dark:bg-yellow-600';
  } else if (isLastMove) {
    bgColor = isDark ? 'bg-green-700' : 'bg-green-300';
  } else if (isCheck && piece && piece.type === 'king') {
    bgColor = 'bg-red-500';
  }
  
  return (
    <div 
      className={`relative w-full h-full ${bgColor} flex items-center justify-center cursor-pointer`}
      onClick={onClick}
    >
      {/* Coordinates */}
      {showCoordinates && (
        <>
          {col === 0 && (
            <div className="absolute left-1 top-0 text-xs font-semibold opacity-70">
              {8 - row}
            </div>
          )}
          {row === 7 && (
            <div className="absolute bottom-0 right-1 text-xs font-semibold opacity-70">
              {String.fromCharCode(97 + col)}
            </div>
          )}
        </>
      )}
      
      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
      )}
      
      {/* Valid capture indicator */}
      {isValidMove && piece && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-sm opacity-70" />
      )}
      
      {/* Chess piece */}
      {piece && (
        <motion.div
          className={`text-4xl ${piece.color === 'white' ? 'text-white' : 'text-black'}`}
          initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {pieceSymbol}
        </motion.div>
      )}
    </div>
  );
};

interface EnhancedChessBoardProps {
  gameState: GameState;
  selectedCell: Position | null;
  validMoves: Position[];
  onCellClick: (row: number, col: number) => void;
  showCoordinates?: boolean;
  animationsEnabled?: boolean;
}

const EnhancedChessBoard: React.FC<EnhancedChessBoardProps> = ({
  gameState,
  selectedCell,
  validMoves,
  onCellClick,
  showCoordinates = true,
  animationsEnabled = true
}) => {
  const board = gameState.board;
  const lastMove = gameState.moveHistory.length > 0 
    ? gameState.moveHistory[gameState.moveHistory.length - 1] 
    : null;
  
  return (
    <div className="w-full max-w-md mx-auto aspect-square bg-gray-800 p-2 rounded-lg shadow-xl">
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
        {Array.from({ length: 8 }).map((_, row) => (
          Array.from({ length: 8 }).map((_, col) => {
            const piece = board[row][col];
            const isSelected = selectedCell ? selectedCell[0] === row && selectedCell[1] === col : false;
            const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
            const isLastMove = lastMove && 
              ((lastMove.from[0] === row && lastMove.from[1] === col) || 
               (lastMove.to[0] === row && lastMove.to[1] === col));
            const isCheck = gameState.check && piece && piece.type === 'king' && 
              piece.color === gameState.currentPlayer;
            
            return (
              <Cell
                key={`cell-${row}-${col}`}
                row={row}
                col={col}
                piece={piece}
                isSelected={isSelected}
                isValidMove={isValidMove}
                isLastMove={isLastMove}
                isCheck={isCheck}
                onClick={() => onCellClick(row, col)}
                showCoordinates={showCoordinates}
                animationsEnabled={animationsEnabled}
              />
            );
          })
        ))}
      </div>
    </div>
  );
};

export default EnhancedChessBoard;
