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
  Stethoscope,
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
  XCircle
} from 'lucide-react';

interface DoctorStats {
  totalPatients: number;
  todayAppointments: number;
  monthlyEarnings: number;
  pendingReports: number;
  patientSatisfaction: number;
  consultationHours: number;
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  condition: string;
  status: 'stable' | 'critical' | 'improving';
}

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'patients' | 'reports' | 'ai-assistant' | 'profile'>('overview');
  const [doctorStats, setDoctorStats] = useState<DoctorStats>({
    totalPatients: 247,
    todayAppointments: 12,
    monthlyEarnings: 850000, // XAF
    pendingReports: 8,
    patientSatisfaction: 4.8,
    consultationHours: 156
  });

  const [todayAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'Marie Dubois', time: '09:00', type: 'Consultation', status: 'completed', priority: 'medium' },
    { id: '2', patientName: 'Jean Kamga', time: '10:30', type: 'Follow-up', status: 'scheduled', priority: 'low' },
    { id: '3', patientName: 'Fatima Ngono', time: '11:15', type: 'Emergency', status: 'scheduled', priority: 'high' },
    { id: '4', patientName: 'Paul Mbarga', time: '14:00', type: 'Consultation', status: 'scheduled', priority: 'medium' },
  ]);

  const [recentPatients] = useState<Patient[]>([
    { id: '1', name: 'Marie Dubois', age: 34, gender: 'Female', lastVisit: '2024-06-25', condition: 'Hypertension', status: 'stable' },
    { id: '2', name: 'Jean Kamga', age: 45, gender: 'Male', lastVisit: '2024-06-24', condition: 'Diabetes Type 2', status: 'improving' },
    { id: '3', name: 'Fatima Ngono', age: 28, gender: 'Female', lastVisit: '2024-06-23', condition: 'Asthma', status: 'stable' },
  ]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'patients', name: 'Patients', icon: Users },
    { id: 'reports', name: 'Reports', icon: FileText },
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
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Dr. Ngana Frederic</p>
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
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
              <OverviewTab stats={doctorStats} appointments={todayAppointments} patients={recentPatients} />
            )}
            {activeTab === 'appointments' && (
              <AppointmentsTab appointments={todayAppointments} />
            )}
            {activeTab === 'patients' && (
              <PatientsTab patients={recentPatients} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab />
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
  stats: DoctorStats;
  appointments: Appointment[];
  patients: Patient[];
}

function OverviewTab({ stats, appointments, patients }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toString()}
          icon={Users}
          color="blue"
          change="+12%"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments.toString()}
          icon={Calendar}
          color="green"
          change="+5%"
        />
        <StatCard
          title="Monthly Earnings"
          value={`${(stats.monthlyEarnings / 1000).toFixed(0)}K XAF`}
          icon={DollarSign}
          color="purple"
          change="+18%"
        />
        <StatCard
          title="Patient Satisfaction"
          value={`${stats.patientSatisfaction}/5`}
          icon={Star}
          color="yellow"
          change="+0.2"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={Plus} label="New Appointment" />
          <QuickActionButton icon={FileText} label="Create Report" />
          <QuickActionButton icon={MessageSquare} label="Message Patient" />
          <QuickActionButton icon={Brain} label="AI Consultation" />
        </div>
      </div>

      {/* Today's Schedule & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {appointments.slice(0, 4).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.time} - {appointment.type}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Patients</h3>
          <div className="space-y-3">
            {patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{patient.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{patient.condition}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  change: string;
}

function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
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

// Quick Action Button Component
interface QuickActionButtonProps {
  icon: React.ComponentType<any>;
  label: string;
}

function QuickActionButton({ icon: Icon, label }: QuickActionButtonProps) {
  return (
    <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors">
      <Icon className="h-6 w-6 text-blue-600 mb-2" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </button>
  );
}

// Appointments Tab Component
function AppointmentsTab({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appointments Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Appointment</span>
        </button>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-spotify-lighter-gray">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-spotify-lighter-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-spotify-light-gray dark:text-white"
                />
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-spotify-lighter-gray">
            <thead className="bg-gray-50 dark:bg-spotify-light-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-spotify-black divide-y divide-gray-200 dark:divide-spotify-lighter-gray">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-spotify-light-gray">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{appointment.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{appointment.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{appointment.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                      {appointment.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
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

// Patients Tab Component
function PatientsTab({ patients }: { patients: Patient[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Patient</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div key={patient.id} className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{patient.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{patient.age} years, {patient.gender}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Visit:</span>
                <span className="text-sm text-gray-900 dark:text-white">{patient.lastVisit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Condition:</span>
                <span className="text-sm text-gray-900 dark:text-white">{patient.condition}</span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                View Details
              </button>
              <button className="px-3 py-2 border border-gray-300 dark:border-spotify-lighter-gray rounded-lg hover:bg-gray-50 dark:hover:bg-spotify-light-gray transition-colors text-sm text-gray-700 dark:text-gray-300">
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reports Tab Component
function ReportsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Medical Reports</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Reports</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">42</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Completion Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">2.5h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-spotify-lighter-gray">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Reports</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { patient: 'Marie Dubois', type: 'Blood Test Results', date: '2024-06-25', status: 'completed' },
              { patient: 'Jean Kamga', type: 'X-Ray Analysis', date: '2024-06-24', status: 'pending' },
              { patient: 'Fatima Ngono', type: 'Consultation Summary', date: '2024-06-23', status: 'completed' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{report.type}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Patient: {report.patient}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date: {report.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Assistant Tab Component
function AIAssistantTab() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello Dr. Frederic! I\'m your AI medical assistant. How can I help you today?' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Medical Assistant</h2>
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Analyze Document</span>
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Drug Interaction Check</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow h-96 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-spotify-lighter-gray">
              <h3 className="font-medium text-gray-900 dark:text-white">Medical Consultation Assistant</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-spotify-light-gray text-gray-900 dark:text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-spotify-lighter-gray">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about symptoms, medications, or upload documents..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-spotify-lighter-gray rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-spotify-light-gray dark:text-white"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors">
                <div className="flex items-center">
                  <Search className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Drug Information</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Symptom Analysis</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">Lab Results Analysis</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Analyses</h4>
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 dark:bg-spotify-light-gray rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Blood Test - Marie D.</p>
                <p className="text-xs text-green-600">Normal ranges</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-spotify-light-gray rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">X-Ray - Jean K.</p>
                <p className="text-xs text-yellow-600">Requires attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Doctor Profile</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Edit className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dr. Ngana Noa Junior Frederic</h3>
                <p className="text-gray-600 dark:text-gray-400">General Practitioner</p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">4.8/5 (247 reviews)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">dr.frederic@ukuqala.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">+237 6XX XXX XXX</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Yaoundé, Cameroon</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Professional Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">License Number:</span>
                    <span className="text-sm text-gray-900 dark:text-white">MD-CM-2024-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Years of Experience:</span>
                    <span className="text-sm text-gray-900 dark:text-white">8 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Specialization:</span>
                    <span className="text-sm text-gray-900 dark:text-white">Internal Medicine</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Monthly Performance</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Patients Treated</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Rating</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">4.8/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Response Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">&lt; 2 hours</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Certifications</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-900 dark:text-white">Board Certified Internal Medicine</span>
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-900 dark:text-white">Advanced Cardiac Life Support</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm text-gray-900 dark:text-white">Continuing Medical Education</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Update Availability
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                Send Message to Ukuqala
              </button>
              <button className="w-full border border-gray-300 dark:border-spotify-lighter-gray text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-spotify-light-gray transition-colors text-sm">
                Download Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get status colors (moved to end to avoid duplication)
function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'scheduled': return 'text-blue-600 bg-blue-100';
    case 'cancelled': return 'text-red-600 bg-red-100';
    case 'stable': return 'text-green-600 bg-green-100';
    case 'critical': return 'text-red-600 bg-red-100';
    case 'improving': return 'text-blue-600 bg-blue-100';
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

// Helper function to get priority colors
function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
