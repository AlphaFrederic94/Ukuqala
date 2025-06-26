import React from 'react';

interface SocialBackgroundProps {
  className?: string;
}

const SocialBackground: React.FC<SocialBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden opacity-5 dark:opacity-10 pointer-events-none ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 1000 1000"
        className="text-blue-500 dark:text-blue-400"
      >
        <defs>
          <pattern
            id="socialPattern"
            patternUnits="userSpaceOnUse"
            width="100"
            height="100"
            patternTransform="scale(2) rotate(0)"
          >
            <path
              d="M50 0 L50 100 M0 50 L100 50"
              strokeWidth="0.5"
              stroke="currentColor"
              fill="none"
            />
            <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path
              d="M20 20 L80 80 M80 20 L20 80"
              strokeWidth="0.5"
              stroke="currentColor"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#socialPattern)" />
        
        {/* Social Media Icons */}
        <g className="social-icons" fill="currentColor">
          {/* Heart */}
          <path d="M100 200 C100 150, 150 100, 200 150 C250 100, 300 150, 300 200 C300 300, 200 350, 200 350 C200 350, 100 300, 100 200 Z" />
          
          {/* Comment Bubble */}
          <path d="M500 150 C450 150, 400 200, 400 250 L400 300 C400 350, 450 400, 500 400 L550 400 L550 450 L600 400 L650 400 C700 400, 750 350, 750 300 L750 250 C750 200, 700 150, 650 150 Z" />
          
          {/* Share Arrow */}
          <path d="M850 150 L950 250 L850 350 L850 300 L750 300 L750 200 L850 200 Z" />
          
          {/* Thumbs Up */}
          <path d="M150 500 L200 500 L200 650 L150 650 Z M200 550 C200 550, 250 500, 300 500 L350 500 C400 500, 400 550, 400 550 L400 650 C400 650, 350 700, 300 700 L200 700 Z" />
          
          {/* Camera */}
          <path d="M500 500 L600 500 L625 525 L650 525 C675 525, 700 550, 700 575 L700 675 C700 700, 675 725, 650 725 L500 725 C475 725, 450 700, 450 675 L450 575 C450 550, 475 525, 500 525 Z M575 625 C600 625, 625 600, 625 575 C625 550, 600 525, 575 525 C550 525, 525 550, 525 575 C525 600, 550 625, 575 625 Z" />
          
          {/* Hashtag */}
          <path d="M800 500 L850 500 L825 600 L775 600 Z M875 500 L925 500 L900 600 L850 600 Z M775 550 L925 550 M750 575 L900 575" />
          
          {/* User Profile */}
          <circle cx="200" cy="850" r="50" />
          <path d="M150 950 C150 900, 250 900, 250 950 C250 975, 225 975, 200 975 C175 975, 150 975, 150 950 Z" />
          
          {/* Bell Notification */}
          <path d="M500 800 C500 775, 525 750, 550 750 C575 750, 600 775, 600 800 L600 900 L500 900 Z M525 925 C525 925, 550 950, 575 925" />
          <circle cx="550" cy="750" r="10" />
          
          {/* Globe */}
          <circle cx="850" cy="850" r="75" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M800 825 C825 800, 875 800, 900 825 M800 875 C825 900, 875 900, 900 875 M850 775 L850 925 M775 850 L925 850" stroke="currentColor" strokeWidth="5" fill="none" />
        </g>
      </svg>
    </div>
  );
};

export default SocialBackground;
