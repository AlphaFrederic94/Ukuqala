import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useRoutes } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { AppUsageProvider } from './contexts/AppUsageContext';
import TutorialModal from './components/tutorial/TutorialModal';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PinSetup from './components/auth/PinSetup';
import PinVerification from './components/auth/PinVerification';
import PinVerificationWrapper from './components/auth/PinVerificationWrapper';
import { ToastProvider } from './components/ui/Toast';
import { appointmentReminderService } from './services/appointmentReminderService';
import predictionRoutes from './routes/predictionRoutes';
import { ThemeEnforcer } from './utils/themeEnforcer';

// Welcome and Auth pages
const Welcome = React.lazy(() => import('./pages/Welcome'));
const NewLoginForm = React.lazy(() => import('./components/auth/NewLoginForm'));
const NewRegisterForm = React.lazy(() => import('./components/auth/NewRegisterForm'));
const ForgotPassword = React.lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const AuthCallback = React.lazy(() => import('./components/auth/AuthCallback'));

// Lazy load pages
const Home = React.lazy(() => import('./pages/Home'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Predictions = React.lazy(() => import('./pages/Predictions'));
const Games = React.lazy(() => import('./pages/Games'));
const TicTacToe = React.lazy(() => import('./components/games/TicTacToe'));
const ChessGame = React.lazy(() => import('./components/games/ChessGame'));
const Chess3DGame = React.lazy(() => import('./components/games/Chess3DGame'));
const Appointments = React.lazy(() => import('./pages/Appointments').catch(err => {
  console.error('Error loading Appointments:', err);
  throw err;
}));
const HealthTips = React.lazy(() => import('./pages/HealthTips'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Weather = React.lazy(() => import('./pages/Weather'));

// Healthcare Provider Dashboards (Developer only)
const DoctorDashboard = React.lazy(() => import('./pages/providers/DoctorDashboard'));
const NurseDashboard = React.lazy(() => import('./pages/providers/NurseDashboard'));
const RadiologistDashboard = React.lazy(() => import('./pages/providers/RadiologistDashboard'));

// Advanced feature pages with error handling
const DigitalTwin = React.lazy(() => import('./pages/digital-twin/DigitalTwinPage').catch(err => {
  console.error('Error loading DigitalTwin:', err);
  return import('./pages/ErrorPage').then(module => ({
    default: () => module.default({ error: 'Failed to load Digital Twin page. Please try again later.' })
  }));
}));

const SystemDesign = React.lazy(() => import('./pages/SystemDesign').catch(err => {
  console.error('Error loading SystemDesign:', err);
  return import('./pages/ErrorPage').then(module => ({
    default: () => module.default({ error: 'Failed to load System Design page. Please try again later.' })
  }));
}));


const BlockchainHealth = React.lazy(() => import('./pages/blockchain-health/BlockchainHealthPage').catch(err => {
  console.error('Error loading BlockchainHealth:', err);
  return import('./pages/ErrorPage').then(module => ({
    default: () => module.default({ error: 'Failed to load Blockchain Health page. Please try again later.' })
  }));
}));



// Social pages
const SocialFeedPage = React.lazy(() => import('./pages/social/SimpleSocialFeed.jsx'));
const UserProfilePage = React.lazy(() => import('./pages/social/UserProfilePage'));
const MessagesPage = React.lazy(() => import('./pages/social/MessagesPage'));
const Friends = React.lazy(() => import('./pages/social/Friends'));
const Messages = React.lazy(() => import('./pages/social/Messages'));
const Notifications = React.lazy(() => import('./pages/social/Notifications'));
const Explore = React.lazy(() => import('./pages/social/Explore'));
const SavedPosts = React.lazy(() => import('./pages/social/SavedPosts'));
const HashtagPage = React.lazy(() => import('./pages/social/HashtagPage'));
const SearchResults = React.lazy(() => import('./pages/social/SearchResults'));
const ChannelPage = React.lazy(() => import('./pages/social/ChannelPage'));
const TestPage = React.lazy(() => import('./pages/social/TestPage'));
const FirebaseTestPage = React.lazy(() => import('./pages/social/FirebaseTestPage'));

// Admin pages
const StorageAdmin = React.lazy(() => import('./pages/admin/StorageAdmin'));

// Nutrition pages
const ModernNutritionDashboard = React.lazy(() => import('./pages/nutrition/ModernNutritionDashboard'));
const NutritionPlan = React.lazy(() => import('./pages/nutrition/NutritionPlan'));
const CreateNutritionPlan = React.lazy(() => import('./pages/nutrition/CreateNutritionPlan'));
const Meals = React.lazy(() => import('./pages/nutrition/Meals'));
const Hydration = React.lazy(() => import('./pages/nutrition/Hydration'));

// Other health programs
const SleepProgram = React.lazy(() => import('./pages/sleep/SleepProgram'));
const StressManagement = React.lazy(() => import('./pages/mental/StressManagement'));
const ExerciseProgram = React.lazy(() => import('./pages/exercise/ExerciseProgram'));
const BiblePage = React.lazy(() => import('./pages/spiritual/BiblePage.jsx').catch(err => {
  console.error('Error loading Bible Page:', err);
  return import('./pages/ErrorPage.jsx').then(module => ({
    default: () => module.default({ error: 'Failed to load Bible page. Please try again later.' })
  }));
}));

// Chatbot page
const ChatbotPage = React.lazy(() => import('./pages/ChatbotPage'));

// Medical Facilities page
const MedicalFacilitiesPage = React.lazy(() => import('./pages/MedicalFacilitiesPage'));

// Spotify Dark Mode Test
const SpotifyDarkModeTest = React.lazy(() => import('./components/SpotifyDarkModeTest'));

// Subscription page
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));




// App wrapper component that uses hooks
function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize theme enforcement immediately
    ThemeEnforcer.initialize();

    if (user) {
      // Start checking for appointment reminders
      appointmentReminderService.startReminderCheck(user.id);
    }
  }, [user]);

  // Add a global effect to ensure theme is current on every render
  useEffect(() => {
    if (ThemeEnforcer.needsReapplication()) {
      const currentTheme = localStorage.getItem('themeMode') || 'system';
      ThemeEnforcer.applyTheme(currentTheme);
    }
  });

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Welcome />
        </Suspense>
      } />
      <Route path="/login" element={
        <Suspense fallback={<LoadingSpinner />}>
          <NewLoginForm />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<LoadingSpinner />}>
          <NewRegisterForm />
        </Suspense>
      } />
      <Route path="/pin-setup" element={<PinSetup />} />
      <Route path="/pin-verify" element={<PinVerification />} />
      <Route path="/forgot-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ForgotPassword />
        </Suspense>
      } />
      <Route path="/reset-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ResetPassword />
        </Suspense>
      } />
      <Route path="/auth/callback" element={
        <Suspense fallback={<LoadingSpinner />}>
          <AuthCallback />
        </Suspense>
      } />

      {/* Onboarding route - protected but outside main layout */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <Onboarding />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <PinVerificationWrapper>
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/predictions" element={<Predictions />} />
                    {/* Use the predictionRoutes for all prediction pages */}
                    {predictionRoutes.map((route) => (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <Suspense fallback={<LoadingSpinner />}>
                            {route.element}
                          </Suspense>
                        }
                      />
                    ))}
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/health-tips" element={<HealthTips />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/weather" element={<Weather />} />

                    {/* Nutrition routes */}
                    <Route path="/nutrition" element={<ModernNutritionDashboard />} />
                    <Route path="/nutrition/plan" element={<NutritionPlan />} />
                    <Route path="/nutrition/create-plan" element={<CreateNutritionPlan />} />
                    <Route path="/nutrition/meals" element={<Meals />} />
                    <Route path="/nutrition/hydration" element={<Hydration />} />

                    {/* Healthcare Provider routes - Developer only access */}
                    <Route path="/dev/provider/doctor" element={<DoctorDashboard />} />
                    <Route path="/dev/provider/nurse" element={<NurseDashboard />} />
                    <Route path="/dev/provider/radiologist" element={<RadiologistDashboard />} />

                    {/* Other health program routes */}
                    <Route path="/sleep/program" element={<SleepProgram />} />
                    <Route path="/mental/stress-management" element={<StressManagement />} />
                    <Route path="/exercise/program" element={<ExerciseProgram />} />
                    <Route path="/exercise/strength-training" element={<BiblePage />} />

                    {/* Game routes */}
                    <Route path="/games" element={<Games />} />
                    <Route path="/games/tic-tac-toe" element={<TicTacToe />} />
                    <Route path="/games/chess3d" element={<Chess3DGame />} />

                    {/* Social routes */}
                    <Route path="/social" element={<SocialFeedPage />} />
                    <Route path="/social/profile/:id" element={<UserProfilePage />} />
                    <Route path="/social/friends" element={<Friends />} />
                    <Route path="/social/messages" element={<MessagesPage />} />
                    <Route path="/social/messages/:userId" element={<MessagesPage />} />
                    <Route path="/social/notifications" element={<Notifications />} />
                    <Route path="/social/explore" element={<Explore />} />
                    <Route path="/social/saved" element={<SavedPosts />} />
                    <Route path="/social/hashtag/:tag" element={<HashtagPage />} />
                    <Route path="/social/search" element={<SearchResults />} />
                    <Route path="/social/channel/:id" element={<ChannelPage />} />
                    <Route path="/social/test" element={<TestPage />} />
                    <Route path="/social/firebase-test" element={<FirebaseTestPage />} />


                    {/* Advanced feature routes */}
                    <Route path="/digital-twin" element={<DigitalTwin />} />
                    <Route path="/blockchain-health" element={<BlockchainHealth />} />
                    <Route path="/system-design" element={<SystemDesign />} />

                    {/* Admin routes */}
                    <Route path="/admin/storage" element={<StorageAdmin />} />

                    {/* Chatbot route */}
                    <Route path="/chatbot" element={<ChatbotPage />} />

                    {/* Medical Facilities route */}
                    <Route path="/medical-facilities" element={<MedicalFacilitiesPage />} />

                    {/* Spotify Dark Mode Test route */}
                    <Route path="/spotify-test" element={<SpotifyDarkModeTest />} />

                    {/* Subscription route */}
                    <Route path="/subscription" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <SubscriptionPage />
                      </Suspense>
                    } />


                  </Routes>
                </Suspense>
              </Layout>
            </PinVerificationWrapper>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Import the DatabaseInitializer
import DatabaseInitializer from './components/DatabaseInitializer';
import SocialInitializer from './components/social/SocialInitializer';

// Main App component
function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <FirebaseProvider>
                <NotificationProvider>
                  <TutorialProvider>
                    <AppUsageProvider>
                      {/* Add DatabaseInitializer to ensure database is set up */}
                      <DatabaseInitializer>
                        <SocialInitializer>
                          <AppContent />
                          <TutorialModal />
                        </SocialInitializer>
                      </DatabaseInitializer>
                    </AppUsageProvider>
                  </TutorialProvider>
                </NotificationProvider>
              </FirebaseProvider>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
