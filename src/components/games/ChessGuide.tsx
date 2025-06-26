import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  X, 
  HelpCircle, 
  BookOpen, 
  Zap, 
  Award, 
  Brain, 
  Crown, 
  Swords, 
  Lightbulb
} from 'lucide-react';

// Chess piece images with fallback symbols
const PIECE_SYMBOLS: Record<string, string> = {
  'pawn': '♙',
  'knight': '♘',
  'bishop': '♗',
  'rook': '♖',
  'queen': '♕',
  'king': '♔',
};

// Chess piece movement patterns
const PIECE_MOVEMENTS = {
  pawn: "Moves forward one square (or two on first move). Captures diagonally.",
  knight: "Moves in an L-shape: two squares in one direction, then one square perpendicular.",
  bishop: "Moves diagonally any number of squares.",
  rook: "Moves horizontally or vertically any number of squares.",
  queen: "Moves horizontally, vertically, or diagonally any number of squares.",
  king: "Moves one square in any direction. Can castle with a rook under specific conditions."
};

// Chess tips by category
const CHESS_TIPS = {
  beginner: [
    "Control the center of the board with pawns and pieces",
    "Develop your knights and bishops early",
    "Castle early to protect your king",
    "Connect your rooks by moving the queen",
    "Don't bring your queen out too early",
    "Look for checks, captures, and threats on every move"
  ],
  intermediate: [
    "Create and exploit weaknesses in your opponent's position",
    "Trade pieces when ahead in material",
    "Keep pieces active and avoid passive positions",
    "Plan your pawn structure carefully",
    "Look for tactical opportunities like forks, pins, and skewers",
    "Think about your opponent's threats and plans"
  ],
  advanced: [
    "Calculate variations several moves deep",
    "Understand pawn structure imbalances",
    "Create and exploit weak squares in enemy territory",
    "Coordinate your pieces for maximum effectiveness",
    "Recognize typical endgame patterns",
    "Study classic games to improve pattern recognition"
  ]
};

// Common tactical patterns
const TACTICAL_PATTERNS = [
  {
    name: "Fork",
    description: "A single piece attacks two or more enemy pieces simultaneously.",
    example: "Knight fork: Your knight attacks the opponent's king and queen at the same time."
  },
  {
    name: "Pin",
    description: "A piece cannot move because it would expose a more valuable piece to capture.",
    example: "Bishop pins a knight to the king, preventing the knight from moving."
  },
  {
    name: "Skewer",
    description: "Similar to a pin, but the more valuable piece is in front and forced to move.",
    example: "Rook attacks queen with king behind it, forcing the queen to move."
  },
  {
    name: "Discovered Attack",
    description: "Moving one piece reveals an attack from another piece behind it.",
    example: "Moving a knight reveals a bishop's attack on the opponent's queen."
  }
];

// Chess benefits
const CHESS_BENEFITS = [
  {
    title: "Improves Memory",
    description: "Chess players develop better memory through recalling patterns and strategies."
  },
  {
    title: "Enhances Problem-Solving",
    description: "Chess requires constant problem-solving and adaptation to new situations."
  },
  {
    title: "Boosts Concentration",
    description: "Playing chess improves focus and attention span through sustained concentration."
  },
  {
    title: "Develops Planning Skills",
    description: "Chess teaches how to plan several moves ahead and anticipate consequences."
  },
  {
    title: "Exercises Both Brain Hemispheres",
    description: "Chess engages both analytical and creative thinking simultaneously."
  }
];

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeTab: string;
  onClick: (id: string) => void;
}

const Tab: React.FC<TabProps> = ({ id, label, icon, activeTab, onClick }) => {
  const isActive = activeTab === id;
  
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};

interface PieceCardProps {
  type: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
}

const PieceCard: React.FC<PieceCardProps> = ({ type }) => {
  const symbol = PIECE_SYMBOLS[type];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
          <span className="text-2xl">{symbol}</span>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{type}</h4>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{PIECE_MOVEMENTS[type]}</p>
    </div>
  );
};

interface TipCardProps {
  tip: string;
  index: number;
}

const TipCard: React.FC<TipCardProps> = ({ tip, index }) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
        {index + 1}
      </div>
      <p className="text-gray-700 dark:text-gray-300">{tip}</p>
    </div>
  );
};

interface TacticCardProps {
  tactic: {
    name: string;
    description: string;
    example: string;
  };
}

const TacticCard: React.FC<TacticCardProps> = ({ tactic }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="p-3 cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="font-semibold text-gray-900 dark:text-white">{tactic.name}</h4>
        <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3"
          >
            <p className="text-gray-700 dark:text-gray-300 mb-2">{tactic.description}</p>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-700 dark:text-gray-200">Example: </span>
              {tactic.example}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface BenefitCardProps {
  benefit: {
    title: string;
    description: string;
  };
}

const BenefitCard: React.FC<BenefitCardProps> = ({ benefit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{benefit.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300">{benefit.description}</p>
    </div>
  );
};

interface ChessGuideProps {
  onClose: () => void;
}

const ChessGuide: React.FC<ChessGuideProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('basics');
  const [tipLevel, setTipLevel] = useState('beginner');
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Chess Guide
        </h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          aria-label="Close guide"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <Tab 
            id="basics" 
            label="Basics" 
            icon={<BookOpen className="h-4 w-4" />} 
            activeTab={activeTab} 
            onClick={setActiveTab} 
          />
          <Tab 
            id="pieces" 
            label="Pieces" 
            icon={<Crown className="h-4 w-4" />} 
            activeTab={activeTab} 
            onClick={setActiveTab} 
          />
          <Tab 
            id="tips" 
            label="Tips" 
            icon={<Lightbulb className="h-4 w-4" />} 
            activeTab={activeTab} 
            onClick={setActiveTab} 
          />
          <Tab 
            id="tactics" 
            label="Tactics" 
            icon={<Swords className="h-4 w-4" />} 
            activeTab={activeTab} 
            onClick={setActiveTab} 
          />
          <Tab 
            id="benefits" 
            label="Benefits" 
            icon={<Brain className="h-4 w-4" />} 
            activeTab={activeTab} 
            onClick={setActiveTab} 
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {/* Basics Tab */}
        {activeTab === 'basics' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Play Chess</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Objective</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    The goal is to checkmate your opponent's king, which means the king is in a position to be captured (in "check") and cannot escape capture.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Setup</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Chess is played on an 8×8 checkered board. Each player begins with 16 pieces: one king, one queen, two rooks, two knights, two bishops, and eight pawns.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Movement</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Each piece moves differently. Players take turns moving one piece at a time. Pieces capture opponent pieces by moving to their square.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Special Moves</h4>
                  <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-1">
                    <li><strong>Castling:</strong> King moves two squares toward a rook, and the rook moves to the square the king crossed.</li>
                    <li><strong>En Passant:</strong> A pawn can capture an opponent's pawn that has moved two squares forward from its starting position.</li>
                    <li><strong>Promotion:</strong> When a pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a queen).</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Game End</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    The game ends when a king is checkmated, a player resigns, or a draw occurs (stalemate, insufficient material, threefold repetition, fifty-move rule, or by agreement).
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Quick Help</h4>
                  <p className="text-blue-700 dark:text-blue-200 text-sm">
                    While playing, you can select a piece to see its valid moves highlighted on the board. The computer will play as black pieces at your selected difficulty level.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Pieces Tab */}
        {activeTab === 'pieces' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PieceCard type="pawn" />
            <PieceCard type="knight" />
            <PieceCard type="bishop" />
            <PieceCard type="rook" />
            <PieceCard type="queen" />
            <PieceCard type="king" />
          </div>
        )}
        
        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chess Tips</h3>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <button 
                    className={`px-3 py-1 text-sm ${tipLevel === 'beginner' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setTipLevel('beginner')}
                  >
                    Beginner
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm ${tipLevel === 'intermediate' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setTipLevel('intermediate')}
                  >
                    Intermediate
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm ${tipLevel === 'advanced' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setTipLevel('advanced')}
                  >
                    Advanced
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {CHESS_TIPS[tipLevel].map((tip, index) => (
                  <TipCard key={index} tip={tip} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Tactics Tab */}
        {activeTab === 'tactics' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Common Tactical Patterns</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Recognizing these patterns will help you find winning moves and avoid traps.
              </p>
            </div>
            
            {TACTICAL_PATTERNS.map((tactic, index) => (
              <TacticCard key={index} tactic={tactic} />
            ))}
          </div>
        )}
        
        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Benefits of Playing Chess</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Chess is not just a game—it's a powerful tool for mental development and wellbeing.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHESS_BENEFITS.map((benefit, index) => (
                <BenefitCard key={index} benefit={benefit} />
              ))}
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 shadow-sm border border-green-100 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-1">Brain Health</h4>
                  <p className="text-green-700 dark:text-green-200 text-sm">
                    Studies show that playing chess can help prevent cognitive decline and reduce the risk of dementia by keeping your brain active and engaged.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Explore the tabs above to learn more about chess
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
};

export default ChessGuide;
