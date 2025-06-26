import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  onImageClick: (index: number) => void;
  maxDisplay?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImageClick,
  maxDisplay = 4
}) => {
  if (!images || images.length === 0) {
    return null;
  }
  
  // Single image
  if (images.length === 1) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="rounded-lg overflow-hidden cursor-pointer"
        onClick={() => onImageClick(0)}
      >
        <img
          src={images[0]}
          alt="Gallery"
          className="w-full h-auto object-cover max-h-96"
          loading="lazy"
        />
      </motion.div>
    );
  }
  
  // Two images
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        {images.map((image, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            className="cursor-pointer aspect-square"
            onClick={() => onImageClick(index)}
          >
            <img
              src={image}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    );
  }
  
  // Three images
  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer row-span-2"
          onClick={() => onImageClick(0)}
        >
          <img
            src={images[0]}
            alt="Gallery 1"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => onImageClick(1)}
        >
          <img
            src={images[1]}
            alt="Gallery 2"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => onImageClick(2)}
        >
          <img
            src={images[2]}
            alt="Gallery 3"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
      </div>
    );
  }
  
  // Four or more images
  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;
  
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
      {displayImages.map((image, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.02 }}
          className={`cursor-pointer ${index === 0 && images.length === 4 ? 'col-span-2' : ''}`}
          onClick={() => onImageClick(index)}
          style={{ aspectRatio: index === 0 && images.length === 4 ? '2/1' : '1/1' }}
        >
          <div className="relative w-full h-full">
            <img
              src={image}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Show remaining count on the last visible image */}
            {index === maxDisplay - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <div className="text-white text-center">
                  <span className="text-2xl font-bold">+{remainingCount}</span>
                  <div className="flex items-center justify-center mt-1">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">more</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ImageGallery;
