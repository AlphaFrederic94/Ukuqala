import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PieceType, PieceColor } from '../../../lib/chess/engine';

// URLs for 3D models
const PIECE_MODELS = {
  'white-pawn': '/models/chess/white-pawn.glb',
  'white-knight': '/models/chess/white-knight.glb',
  'white-bishop': '/models/chess/white-bishop.glb',
  'white-rook': '/models/chess/white-rook.glb',
  'white-queen': '/models/chess/white-queen.glb',
  'white-king': '/models/chess/white-king.glb',
  'black-pawn': '/models/chess/black-pawn.glb',
  'black-knight': '/models/chess/black-knight.glb',
  'black-bishop': '/models/chess/black-bishop.glb',
  'black-rook': '/models/chess/black-rook.glb',
  'black-queen': '/models/chess/black-queen.glb',
  'black-king': '/models/chess/black-king.glb',
};

// Fallback piece geometries when models aren't available
const PIECE_GEOMETRIES: Record<PieceType, (size: number) => THREE.BufferGeometry> = {
  pawn: (size) => new THREE.CylinderGeometry(size * 0.2, size * 0.25, size * 0.5, 32),
  knight: (size) => new THREE.ConeGeometry(size * 0.25, size * 0.6, 32),
  bishop: (size) => new THREE.ConeGeometry(size * 0.25, size * 0.7, 32),
  rook: (size) => new THREE.BoxGeometry(size * 0.4, size * 0.6, size * 0.4),
  queen: (size) => new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.8, 32),
  king: (size) => new THREE.CylinderGeometry(size * 0.3, size * 0.3, size * 0.9, 32)
};

interface ChessPiece3DProps {
  type: PieceType;
  color: PieceColor;
  position: [number, number, number];
  squareSize: number;
  isAnimating?: boolean;
  targetPosition?: [number, number, number];
  onAnimationComplete?: () => void;
}

export const ChessPiece3D: React.FC<ChessPiece3DProps> = ({
  type,
  color,
  position,
  squareSize,
  isAnimating = false,
  targetPosition,
  onAnimationComplete
}) => {
  // Create a reference to the piece mesh
  const meshRef = useRef<THREE.Mesh>(null);
  
  // State for animation
  const [animationProgress, setAnimationProgress] = useState(0);
  const [startPosition] = useState<[number, number, number]>([...position]);
  
  // Try to load the 3D model
  const modelKey = `${color}-${type}`;
  const modelUrl = PIECE_MODELS[modelKey];
  
  // Animation frame
  useFrame((_, delta) => {
    // Handle animation if needed
    if (isAnimating && targetPosition && animationProgress < 1) {
      // Update animation progress
      const newProgress = Math.min(animationProgress + delta * 2, 1);
      setAnimationProgress(newProgress);
      
      // Update position
      if (meshRef.current) {
        meshRef.current.position.x = THREE.MathUtils.lerp(
          startPosition[0], targetPosition[0], newProgress
        );
        meshRef.current.position.y = THREE.MathUtils.lerp(
          startPosition[1], targetPosition[1], newProgress
        ) + Math.sin(newProgress * Math.PI) * 0.5; // Arc upward
        meshRef.current.position.z = THREE.MathUtils.lerp(
          startPosition[2], targetPosition[2], newProgress
        );
        
        // Rotation during movement
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          0, Math.PI * 2, newProgress
        );
      }
      
      // Call completion handler when done
      if (newProgress === 1 && onAnimationComplete) {
        onAnimationComplete();
      }
    }
  });
  
  // Determine material color
  const materialColor = color === 'white' ? '#f8fafc' : '#1e293b';
  
  // Use fallback geometry when models aren't available
  const geometry = PIECE_GEOMETRIES[type](squareSize * 0.8);
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      {/* Fallback geometry */}
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color={materialColor} 
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
};

export default ChessPiece3D;
