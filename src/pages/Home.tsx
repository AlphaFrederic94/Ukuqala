import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Brain, Heart, Lungs, Microscope, Stethoscope, Calendar,
  Droplets, Utensils, Moon, Dumbbell, ArrowRight, ChevronRight,
  Shield, Bell, User, Search, CheckCircle2, TrendingUp, Zap,
  Info, Globe, Building2, HeartPulse, Laptop, Pill, Users, MapPin,
  ArrowUp, ArrowDown, Minus, CloudSun, Bot, Dna, Map, MessageCircle
} from 'lucide-react';
import WeatherWidget from '../components/weather/WeatherWidget';
import IllustrationImage from '../components/IllustrationImage';
import TypingAnimation from '../components/TypingAnimation';
import { useAuth } from '../contexts/AuthContext';
import { homeService, HomeMetrics } from '../lib/homeService';

// Disease prediction cards with enhanced metadata
const diseaseCards = [
  {
    id: 'brain-cancer',
    name: 'Brain Cancer',
    icon: Brain,
    description: 'Early detection through MRI analysis',
    color: 'from-purple-500 to-purple-600',
    path: '/predictions/brain-cancer'
  },
  {
    id: 'heart-disease',
    name: 'Heart Disease',
    icon: Heart,
    description: 'Predict cardiovascular risks',
    color: 'from-red-500 to-red-600',
    path: '/predictions/heart-disease'
  },
  {
    id: 'diabetes',
    name: 'Diabetes',
    icon: Droplets,
    description: 'Analyze blood glucose patterns',
    color: 'from-blue-500 to-blue-600',
    path: '/predictions/diabetes'
  },
  {
    id: 'symptoms',
    name: 'Symptoms Analysis',
    icon: Stethoscope,
    description: 'Identify potential conditions',
    color: 'from-green-500 to-green-600',
    path: '/predictions/symptoms'
  },
];

// Health program cards
const healthPrograms = [
  {
    id: 'nutrition',
    name: 'Nutrition Plan',
    icon: Utensils,
    description: 'Personalized meal planning',
    path: '/nutrition',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-800 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-300'
  },
  {
    id: 'sleep',
    name: 'Sleep Tracking',
    icon: Moon,
    description: 'Optimize your sleep patterns',
    path: '/sleep/program',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    textColor: 'text-indigo-800 dark:text-indigo-200',
    iconColor: 'text-indigo-600 dark:text-indigo-300'
  },
  {
    id: 'exercise',
    name: 'Exercise Program',
    icon: Dumbbell,
    description: 'Tailored fitness routines',
    path: '/exercise/program',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-800 dark:text-emerald-200',
    iconColor: 'text-emerald-600 dark:text-emerald-300'
  },
  {
    id: 'hydration',
    name: 'Hydration Tracking',
    icon: Droplets,
    description: 'Monitor water intake',
    path: '/nutrition/hydration',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-800 dark:text-cyan-200',
    iconColor: 'text-cyan-600 dark:text-cyan-300'
  }
];

// Default metrics (will be replaced with real data)
const defaultMetrics = [
  { name: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, trend: 'stable' },
  { name: 'Sleep', value: '0', unit: 'hours', icon: Moon, trend: 'stable' },
  { name: 'Steps', value: '8,432', unit: 'steps', icon: Activity, trend: 'stable' },
  { name: 'Water', value: '0', unit: 'L', icon: Droplets, trend: 'stable' },
];

export default function Home() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState(defaultMetrics);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch real metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await homeService.getHomeMetrics(user.id);
        setMetrics(data);

        // Update health metrics with real data
        setHealthMetrics([
          { name: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, trend: 'stable' },
          {
            name: 'Sleep',
            value: data.sleep.value.toString(),
            unit: data.sleep.unit,
            icon: Moon,
            trend: data.sleep.trend
          },
          { name: 'Steps', value: '8,432', unit: 'steps', icon: Activity, trend: 'stable' },
          {
            name: 'Water',
            value: data.water.value.toString(),
            unit: data.water.unit,
            icon: Droplets,
            trend: data.water.trend
          },
        ]);
      } catch (error) {
        console.error('Error fetching home metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  // Get user's first name
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Top Bar with Time, Weather and Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Weather Widget */}
          <div className="flex-grow md:flex-grow-0">
            <WeatherWidget compact={true} className="h-full" />
          </div>

          <div className="flex space-x-2">
            <button
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all relative group"
              onClick={() => setActiveTab('about')}
              aria-label="About Project"
            >
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="absolute -bottom-10 right-0 w-max bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">About Project</span>
            </button>
            <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <Link to="/profile" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full animate-pulse" style={{ animationDuration: '7s' }}></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full animate-pulse" style={{ animationDuration: '5s' }}></div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="md:max-w-xl mb-8 md:mb-0">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
              <span className="flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                AI-Powered Health Platform
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Your Complete <span className="text-blue-200">Healthcare</span> <br />Solution in One Place
            </h1>
            <p className="text-xl mb-6 text-blue-100 max-w-2xl">
              <TypingAnimation
                text="Advanced AI-powered health predictions, personalized wellness programs, and expert medical guidance at your fingertips."
                speed={30}
                delay={1000}
                showCursor={true}
                cursorChar="|"
                className="inline"
              />
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/predictions"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
              >
                Explore Predictions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/appointments"
                className="inline-flex items-center px-6 py-3 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-all border border-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
              >
                Book Consultation
                <Calendar className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <IllustrationImage
              name="welcome"
              alt="Ukuqala Healthcare Platform"
              className="max-w-full h-auto transform hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'predictions' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Predictions
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'programs' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Programs
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            About ADDSS
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Health Metrics */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">Today's Health Metrics</h2>
                  <Link to="/analytics" className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    View Details <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {loading ? (
                    // Loading skeleton
                    Array(4).fill(0).map((_, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center animate-pulse">
                        <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-600 mr-4 w-12 h-12"></div>
                        <div className="w-full">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
                          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    healthMetrics.map((metric, index) => {
                      const Icon = metric.icon;
                      return (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center">
                          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
                            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.name}</p>
                            <div className="flex items-center">
                              <p className="text-xl font-bold dark:text-white">{metric.value}</p>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
                              {metric.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500 ml-2" />}
                              {metric.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500 ml-2" />}
                              {metric.trend === 'stable' && <Minus className="h-4 w-4 text-blue-500 ml-2" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">Upcoming Appointment</h2>
                  <Link to="/appointments" className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                {loading ? (
                  // Loading skeleton
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-600 mr-4 w-12 h-12"></div>
                      <div className="w-full">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ) : metrics?.appointments.upcoming ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium dark:text-white">Dr. {metrics.appointments.next?.doctor}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Medical Consultation</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">{metrics.appointments.next?.date}, {metrics.appointments.next?.time}</p>
                      </div>
                    </div>
                    <Link to="/appointments" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming appointments</p>
                    <Link to="/appointments" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
                      Schedule Appointment
                    </Link>
                  </div>
                )}
              </div>

              {/* Advanced Features */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">Advanced Features</h2>
                  <Link to="/digital-twin" className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/digital-twin" className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 mb-4 text-white">
                          <Dna className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Digital Twin</h3>
                        <p className="text-gray-600 dark:text-gray-300">Visualize your health with a personalized digital avatar</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-pink-100 to-purple-50 dark:from-pink-900/20 dark:to-purple-800/10 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                  </Link>

                  <Link to="/blockchain-health" className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 mb-4 text-white">
                          <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Secure Records</h3>
                        <p className="text-gray-600 dark:text-gray-300">Blockchain-secured health records with selective sharing</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-800/10 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                  </Link>

                  <Link to="/health-map" className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 mb-4 text-white">
                          <Map className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Health Map</h3>
                        <p className="text-gray-600 dark:text-gray-300">Explore healthcare facilities and track disease outbreaks</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-purple-100 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-800/10 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <Link to="/predictions/symptoms" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mb-3">
                      <Search className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Check Symptoms</span>
                  </Link>
                  <Link to="/nutrition/meals" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900 mb-3">
                      <Utensils className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Log Meal</span>
                  </Link>
                  <Link to="/nutrition/hydration" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
                      <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Track Water</span>
                  </Link>
                  <Link to="/weather" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-cyan-100 dark:bg-cyan-900 mb-3">
                      <CloudSun className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Weather</span>
                  </Link>
                  <Link to="/chatbot" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-3">
                      <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Medical Chatbot</span>
                  </Link>
                  <Link to="/digital-twin" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900 mb-3">
                      <Dna className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Digital Twin</span>
                  </Link>
                  <Link to="/blockchain-health" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900 mb-3">
                      <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Secure Records</span>
                  </Link>
                  <Link to="/health-map" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mb-3">
                      <Map className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Health Map</span>
                  </Link>
                  <Link to="/chatbot" className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
                      <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium dark:text-white">Medical Chatbot</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold dark:text-white">Disease Prediction</h2>
                <Link to="/predictions" className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diseaseCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link
                      key={card.id}
                      to={card.path}
                      className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`inline-flex items-center justify-center p-3 rounded-lg bg-gradient-to-r ${card.color} mb-4 text-white`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{card.name}</h3>
                          <p className="text-gray-600 dark:text-gray-300">{card.description}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      {/* Decorative element */}
                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'programs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold dark:text-white">Health Programs</h2>
                <Link to="/nutrition" className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthPrograms.map((program) => {
                  const Icon = program.icon;
                  return (
                    <Link
                      key={program.id}
                      to={program.path}
                      className="group flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                      <div className={`p-4 rounded-full ${program.bgColor} mr-4`}>
                        <Icon className={`h-6 w-6 ${program.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{program.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{program.description}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="mb-6">
                  <IllustrationImage
                    name="chatbot"
                    alt="AI-powered Disease Diagnosis and Support System"
                    className="h-40 mx-auto"
                  />
                </div>
                <h2 className="text-2xl font-bold dark:text-white mb-2">AI-powered Disease Diagnosis and Support System (ADDSS)</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  An integrated healthcare solution designed specifically for resource-constrained settings
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800/30">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Project Overview</h3>
                <p className="text-blue-700 dark:text-blue-200 mb-4">
                  Ukuqala is developing an integrated disease prediction system specifically designed for low-resource countries and healthcare settings. Our AI-powered Disease Diagnosis and Support System (ADDSS) aims to bridge critical healthcare gaps where medical expertise and diagnostic equipment are limited.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                        <HeartPulse className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white mb-1">Accessible Healthcare</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Bringing advanced diagnostic capabilities to areas with limited access to healthcare specialists and equipment
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                        <Laptop className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white mb-1">AI-Powered Diagnostics</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Utilizing machine learning models to analyze symptoms, medical images, and patient data for accurate disease prediction
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg mr-3">
                        <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white mb-1">Community Health Support</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Empowering community health workers with decision support tools and medical knowledge resources
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg mr-3">
                        <MapPin className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-medium dark:text-white mb-1">Localized Solutions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Adapting to regional disease patterns, infrastructure limitations, and cultural contexts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mb-4">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold dark:text-white mb-2">Infrastructure Adaptability</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Designed to function in settings with limited internet connectivity, power constraints, and minimal computing resources
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit mb-4">
                    <Stethoscope className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold dark:text-white mb-2">Clinical Decision Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Providing healthcare workers with evidence-based recommendations for diagnosis, treatment, and patient management
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mb-4">
                    <Pill className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold dark:text-white mb-2">Preventive Health Focus</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Emphasizing early detection, health education, and preventive measures to reduce disease burden in vulnerable communities
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-6">
                <h3 className="text-lg font-semibold dark:text-white mb-4">Our Mission</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  To democratize access to quality healthcare diagnostics and support through innovative, accessible, and culturally appropriate AI solutions that can function effectively in resource-constrained environments.
                </p>
                <div className="flex justify-center mt-6">
                  <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center">
                    Learn More About Our Impact
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weather and Health Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Weather Widget */}
        <div className="md:col-span-1">
          <Link to="/weather" className="block">
            <div className="relative group">
              <WeatherWidget />
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Health Insights */}
        <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between h-full">
            <div className="mb-4 md:mb-0 md:mr-6">
              <h2 className="text-xl font-semibold mb-2 text-purple-900 dark:text-purple-300">Personalized Health Insights</h2>
              <p className="text-purple-800 dark:text-purple-200 max-w-2xl">
                Our AI has analyzed your health data and has new recommendations to improve your wellbeing.
              </p>
            </div>
            <Link
              to="/analytics"
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md flex items-center whitespace-nowrap"
            >
              View Insights
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Medical Chatbot Teaser */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row items-center">
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 md:mb-0 md:mr-6">
            <Stethoscope className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
            <h3 className="text-lg font-semibold mb-1 dark:text-white">Have a Medical Question?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI-powered medical assistant can answer your health questions 24/7.
            </p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center">
            Ask Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
