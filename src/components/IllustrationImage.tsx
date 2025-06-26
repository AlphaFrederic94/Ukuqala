import React from 'react';

interface IllustrationImageProps {
  name: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * A component for displaying SVG illustrations from the illustrations directory
 */
const IllustrationImage: React.FC<IllustrationImageProps> = ({
  name,
  alt,
  className = '',
  width = 'auto',
  height = 'auto'
}) => {
  return (
    <img
      src={`/images/illustrations/${name}.svg`}
      alt={alt}
      className={`illustration ${className}`}
      style={{ width, height }}
    />
  );
};

export default IllustrationImage;
