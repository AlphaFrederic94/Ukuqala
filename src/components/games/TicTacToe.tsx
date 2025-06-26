import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trophy, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { gameService } from '../../lib/gameService';

type Player = 'X' | 'O' | null;
type Board = (Player)[][];

const initialBoard: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null]
];

export default function TicTacToe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [settings, setSettings] = useState({
    difficulty: 'medium',
    sound_enabled: true,
    animations_enabled: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Check for winner
  const checkWinner = (board: Board): Player => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
        return board[i][0];
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
        return board[0][i];
      }
    }

    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
      return board[0][2];
    }

    return null;
  };

  // Check for draw
  const checkDraw = (board: Board): boolean => {
    return board.every(row => row.every(cell => cell !== null));
  };

  // Computer move
  const computerMove = () => {
    if (winner || isDraw) return;

    setIsComputerThinking(true);

    setTimeout(() => {
      const newBoard = [...board.map(row => [...row])];

      // Try to win
      const winMove = findWinningMove(newBoard, 'O');
      if (winMove) {
        const { row, col } = winMove;
        newBoard[row][col] = 'O';
        setBoard(newBoard);
        setCurrentPlayer('X');
        setIsComputerThinking(false);
        return;
      }

      // Block player from winning
      const blockMove = findWinningMove(newBoard, 'X');
      if (blockMove) {
        const { row, col } = blockMove;
        newBoard[row][col] = 'O';
        setBoard(newBoard);
        setCurrentPlayer('X');
        setIsComputerThinking(false);
        return;
      }

      // Take center if available
      if (newBoard[1][1] === null) {
        newBoard[1][1] = 'O';
        setBoard(newBoard);
        setCurrentPlayer('X');
        setIsComputerThinking(false);
        return;
      }

      // Take a random empty cell
      const emptyCells: {row: number, col: number}[] = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (newBoard[i][j] === null) {
            emptyCells.push({row: i, col: j});
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        newBoard[row][col] = 'O';
        setBoard(newBoard);
        setCurrentPlayer('X');
      }

      setIsComputerThinking(false);
    }, 700); // Delay to simulate thinking
  };

  // Find winning move for a player
  const findWinningMove = (board: Board, player: 'X' | 'O'): {row: number, col: number} | null => {
    // Check each empty cell
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          // Try this move
          board[i][j] = player;
          // Check if it's a winning move
          const isWinning = checkWinner(board) === player;
          // Undo the move
          board[i][j] = null;

          if (isWinning) {
            return { row: i, col: j };
          }
        }
      }
    }
    return null;
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] !== null || winner || isDraw || currentPlayer === 'O' || isComputerThinking) {
      return;
    }

    // Start tracking time on first move
    if (moves === 0) {
      setStartTime(new Date());
    }

    const newBoard = [...board.map(r => [...r])];
    newBoard[row][col] = 'X';
    setBoard(newBoard);
    setCurrentPlayer('O');
    setMoves(prev => prev + 1);
  };

  // Reset game
  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setMoves(0);
    setStartTime(new Date());
  };

  // Load game settings when component mounts
  useEffect(() => {
    if (user) {
      const loadSettings = async () => {
        try {
          const userSettings = await gameService.getGameSettings(user.id, 'tic-tac-toe');
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
    if (user && (winner || isDraw) && startTime) {
      const saveResult = async () => {
        try {
          const endTime = new Date();
          const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

          let result: 'win' | 'loss' | 'draw';
          let score = 0;

          if (winner === 'X') {
            result = 'win';
            score = 10;
          } else if (winner === 'O') {
            result = 'loss';
            score = 0;
          } else {
            result = 'draw';
            score = 5;
          }

          await gameService.saveGameResult({
            user_id: user.id,
            game_type: 'tic-tac-toe',
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
  }, [winner, isDraw, user, moves, startTime]);

  // Update game state after each move
  useEffect(() => {
    const newWinner = checkWinner(board);
    const newIsDraw = checkDraw(board);

    if (newWinner) {
      setWinner(newWinner);
      if (newWinner === 'X') {
        setPlayerScore(prev => prev + 1);
        setGameHistory(prev => [...prev, "You won!"]);
      } else {
        setComputerScore(prev => prev + 1);
        setGameHistory(prev => [...prev, "Computer won!"]);
      }
    } else if (newIsDraw) {
      setIsDraw(true);
      setGameHistory(prev => [...prev, "It's a draw!"]);
    } else if (currentPlayer === 'O') {
      computerMove();
    }
  }, [board, currentPlayer]);

  // Cell component
  const Cell = ({ value, onClick }: { value: Player; onClick: () => void }) => {
    return (
      <motion.div
        whileHover={{ scale: value ? 1 : 1.05 }}
        whileTap={{ scale: value ? 1 : 0.95 }}
        className={`w-24 h-24 flex items-center justify-center text-4xl font-bold rounded-lg cursor-pointer shadow-md ${
          value === null
            ? 'bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600'
            : value === 'X'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300'
        }`}
        onClick={onClick}
      >
        {value && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {value}
          </motion.span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/tips')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tic Tac Toe</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game board */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${currentPlayer === 'X' ? 'bg-blue-500' : 'bg-gray-300'} mr-2`}></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Your Turn (X)</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${currentPlayer === 'O' ? 'bg-pink-500' : 'bg-gray-300'} mr-2`}></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Computer (O)</span>
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
                              await gameService.updateGameSettings(user.id, 'tic-tac-toe', { difficulty: level });
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
                            await gameService.updateGameSettings(user.id, 'tic-tac-toe', { sound_enabled: e.target.checked });
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
                            await gameService.updateGameSettings(user.id, 'tic-tac-toe', { animations_enabled: e.target.checked });
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
            {(winner || isDraw) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg text-center ${
                  winner === 'X'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : winner === 'O'
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {winner
                  ? winner === 'X'
                    ? 'You won! 🎉'
                    : 'Computer won! 🤖'
                  : "It's a draw! 🤝"}
              </motion.div>
            )}

            {/* Computer thinking indicator */}
            {isComputerThinking && (
              <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
                <div className="flex justify-center items-center">
                  <div className="animate-pulse text-gray-600 dark:text-gray-300">Computer is thinking...</div>
                  <div className="ml-2 w-5 h-5 border-t-2 border-b-2 border-gray-600 dark:border-gray-300 rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {/* Game board */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {board.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    value={cell}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  />
                ))
              ))}
            </div>
          </div>

          {/* Scoreboard and history */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Scoreboard</h2>
            </div>

            <div className="flex justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">You (X)</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{playerScore}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Computer (O)</div>
                <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">{computerScore}</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Game History</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-60 overflow-y-auto">
                {gameHistory.length > 0 ? (
                  <ul className="space-y-2">
                    {gameHistory.map((result, index) => (
                      <li
                        key={index}
                        className="text-sm p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        Game {index + 1}: {result}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No games played yet
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">Health Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Improves cognitive function</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Reduces stress through mental engagement</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Enhances problem-solving skills</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
