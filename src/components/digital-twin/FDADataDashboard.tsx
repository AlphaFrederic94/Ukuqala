import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Database,
  AlertTriangle,
  Activity,
  Pill,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  ExternalLink,
  RefreshCw,
  Filter,
  Search,
  Download,
  Info,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { openFDAService, AdverseEvent, DrugLabel, NDCProduct, RecallEnforcement } from '../../lib/openFDAService';
import { fdaDataProcessor, MedicationRisk } from '../../lib/fdaDataProcessor';
import { toast } from 'react-hot-toast';

interface FDADataDashboardProps {
  medications: string[];
  patientProfile?: {
    age?: number;
    gender?: 'male' | 'female';
    weight?: number;
    conditions?: string[];
    allergies?: string[];
  };
}

interface FDADataSummary {
  totalAdverseEvents: number;
  seriousEvents: number;
  recalls: number;
  interactions: number;
  lastUpdated: Date;
}

const FDADataDashboard: React.FC<FDADataDashboardProps> = ({ medications, patientProfile }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'adverse-events' | 'recalls' | 'interactions' | 'labels'>('overview');
  const [selectedMedication, setSelectedMedication] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // FDA Data States
  const [fdaSummary, setFdaSummary] = useState<FDADataSummary | null>(null);
  const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>([]);
  const [drugLabels, setDrugLabels] = useState<Map<string, DrugLabel>>(new Map());
  const [recalls, setRecalls] = useState<RecallEnforcement[]>([]);
  const [medicationRisks, setMedicationRisks] = useState<MedicationRisk[]>([]);
  const [ndcProducts, setNdcProducts] = useState<NDCProduct[]>([]);

  useEffect(() => {
    if (medications.length > 0) {
      loadFDAData();
    }
  }, [medications, patientProfile]);

  const loadFDAData = async () => {
    setLoading(true);
    try {
      // Load comprehensive FDA data for all medications
      const dataPromises = medications.map(async (medication) => {
        const [adverseEventsData, drugLabel, recallsData, ndcData] = await Promise.all([
          openFDAService.searchAdverseEvents(medication, 50).catch(() => []),
          openFDAService.getDrugLabel(medication).catch(() => null),
          openFDAService.getDrugRecalls(medication, 20).catch(() => []),
          openFDAService.searchNDC(medication, 10).catch(() => [])
        ]);

        return {
          medication,
          adverseEvents: adverseEventsData,
          drugLabel,
          recalls: recallsData,
          ndcProducts: ndcData
        };
      });

      const results = await Promise.all(dataPromises);

      // Aggregate data
      const allAdverseEvents: AdverseEvent[] = [];
      const allRecalls: RecallEnforcement[] = [];
      const allNdcProducts: NDCProduct[] = [];
      const labelMap = new Map<string, DrugLabel>();

      results.forEach(({ medication, adverseEvents, drugLabel, recalls, ndcProducts }) => {
        allAdverseEvents.push(...adverseEvents);
        allRecalls.push(...recalls);
        allNdcProducts.push(...ndcProducts);
        if (drugLabel) {
          labelMap.set(medication, drugLabel);
        }
      });

      setAdverseEvents(allAdverseEvents);
      setRecalls(allRecalls);
      setNdcProducts(allNdcProducts);
      setDrugLabels(labelMap);

      // Get medication risk analysis
      if (patientProfile) {
        const riskAnalysis = await fdaDataProcessor.analyzeMedicationRisks({
          medications,
          ...patientProfile
        });
        setMedicationRisks(riskAnalysis.medicationRisks);
      }

      // Calculate summary
      const seriousEvents = allAdverseEvents.filter(event => event.serious === '1').length;
      const recentRecalls = allRecalls.filter(recall => {
        const recallDate = new Date(recall.recall_initiation_date);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return recallDate > sixMonthsAgo;
      }).length;

      // Check for interactions
      const interactions = medications.length > 1 
        ? await openFDAService.checkDrugInteractions(medications)
        : { interactions: [] };

      setFdaSummary({
        totalAdverseEvents: allAdverseEvents.length,
        seriousEvents,
        recalls: recentRecalls,
        interactions: interactions.interactions.length,
        lastUpdated: new Date()
      });

      toast.success('FDA data loaded successfully');
    } catch (error) {
      console.error('Error loading FDA data:', error);
      toast.error('Failed to load FDA data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (selectedMedication === 'all') {
      return {
        adverseEvents,
        recalls,
        medicationRisks
      };
    }

    return {
      adverseEvents: adverseEvents.filter(event =>
        event.drug?.some(drug =>
          drug.medicinalproduct?.toLowerCase().includes(selectedMedication.toLowerCase())
        )
      ),
      recalls: recalls.filter(recall =>
        recall.product_description?.toLowerCase().includes(selectedMedication.toLowerCase())
      ),
      medicationRisks: medicationRisks.filter(risk =>
        risk.medication.toLowerCase().includes(selectedMedication.toLowerCase())
      )
    };
  };

  const filteredData = getFilteredData();

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Events</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {fdaSummary?.totalAdverseEvents || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Serious Events</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {fdaSummary?.seriousEvents || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">Recent Recalls</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {fdaSummary?.recalls || 0}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Interactions</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {fdaSummary?.interactions || 0}
              </p>
            </div>
            <Pill className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Medication Risk Summary */}
      {medicationRisks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Medication Risk Assessment
          </h3>
          <div className="space-y-4">
            {medicationRisks.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Pill className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{risk.medication}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {risk.adverseEventCount} events reported, {risk.seriousEventCount} serious
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  risk.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                  risk.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                  risk.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                }`}>
                  {risk.riskLevel.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent FDA Activity
        </h3>
        <div className="space-y-3">
          {recalls.slice(0, 5).map((recall, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Recall: {recall.product_description}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recall.reason_for_recall}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(recall.recall_initiation_date).toLocaleDateString()} • {recall.classification}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdverseEventsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Adverse Events Analysis
        </h3>
        
        {filteredData.adverseEvents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              No adverse events found for selected medications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.adverseEvents.slice(0, 10).map((event, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.serious === '1' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {event.serious === '1' ? 'SERIOUS' : 'NON-SERIOUS'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {event.receivedate}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Patient Info</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {event.patient?.patientonsetage && (
                        <li>Age: {event.patient.patientonsetage} {event.patient.patientageunit}</li>
                      )}
                      {event.patient?.patientsex && (
                        <li>Gender: {event.patient.patientsex === '1' ? 'Male' : 'Female'}</li>
                      )}
                      {event.patient?.patientweight && (
                        <li>Weight: {event.patient.patientweight} kg</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reactions</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {event.reaction?.slice(0, 3).map((reaction, idx) => (
                        <li key={idx}>• {reaction.reactionmeddrapt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRecallsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          FDA Recalls
        </h3>
        
        {filteredData.recalls.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              No recalls found for selected medications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.recalls.map((recall, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      recall.classification === 'Class I' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        : recall.classification === 'Class II'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                      {recall.classification}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(recall.recall_initiation_date).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {recall.product_description}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Reason:</strong> {recall.reason_for_recall}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Recalling Firm:</strong> {recall.recalling_firm}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLabelsTab = () => (
    <div className="space-y-6">
      {Array.from(drugLabels.entries()).map(([medication, label]) => (
        <div key={medication} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {medication} - FDA Label Information
            </h3>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {label.indications_and_usage && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Indications</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                  {label.indications_and_usage[0]?.substring(0, 300)}...
                </div>
              </div>
            )}
            
            {label.warnings && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Warnings</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                  {label.warnings[0]?.substring(0, 300)}...
                </div>
              </div>
            )}
            
            {label.contraindications && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contraindications</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                  {label.contraindications[0]?.substring(0, 300)}...
                </div>
              </div>
            )}
            
            {label.adverse_reactions && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Adverse Reactions</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                  {label.adverse_reactions[0]?.substring(0, 300)}...
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

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
            <Database className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              FDA Data Dashboard
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedMedication}
              onChange={(e) => setSelectedMedication(e.target.value)}
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">All Medications</option>
              {medications.map(med => (
                <option key={med} value={med}>{med}</option>
              ))}
            </select>
            <button
              onClick={loadFDAData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'adverse-events', label: 'Adverse Events', icon: Activity },
              { id: 'recalls', label: 'Recalls', icon: AlertTriangle },
              { id: 'labels', label: 'Drug Labels', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'adverse-events' && renderAdverseEventsTab()}
          {activeTab === 'recalls' && renderRecallsTab()}
          {activeTab === 'labels' && renderLabelsTab()}
        </motion.div>
      </AnimatePresence>

      {/* Data Source Footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
            <Info className="w-4 h-4 mr-2" />
            Data sourced from FDA openFDA API
          </div>
          {fdaSummary && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {fdaSummary.lastUpdated.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FDADataDashboard;
