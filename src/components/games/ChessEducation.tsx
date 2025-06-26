import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Brain, Award, BookOpen, Zap, Heart } from 'lucide-react';

// Chess education images
const CHESS_IMAGES = {
  board: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  pieces: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  strategy: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  brain: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  children: 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
};

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  toggleOpen: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, icon, children, isOpen, toggleOpen }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={toggleOpen}
      >
        <div className="flex items-center">
          <div className="mr-3 text-blue-600 dark:text-blue-400">{icon}</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div>{isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-gray-50 dark:bg-gray-900"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default function ChessEducation() {
  const [openSection, setOpenSection] = useState<string | null>('rules');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">The Royal Game of Chess</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover the fascinating world of chess - a game of strategy, intellect, and endless possibilities that has captivated minds for centuries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <img 
            src={CHESS_IMAGES.board} 
            alt="Chess board setup" 
            className="w-full h-64 object-cover rounded-lg shadow-md" 
          />
        </div>
        <div>
          <img 
            src={CHESS_IMAGES.pieces} 
            alt="Chess pieces" 
            className="w-full h-64 object-cover rounded-lg shadow-md" 
          />
        </div>
      </div>

      <AccordionItem
        title="Rules of Chess"
        icon={<BookOpen className="h-6 w-6" />}
        isOpen={openSection === 'rules'}
        toggleOpen={() => toggleSection('rules')}
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-2/3">
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">The Basics</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Chess is played on an 8×8 checkered board between two players. Each player begins with 16 pieces: one king, one queen, two rooks, two knights, two bishops, and eight pawns.
              </p>
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">The Objective</h4>
              <p className="text-gray-700 dark:text-gray-300">
                The goal is to checkmate your opponent's king, which means the king is in a position to be captured (in "check") and cannot escape capture.
              </p>
            </div>
            <div className="md:w-1/3">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Did You Know?</h5>
                <p className="text-blue-700 dark:text-blue-200 text-sm">
                  The modern game of chess has been played for over 500 years, but its origins date back to the 6th century in India.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">How Pieces Move</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>King:</strong> One square in any direction</li>
              <li><strong>Queen:</strong> Any number of squares diagonally, horizontally, or vertically</li>
              <li><strong>Rook:</strong> Any number of squares horizontally or vertically</li>
              <li><strong>Bishop:</strong> Any number of squares diagonally</li>
              <li><strong>Knight:</strong> Moves in an L-shape (two squares in one direction, then one square perpendicular)</li>
              <li><strong>Pawn:</strong> One square forward (or two on first move), captures diagonally</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Special Moves</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Castling:</strong> King moves two squares toward a rook, and the rook moves to the square the king crossed</li>
              <li><strong>En Passant:</strong> A pawn can capture an opponent's pawn that has moved two squares forward from its starting position</li>
              <li><strong>Promotion:</strong> When a pawn reaches the opposite end of the board, it can be promoted to any other piece (usually a queen)</li>
            </ul>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem
        title="Chess Strategies"
        icon={<Zap className="h-6 w-6" />}
        isOpen={openSection === 'strategies'}
        toggleOpen={() => toggleSection('strategies')}
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-2/3">
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Opening Principles</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Control the center of the board</li>
                <li>Develop your knights and bishops early</li>
                <li>Castle to protect your king</li>
                <li>Connect your rooks</li>
                <li>Don't move the same piece multiple times in the opening</li>
              </ul>
            </div>
            <div className="md:w-1/3">
              <img 
                src={CHESS_IMAGES.strategy} 
                alt="Chess strategy" 
                className="w-full h-40 object-cover rounded-lg shadow-sm" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Common Tactics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Fork</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  A single piece attacks two or more enemy pieces simultaneously.
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Pin</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  A piece cannot move because it would expose a more valuable piece to capture.
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Skewer</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Similar to a pin, but the more valuable piece is in front.
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Discovered Attack</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Moving one piece reveals an attack from another piece.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Endgame Principles</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              <li>Activate your king in the endgame</li>
              <li>Promote pawns to queens when possible</li>
              <li>Create passed pawns (pawns with no opposing pawns in front)</li>
              <li>Control key squares to restrict your opponent's king</li>
              <li>Know basic checkmate patterns (e.g., king and queen vs king)</li>
            </ul>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem
        title="Benefits for Brain Health"
        icon={<Brain className="h-6 w-6" />}
        isOpen={openSection === 'brain'}
        toggleOpen={() => toggleSection('brain')}
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <img 
                src={CHESS_IMAGES.brain} 
                alt="Brain health" 
                className="w-full h-48 object-cover rounded-lg shadow-sm" 
              />
            </div>
            <div className="md:w-2/3">
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Cognitive Benefits</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Chess is not just a game—it's a powerful brain workout. Research has shown that regular chess play can improve various cognitive abilities:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li><strong>Problem-solving skills</strong> through analyzing complex positions</li>
                <li><strong>Critical thinking</strong> by evaluating multiple options</li>
                <li><strong>Pattern recognition</strong> by identifying familiar structures</li>
                <li><strong>Memory improvement</strong> through recalling openings and strategies</li>
                <li><strong>Concentration</strong> by maintaining focus during long games</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-300">Scientific Evidence</h4>
            <p className="text-green-700 dark:text-green-200 mb-2">
              Multiple studies have demonstrated the positive effects of chess on brain function:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-green-700 dark:text-green-200">
              <li>A study in The New England Journal of Medicine found that mentally challenging activities like chess reduce the risk of dementia.</li>
              <li>Research published in the Spanish Journal of Psychology showed that children who played chess improved their cognitive abilities more than those who didn't.</li>
              <li>A study at the University of Memphis found that chess players demonstrated enhanced memory, planning, and problem-solving abilities.</li>
            </ul>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem
        title="Physical and Mental Health Benefits"
        icon={<Heart className="h-6 w-6" />}
        isOpen={openSection === 'health'}
        toggleOpen={() => toggleSection('health')}
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Mental Wellness</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Chess offers significant mental health benefits beyond cognitive improvements:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li><strong>Stress reduction</strong> through focused attention and flow state</li>
                <li><strong>Improved self-confidence</strong> as skills develop</li>
                <li><strong>Enhanced patience and emotional control</strong> during challenging situations</li>
                <li><strong>Social connection</strong> through playing with others</li>
                <li><strong>Mindfulness practice</strong> by being present in the game</li>
              </ul>
            </div>
            <div className="md:w-1/3">
              <img 
                src={CHESS_IMAGES.children} 
                alt="Children playing chess" 
                className="w-full h-48 object-cover rounded-lg shadow-sm" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Physical Benefits</h4>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              While chess is primarily a mental activity, it can contribute to physical health in several ways:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Blood Pressure</h5>
                <p className="text-sm text-purple-700 dark:text-purple-200">
                  The focused, meditative state of chess can help lower blood pressure and reduce stress hormones.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Brain Health</h5>
                <p className="text-sm text-purple-700 dark:text-purple-200">
                  Chess stimulates blood flow to the brain, promoting neuronal health and potentially reducing age-related decline.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Sleep Quality</h5>
                <p className="text-sm text-purple-700 dark:text-purple-200">
                  Mental exercise from chess can help regulate sleep patterns and improve overall sleep quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem
        title="Getting Better at Chess"
        icon={<Award className="h-6 w-6" />}
        isOpen={openSection === 'improvement'}
        toggleOpen={() => toggleSection('improvement')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Practice Strategies</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>Solve chess puzzles</strong> to improve tactical vision</li>
              <li><strong>Study master games</strong> to understand strategic concepts</li>
              <li><strong>Analyze your own games</strong> to identify mistakes and patterns</li>
              <li><strong>Play against stronger opponents</strong> to challenge yourself</li>
              <li><strong>Learn common endgame positions</strong> to improve technical skills</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <h4 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-300">Tips for Beginners</h4>
            <ol className="list-decimal pl-5 space-y-1 text-yellow-700 dark:text-yellow-200">
              <li>Focus on understanding principles rather than memorizing moves</li>
              <li>Practice regularly, even if it's just 15-30 minutes a day</li>
              <li>Don't get discouraged by losses—they're valuable learning opportunities</li>
              <li>Join a chess club or online community for support and motivation</li>
              <li>Use chess apps and websites with interactive lessons and puzzles</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Resources for Learning</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Online Platforms</h5>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                  <li>Chess.com</li>
                  <li>Lichess.org</li>
                  <li>Chess24.com</li>
                  <li>ChessKid (for children)</li>
                </ul>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Recommended Books</h5>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                  <li>"Bobby Fischer Teaches Chess"</li>
                  <li>"Logical Chess: Move by Move" by Irving Chernev</li>
                  <li>"My System" by Aron Nimzowitsch</li>
                  <li>"The Art of Learning" by Josh Waitzkin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AccordionItem>
    </div>
  );
}
