import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Bell,
  Activity,
  Users,
  Heart,
  ClipboardList,
  TrendingUp,
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
  Award,
  BookOpen,
  Brain,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Thermometer,
  Droplets,
  Zap,
  Shield,
  Pill,
  Syringe
} from 'lucide-react';

interface NurseStats {
  totalPatients: number;
  todayTasks: number;
  monthlyEarnings: number;
  completedTasks: number;
  patientSatisfaction: number;
  workingHours: number;
}

interface Task {
  id: string;
  patientName: string;
  task: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  type: 'medication' | 'vitals' | 'care' | 'documentation';
}

interface VitalSigns {
  id: string;
  patientName: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  oxygenSaturation: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

export default function NurseDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'vitals' | 'medications' | 'ai-assistant' | 'profile'>('overview');
  const [nurseStats, setNurseStats] = useState<NurseStats>({
    totalPatients: 45,
    todayTasks: 18,
    monthlyEarnings: 420000, // XAF
    completedTasks: 156,
    patientSatisfaction: 4.9,
    workingHours: 168
  });

  const [todayTasks] = useState<Task[]>([
    { id: '1', patientName: 'Marie Dubois', task: 'Administer medication', time: '08:00', priority: 'high', status: 'completed', type: 'medication' },
    { id: '2', patientName: 'Jean Kamga', task: 'Check vital signs', time: '09:30', priority: 'medium', status: 'in-progress', type: 'vitals' },
    { id: '3', patientName: 'Fatima Ngono', task: 'Wound dressing', time: '10:15', priority: 'high', status: 'pending', type: 'care' },
    { id: '4', patientName: 'Paul Mbarga', task: 'Patient education', time: '11:00', priority: 'low', status: 'pending', type: 'care' },
  ]);

  const [recentVitals] = useState<VitalSigns[]>([
    { id: '1', patientName: 'Marie Dubois', temperature: '36.8°C', bloodPressure: '120/80', heartRate: '72 bpm', oxygenSaturation: '98%', timestamp: '09:15', status: 'normal' },
    { id: '2', patientName: 'Jean Kamga', temperature: '37.2°C', bloodPressure: '140/90', heartRate: '88 bpm', oxygenSaturation: '96%', timestamp: '09:45', status: 'warning' },
    { id: '3', patientName: 'Fatima Ngono', temperature: '38.5°C', bloodPressure: '110/70', heartRate: '95 bpm', oxygenSaturation: '94%', timestamp: '10:30', status: 'critical' },
  ]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'tasks', name: 'Tasks', icon: ClipboardList },
    { id: 'vitals', name: 'Vital Signs', icon: Heart },
    { id: 'medications', name: 'Medications', icon: Pill },
    { id: 'ai-assistant', name: 'AI Assistant', icon: Brain },
    { id: 'profile', name: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-spotify-dark-gray">
      {/* Header */}
      <div className="bg-white dark:bg-spotify-black shadow-sm border-b border-gray-200 dark:border-spotify-lighter-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-red-600 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nurse Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Nurse Sarah</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <MessageSquare className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-spotify-black border-b border-gray-200 dark:border-spotify-lighter-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab stats={nurseStats} tasks={todayTasks} vitals={recentVitals} />
            )}
            {activeTab === 'tasks' && (
              <TasksTab tasks={todayTasks} />
            )}
            {activeTab === 'vitals' && (
              <VitalsTab vitals={recentVitals} />
            )}
            {activeTab === 'medications' && (
              <MedicationsTab />
            )}
            {activeTab === 'ai-assistant' && (
              <AIAssistantTab />
            )}
            {activeTab === 'profile' && (
              <ProfileTab />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Tab Component
interface OverviewTabProps {
  stats: NurseStats;
  tasks: Task[];
  vitals: VitalSigns[];
}

function OverviewTab({ stats, tasks, vitals }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Patients"
          value={stats.totalPatients.toString()}
          icon={Users}
          color="pink"
          change="+3"
        />
        <StatCard
          title="Today's Tasks"
          value={stats.todayTasks.toString()}
          icon={ClipboardList}
          color="blue"
          change="+2"
        />
        <StatCard
          title="Monthly Earnings"
          value={`${(stats.monthlyEarnings / 1000).toFixed(0)}K XAF`}
          icon={DollarSign}
          color="green"
          change="+15%"
        />
        <StatCard
          title="Patient Rating"
          value={`${stats.patientSatisfaction}/5`}
          icon={Star}
          color="yellow"
          change="+0.1"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={Thermometer} label="Record Vitals" />
          <QuickActionButton icon={Pill} label="Medication Log" />
          <QuickActionButton icon={FileText} label="Patient Notes" />
          <QuickActionButton icon={Syringe} label="Injection Record" />
        </div>
      </div>

      {/* Today's Tasks & Critical Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Priority Tasks</h3>
          <div className="space-y-3">
            {tasks.filter(task => task.priority === 'high' || task.status === 'in-progress').map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{task.task}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.patientName} - {task.time}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Critical Vitals Alert</h3>
          <div className="space-y-3">
            {vitals.filter(vital => vital.status !== 'normal').map((vital) => (
              <div key={vital.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{vital.patientName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Temp: {vital.temperature}, BP: {vital.bloodPressure}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVitalStatusColor(vital.status)}`}>
                  {vital.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions and remaining components
function StatCard({ title, value, icon: Icon, color, change }: { title: string; value: string; icon: React.ComponentType<any>; color: string; change: string }) {
  const colorClasses = {
    pink: 'text-pink-600 bg-pink-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
  };

  return (
    <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            <span className="ml-2 text-sm text-green-600">{change}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors">
      <Icon className="h-6 w-6 text-pink-600 mb-2" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </button>
  );
}

function TasksTab({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Management</h2>
        <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{task.task}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Patient: {task.patientName} - {task.time}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VitalsTab({ vitals }: { vitals: VitalSigns[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vital Signs Monitoring</h2>
        <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2">
          <Thermometer className="h-4 w-4" />
          <span>Record Vitals</span>
        </button>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-spotify-lighter-gray">
            <thead className="bg-gray-50 dark:bg-spotify-light-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Temperature</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blood Pressure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heart Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">O2 Sat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-spotify-black divide-y divide-gray-200 dark:divide-spotify-lighter-gray">
              {vitals.map((vital) => (
                <tr key={vital.id} className="hover:bg-gray-50 dark:hover:bg-spotify-light-gray">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{vital.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{vital.temperature}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{vital.bloodPressure}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{vital.heartRate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{vital.oxygenSaturation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVitalStatusColor(vital.status)}`}>
                      {vital.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{vital.timestamp}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MedicationsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Medication Management</h2>
        <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2">
          <Pill className="h-4 w-4" />
          <span>Log Medication</span>
        </button>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Today's Medication Schedule</h3>
        <div className="space-y-4">
          {[
            { patient: 'Marie Dubois', medication: 'Lisinopril 10mg', time: '08:00', status: 'administered' },
            { patient: 'Jean Kamga', medication: 'Metformin 500mg', time: '12:00', status: 'pending' },
            { patient: 'Fatima Ngono', medication: 'Albuterol Inhaler', time: '14:00', status: 'pending' },
          ].map((med, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{med.medication}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Patient: {med.patient}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time: {med.time}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${med.status === 'administered' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
                {med.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIAssistantTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Nursing Assistant</h2>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Assistance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors text-left">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-pink-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Medication Interaction Check</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Verify drug interactions</p>
              </div>
            </div>
          </button>
          <button className="p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors text-left">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Vital Signs Analysis</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Analyze patient vitals</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nurse Profile</h2>
        <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2">
          <Edit className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-pink-500 to-red-600 flex items-center justify-center">
            <Heart className="h-10 w-10 text-white" />
          </div>
          <div className="ml-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nurse Sarah Johnson</h3>
            <p className="text-gray-600 dark:text-gray-400">Registered Nurse - ICU</p>
            <div className="flex items-center mt-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">4.9/5 (156 reviews)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">sarah.johnson@ukuqala.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">+237 6XX XXX XXX</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Professional Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">License Number:</span>
                <span className="text-sm text-gray-900 dark:text-white">RN-CM-2024-002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Years of Experience:</span>
                <span className="text-sm text-gray-900 dark:text-white">6 years</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'in-progress': return 'text-blue-600 bg-blue-100';
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getVitalStatusColor(status: string) {
  switch (status) {
    case 'normal': return 'text-green-600 bg-green-100';
    case 'warning': return 'text-yellow-600 bg-yellow-100';
    case 'critical': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
