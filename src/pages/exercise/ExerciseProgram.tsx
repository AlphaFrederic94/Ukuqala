import React, { useState, useEffect } from 'react';
import { Dumbbell, Clock, Activity, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Stopwatch from '../../components/Stopwatch';
import ExerciseTracker from '../../components/ExerciseTracker';

interface Exercise {
  name: string;
  duration: number;
  sets: number;
  reps: number;
  description: string;
}

interface Program {
  title: string;
  exercises: Exercise[];
  restBetweenSets: number;
}

const bodyTypePrograms: Record<string, Program & { image: string; description: string }> = {
  ectomorph: {
    title: 'Ectomorph Build Program',
    description: 'Naturally thin with smaller bone structure and muscles. Focus on muscle building with heavy weights.',
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=500',
    exercises: [
      {
        name: 'Compound Squats',
        duration: 300,
        sets: 4,
        reps: 8,
        description: 'Focus on heavy weights and proper form'
      },
      {
        name: 'Bench Press',
        duration: 300,
        sets: 4,
        reps: 8,
        description: 'Keep shoulders back and maintain steady breathing'
      },
      {
        name: 'Deadlifts',
        duration: 300,
        sets: 4,
        reps: 6,
        description: 'Keep back straight and engage core'
      }
    ],
    restBetweenSets: 90
  },
  mesomorph: {
    title: 'Mesomorph Power Program',
    description: 'Athletic and muscular build. Responds well to both strength and cardio training.',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=500',
    exercises: [
      {
        name: 'HIIT Sprints',
        duration: 180,
        sets: 6,
        reps: 1,
        description: '30 seconds sprint, 30 seconds rest'
      },
      {
        name: 'Plyometric Push-ups',
        duration: 240,
        sets: 3,
        reps: 12,
        description: 'Explosive movement with full range of motion'
      },
      {
        name: 'Box Jumps',
        duration: 240,
        sets: 4,
        reps: 10,
        description: 'Land softly and reset between jumps'
      }
    ],
    restBetweenSets: 60
  },
  endomorph: {
    title: 'Endomorph Fat-Burning Program',
    description: 'Naturally higher body fat and larger frame. Focus on fat burning and metabolic conditioning.',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=500',
    exercises: [
      {
        name: 'Mountain Climbers',
        duration: 180,
        sets: 3,
        reps: 20,
        description: 'Keep core engaged and maintain steady pace'
      },
      {
        name: 'Kettlebell Swings',
        duration: 240,
        sets: 4,
        reps: 15,
        description: 'Drive with hips and maintain straight back'
      },
      {
        name: 'Burpees',
        duration: 180,
        sets: 3,
        reps: 12,
        description: 'Focus on form over speed'
      }
    ],
    restBetweenSets: 45
  }
};

interface ExerciseProgramProps {
  bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph' | null;
}

export default function ExerciseProgram({ bodyType }: ExerciseProgramProps = {}) {
  const { t } = useTranslation();
  const [selectedBodyType, setSelectedBodyType] = useState<'ectomorph' | 'mesomorph' | 'endomorph' | null>(bodyType || null);

  // If bodyType prop changes, update the state
  useEffect(() => {
    if (bodyType) {
      setSelectedBodyType(bodyType);
    }
  }, [bodyType]);
  const [currentExercise, setCurrentExercise] = useState(0);

  const handleExerciseComplete = () => {
    if (selectedBodyType && currentExercise < bodyTypePrograms[selectedBodyType].exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Exercise Program</h1>

        {/* Body Type Selection */}
        {!selectedBodyType && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold dark:text-white">Select Your Body Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(bodyTypePrograms).map(([type, program]) => (
                <button
                  key={type}
                  onClick={() => setSelectedBodyType(type as 'ectomorph' | 'mesomorph' | 'endomorph')}
                  className="overflow-hidden rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48">
                    <img
                      src={program.image}
                      alt={type}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg font-semibold">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </h3>
                      <p className="text-sm opacity-90">{program.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Program */}
        {selectedBodyType && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold dark:text-white">
                {bodyTypePrograms[selectedBodyType].title}
              </h2>
              <button
                onClick={() => {
                  setSelectedBodyType(null);
                  setCurrentExercise(0);
                }}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Change Program
              </button>
            </div>

            {/* Exercise Tracker */}
            <ExerciseTracker
              bodyType={selectedBodyType}
              currentExercise={currentExercise}
              onExerciseComplete={handleExerciseComplete}
            />

            {/* Current Exercise */}
            <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                    {bodyTypePrograms[selectedBodyType].exercises[currentExercise].name}
                  </h3>
                  <div className="space-y-4 text-blue-800 dark:text-blue-200">
                    <p>{bodyTypePrograms[selectedBodyType].exercises[currentExercise].description}</p>
                    <div className="flex items-center">
                      <Dumbbell className="h-5 w-5 mr-2" />
                      <span>
                        {bodyTypePrograms[selectedBodyType].exercises[currentExercise].sets} sets x{' '}
                        {bodyTypePrograms[selectedBodyType].exercises[currentExercise].reps} reps
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
              {bodyTypePrograms[selectedBodyType].exercises.map((exercise, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    index === currentExercise
                      ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
                      : index < currentExercise
                      ? 'bg-green-50 dark:bg-green-900'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold dark:text-white">{exercise.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {exercise.sets} sets x {exercise.reps} reps
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        index < currentExercise
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : index === currentExercise
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {index < currentExercise ? 'Completed' : index === currentExercise ? 'Current' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
