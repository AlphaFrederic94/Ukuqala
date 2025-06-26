import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

const ImageViewer = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
          handleRotate();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Zoom in
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3));
  };
  
  // Zoom out
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.5));
  };
  
  // Rotate image
  const handleRotate = () => {
    setRotation(prevRotation => prevRotation + 90);
  };
  
  // Download image
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="relative max-w-5xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <button
            onClick={handleZoomIn}
            className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
            title="Zoom In (+ key)"
          >
            <ZoomIn className="w-6 h-6" />
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
            title="Zoom Out (- key)"
          >
            <ZoomOut className="w-6 h-6" />
          </button>
          <button
            onClick={handleRotate}
            className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
            title="Rotate (r key)"
          >
            <RotateCw className="w-6 h-6" />
          </button>
          <button
            onClick={handleDownload}
            className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
            title="Download Image"
          >
            <Download className="w-6 h-6" />
          </button>
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
            title="Close (Esc key)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Image */}
        <div className="overflow-auto max-w-full max-h-[90vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Enlarged view"
            className="object-contain rounded-lg"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
              maxWidth: '100%',
              maxHeight: '90vh'
            }}
          />
        </div>
        
        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {Math.round(scale * 100)}%
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageViewer;
