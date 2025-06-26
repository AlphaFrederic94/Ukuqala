import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ChessPiece3D } from './ChessPiece3D';
import { GameState, Position } from '../../../lib/chess/engine';

// Chess piece symbols for fallback rendering
const PIECE_SYMBOLS: Record<string, string> = {
  'white-pawn': '♙',
  'white-knight': '♘',
  'white-bishop': '♗',
  'white-rook': '♖',
  'white-queen': '♕',
  'white-king': '♔',
  'black-pawn': '♟',
  'black-knight': '♞',
  'black-bishop': '♝',
  'black-rook': '♜',
  'black-queen': '♛',
  'black-king': '♚',
};

// Board square component
interface SquareProps {
  position: [number, number, number];
  color: string;
  size: number;
  isSelected?: boolean;
  isValidMove?: boolean;
  onClick?: () => void;
}

const Square: React.FC<SquareProps> = ({
  position,
  color,
  size,
  isSelected = false,
  isValidMove = false,
  onClick
}) => {
  // Create refs for the mesh
  const meshRef = useRef<THREE.Mesh>(null);

  // Handle hover state
  const [hovered, setHovered] = useState(false);

  // Set cursor and update color on hover
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  // Determine the material color based on state
  let materialColor = color;
  if (isSelected) {
    materialColor = '#fbbf24'; // Yellow highlight for selected
  } else if (isValidMove) {
    materialColor = '#34d399'; // Green highlight for valid moves
  } else if (hovered) {
    // Lighten the color on hover
    const c = new THREE.Color(color);
    c.offsetHSL(0, 0, 0.1);
    materialColor = c.getStyle();
  }

  return (
    <mesh
      position={position}
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <boxGeometry args={[size, 0.1, size]} />
      <meshStandardMaterial color={materialColor} />

      {/* Add a highlight effect for valid moves */}
      {isValidMove && !isSelected && (
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
          <meshStandardMaterial color="#34d399" transparent opacity={0.6} />
        </mesh>
      )}
    </mesh>
  );
};

// Board component
interface BoardProps {
  gameState: GameState;
  selectedCell: Position | null;
  validMoves: Position[];
  onCellClick: (row: number, col: number) => void;
}

const Board: React.FC<BoardProps> = ({
  gameState,
  selectedCell,
  validMoves,
  onCellClick
}) => {
  // Get the board from the game state
  const board = gameState.board;

  // Set up the board dimensions
  const boardSize = 8;
  const squareSize = 1;

  // Create the squares
  const squares = [];
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      // Calculate the position in 3D space
      // We center the board at (0,0,0) and adjust coordinates
      const x = col * squareSize - (boardSize * squareSize) / 2 + squareSize / 2;
      const z = row * squareSize - (boardSize * squareSize) / 2 + squareSize / 2;
      const y = 0;

      // Determine if this square is dark or light
      const isDark = (row + col) % 2 === 1;
      const color = isDark ? '#1e40af' : '#bfdbfe'; // Dark blue or light blue

      // Check if this square is selected or a valid move
      const isSelected = selectedCell ? selectedCell[0] === row && selectedCell[1] === col : false;
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col);

      // Add the square to the array
      squares.push(
        <Square
          key={`square-${row}-${col}`}
          position={[x, y, z]}
          color={color}
          size={squareSize}
          isSelected={isSelected}
          isValidMove={isValidMove}
          onClick={() => onCellClick(row, col)}
        />
      );

      // Add the piece if there is one
      const piece = board[row][col];
      if (piece) {
        squares.push(
          <ChessPiece3D
            key={`piece-${row}-${col}`}
            type={piece.type}
            color={piece.color}
            position={[x, 0.05, z]}
            squareSize={squareSize}
          />
        );
      }
    }
  }

  return (
    <group>
      {/* Board base */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[boardSize * squareSize + 0.5, 0.2, boardSize * squareSize + 0.5]} />
        <meshStandardMaterial color="#8b4513" /> {/* Wooden board base */}
      </mesh>

      {/* Squares and pieces */}
      {squares}

      {/* Board edge coordinates */}
      {Array.from({ length: boardSize }).map((_, i) => (
        <React.Fragment key={`coords-${i}`}>
          {/* File labels (a-h) */}
          <Text
            position={[
              i * squareSize - (boardSize * squareSize) / 2 + squareSize / 2,
              0.05,
              (boardSize * squareSize) / 2 + 0.3
            ]}
            fontSize={0.3}
            color="#333"
          >
            {String.fromCharCode(97 + i)}
          </Text>

          {/* Rank labels (1-8) */}
          <Text
            position={[
              -(boardSize * squareSize) / 2 - 0.3,
              0.05,
              i * squareSize - (boardSize * squareSize) / 2 + squareSize / 2
            ]}
            fontSize={0.3}
            color="#333"
          >
            {String(8 - i)}
          </Text>
        </React.Fragment>
      ))}
    </group>
  );
};

// Camera setup
const CameraSetup: React.FC = () => {
  const { camera } = useThree();

  useEffect(() => {
    // Position the camera for a good view of the board
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
};

// Main 3D Chess Board component
interface ChessBoard3DProps {
  gameState: GameState;
  selectedCell: Position | null;
  validMoves: Position[];
  onCellClick: (row: number, col: number) => void;
}

const ChessBoard3D: React.FC<ChessBoard3DProps> = ({
  gameState,
  selectedCell,
  validMoves,
  onCellClick
}) => {
  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-xl">
      <Canvas shadows>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 10, 10]} />
        <CameraSetup />

        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 10, -5]} intensity={0.5} />

        {/* Chess Board */}
        <Board
          gameState={gameState}
          selectedCell={selectedCell}
          validMoves={validMoves}
          onCellClick={onCellClick}
        />
      </Canvas>
    </div>
  );
};

export default ChessBoard3D;
