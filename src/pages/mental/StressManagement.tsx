import React, { useState, useEffect } from 'react';
import { Brain, Book, Clock, Calendar, Activity, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Stopwatch from '../../components/Stopwatch';
import { useUser } from '../../contexts/UserContext';
import { format } from 'date-fns';

interface StressLevel {
  date: string;
  level: number;
  notes: string;
}

const meditationPrograms = [
  {
    id: 1,
    title: 'Mindful Breathing',
    duration: 300, // 5 minutes
    description: 'Focus on your breath to calm your mind and reduce stress.',
    steps: [
      'Find a comfortable sitting position',
      'Close your eyes and take deep breaths',
      'Focus on the sensation of breathing',
      'When your mind wanders, gently return to your breath',
    ],
    benefits: [
      'Reduces anxiety',
      'Improves focus',
      'Lowers blood pressure',
      'Promotes emotional well-being'
    ]
  },
  {
    id: 2,
    title: 'Body Scan Meditation',
    duration: 600, // 10 minutes
    description: 'Progressively relax your body from head to toe.',
    steps: [
      'Lie down in a comfortable position',
      'Focus attention on different parts of your body',
      'Release tension in each area',
      'Move from your toes to your head',
    ],
    benefits: [
      'Releases physical tension',
      'Improves body awareness',
      'Helps with insomnia',
      'Reduces chronic pain'
    ]
  },
  {
    id: 3,
    title: 'Loving-Kindness Meditation',
    duration: 480, // 8 minutes
    description: 'Develop feelings of goodwill, kindness and warmth towards others.',
    steps: [
      'Start with self-compassion phrases',
      'Extend to loved ones',
      'Include neutral people',
      'Eventually include difficult people',
    ],
    benefits: [
      'Increases positive emotions',
      'Decreases emotional pain',
      'Develops empathy',
      'Reduces self-criticism'
    ]
  },
];

const recommendedBooks = [
  {
    title: 'The Stress-Proof Brain',
    author: 'Melanie Greenberg Ph.D.',
    link: 'https://www.amazon.com/Stress-Proof-Brain-Emotional-Resilience-Uncertainty/dp/1626252661',
  },
  {
    title: 'Why Zebras Don\'t Get Ulcers',
    author: 'Robert M. Sapolsky',
    link: 'https://www.amazon.com/Why-Zebras-Dont-Ulcers-Third/dp/0805073698',
  },
  {
    title: 'Full Catastrophe Living',
    author: 'Jon Kabat-Zinn',
    link: 'https://www.amazon.com/Full-Catastrophe-Living-Revised-Illness/dp/0345536932',
  },
];

const dailyQuotes = [
  {
    quote: "The greatest weapon against stress is our ability to choose one thought over another.",
    author: "William James"
  },
  {
    quote: "It's not stress that kills us, it's our reaction to it.",
    author: "Hans Selye"
  },
  {
    quote: "Breath is the power behind all things. I breathe in and know that good things will happen.",
    author: "Tao Porchon-Lynch"
  },
];

export default function StressManagement() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [selectedProgram, setSelectedProgram] = useState(meditationPrograms[0]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<number[]>([]);
  const [stressLevel, setStressLevel] = useState(5);
  const [stressNotes, setStressNotes] = useState('');
  const [stressHistory, setStressHistory] = useState<StressLevel[]>([
    { 
      date: format(new Date(Date.now() - 86400000 * 1), 'yyyy-MM-dd'),
      level: 7,
      notes: 'Work deadline'
    },
    {
      date: format(new Date(Date.now() - 86400000 * 2), 'yyyy-MM-dd'),
      level: 4,
      notes: 'Practiced meditation'
    },
    {
      date: format(new Date(Date.now() - 86400000 * 3), 'yyyy-MM-dd'),
      level: 6,
      notes: 'Family visit'
    },
    {
      date: format(new Date(Date.now() - 86400000 * 4), 'yyyy-MM-dd'),
      level: 5,
      notes: 'Regular day'
    },
    {
      date: format(new Date(Date.now() - 86400000 * 5), 'yyyy-MM-dd'),
      level: 8,
      notes: 'Argument with colleague'
    }
  ]);

  const handleProgramComplete = () => {
    setIsSessionActive(false);
    setCompletedSessions(prev => [...prev, selectedProgram.id]);
    
    // Simulate stress reduction after meditation
    setStressLevel(prev => Math.max(1, prev - 2));
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleLogStressLevel = () => {
    const newEntry: StressLevel = {
      date: format(new Date(), 'yyyy-MM-dd'),
      level: stressLevel,
      notes: stressNotes
    };
    
    setStressHistory(prev => [newEntry, ...prev]);
    setStressNotes('');
  };

  const getStressLevelLabel = (level: number) => {
    if (level <= 3) return 'Low';
    if (level <= 6) return 'Moderate';
    return 'High';
  };

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-800';
    if (level <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Stress Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Stress Tracker */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Track Your Stress</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Stress Level (1-10)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className={`px-2 py-1 rounded-full text-sm ${getStressLevelColor(stressLevel)}`}>
                    {stressLevel} - {getStressLevelLabel(stressLevel)}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={stressNotes}
                  onChange={(e) => setStressNotes(e.target.value)}
                  placeholder="What's causing your stress today?"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <button
                onClick={handleLogStressLevel}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Log Stress Level
              </button>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2 dark:text-white">Recent History</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stressHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="text-sm font-medium dark:text-white">{entry.date}</span>
                        {entry.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{entry.notes}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStressLevelColor(entry.level)}`}>
                        {entry.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meditation Programs */}
            <div>
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Meditation Programs</h2>
              <div className="space-y-4">
                {meditationPrograms.map((program) => (
                  <div
                    key={program.id}
                    className={`p-4 rounded-xl cursor-pointer transition-colors ${
                      selectedProgram.id === program.id
                        ? 'bg-blue-50 border-2 border-blue-500 dark:bg-blue-900'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                    onClick={() => setSelectedProgram(program)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Brain className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="font-semibold dark:text-white">{program.title}</h3>
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{program.duration / 60} min</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{program.description}</p>
                    {completedSessions.includes(program.id) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <Activity className="h-3 w-3 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Active Session */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">{selectedProgram.title}</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">{selectedProgram.description}</p>
                  
                  <div>
                    <h3 className="font-medium mb-2 dark:text-white">Steps:</h3>
                    <ul className="space-y-2">
                      {selectedProgram.steps.map((step, index) => (
                        <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-sm">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 dark:text-white">Benefits:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProgram.benefits.map((benefit, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    {isSessionActive ? (
                      <div className="flex flex-col items-center">
                        <Stopwatch
                          duration={selectedProgram.duration}
                          onComplete={handleProgramComplete}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Follow the steps above as you meditate
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartSession}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <Brain className="h-5 w-5 mr-2" />
                        Start Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resources Section */}
            <div className="grid grid-cols-1 gap-6">
              {/* Recommended Books */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  <Book className="h-5 w-5 inline mr-2" />
                  Recommended Reading
                </h3>
                <div className="space-y-3">
                  {recommendedBooks.map((book, index) => (
                    <a
                      key={index}
                      href={book.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium dark:text-white">{book.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Daily Quotes */}
              <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                  <Calendar className="h-5 w-5 inline mr-2" />
                  Daily Inspiration
                </h3>
                <div className="space-y-4">
                  {dailyQuotes.map((quote, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-800 dark:text-gray-200 italic">"{quote.quote}"</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">- {quote.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}