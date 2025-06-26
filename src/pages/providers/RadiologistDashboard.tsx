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
  Zap,
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
  Camera,
  Monitor,
  Scan,
  Image,
  FileImage,
  Layers,
  Target,
  Microscope
} from 'lucide-react';

interface RadiologistStats {
  totalScans: number;
  todayReports: number;
  monthlyEarnings: number;
  pendingReviews: number;
  accuracyRate: number;
  avgReportTime: number;
}

interface ScanReport {
  id: string;
  patientName: string;
  scanType: string;
  bodyPart: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-review' | 'completed' | 'urgent-review';
  requestedBy: string;
  scanDate: string;
  findings?: string;
}

interface ImagingStudy {
  id: string;
  patientName: string;
  studyType: string;
  modality: string;
  images: number;
  timestamp: string;
  status: 'new' | 'reviewed' | 'reported';
  urgency: 'routine' | 'urgent' | 'stat';
}

export default function RadiologistDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'scans' | 'reports' | 'imaging' | 'ai-assistant' | 'profile'>('overview');
  const [radiologistStats, setRadiologistStats] = useState<RadiologistStats>({
    totalScans: 1247,
    todayReports: 15,
    monthlyEarnings: 950000, // XAF
    pendingReviews: 23,
    accuracyRate: 98.5,
    avgReportTime: 45 // minutes
  });

  const [pendingScans] = useState<ScanReport[]>([
    { id: '1', patientName: 'Marie Dubois', scanType: 'CT Scan', bodyPart: 'Chest', priority: 'urgent', status: 'pending', requestedBy: 'Dr. Ngana', scanDate: '2024-06-26', findings: 'Possible pneumonia' },
    { id: '2', patientName: 'Jean Kamga', scanType: 'MRI', bodyPart: 'Brain', priority: 'high', status: 'in-review', requestedBy: 'Dr. Sarah', scanDate: '2024-06-25' },
    { id: '3', patientName: 'Fatima Ngono', scanType: 'X-Ray', bodyPart: 'Knee', priority: 'medium', status: 'pending', requestedBy: 'Dr. Paul', scanDate: '2024-06-26' },
    { id: '4', patientName: 'Paul Mbarga', scanType: 'Ultrasound', bodyPart: 'Abdomen', priority: 'low', status: 'completed', requestedBy: 'Dr. Marie', scanDate: '2024-06-24' },
  ]);

  const [recentStudies] = useState<ImagingStudy[]>([
    { id: '1', patientName: 'Marie Dubois', studyType: 'Chest CT', modality: 'CT', images: 245, timestamp: '10:30', status: 'new', urgency: 'urgent' },
    { id: '2', patientName: 'Jean Kamga', studyType: 'Brain MRI', modality: 'MRI', images: 180, timestamp: '09:15', status: 'reviewed', urgency: 'routine' },
    { id: '3', patientName: 'Fatima Ngono', studyType: 'Knee X-Ray', modality: 'X-Ray', images: 2, timestamp: '11:45', status: 'reported', urgency: 'routine' },
  ]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'scans', name: 'Scan Queue', icon: Scan },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'imaging', name: 'Imaging Studies', icon: Image },
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
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Scan className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Radiologist Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Dr. Alex Thompson</p>
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
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
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
              <OverviewTab stats={radiologistStats} scans={pendingScans} studies={recentStudies} />
            )}
            {activeTab === 'scans' && (
              <ScansTab scans={pendingScans} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab />
            )}
            {activeTab === 'imaging' && (
              <ImagingTab studies={recentStudies} />
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
  stats: RadiologistStats;
  scans: ScanReport[];
  studies: ImagingStudy[];
}

function OverviewTab({ stats, scans, studies }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Scans Reviewed"
          value={stats.totalScans.toString()}
          icon={Scan}
          color="purple"
          change="+45"
        />
        <StatCard
          title="Today's Reports"
          value={stats.todayReports.toString()}
          icon={FileText}
          color="blue"
          change="+3"
        />
        <StatCard
          title="Monthly Earnings"
          value={`${(stats.monthlyEarnings / 1000).toFixed(0)}K XAF`}
          icon={DollarSign}
          color="green"
          change="+22%"
        />
        <StatCard
          title="Accuracy Rate"
          value={`${stats.accuracyRate}%`}
          icon={Target}
          color="yellow"
          change="+0.3%"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={Eye} label="Review Scan" />
          <QuickActionButton icon={FileText} label="Create Report" />
          <QuickActionButton icon={Brain} label="AI Analysis" />
          <QuickActionButton icon={Microscope} label="Compare Studies" />
        </div>
      </div>

      {/* Urgent Scans & Recent Studies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Urgent Scans</h3>
          <div className="space-y-3">
            {scans.filter(scan => scan.priority === 'urgent' || scan.priority === 'high').map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{scan.scanType} - {scan.bodyPart}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{scan.patientName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Requested by: {scan.requestedBy}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(scan.priority)}`}>
                    {scan.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}>
                    {scan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Imaging Studies</h3>
          <div className="space-y-3">
            {studies.map((study) => (
              <div key={study.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{study.studyType}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{study.patientName} - {study.images} images</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time: {study.timestamp}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(study.urgency)}`}>
                    {study.urgency}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStudyStatusColor(study.status)}`}>
                    {study.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components and functions
function StatCard({ title, value, icon: Icon, color, change }: { title: string; value: string; icon: React.ComponentType<any>; color: string; change: string }) {
  const colorClasses = {
    purple: 'text-purple-600 bg-purple-100',
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
      <Icon className="h-6 w-6 text-purple-600 mb-2" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </button>
  );
}

function ScansTab({ scans }: { scans: ScanReport[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scan Review Queue</h2>
        <div className="flex space-x-2">
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Review Next</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-spotify-lighter-gray">
            <thead className="bg-gray-50 dark:bg-spotify-light-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scan Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Body Part</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-spotify-black divide-y divide-gray-200 dark:divide-spotify-lighter-gray">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-spotify-light-gray">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{scan.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{scan.scanType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{scan.bodyPart}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(scan.priority)}`}>
                      {scan.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{scan.requestedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400">
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

function ReportsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Radiology Reports</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reports Today</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">15</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Report Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">45min</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accuracy Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">98.5%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Reports</h3>
        <div className="space-y-4">
          {[
            { patient: 'Marie Dubois', study: 'Chest CT', findings: 'Pneumonia in right lower lobe', date: '2024-06-26', status: 'completed' },
            { patient: 'Jean Kamga', study: 'Brain MRI', findings: 'No acute findings', date: '2024-06-25', status: 'completed' },
            { patient: 'Fatima Ngono', study: 'Knee X-Ray', findings: 'Mild osteoarthritis', date: '2024-06-24', status: 'pending' },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{report.study}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Patient: {report.patient}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Findings: {report.findings}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date: {report.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'completed' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
                  {report.status}
                </span>
                <button className="text-purple-600 hover:text-purple-800 dark:text-purple-400">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImagingTab({ studies }: { studies: ImagingStudy[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Imaging Studies</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
          <Image className="h-4 w-4" />
          <span>View DICOM</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studies.map((study) => (
          <div key={study.id} className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{study.studyType}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{study.patientName}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStudyStatusColor(study.status)}`}>
                {study.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Modality:</span>
                <span className="text-sm text-gray-900 dark:text-white">{study.modality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Images:</span>
                <span className="text-sm text-gray-900 dark:text-white">{study.images}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Time:</span>
                <span className="text-sm text-gray-900 dark:text-white">{study.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Urgency:</span>
                <span className={`text-sm font-medium ${getUrgencyColor(study.urgency)}`}>{study.urgency}</span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                View Images
              </button>
              <button className="px-3 py-2 border border-gray-300 dark:border-spotify-lighter-gray rounded-lg hover:bg-gray-50 dark:hover:bg-spotify-light-gray transition-colors text-sm text-gray-700 dark:text-gray-300">
                Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIAssistantTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Radiology Assistant</h2>
        <div className="flex space-x-2">
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Analysis</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Microscope className="h-4 w-4" />
            <span>Compare Studies</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Tools */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">AI-Powered Analysis Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors text-left">
                <div className="flex items-center">
                  <Brain className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Lung Nodule Detection</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered chest CT analysis</p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors text-left">
                <div className="flex items-center">
                  <Target className="h-6 w-6 text-red-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Fracture Detection</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automated bone fracture analysis</p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors text-left">
                <div className="flex items-center">
                  <Layers className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Brain Lesion Analysis</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">MRI brain abnormality detection</p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-gray-50 dark:bg-spotify-light-gray rounded-lg hover:bg-gray-100 dark:hover:bg-spotify-lighter-gray transition-colors text-left">
                <div className="flex items-center">
                  <Monitor className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Cardiac Assessment</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automated cardiac function analysis</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent AI Analyses */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent AI Analyses</h4>
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 dark:bg-spotify-light-gray rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Chest CT - Marie D.</p>
                <p className="text-xs text-green-600">No nodules detected</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-spotify-light-gray rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Brain MRI - Jean K.</p>
                <p className="text-xs text-blue-600">Normal findings</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-spotify-light-gray rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Knee X-Ray - Fatima N.</p>
                <p className="text-xs text-yellow-600">Mild degenerative changes</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">AI Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Accuracy:</span>
                <span className="text-xs text-green-600">98.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Sensitivity:</span>
                <span className="text-xs text-blue-600">96.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Specificity:</span>
                <span className="text-xs text-purple-600">99.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Radiologist Profile</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
          <Edit className="h-4 w-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                <Scan className="h-10 w-10 text-white" />
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dr. Alex Thompson</h3>
                <p className="text-gray-600 dark:text-gray-400">Board-Certified Radiologist</p>
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">4.9/5 (342 reviews)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">alex.thompson@ukuqala.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">+237 6XX XXX XXX</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Douala, Cameroon</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Professional Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">License Number:</span>
                    <span className="text-sm text-gray-900 dark:text-white">RAD-CM-2024-003</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Years of Experience:</span>
                    <span className="text-sm text-gray-900 dark:text-white">12 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Subspecialty:</span>
                    <span className="text-sm text-gray-900 dark:text-white">Chest Imaging</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Certifications */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Monthly Performance</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Scans Reviewed</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Accuracy Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">98.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Report Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">45 min</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-spotify-black rounded-lg shadow p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Certifications</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm text-gray-900 dark:text-white">Board Certified Radiology</span>
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-900 dark:text-white">Subspecialty Chest Imaging</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-900 dark:text-white">AI in Radiology Certificate</span>
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
    case 'urgent': return 'text-red-600 bg-red-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'in-review': return 'text-blue-600 bg-blue-100';
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    case 'urgent-review': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'stat': return 'text-red-600 bg-red-100';
    case 'urgent': return 'text-orange-600 bg-orange-100';
    case 'routine': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getStudyStatusColor(status: string) {
  switch (status) {
    case 'reported': return 'text-green-600 bg-green-100';
    case 'reviewed': return 'text-blue-600 bg-blue-100';
    case 'new': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
