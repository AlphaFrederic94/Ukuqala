import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export type TutorialStep = {
  id: string;
  title: string;
  content: string;
  element?: string; // CSS selector for the element to highlight
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  arrow?: boolean;
  spotlightClicks?: boolean;
  disableOverlay?: boolean;
  disableBeacon?: boolean;
};

export type TutorialConfig = {
  id: string;
  name: string;
  steps: TutorialStep[];
  showOnce?: boolean;
  requiredFeatures?: string[];
};

export type TutorialState = {
  activeTutorial: string | null;
  step: number;
  run: boolean;
  completedTutorials: string[];
};

interface TutorialContextType {
  tutorials: Record<string, TutorialConfig>;
  tutorialState: TutorialState;
  startTutorial: (tutorialId: string) => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  isTutorialAvailable: (tutorialId: string) => boolean;
  isTutorialCompleted: (tutorialId: string) => boolean;
}

const TutorialContext = createContext<TutorialContextType>({
  tutorials: {},
  tutorialState: {
    activeTutorial: null,
    step: 0,
    run: false,
    completedTutorials: [],
  },
  startTutorial: () => {},
  endTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  resetTutorial: () => {},
  isTutorialAvailable: () => false,
  isTutorialCompleted: () => false,
});

// Define tutorials
const tutorials: Record<string, TutorialConfig> = {
  onboarding: {
    id: 'onboarding',
    name: 'App Introduction',
    showOnce: true,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to CareAI',
        content: 'Let\'s take a quick tour to help you get started with the app.',
        position: 'center',
        disableBeacon: true,
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        content: 'This is your dashboard where you can see an overview of your health metrics and recent activities.',
        element: '.dashboard-overview',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'navigation',
        title: 'Navigation',
        content: 'Use the navigation menu to access different features of the app.',
        element: 'nav',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'profile',
        title: 'Profile',
        content: 'Click here to access your profile settings and account information.',
        element: '#user-menu-button',
        position: 'left',
        arrow: true,
      },
      {
        id: 'language',
        title: 'Language Settings',
        content: 'You can change the language of the app here.',
        element: '.language-switcher',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'complete',
        title: 'You\'re All Set!',
        content: 'You\'ve completed the introduction. Explore the app to discover more features!',
        position: 'center',
        disableBeacon: true,
      },
    ],
  },
  predictions: {
    id: 'predictions',
    name: 'Health Predictions',
    steps: [
      {
        id: 'intro',
        title: 'Health Predictions',
        content: 'This feature uses AI to analyze your health data and provide risk assessments for various conditions.',
        position: 'center',
        disableBeacon: true,
      },
      {
        id: 'prediction-types',
        title: 'Prediction Types',
        content: 'Choose from different types of predictions including heart disease, diabetes, and symptom analysis.',
        element: '.prediction-types',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'input-parameters',
        title: 'Input Parameters',
        content: 'Fill in these health parameters accurately for the most reliable predictions.',
        element: '.prediction-parameters',
        position: 'right',
        arrow: true,
      },
      {
        id: 'results',
        title: 'Results Interpretation',
        content: 'Your results will show risk levels and recommendations based on your inputs.',
        element: '.prediction-results',
        position: 'top',
        arrow: true,
      },
      {
        id: 'history',
        title: 'Prediction History',
        content: 'View your past predictions and track changes over time.',
        element: '.prediction-history',
        position: 'left',
        arrow: true,
      },
      {
        id: 'complete',
        title: 'Ready to Predict',
        content: 'You now know how to use the prediction feature. Remember that these predictions are not a substitute for professional medical advice.',
        position: 'center',
        disableBeacon: true,
      },
    ],
  },
  chatbot: {
    id: 'chatbot',
    name: 'Medical Chatbot',
    steps: [
      {
        id: 'intro',
        title: 'Medical Chatbot',
        content: 'The AI-powered medical chatbot can answer your health questions and provide general medical information.',
        position: 'center',
        disableBeacon: true,
      },
      {
        id: 'chat-input',
        title: 'Ask Questions',
        content: 'Type your health-related questions here. Be specific for the best answers.',
        element: '.chat-input',
        position: 'top',
        arrow: true,
      },
      {
        id: 'suggested-questions',
        title: 'Suggested Questions',
        content: 'You can also choose from these suggested topics if you\'re not sure what to ask.',
        element: '.suggested-questions',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'conversation-history',
        title: 'Conversation History',
        content: 'Your chat history appears here. You can refer back to previous answers.',
        element: '.conversation-history',
        position: 'right',
        arrow: true,
      },
      {
        id: 'disclaimer',
        title: 'Important Note',
        content: 'Remember that the chatbot provides general information only and is not a substitute for professional medical advice.',
        element: '.chatbot-disclaimer',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'complete',
        title: 'Ready to Chat',
        content: 'You\'re now ready to use the medical chatbot. Feel free to ask any health-related questions!',
        position: 'center',
        disableBeacon: true,
      },
    ],
  },
  tracking: {
    id: 'tracking',
    name: 'Health Tracking',
    steps: [
      {
        id: 'intro',
        title: 'Health Tracking',
        content: 'This feature helps you monitor various health metrics over time.',
        position: 'center',
        disableBeacon: true,
      },
      {
        id: 'tracking-types',
        title: 'Tracking Categories',
        content: 'Choose from different tracking categories like sleep, nutrition, exercise, and more.',
        element: '.tracking-categories',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'add-entry',
        title: 'Add New Entries',
        content: 'Click here to add a new entry for the selected tracking category.',
        element: '.add-entry-button',
        position: 'left',
        arrow: true,
      },
      {
        id: 'view-history',
        title: 'View History',
        content: 'Your tracking history is displayed here. You can see trends and patterns over time.',
        element: '.tracking-history',
        position: 'top',
        arrow: true,
      },
      {
        id: 'analytics',
        title: 'Analytics',
        content: 'These charts show your progress and trends based on your tracking data.',
        element: '.tracking-analytics',
        position: 'right',
        arrow: true,
      },
      {
        id: 'complete',
        title: 'Ready to Track',
        content: 'You now know how to use the health tracking features. Consistent tracking will provide the most valuable insights!',
        position: 'center',
        disableBeacon: true,
      },
    ],
  },
  encryption: {
    id: 'encryption',
    name: 'End-to-End Encryption',
    steps: [
      {
        id: 'intro',
        title: 'End-to-End Encryption',
        content: 'This feature ensures your sensitive medical data is securely encrypted.',
        position: 'center',
        disableBeacon: true,
      },
      {
        id: 'master-password',
        title: 'Master Password',
        content: 'Your master password is the key to encrypting and decrypting your data. Never share it with anyone.',
        element: '.master-password-field',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'encrypted-data',
        title: 'Encrypted Data',
        content: 'All data entered here is encrypted before being stored. Only you can access it with your master password.',
        element: '.encrypted-data-section',
        position: 'top',
        arrow: true,
      },
      {
        id: 'security-info',
        title: 'Security Information',
        content: 'This section provides important information about how your data is protected.',
        element: '.security-info',
        position: 'bottom',
        arrow: true,
      },
      {
        id: 'complete',
        title: 'Security First',
        content: 'You now understand how end-to-end encryption protects your sensitive medical information. Remember to keep your master password secure!',
        position: 'center',
        disableBeacon: true,
      },
    ],
  },
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    activeTutorial: null,
    step: 0,
    run: false,
    completedTutorials: [],
  });

  // Load completed tutorials from database
  useEffect(() => {
    const loadCompletedTutorials = async () => {
      if (!user) return;

      try {
        // First, check if the table exists by trying to select from it
        const { data, error } = await supabase
          .from('user_tutorials')
          .select('completed_tutorials')
          .eq('user_id', user.id)
          .maybeSingle();

        // Handle various error cases gracefully
        if (error) {
          console.log('Tutorial data error:', error.code, error.status, error.message);

          // For any error, just use an empty array and try to create the record
          setTutorialState(prev => ({
            ...prev,
            completedTutorials: [],
          }));

          // Try to create a new user_tutorials record
          try {
            await supabase
              .from('user_tutorials')
              .upsert({
                user_id: user.id,
                completed_tutorials: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            console.log('Created new user_tutorials record');
          } catch (insertError) {
            console.error('Error creating tutorial record:', insertError);
          }

          return;
        }

        if (data) {
          setTutorialState(prev => ({
            ...prev,
            completedTutorials: data.completed_tutorials || [],
          }));
        } else {
          // No data found, create a new record
          try {
            await supabase
              .from('user_tutorials')
              .insert({
                user_id: user.id,
                completed_tutorials: [],
              });

            setTutorialState(prev => ({
              ...prev,
              completedTutorials: [],
            }));
          } catch (insertError) {
            console.error('Error creating tutorial record:', insertError);
          }
        }
      } catch (error) {
        console.error('Error loading tutorial data:', error);
      }
    };

    loadCompletedTutorials();
  }, [user]);

  // Save completed tutorials to database
  const saveCompletedTutorial = async (tutorialId: string) => {
    if (!user) return;

    try {
      const newCompletedTutorials = [...tutorialState.completedTutorials, tutorialId];

      // Use upsert to either update or insert
      const { error } = await supabase
        .from('user_tutorials')
        .upsert({
          user_id: user.id,
          completed_tutorials: newCompletedTutorials,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving tutorial data:', error);
        return;
      }

      setTutorialState(prev => ({
        ...prev,
        completedTutorials: newCompletedTutorials,
      }));
    } catch (error) {
      console.error('Error saving tutorial data:', error);
    }
  };

  const startTutorial = (tutorialId: string) => {
    if (!tutorials[tutorialId]) return;

    setTutorialState({
      ...tutorialState,
      activeTutorial: tutorialId,
      step: 0,
      run: true,
    });
  };

  const endTutorial = () => {
    if (tutorialState.activeTutorial) {
      saveCompletedTutorial(tutorialState.activeTutorial);
    }

    setTutorialState({
      ...tutorialState,
      activeTutorial: null,
      step: 0,
      run: false,
    });
  };

  const nextStep = () => {
    if (!tutorialState.activeTutorial) return;

    const tutorial = tutorials[tutorialState.activeTutorial];
    const nextStep = tutorialState.step + 1;

    if (nextStep >= tutorial.steps.length) {
      endTutorial();
    } else {
      setTutorialState({
        ...tutorialState,
        step: nextStep,
      });
    }
  };

  const prevStep = () => {
    if (!tutorialState.activeTutorial) return;

    const prevStep = Math.max(0, tutorialState.step - 1);
    setTutorialState({
      ...tutorialState,
      step: prevStep,
    });
  };

  const skipTutorial = () => {
    if (tutorialState.activeTutorial) {
      saveCompletedTutorial(tutorialState.activeTutorial);
    }

    setTutorialState({
      ...tutorialState,
      activeTutorial: null,
      step: 0,
      run: false,
    });
  };

  const resetTutorial = () => {
    setTutorialState({
      ...tutorialState,
      step: 0,
    });
  };

  const isTutorialAvailable = (tutorialId: string) => {
    const tutorial = tutorials[tutorialId];
    if (!tutorial) return false;

    // Check if tutorial should only be shown once and has been completed
    if (tutorial.showOnce && tutorialState.completedTutorials.includes(tutorialId)) {
      return false;
    }

    // Check if tutorial requires specific features
    if (tutorial.requiredFeatures) {
      // This is where you would check if the user has access to required features
      // For now, we'll assume all features are available
    }

    return true;
  };

  const isTutorialCompleted = (tutorialId: string) => {
    return tutorialState.completedTutorials.includes(tutorialId);
  };

  return (
    <TutorialContext.Provider
      value={{
        tutorials,
        tutorialState,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        resetTutorial,
        isTutorialAvailable,
        isTutorialCompleted,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => useContext(TutorialContext);
