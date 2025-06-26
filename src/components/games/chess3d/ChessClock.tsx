import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';

// Time control presets in seconds
export const TIME_CONTROLS = {
  bullet: { initial: 60, increment: 0 },       // 1 minute
  blitz: { initial: 300, increment: 2 },       // 5 minutes + 2s increment
  rapid: { initial: 600, increment: 5 },       // 10 minutes + 5s increment
  classical: { initial: 1800, increment: 10 }, // 30 minutes + 10s increment
  custom: { initial: 600, increment: 0 }       // Custom time control
};

export type TimeControlType = keyof typeof TIME_CONTROLS;

interface ChessClockProps {
  activePlayer: 'white' | 'black';
  paused: boolean;
  timeControl: TimeControlType;
  onTimeUp: (player: 'white' | 'black') => void;
  onReset?: () => void;
  onPauseToggle?: () => void;
}

const ChessClock: React.FC<ChessClockProps> = ({
  activePlayer,
  paused,
  timeControl,
  onTimeUp,
  onReset,
  onPauseToggle
}) => {
  // Get time control settings
  const { initial, increment } = TIME_CONTROLS[timeControl];
  
  // State for player times
  const [whiteTime, setWhiteTime] = useState(initial);
  const [blackTime, setBlackTime] = useState(initial);
  
  // State for last move time (for increment)
  const [lastMoveTime, setLastMoveTime] = useState<number | null>(null);
  
  // Refs for audio
  const tickSound = useRef<HTMLAudioElement | null>(null);
  const lowTimeSound = useRef<HTMLAudioElement | null>(null);
  const timeUpSound = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio refs
  useEffect(() => {
    tickSound.current = new Audio('/sounds/chess/tick.mp3');
    lowTimeSound.current = new Audio('/sounds/chess/low-time.mp3');
    timeUpSound.current = new Audio('/sounds/chess/time-up.mp3');
    
    // Cleanup
    return () => {
      tickSound.current = null;
      lowTimeSound.current = null;
      timeUpSound.current = null;
    };
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (paused) return;
    
    // Handle player switch (add increment)
    if (lastMoveTime !== null && activePlayer === 'white') {
      setBlackTime(prev => prev + increment);
    } else if (lastMoveTime !== null && activePlayer === 'black') {
      setWhiteTime(prev => prev + increment);
    }
    
    // Update last move time
    setLastMoveTime(Date.now());
    
    // Set up timer
    const timer = setInterval(() => {
      if (activePlayer === 'white') {
        setWhiteTime(prev => {
          // Play sounds
          if (prev <= 10 && prev > 0) {
            lowTimeSound.current?.play().catch(() => {});
          } else if (prev % 10 === 0 && prev > 0) {
            tickSound.current?.play().catch(() => {});
          }
          
          // Check for time up
          if (prev <= 1) {
            timeUpSound.current?.play().catch(() => {});
            onTimeUp('white');
            clearInterval(timer);
            return 0;
          }
          
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          // Play sounds
          if (prev <= 10 && prev > 0) {
            lowTimeSound.current?.play().catch(() => {});
          } else if (prev % 10 === 0 && prev > 0) {
            tickSound.current?.play().catch(() => {});
          }
          
          // Check for time up
          if (prev <= 1) {
            timeUpSound.current?.play().catch(() => {});
            onTimeUp('black');
            clearInterval(timer);
            return 0;
          }
          
          return prev - 1;
        });
      }
    }, 1000);
    
    // Cleanup
    return () => clearInterval(timer);
  }, [activePlayer, paused, increment, onTimeUp]);
  
  // Reset function
  const handleReset = () => {
    setWhiteTime(initial);
    setBlackTime(initial);
    setLastMoveTime(null);
    if (onReset) onReset();
  };
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Chess Clock
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onPauseToggle}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* White player clock */}
        <div 
          className={`p-4 rounded-lg ${
            activePlayer === 'white' && !paused
              ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
            <span className="font-medium text-gray-800 dark:text-gray-200">White</span>
          </div>
          <div className={`text-3xl font-bold text-center ${
            whiteTime <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}>
            {formatTime(whiteTime)}
          </div>
        </div>
        
        {/* Black player clock */}
        <div 
          className={`p-4 rounded-lg ${
            activePlayer === 'black' && !paused
              ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full bg-black border border-gray-300"></div>
            <span className="font-medium text-gray-800 dark:text-gray-200">Black</span>
          </div>
          <div className={`text-3xl font-bold text-center ${
            blackTime <= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}>
            {formatTime(blackTime)}
          </div>
        </div>
      </div>
      
      {/* Time control info */}
      <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {timeControl.charAt(0).toUpperCase() + timeControl.slice(1)} 
        {increment > 0 ? ` + ${increment}s increment` : ''}
      </div>
    </div>
  );
};

export default ChessClock;
