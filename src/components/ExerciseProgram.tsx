import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { healthProgramsService } from '../lib/healthProgramsService';
import Stopwatch from './Stopwatch';
import { Dumbbell, Clock, Activity, Heart } from 'lucide-react';

interface ExerciseSession {
  exerciseId: string;
  duration: number;
  sets: number;
  reps: number;
  weight?: number;
  heartRate?: number;
  caloriesBurned: number;
}

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

const bodyTypePrograms: Record<string, Program> = {
  ectomorph: {
    title: 'Ectomorph Build Program',
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
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
}

export default function ExerciseProgram({ bodyType }: ExerciseProgramProps) {
  const { user } = useUser();
  const { t } = useTranslation();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [isResting, setIsResting] = useState(false);
  const [heartRate, setHeartRate] = useState(70);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  useEffect(() => {
    if (user) {
      loadActiveProgram();
    }
  }, [user, bodyType]);

  const loadActiveProgram = async () => {
    try {
      const programs = await healthProgramsService.getUserPrograms(user!.id);
      const active = programs.find(p => 
        p.type === 'exercise' && 
        p.status === 'active' && 
        p.body_type === bodyType
      );
      setActiveProgram(active);
    } catch (error) {
      console.error('Error loading exercise program:', error);
    }
  };

  const handleExerciseComplete = async (session: ExerciseSession) => {
    if (!user || !activeProgram) return;

    try {
      // Update program progress
      await healthProgramsService.updateProgress(activeProgram.id, {
        date: new Date().toISOString(),
        metrics: {
          duration: session.duration,
          calories: session.caloriesBurned,
          heartRate: session.heartRate || 0,
        },
        notes: `Completed ${bodyTypePrograms[bodyType].exercises[currentExercise].name}`
      });

      // Update local state
      setSessions([...sessions, session]);
      setHeartRate(prev => Math.min(180, prev + Math.floor(Math.random() * 20)));
      setCaloriesBurned(prev => prev + session.caloriesBurned);

      if (currentExercise < bodyTypePrograms[bodyType].exercises.length - 1) {
        setIsResting(true);
        setTimeout(() => {
          setIsResting(false);
          setCurrentExercise(currentExercise + 1);
        }, bodyTypePrograms[bodyType].restBetweenSets * 1000);
      }
    } catch (error) {
      console.error('Error updating exercise progress:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">{program.title}</h2>
        
        {/* Current Exercise */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold dark:text-white">
              {program.exercises[currentExercise].name}
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Exercise {currentExercise + 1}/{program.exercises.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <Dumbbell className="h-5 w-5" />
                <span>{program.exercises[currentExercise].sets} sets x {program.exercises[currentExercise].reps} reps</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <Clock className="h-5 w-5" />
                <span>{program.restBetweenSets}s rest between sets</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <BookOpen className="h-5 w-5" />
                <p>{program.exercises[currentExercise].description}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <Stopwatch 
                duration={program.exercises[currentExercise].duration}
                onComplete={handleExerciseComplete}
              />
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {program.exercises.map((exercise, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                index === currentExercise
                  ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
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
                <span className={`px-3 py-1 rounded-full text-sm ${
                  index < currentExercise
                    ? 'bg-green-100 text-green-800'
                    : index === currentExercise
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {index < currentExercise ? 'Completed' : index === currentExercise ? 'Current' : 'Upcoming'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
