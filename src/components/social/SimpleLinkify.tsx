import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SimpleLinkifyProps {
  children: string;
}

const SimpleLinkify: React.FC<SimpleLinkifyProps> = ({ children }) => {
  const navigate = useNavigate();
  
  // Function to convert text to JSX with links, hashtags, and mentions
  const processText = (text: string) => {
    // Regular expressions for URLs, hashtags, and mentions
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hashtagRegex = /#(\w+)/g;
    const mentionRegex = /@(\w+)/g;
    
    // Split the text by URLs, hashtags, and mentions
    let parts: React.ReactNode[] = [text];
    
    // Process URLs
    parts = parts.flatMap(part => {
      if (typeof part !== 'string') return part;
      
      return part.split(urlRegex).map((subPart, i) => {
        if (i % 2 === 1) { // It's a URL
          return (
            <a 
              key={`url-${i}`}
              href={subPart}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {subPart}
            </a>
          );
        }
        return subPart;
      });
    });
    
    // Process hashtags
    parts = parts.flatMap(part => {
      if (typeof part !== 'string') return part;
      
      return part.split(hashtagRegex).map((subPart, i) => {
        if (i % 2 === 1) { // It's a hashtag
          return (
            <a 
              key={`hashtag-${i}`}
              href={`/social/hashtag/${subPart}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/social/hashtag/${subPart}`);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              #{subPart}
            </a>
          );
        }
        return subPart;
      });
    });
    
    // Process mentions
    parts = parts.flatMap(part => {
      if (typeof part !== 'string') return part;
      
      return part.split(mentionRegex).map((subPart, i) => {
        if (i % 2 === 1) { // It's a mention
          return (
            <a 
              key={`mention-${i}`}
              href={`/social/profile/${subPart}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/social/profile/${subPart}`);
              }}
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              @{subPart}
            </a>
          );
        }
        return subPart;
      });
    });
    
    return parts;
  };
  
  return <>{processText(children)}</>;
};

export default SimpleLinkify;
