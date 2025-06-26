import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Info,
  AlertCircle,
  Settings,
  Volume2,
  VolumeX,
  BookOpen,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { gameService } from '../../lib/gameService';
import {
  createInitialGameState,
  makeMove,
  getValidMovesForPiece,
  Position,
  GameState,
  Move
} from '../../lib/chess/engine';
import { makeComputerMove } from '../../lib/chess/ai';
import {
  playChessSound,
  preloadChessSounds,
  toggleChessSounds,
  areChessSoundsEnabled
} from '../../lib/chess/sounds';
import ChessGuide from './ChessGuide';
// Using enhanced 2D board since Three.js installation failed
import EnhancedChessBoard from './chess3d/EnhancedChessBoard';
import ChessClock, { TimeControlType } from './chess3d/ChessClock';

export default function Chess3DGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Game state
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [moves, setMoves] = useState(0);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Chess clock state
  const [clockPaused, setClockPaused] = useState(true);

  // Settings
  const [settings, setSettings] = useState({
    difficulty: 'medium',
    sound_enabled: areChessSoundsEnabled(),
    animations_enabled: true,
    time_control: 'rapid' as TimeControlType
  });

  // For compatibility with the existing UI
  const board = gameState.board;
  const currentPlayer = gameState.currentPlayer;
  const capturedPieces = gameState.capturedPieces;

  // Preload sounds on component mount
  useEffect(() => {
    preloadChessSounds();
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    // Start tracking time on first move
    if (moves === 0) {
      setStartTime(new Date());
      setClockPaused(false);
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
          setGameOver(true);
          setClockPaused(true);
        } else if (newGameState.stalemate) {
          setGameStatus('Draw by stalemate!');
          setGameOver(true);
          setClockPaused(true);
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
              setGameOver(true);
              setClockPaused(true);
            } else if (afterComputerMove.stalemate) {
              setGameStatus('Draw by stalemate!');
              setGameOver(true);
              setClockPaused(true);
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

  // Handle time up
  const handleTimeUp = useCallback((player: 'white' | 'black') => {
    setGameStatus(`${player === 'white' ? 'Black' : 'White'} wins on time!`);
    setGameOver(true);
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelectedCell(null);
    setValidMoves([]);
    setGameStatus('');
    setMoveHistory([]);
    setMoves(0);
    setStartTime(new Date());
    setGameOver(false);
    setClockPaused(true);
  }, []);

  // Save game result when game ends
  useEffect(() => {
    if (user && gameOver && startTime) {
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
  }, [gameOver, user, gameState.currentPlayer, moves, startTime, gameStatus]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column - Game board and controls */}
        <div className="w-full md:w-2/3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('common.back')}</span>
            </button>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">3D Chess</h1>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowTutorial(!showTutorial)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                aria-label="Tutorial"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Game status */}
          {gameStatus && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
              gameStatus.includes('wins')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
            }`}>
              {gameStatus.includes('wins') ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{gameStatus}</span>
            </div>
          )}

          {/* Enhanced Chess Board */}
          <EnhancedChessBoard
            gameState={gameState}
            selectedCell={selectedCell}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            showCoordinates={true}
            animationsEnabled={settings.animations_enabled}
          />

          {/* Game controls */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="h-5 w-5" />
              <span>New Game</span>
            </button>

            <div className="text-gray-600 dark:text-gray-400">
              Moves: {moves}
            </div>

            <button
              onClick={() => {
                const newSetting = !settings.sound_enabled;
                setSettings(prev => ({ ...prev, sound_enabled: newSetting }));
                toggleChessSounds(newSetting);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              {settings.sound_enabled ? (
                <>
                  <Volume2 className="h-5 w-5" />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-5 w-5" />
                  <span>Sound Off</span>
                </>
              )}
            </button>
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

        {/* Right column - Game info and clock */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* Chess Clock */}
          <ChessClock
            activePlayer={currentPlayer}
            paused={clockPaused}
            timeControl={settings.time_control}
            onTimeUp={handleTimeUp}
            onReset={resetGame}
            onPauseToggle={() => setClockPaused(!clockPaused)}
          />

          {/* Captured pieces */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Captured Pieces</h3>

            <div className="space-y-3">
              {/* White's captures */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">White's captures</span>
                </div>
                <div className="flex flex-wrap gap-1 min-h-10 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  {capturedPieces.white.map((piece, index) => (
                    <div
                      key={`white-capture-${index}`}
                      className="w-6 h-6 flex items-center justify-center text-lg"
                      title={`${piece.color} ${piece.type}`}
                    >
                      {piece.type === 'pawn' && '♟'}
                      {piece.type === 'knight' && '♞'}
                      {piece.type === 'bishop' && '♝'}
                      {piece.type === 'rook' && '♜'}
                      {piece.type === 'queen' && '♛'}
                      {piece.type === 'king' && '♚'}
                    </div>
                  ))}
                  {capturedPieces.white.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No captures yet</span>
                  )}
                </div>
              </div>

              {/* Black's captures */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-black border border-gray-300"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Black's captures</span>
                </div>
                <div className="flex flex-wrap gap-1 min-h-10 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  {capturedPieces.black.map((piece, index) => (
                    <div
                      key={`black-capture-${index}`}
                      className="w-6 h-6 flex items-center justify-center text-lg"
                      title={`${piece.color} ${piece.type}`}
                    >
                      {piece.type === 'pawn' && '♙'}
                      {piece.type === 'knight' && '♘'}
                      {piece.type === 'bishop' && '♗'}
                      {piece.type === 'rook' && '♖'}
                      {piece.type === 'queen' && '♕'}
                      {piece.type === 'king' && '♔'}
                    </div>
                  ))}
                  {capturedPieces.black.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No captures yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Move history */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Move History</h3>

            <div className="max-h-60 overflow-y-auto">
              {moveHistory.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <span className="w-6 text-gray-500 dark:text-gray-400">{i + 1}.</span>
                        <span className="text-gray-900 dark:text-white">{moveHistory[i * 2]}</span>
                      </div>
                      {moveHistory[i * 2 + 1] && (
                        <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <span className="w-6 text-gray-500 dark:text-gray-400">{i + 1}...</span>
                          <span className="text-gray-900 dark:text-white">{moveHistory[i * 2 + 1]}</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 italic p-4">
                  No moves yet
                </div>
              )}
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={settings.difficulty}
                      onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Control
                    </label>
                    <select
                      value={settings.time_control}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        time_control: e.target.value as TimeControlType
                      }))}
                      className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                    >
                      <option value="bullet">Bullet (1 min)</option>
                      <option value="blitz">Blitz (5 min + 2s)</option>
                      <option value="rapid">Rapid (10 min + 5s)</option>
                      <option value="classical">Classical (30 min + 10s)</option>
                    </select>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
