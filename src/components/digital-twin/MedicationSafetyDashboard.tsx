import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Pill,
  Heart,
  Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { medicationSafetyMonitor, SafetyAlert, MedicationProfile, MonitoringSettings } from '../../lib/medicationSafetyMonitor';
import { toast } from 'react-hot-toast';

interface MedicationSafetyDashboardProps {
  patientProfile?: {
    age?: number;
    gender?: 'male' | 'female';
    weight?: number;
    conditions?: string[];
    medications: string[];
    allergies?: string[];
  };
}

const MedicationSafetyDashboard: React.FC<MedicationSafetyDashboardProps> = ({ patientProfile }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [profile, setProfile] = useState<MedicationProfile | null>(null);
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    if (user && patientProfile) {
      initializeMonitoring();
    }
  }, [user, patientProfile]);

  const initializeMonitoring = async () => {
    if (!user || !patientProfile) return;

    try {
      setLoading(true);
      
      // Initialize monitoring for the user
      await medicationSafetyMonitor.initializeUserMonitoring(user.id, patientProfile);
      
      // Load current data
      await loadDashboardData();
      
      // Get settings
      const currentSettings = medicationSafetyMonitor.getSettings();
      setSettings(currentSettings);

    } catch (error) {
      console.error('Error initializing medication monitoring:', error);
      toast.error('Failed to initialize medication safety monitoring');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [activeAlerts] = await Promise.all([
        medicationSafetyMonitor.getActiveAlerts(user.id)
      ]);

      setAlerts(activeAlerts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const performSafetyCheck = async () => {
    if (!user) return;

    try {
      setChecking(true);
      const newAlerts = await medicationSafetyMonitor.performSafetyCheck(user.id);
      
      if (newAlerts.length > 0) {
        toast.success(`Safety check complete: ${newAlerts.length} new alerts found`);
      } else {
        toast.success('Safety check complete: No new issues found');
      }
      
      await loadDashboardData();
    } catch (error) {
      console.error('Error performing safety check:', error);
      toast.error('Failed to perform safety check');
    } finally {
      setChecking(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;

    try {
      await medicationSafetyMonitor.acknowledgeAlert(user.id, alertId);
      await loadDashboardData();
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const dismissAlert = async (alertId: string) => {
    if (!user) return;

    try {
      await medicationSafetyMonitor.dismissAlert(user.id, alertId);
      await loadDashboardData();
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  const updateSettings = async (newSettings: Partial<MonitoringSettings>) => {
    try {
      medicationSafetyMonitor.updateSettings(newSettings);
      setSettings(medicationSafetyMonitor.getSettings());
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <AlertCircle className="w-5 h-5" />;
      case 'medium': return <AlertCircle className="w-5 h-5" />;
      case 'low': return <AlertCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recall': return <AlertTriangle className="w-4 h-4" />;
      case 'adverse_event': return <Activity className="w-4 h-4" />;
      case 'interaction': return <Pill className="w-4 h-4" />;
      case 'contraindication': return <Heart className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Initializing medication safety monitoring...
          </span>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const highAlerts = alerts.filter(alert => alert.severity === 'high');
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Medication Safety Monitor
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={performSafetyCheck}
              disabled={checking}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Now'}
            </button>
          </div>
        </div>

        {/* Safety Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">High Risk</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{highAlerts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Unread</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{unacknowledgedAlerts.length}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && settings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monitoring Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => updateSettings({ enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Enable monitoring</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check interval (hours)
                </label>
                <select
                  value={settings.checkInterval}
                  onChange={(e) => updateSettings({ checkInterval: parseInt(e.target.value) })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value={1}>Every hour</option>
                  <option value={6}>Every 6 hours</option>
                  <option value={12}>Every 12 hours</option>
                  <option value={24}>Daily</option>
                  <option value={168}>Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert threshold
                </label>
                <select
                  value={settings.alertThreshold}
                  onChange={(e) => updateSettings({ alertThreshold: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low (all alerts)</option>
                  <option value="medium">Medium (moderate and above)</option>
                  <option value="high">High (high and critical only)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.includeMinorAdverseEvents}
                    onChange={(e) => updateSettings({ includeMinorAdverseEvents: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Include minor adverse events</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Safety Alerts
          </h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Database className="w-4 h-4 mr-1" />
            FDA Data
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              No safety alerts found. Your medications appear to be safe.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getTypeIcon(alert.type)}
                        <h4 className="font-medium">{alert.title}</h4>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/50">
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <p className="text-sm font-medium mb-2">
                        Action Required: {alert.actionRequired}
                      </p>
                      {alert.fdaSource && (
                        <p className="text-xs opacity-75">Source: {alert.fdaSource}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="p-1 text-green-600 hover:text-green-700 rounded"
                        title="Acknowledge"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Dismiss"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MedicationSafetyDashboard;
