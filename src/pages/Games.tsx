import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid3X3, Box, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Games() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          {t('Brain Games')}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl">
          {t('Exercise your mind with these games designed to improve cognitive function and provide a fun break from your health routine.')}
        </p>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg relative overflow-hidden mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('Why Brain Games Matter for Health')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">
                {t('Cognitive Benefits')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('Regular brain exercise through games can improve memory, attention, and problem-solving skills, potentially reducing the risk of cognitive decline.')}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">
                {t('Stress Reduction')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('Engaging in mentally stimulating games can provide a healthy distraction from daily stressors, promoting relaxation and mental well-being.')}
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white">
                {t('Social Connection')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('Games can create opportunities for social interaction and connection, which is vital for mental health and can combat feelings of isolation.')}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {t('Available Games')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer"
            onClick={() => navigate('/games/tic-tac-toe')}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src="/images/games/tictactoe.jpg"
                alt="Tic-Tac-Toe"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <h2 className="text-2xl font-bold text-white p-4">
                  {t('Tic-Tac-Toe')}
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Grid3X3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('Strategic Thinking')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Beginner Friendly')}</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t("A classic game of X's and O's. Challenge the computer and test your strategic thinking.")}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {t('Improves cognitive function')}
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {t('Reduces stress through mental engagement')}
                  </span>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <span>{t('Play Now')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>



          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer"
            onClick={() => navigate('/games/chess3d')}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src="/images/games/chess.jpg"
                alt="3D Chess"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <h2 className="text-2xl font-bold text-white p-4">
                  {t('3D Chess')}
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <Box className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{t('Advanced Strategy')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('Tournament Style')}</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('Experience chess in stunning 3D with advanced animations and tournament-style timing.')}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {t('Enhances memory and concentration')}
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5 mr-2">
                    <span className="text-green-600 dark:text-green-300 text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {t('Helps prevent cognitive decline')}
                  </span>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <span>{t('Play Now')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>


      </div>
    </div>
  );
}
