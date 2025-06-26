import React, { useState, useEffect } from 'react';
import { Heart, Brain, Apple, Dumbbell, Coffee, Moon, Book, ArrowRight, CheckCircle, Info, Sparkles, Gamepad2, Grid3X3, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseProgram from './exercise/ExerciseProgram';

const categories = [
  { id: 'all', name: 'All Tips', icon: Heart },
  { id: 'mental', name: 'Mental Health', icon: Brain },
  { id: 'diet', name: 'Diet', icon: Apple },
  { id: 'exercise', name: 'Exercise', icon: Dumbbell },
  { id: 'lifestyle', name: 'Lifestyle', icon: Coffee },
  { id: 'sleep', name: 'Sleep', icon: Moon },
  { id: 'games', name: 'Brain Games', icon: Gamepad2 },
];

const healthTips = [
  {
    id: 1,
    category: 'diet',
    title: 'Balanced Nutrition Guide',
    content: 'Include a variety of fruits, vegetables, whole grains, and lean proteins in your daily diet.',
    description: 'A balanced diet provides essential nutrients for optimal health. Learn how to create nutritious meals that fuel your body and mind.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=500',
    route: '/nutrition/plan',
    benefits: ['Improved energy levels', 'Better weight management', 'Reduced risk of chronic diseases'],
    featured: true
  },
  {
    id: 2,
    category: 'exercise',
    title: 'Daily Exercise Routine',
    content: '30 minutes of moderate exercise daily can significantly improve your health.',
    description: 'Regular physical activity strengthens your heart, improves mood, and helps maintain a healthy weight. Discover exercises that fit your lifestyle.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=500',
    route: '/exercise/program',
    benefits: ['Increased cardiovascular health', 'Improved muscle strength', 'Better mental wellbeing'],
    featured: true
  },
  {
    id: 3,
    category: 'mental',
    title: 'Stress Management',
    content: 'Practice mindfulness and meditation to reduce stress and improve mental clarity.',
    description: 'Effective stress management techniques can help you cope with life\'s challenges. Learn mindfulness practices that promote mental wellbeing.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500',
    route: '/mental/stress-management',
    benefits: ['Reduced anxiety', 'Better focus and concentration', 'Improved sleep quality'],
    featured: true
  },
  {
    id: 4,
    category: 'sleep',
    title: 'Better Sleep Habits',
    content: 'Maintain a consistent sleep schedule and create a relaxing bedtime routine.',
    description: 'Quality sleep is essential for physical and mental health. Discover strategies to improve your sleep patterns and wake up refreshed.',
    image: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&q=80&w=500',
    route: '/sleep/program',
    benefits: ['Enhanced cognitive function', 'Improved immune system', 'Better mood regulation'],
    featured: false
  },
  {
    id: 5,
    category: 'diet',
    title: 'Hydration Importance',
    content: 'Drinking adequate water daily is crucial for overall health and bodily functions.',
    description: 'Proper hydration supports digestion, circulation, and temperature regulation. Learn how to maintain optimal hydration throughout the day.',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=500',
    route: '/nutrition/hydration',
    benefits: ['Improved skin health', 'Better digestion', 'Enhanced physical performance'],
    featured: false
  },
  {
    id: 6,
    category: 'games',
    title: 'Brain Games',
    content: 'Exercise your mind with games designed to improve cognitive function and mental agility.',
    description: 'Brain games can help maintain cognitive health and provide a fun way to challenge your mind. Discover games that boost memory, problem-solving, and strategic thinking.',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&q=80&w=500',
    route: '/games',
    benefits: ['Improved cognitive function', 'Enhanced problem-solving skills', 'Better memory retention'],
    featured: true
  },
  {
    id: 8,
    category: 'spiritual',
    title: 'Bible Reading',
    content: 'Spiritual wellness is an important part of overall health and wellbeing.',
    description: 'Take time for spiritual reflection with Bible readings in NIV (English) or LSG (French). Save your progress and favorite verses.',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=500',
    route: '/exercise/strength-training',
    benefits: ['Spiritual growth', 'Mental peace', 'Emotional wellbeing'],
    featured: true
  }
];

export default function HealthTips() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBodyType, setSelectedBodyType] = useState<'ectomorph' | 'mesomorph' | 'endomorph' | null>(null);
  const [hoveredTip, setHoveredTip] = useState<number | null>(null);

  const filteredTips = selectedCategory === 'all'
    ? healthTips
    : healthTips.filter(tip => tip.category === selectedCategory);

  const featuredTips = healthTips.filter(tip => tip.featured);

  const handleTipClick = (route: string) => {
    navigate(route);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid)"/>
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-white mb-4"
            >
              {t('healthTips.title', 'Health & Wellness Tips')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-blue-100 mb-8"
            >
              Discover evidence-based advice to improve your physical and mental wellbeing.
            </motion.p>

            {/* Categories */}
            <motion.div
              className="flex flex-wrap gap-3 mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedBodyType(null);
                    }}
                    className={`flex items-center px-5 py-2.5 rounded-full transition-all ${
                      selectedCategory === category.id
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {t(`healthTips.categories.${category.id}`, category.name)}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Featured Tips Carousel */}
      {selectedCategory === 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold dark:text-white">Featured Health Tips</h2>
            <button
              onClick={() => navigate('/nutrition/plan')}
              className="text-blue-600 dark:text-blue-400 flex items-center hover:underline"
            >
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTips.map(tip => (
              <motion.div
                key={tip.id}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden shadow-sm cursor-pointer"
                onClick={() => handleTipClick(tip.route)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={tip.image}
                    alt={tip.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <h3 className="text-lg font-semibold text-white">{tip.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{tip.content}</p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    <span className="font-medium">{t('common.readMore', 'Read More')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        {/* Games Section */}
        {selectedCategory === 'games' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center">
              <Gamepad2 className="h-6 w-6 mr-2 text-indigo-500" />
              {t('healthTips.programs.games.title', 'Brain Games')}
            </h2>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Boost Your Cognitive Health</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Playing brain games regularly can help improve memory, focus, and problem-solving skills.
                Our selection of games is designed to challenge different cognitive abilities while being fun and engaging.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Grid3X3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">Tic-Tac-Toe</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    A classic game of strategy that helps improve planning and spatial reasoning.
                  </p>
                  <button
                    onClick={() => navigate('/games/tic-tac-toe')}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Play Now
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <Box className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">3D Chess</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    The ultimate game of strategy with tournament-style timing and beautiful animations.
                  </p>
                  <button
                    onClick={() => navigate('/games/chess3d')}
                    className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                  >
                    Play Now
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/games')}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>View All Games</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Programs Section */}
        {selectedCategory === 'exercise' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center">
              <Dumbbell className="h-6 w-6 mr-2 text-blue-500" />
              {t('healthTips.programs.exercise.title', 'Exercise Programs')}
            </h2>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Select Your Body Type</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">We'll customize exercise recommendations based on your body type.</p>

              <div className="flex flex-wrap gap-4 mb-6">
                {['ectomorph', 'mesomorph', 'endomorph'].map((type) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBodyType(type as 'ectomorph' | 'mesomorph' | 'endomorph')}
                    className={`px-5 py-3 rounded-lg transition-all ${
                      selectedBodyType === type
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {t(`healthTips.programs.exercise.bodyTypes.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
                  </motion.button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {selectedBodyType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ExerciseProgram bodyType={selectedBodyType} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Tips Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredTips.map(tip => (
            <motion.div
              key={tip.id}
              variants={itemVariants}
              onHoverStart={() => setHoveredTip(tip.id)}
              onHoverEnd={() => setHoveredTip(null)}
              className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleTipClick(tip.route)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={tip.image}
                  alt={tip.title}
                  className="w-full h-48 object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase">
                  {tip.category}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 dark:text-white">{tip.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{tip.content}</p>

                {/* Benefits */}
                <div className="mb-4">
                  {tip.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                <motion.div
                  className="flex items-center text-blue-600 dark:text-blue-400"
                  animate={{ x: hoveredTip === tip.id ? 5 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  <span className="font-medium">{t('common.readMore', 'Read More')}</span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}