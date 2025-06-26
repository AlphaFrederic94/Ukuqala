import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // initial delay before starting
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
  onComplete?: () => void;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50,
  delay = 0,
  className = '',
  showCursor = true,
  cursorChar = '|',
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursorBlink, setShowCursorBlink] = useState(true);

  // Start typing animation after delay
  useEffect(() => {
    if (currentIndex === 0 && delay > 0) {
      const delayTimer = setTimeout(() => {
        setCurrentIndex(1);
      }, delay);
      return () => clearTimeout(delayTimer);
    }
  }, [delay, currentIndex]);

  // Typing effect
  useEffect(() => {
    if (currentIndex > 0 && currentIndex <= text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex > text.length && !isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  // Cursor blinking effect
  useEffect(() => {
    if (showCursor) {
      const cursorTimer = setInterval(() => {
        setShowCursorBlink(prev => !prev);
      }, 530); // Standard cursor blink rate

      return () => clearInterval(cursorTimer);
    }
  }, [showCursor]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span 
          className={`inline-block transition-opacity duration-100 ${
            showCursorBlink ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            animation: isComplete ? 'none' : undefined,
            color: 'currentColor'
          }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
};

export default TypingAnimation;
