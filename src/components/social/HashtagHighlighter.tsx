import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HashtagHighlighterProps {
  text: string;
}

const HashtagHighlighter: React.FC<HashtagHighlighterProps> = ({ text }) => {
  const navigate = useNavigate();

  if (!text) return null;

  // Improved regex to match hashtags with international characters
  const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;

  // Find all hashtags in the text
  const hashtags = Array.from(text.matchAll(hashtagRegex));

  // If there are no hashtags, just return the text
  if (hashtags.length === 0) {
    return <span>{text}</span>;
  }

  // Create an array to hold the result
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  // Process each hashtag
  hashtags.forEach((match, i) => {
    const [fullMatch, hashtag] = match;
    const startIndex = match.index!;

    // Add text before the hashtag
    if (startIndex > lastIndex) {
      result.push(
        <span key={`text-${i}`}>
          {text.substring(lastIndex, startIndex)}
        </span>
      );
    }

    // Add the hashtag
    result.push(
      <span
        key={`hashtag-${i}`}
        className="text-blue-500 hover:underline cursor-pointer font-medium"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/social/hashtag/${hashtag}`);
        }}
      >
        {fullMatch}
      </span>
    );

    lastIndex = startIndex + fullMatch.length;
  });

  // Add any remaining text after the last hashtag
  if (lastIndex < text.length) {
    result.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{result}</>;
};

export default HashtagHighlighter;
