import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Info, AlertCircle, Settings, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { gameService } from '../../lib/gameService';
import { createInitialGameState, makeMove, getValidMovesForPiece, Position, GameState, Move } from '../../lib/chess/engine';
import { makeComputerMove } from '../../lib/chess/ai';
import { playChessSound, preloadChessSounds, toggleChessSounds, areChessSoundsEnabled } from '../../lib/chess/sounds';
import ChessGuide from './ChessGuide';

// Chess piece types
type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

type Board = (ChessPiece | null)[][];

// Initial board setup
const createInitialBoard = (): Board => {
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
};

export default function ChessGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use the new chess engine
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');

  // For compatibility with the existing UI
  const board = gameState.board;
  const currentPlayer = gameState.currentPlayer;
  const capturedPieces = gameState.capturedPieces;

  // State for UI
  const [showCapturedPieces, setShowCapturedPieces] = useState<{white: ChessPiece[], black: ChessPiece[]}>({
    white: [],
    black: []
  });
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [settings, setSettings] = useState({
    difficulty: 'medium',
    sound_enabled: areChessSoundsEnabled(),
    animations_enabled: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Chess piece Unicode symbols
  const pieceSymbols = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
  };

  // Get valid moves for a piece
  const getValidMoves = (row: number, col: number): [number, number][] => {
    const piece = board[row][col];
    if (!piece || piece.color !== currentPlayer) return [];

    const moves: [number, number][] = [];

    // Simplified move logic for demo purposes
    switch (piece.type) {
      case 'pawn':
        // Pawns move forward one square (or two on first move)
        const direction = piece.color === 'white' ? -1 : 1;

        // Move forward one square
        if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
          moves.push([row + direction, col]);

          // Move forward two squares on first move
          if (!piece.hasMoved && row + 2 * direction >= 0 && row + 2 * direction < 8 && !board[row + 2 * direction][col]) {
            moves.push([row + 2 * direction, col]);
          }
        }

        // Capture diagonally
        for (const diagCol of [col - 1, col + 1]) {
          if (diagCol >= 0 && diagCol < 8 && row + direction >= 0 && row + direction < 8) {
            const targetPiece = board[row + direction][diagCol];
            if (targetPiece && targetPiece.color !== piece.color) {
              moves.push([row + direction, diagCol]);
            }
          }
        }
        break;

      case 'rook':
        // Rooks move horizontally and vertically
        for (const dir of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          let r = row + dir[0];
          let c = col + dir[1];

          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (!board[r][c]) {
              moves.push([r, c]);
            } else {
              if (board[r][c]?.color !== piece.color) {
                moves.push([r, c]);
              }
              break;
            }
            r += dir[0];
            c += dir[1];
          }
        }
        break;

      case 'knight':
        // Knights move in L-shape
        for (const dir of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
          const r = row + dir[0];
          const c = col + dir[1];

          if (r >= 0 && r < 8 && c >= 0 && c < 8 && (!board[r][c] || board[r][c]?.color !== piece.color)) {
            moves.push([r, c]);
          }
        }
        break;

      case 'bishop':
        // Bishops move diagonally
        for (const dir of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          let r = row + dir[0];
          let c = col + dir[1];

          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (!board[r][c]) {
              moves.push([r, c]);
            } else {
              if (board[r][c]?.color !== piece.color) {
                moves.push([r, c]);
              }
              break;
            }
            r += dir[0];
            c += dir[1];
          }
        }
        break;

      case 'queen':
        // Queens move like rooks and bishops combined
        for (const dir of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
          let r = row + dir[0];
          let c = col + dir[1];

          while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (!board[r][c]) {
              moves.push([r, c]);
            } else {
              if (board[r][c]?.color !== piece.color) {
                moves.push([r, c]);
              }
              break;
            }
            r += dir[0];
            c += dir[1];
          }
        }
        break;

      case 'king':
        // Kings move one square in any direction
        for (const dir of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
          const r = row + dir[0];
          const c = col + dir[1];

          if (r >= 0 && r < 8 && c >= 0 && c < 8 && (!board[r][c] || board[r][c]?.color !== piece.color)) {
            moves.push([r, c]);
          }
        }
        break;
    }

    return moves;
  };

  // Preload sounds on component mount
  useEffect(() => {
    preloadChessSounds();
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    // Start tracking time on first move
    if (moves === 0) {
      setStartTime(new Date());
    }

    // If a piece is already selected
    if (selectedCell) {
      const [selectedRow, selectedCol] = selectedCell;
      const piece = board[selectedRow][selectedCol];

      // Check if the clicked cell is a valid move
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col);

      if (isValidMove && piece) {
        // Create a move object
        const move: Move = {
          from: [selectedRow, selectedCol],
          to: [row, col],
          piece: piece
        };

        // Make the move
        const newGameState = makeMove(gameState, move);
        setGameState(newGameState);

        // Play appropriate sound
        if (settings.sound_enabled) {
          // Check if this was a capture move
          if (board[row][col] || move.isEnPassant) {
            playChessSound('capture');
          } else {
            playChessSound('move');
          }

          // Play notification sound for check
          if (newGameState.check) {
            setTimeout(() => playChessSound('notify'), 300);
          }
        }

        // Add to move history
        const pieceNotation = piece.type.charAt(0).toUpperCase();
        const fromNotation = `${String.fromCharCode(97 + selectedCol)}${8 - selectedRow}`;
        const toNotation = `${String.fromCharCode(97 + col)}${8 - row}`;
        setMoveHistory(prev => [...prev, `${pieceNotation} ${fromNotation}-${toNotation}`]);

        // Increment moves counter
        setMoves(prev => prev + 1);

        // Update game status
        if (newGameState.checkmate) {
          setGameStatus(`${currentPlayer === 'white' ? 'White' : 'Black'} wins by checkmate!`);
        } else if (newGameState.stalemate) {
          setGameStatus('Draw by stalemate!');
        } else if (newGameState.check) {
          setGameStatus(`${currentPlayer === 'white' ? 'Black' : 'White'} is in check!`);
        } else {
          setGameStatus('');
        }

        // Make computer move if it's black's turn
        if (newGameState.currentPlayer === 'black' && !newGameState.checkmate && !newGameState.stalemate) {
          setTimeout(() => {
            const afterComputerMove = makeComputerMove(newGameState, settings.difficulty as 'easy' | 'medium' | 'hard');
            setGameState(afterComputerMove);

            // Play sound for computer move
            if (settings.sound_enabled) {
              // Check if computer made a capture
              const lastMove = afterComputerMove.moveHistory[afterComputerMove.moveHistory.length - 1];
              if (lastMove && lastMove.capturedPiece) {
                playChessSound('capture');
              } else {
                playChessSound('move');
              }

              // Play notification sound for check
              if (afterComputerMove.check) {
                setTimeout(() => playChessSound('notify'), 300);
              }
            }

            // Update game status after computer move
            if (afterComputerMove.checkmate) {
              setGameStatus(`${afterComputerMove.currentPlayer === 'white' ? 'Black' : 'White'} wins by checkmate!`);
            } else if (afterComputerMove.stalemate) {
              setGameStatus('Draw by stalemate!');
            } else if (afterComputerMove.check) {
              setGameStatus(`${afterComputerMove.currentPlayer === 'white' ? 'Black' : 'White'} is in check!`);
            } else {
              setGameStatus('');
            }
          }, 500); // Delay for better UX
        }
      }

      // Clear selection
      setSelectedCell(null);
      setValidMoves([]);
    } else {
      // Select a piece
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer && currentPlayer === 'white') { // Only allow selecting white pieces
        setSelectedCell([row, col]);
        setValidMoves(getValidMovesForPiece(gameState, [row, col]));

        // Play selection sound
        if (settings.sound_enabled) {
          playChessSound('move');
        }
      }
    }
  }, [gameState, selectedCell, validMoves, moves, settings.difficulty, settings.sound_enabled, board, currentPlayer]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelectedCell(null);
    setValidMoves([]);
    setGameStatus('');
    setMoveHistory([]);
    setMoves(0);
    setStartTime(new Date());
  }, []);

  // Load game settings when component mounts
  useEffect(() => {
    if (user) {
      const loadSettings = async () => {
        try {
          const userSettings = await gameService.getGameSettings(user.id, 'chess');
          setSettings({
            difficulty: userSettings.difficulty,
            sound_enabled: userSettings.sound_enabled,
            animations_enabled: userSettings.animations_enabled
          });
        } catch (error) {
          console.error('Error loading game settings:', error);
        }
      };

      loadSettings();
    }
  }, [user]);

  // Save game result when game ends
  useEffect(() => {
    if (user && gameStatus && startTime && (gameState.checkmate || gameState.stalemate)) {
      const saveResult = async () => {
        try {
          const endTime = new Date();
          const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

          let result: 'win' | 'loss' | 'draw';
          let score = 0;

          if (gameStatus.includes('White wins')) {
            result = gameState.currentPlayer === 'black' ? 'win' : 'loss';
            score = result === 'win' ? 15 : 5;
          } else if (gameStatus.includes('Black wins')) {
            result = gameState.currentPlayer === 'white' ? 'win' : 'loss';
            score = result === 'win' ? 15 : 5;
          } else {
            result = 'draw';
            score = 10;
          }

          await gameService.saveGameResult({
            user_id: user.id,
            game_type: 'chess',
            result,
            score,
            opponent: 'computer',
            moves,
            duration_seconds: durationSeconds
          });
        } catch (error) {
          console.error('Error saving game result:', error);
        }
      };

      saveResult();
    }
  }, [gameStatus, user, gameState.checkmate, gameState.stalemate, gameState.currentPlayer, moves, startTime]);

  // Cell component
  const Cell = ({ row, col }: { row: number; col: number }) => {
    const piece = board[row][col];
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
    const isDark = (row + col) % 2 === 1;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center relative cursor-pointer ${
          isDark
            ? 'bg-blue-800 dark:bg-blue-900'
            : 'bg-blue-200 dark:bg-blue-700'
        } ${
          isSelected
            ? 'ring-2 ring-yellow-400 dark:ring-yellow-500'
            : ''
        }`}
        onClick={() => handleCellClick(row, col)}
      >
        {piece && (
          <span className={`text-2xl ${piece.color === 'white' ? 'text-white' : 'text-black dark:text-gray-900'}`}>
            {pieceSymbols[piece.color][piece.type]}
          </span>
        )}

        {isValidMove && (
          <div className={`absolute inset-0 flex items-center justify-center ${piece ? 'bg-red-500/30' : ''}`}>
            {!piece && <div className="w-3 h-3 rounded-full bg-gray-500/50"></div>}
          </div>
        )}

        {/* Coordinates on the edges */}
        {col === 0 && (
          <div className="absolute -left-6 text-xs text-gray-600 dark:text-gray-400">
            {8 - row}
          </div>
        )}
        {row === 7 && (
          <div className="absolute -bottom-6 text-xs text-gray-600 dark:text-gray-400">
            {String.fromCharCode(97 + col)}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/tips')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Chess Game</h1>
          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Info className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {showTutorial && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg"
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">How to Play</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This is a simplified chess game. Click on a piece to select it, then click on a highlighted square to move.
              White pieces are at the bottom and move first. The game ends when a king is captured.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Piece Movements:</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>♙ Pawn: Forward 1 square (2 on first move), captures diagonally</li>
                  <li>♖ Rook: Any number of squares horizontally or vertically</li>
                  <li>♘ Knight: L-shape (2 squares in one direction, then 1 square perpendicular)</li>
                  <li>♗ Bishop: Any number of squares diagonally</li>
                  <li>♕ Queen: Any number of squares in any direction</li>
                  <li>♔ King: One square in any direction</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Game Objective:</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  The goal is to capture your opponent's king. This simplified version doesn't include check, checkmate,
                  castling, en passant, or pawn promotion rules.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Close Tutorial
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game board */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${currentPlayer === 'white' ? 'bg-white' : 'bg-gray-400'} border border-gray-300 mr-2`}></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">White</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${currentPlayer === 'black' ? 'bg-black dark:bg-gray-900' : 'bg-gray-400'} border border-gray-300 mr-2`}></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Black</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={resetGame}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Game Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                    <div className="flex space-x-2">
                      {['easy', 'medium', 'hard'].map((level) => (
                        <button
                          key={level}
                          onClick={async () => {
                            setSettings(prev => ({ ...prev, difficulty: level }));
                            if (user) {
                              await gameService.updateGameSettings(user.id, 'chess', { difficulty: level });
                            }
                          }}
                          className={`px-3 py-1 rounded-md text-sm ${settings.difficulty === level
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sound Effects</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.sound_enabled}
                        onChange={async (e) => {
                          setSettings(prev => ({ ...prev, sound_enabled: e.target.checked }));
                          if (user) {
                            await gameService.updateGameSettings(user.id, 'chess', { sound_enabled: e.target.checked });
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Animations</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.animations_enabled}
                        onChange={async (e) => {
                          setSettings(prev => ({ ...prev, animations_enabled: e.target.checked }));
                          if (user) {
                            await gameService.updateGameSettings(user.id, 'chess', { animations_enabled: e.target.checked });
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sound Effects</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.sound_enabled}
                        onChange={async (e) => {
                          setSettings(prev => ({ ...prev, sound_enabled: e.target.checked }));
                          toggleChessSounds(e.target.checked);
                          if (user) {
                            await gameService.updateGameSettings(user.id, 'chess', { sound_enabled: e.target.checked });
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Game status */}
            {gameStatus && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-center"
              >
                {gameStatus}
              </motion.div>
            )}

            {/* Chess board */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="grid grid-cols-8 gap-0 border-2 border-gray-700 dark:border-gray-600">
                  {Array(8).fill(null).map((_, row) => (
                    Array(8).fill(null).map((_, col) => (
                      <Cell key={`${row}-${col}`} row={row} col={col} />
                    ))
                  ))}
                </div>
                <div className="h-6"></div> {/* Space for coordinates */}
              </div>
            </div>
          </div>

          {/* Game info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Game Info</h2>
            </div>

            {/* Captured pieces */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Captured Pieces</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">White captured:</div>
                  <div className="flex flex-wrap gap-1">
                    {capturedPieces.white.map((piece, index) => (
                      <span key={index} className="text-xl text-black dark:text-gray-900">
                        {pieceSymbols.black[piece.type]}
                      </span>
                    ))}
                    {capturedPieces.white.length === 0 && (
                      <span className="text-sm text-gray-400 dark:text-gray-500">None</span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Black captured:</div>
                  <div className="flex flex-wrap gap-1">
                    {capturedPieces.black.map((piece, index) => (
                      <span key={index} className="text-xl text-white">
                        {pieceSymbols.white[piece.type]}
                      </span>
                    ))}
                    {capturedPieces.black.length === 0 && (
                      <span className="text-sm text-gray-400 dark:text-gray-500">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Move history */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Move History</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-60 overflow-y-auto">
                {moveHistory.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                      <React.Fragment key={i}>
                        <div className="text-sm p-1 bg-white dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                          {i + 1}. {moveHistory[i * 2]}
                        </div>
                        {moveHistory[i * 2 + 1] && (
                          <div className="text-sm p-1 bg-white dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                            {moveHistory[i * 2 + 1]}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No moves yet
                  </p>
                )}
              </div>
            </div>

            {/* Health benefits */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Health Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Enhances memory and concentration</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Improves strategic thinking</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Helps prevent cognitive decline</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Reduces stress through mental focus</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Learn about chess button */}
          <div className="mt-8 mb-4 flex justify-center">
            <button
              onClick={() => setShowEducation(!showEducation)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
            >
              <BookOpen className="h-5 w-5" />
              {showEducation ? 'Close Guide' : 'Chess Guide'}
            </button>
          </div>

          {/* Chess guide section */}
          {showEducation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            >
              <div className="w-full max-w-4xl max-h-[90vh]">
                <ChessGuide onClose={() => setShowEducation(false)} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
