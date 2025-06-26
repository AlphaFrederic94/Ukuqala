/**
 * Medication Safety Monitoring System
 * Provides continuous monitoring of user medications against FDA safety data
 */

import { openFDAService, AdverseEvent, RecallEnforcement } from './openFDAService';
import { fdaDataProcessor, MedicationRisk, PatientProfile } from './fdaDataProcessor';
import { supabase } from './supabaseClient';

export interface SafetyAlert {
  id: string;
  type: 'recall' | 'adverse_event' | 'interaction' | 'contraindication';
  severity: 'low' | 'medium' | 'high' | 'critical';
  medication: string;
  title: string;
  description: string;
  actionRequired: string;
  fdaSource?: string;
  dateCreated: Date;
  dateExpires?: Date;
  acknowledged: boolean;
  dismissed: boolean;
}

export interface MedicationProfile {
  userId: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    startDate: Date;
    endDate?: Date;
    prescribedBy?: string;
    indication?: string;
  }>;
  allergies: string[];
  conditions: string[];
  lastMonitored: Date;
  riskScore: number;
}

export interface MonitoringSettings {
  enabled: boolean;
  checkInterval: number; // hours
  alertThreshold: 'low' | 'medium' | 'high';
  notificationMethods: ('email' | 'push' | 'sms')[];
  autoAcknowledgeRecalls: boolean;
  includeMinorAdverseEvents: boolean;
}

class MedicationSafetyMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private activeAlerts: Map<string, SafetyAlert> = new Map();
  private userProfiles: Map<string, MedicationProfile> = new Map();
  private settings: MonitoringSettings = {
    enabled: true,
    checkInterval: 24, // Check every 24 hours
    alertThreshold: 'medium',
    notificationMethods: ['push'],
    autoAcknowledgeRecalls: false,
    includeMinorAdverseEvents: false
  };

  /**
   * Initialize monitoring for a user
   */
  async initializeUserMonitoring(userId: string, patientProfile: PatientProfile): Promise<void> {
    try {
      // Load existing medication profile from database
      const { data: existingProfile } = await supabase
        .from('medication_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      let medicationProfile: MedicationProfile;

      if (existingProfile) {
        medicationProfile = {
          userId,
          medications: existingProfile.medications || [],
          allergies: existingProfile.allergies || [],
          conditions: existingProfile.conditions || [],
          lastMonitored: new Date(existingProfile.last_monitored),
          riskScore: existingProfile.risk_score || 0
        };
      } else {
        // Create new profile
        medicationProfile = {
          userId,
          medications: patientProfile.medications.map(med => ({
            name: med,
            startDate: new Date(),
          })),
          allergies: patientProfile.allergies || [],
          conditions: patientProfile.conditions || [],
          lastMonitored: new Date(),
          riskScore: 0
        };

        // Save to database
        await supabase
          .from('medication_profiles')
          .insert({
            user_id: userId,
            medications: medicationProfile.medications,
            allergies: medicationProfile.allergies,
            conditions: medicationProfile.conditions,
            last_monitored: medicationProfile.lastMonitored.toISOString(),
            risk_score: 0
          });
      }

      this.userProfiles.set(userId, medicationProfile);

      // Perform initial safety check
      await this.performSafetyCheck(userId);

      console.log(`Medication safety monitoring initialized for user ${userId}`);
    } catch (error) {
      console.error('Error initializing medication monitoring:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive safety check for a user
   */
  async performSafetyCheck(userId: string): Promise<SafetyAlert[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const alerts: SafetyAlert[] = [];
    const medicationNames = profile.medications.map(med => med.name);

    try {
      // Check for recalls
      const recallAlerts = await this.checkForRecalls(medicationNames);
      alerts.push(...recallAlerts);

      // Check for new adverse events
      const adverseEventAlerts = await this.checkForAdverseEvents(medicationNames, profile);
      alerts.push(...adverseEventAlerts);

      // Check for drug interactions
      if (medicationNames.length > 1) {
        const interactionAlerts = await this.checkForInteractions(medicationNames);
        alerts.push(...interactionAlerts);
      }

      // Check for contraindications
      const contraindicationAlerts = await this.checkForContraindications(medicationNames, profile);
      alerts.push(...contraindicationAlerts);

      // Update risk score
      const riskScore = await this.calculateRiskScore(medicationNames, profile);
      profile.riskScore = riskScore;
      profile.lastMonitored = new Date();

      // Save alerts to database and memory
      for (const alert of alerts) {
        this.activeAlerts.set(alert.id, alert);
        await this.saveAlertToDatabase(userId, alert);
      }

      // Update profile in database
      await this.updateProfileInDatabase(userId, profile);

      console.log(`Safety check completed for user ${userId}: ${alerts.length} alerts generated`);
      return alerts;

    } catch (error) {
      console.error('Error performing safety check:', error);
      throw error;
    }
  }

  /**
   * Check for drug recalls
   */
  private async checkForRecalls(medications: string[]): Promise<SafetyAlert[]> {
    const alerts: SafetyAlert[] = [];

    for (const medication of medications) {
      try {
        const recalls = await openFDAService.getDrugRecalls(medication, 10);
        
        for (const recall of recalls) {
          // Check if recall is recent (within last 90 days)
          const recallDate = new Date(recall.recall_initiation_date);
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

          if (recallDate > ninetyDaysAgo) {
            const severity = this.getRecallSeverity(recall.classification);
            
            alerts.push({
              id: `recall_${medication}_${recall.recall_number}`,
              type: 'recall',
              severity,
              medication,
              title: `FDA Recall: ${medication}`,
              description: recall.reason_for_recall,
              actionRequired: this.getRecallAction(recall.classification),
              fdaSource: `Recall #${recall.recall_number}`,
              dateCreated: new Date(),
              dateExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
              acknowledged: false,
              dismissed: false
            });
          }
        }
      } catch (error) {
        console.error(`Error checking recalls for ${medication}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Check for significant adverse events
   */
  private async checkForAdverseEvents(medications: string[], profile: MedicationProfile): Promise<SafetyAlert[]> {
    const alerts: SafetyAlert[] = [];

    for (const medication of medications) {
      try {
        const adverseEvents = await openFDAService.searchAdverseEvents(medication, 20);
        
        // Filter for serious events or events matching user profile
        const relevantEvents = adverseEvents.filter(event => {
          // Include serious events
          if (event.serious === '1') return true;
          
          // Include events matching user demographics if available
          // This would require patient profile data
          return false;
        });

        if (relevantEvents.length > 0) {
          // Group by reaction type
          const reactionCounts = new Map<string, number>();
          relevantEvents.forEach(event => {
            event.reaction?.forEach(reaction => {
              if (reaction.reactionmeddrapt) {
                const reactionName = reaction.reactionmeddrapt.toLowerCase();
                reactionCounts.set(reactionName, (reactionCounts.get(reactionName) || 0) + 1);
              }
            });
          });

          // Create alerts for common serious reactions
          const topReactions = Array.from(reactionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          for (const [reaction, count] of topReactions) {
            if (count >= 3) { // Only alert if reaction reported 3+ times
              alerts.push({
                id: `adverse_${medication}_${reaction.replace(/\s+/g, '_')}`,
                type: 'adverse_event',
                severity: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
                medication,
                title: `Adverse Event Alert: ${medication}`,
                description: `${count} reports of ${reaction} associated with ${medication}`,
                actionRequired: 'Monitor for symptoms and consult healthcare provider if experienced',
                fdaSource: 'FDA Adverse Event Reporting System (FAERS)',
                dateCreated: new Date(),
                acknowledged: false,
                dismissed: false
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error checking adverse events for ${medication}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Check for drug interactions
   */
  private async checkForInteractions(medications: string[]): Promise<SafetyAlert[]> {
    const alerts: SafetyAlert[] = [];

    try {
      const interactions = await openFDAService.checkDrugInteractions(medications);
      
      for (const interaction of interactions.interactions) {
        if (interaction.riskLevel === 'high' || interaction.riskLevel === 'medium') {
          alerts.push({
            id: `interaction_${interaction.drugs.join('_')}`,
            type: 'interaction',
            severity: interaction.riskLevel === 'high' ? 'high' : 'medium',
            medication: interaction.drugs.join(' + '),
            title: `Drug Interaction Alert`,
            description: `Potential interaction between ${interaction.drugs.join(' and ')}`,
            actionRequired: 'Consult healthcare provider about this medication combination',
            fdaSource: 'FDA Adverse Event Database',
            dateCreated: new Date(),
            acknowledged: false,
            dismissed: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking drug interactions:', error);
    }

    return alerts;
  }

  /**
   * Check for contraindications
   */
  private async checkForContraindications(medications: string[], profile: MedicationProfile): Promise<SafetyAlert[]> {
    const alerts: SafetyAlert[] = [];

    for (const medication of medications) {
      try {
        const drugLabel = await openFDAService.getDrugLabel(medication);
        
        if (drugLabel?.contraindications) {
          for (const contraindication of drugLabel.contraindications) {
            // Check if user has any conditions mentioned in contraindications
            const hasContraindication = profile.conditions.some(condition =>
              contraindication.toLowerCase().includes(condition.toLowerCase())
            );

            if (hasContraindication) {
              alerts.push({
                id: `contraindication_${medication}_${profile.conditions.find(c => contraindication.toLowerCase().includes(c.toLowerCase()))}`,
                type: 'contraindication',
                severity: 'high',
                medication,
                title: `Contraindication Alert: ${medication}`,
                description: `${medication} may be contraindicated due to your medical condition`,
                actionRequired: 'Consult healthcare provider immediately',
                fdaSource: 'FDA Drug Labeling',
                dateCreated: new Date(),
                acknowledged: false,
                dismissed: false
              });
            }
          }
        }

        // Check allergies
        if (profile.allergies.length > 0 && drugLabel?.openfda?.substance_name) {
          const hasAllergy = profile.allergies.some(allergy =>
            drugLabel.openfda.substance_name?.some(substance =>
              substance.toLowerCase().includes(allergy.toLowerCase())
            )
          );

          if (hasAllergy) {
            alerts.push({
              id: `allergy_${medication}`,
              type: 'contraindication',
              severity: 'critical',
              medication,
              title: `Allergy Alert: ${medication}`,
              description: `${medication} contains substances you may be allergic to`,
              actionRequired: 'DO NOT TAKE - Consult healthcare provider immediately',
              fdaSource: 'FDA Drug Labeling',
              dateCreated: new Date(),
              acknowledged: false,
              dismissed: false
            });
          }
        }
      } catch (error) {
        console.error(`Error checking contraindications for ${medication}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Calculate overall risk score
   */
  private async calculateRiskScore(medications: string[], profile: MedicationProfile): Promise<number> {
    try {
      const analysis = await fdaDataProcessor.analyzeMedicationRisks({
        medications,
        conditions: profile.conditions,
        allergies: profile.allergies
      });

      return analysis.overallRiskScore;
    } catch (error) {
      console.error('Error calculating risk score:', error);
      return 50; // Default moderate risk
    }
  }

  /**
   * Get recall severity based on FDA classification
   */
  private getRecallSeverity(classification: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (classification) {
      case 'Class I': return 'critical';
      case 'Class II': return 'high';
      case 'Class III': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Get recommended action for recall
   */
  private getRecallAction(classification: string): string {
    switch (classification) {
      case 'Class I': return 'STOP TAKING IMMEDIATELY - Contact healthcare provider';
      case 'Class II': return 'Contact healthcare provider about alternatives';
      case 'Class III': return 'Monitor for issues and consult healthcare provider';
      default: return 'Consult healthcare provider if concerned';
    }
  }

  /**
   * Save alert to database
   */
  private async saveAlertToDatabase(userId: string, alert: SafetyAlert): Promise<void> {
    try {
      await supabase
        .from('safety_alerts')
        .insert({
          id: alert.id,
          user_id: userId,
          type: alert.type,
          severity: alert.severity,
          medication: alert.medication,
          title: alert.title,
          description: alert.description,
          action_required: alert.actionRequired,
          fda_source: alert.fdaSource,
          date_created: alert.dateCreated.toISOString(),
          date_expires: alert.dateExpires?.toISOString(),
          acknowledged: alert.acknowledged,
          dismissed: alert.dismissed
        });
    } catch (error) {
      console.error('Error saving alert to database:', error);
    }
  }

  /**
   * Update profile in database
   */
  private async updateProfileInDatabase(userId: string, profile: MedicationProfile): Promise<void> {
    try {
      await supabase
        .from('medication_profiles')
        .update({
          medications: profile.medications,
          allergies: profile.allergies,
          conditions: profile.conditions,
          last_monitored: profile.lastMonitored.toISOString(),
          risk_score: profile.riskScore
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating profile in database:', error);
    }
  }

  /**
   * Get active alerts for user
   */
  async getActiveAlerts(userId: string): Promise<SafetyAlert[]> {
    try {
      const { data: alerts } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('date_created', { ascending: false });

      return alerts?.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        medication: alert.medication,
        title: alert.title,
        description: alert.description,
        actionRequired: alert.action_required,
        fdaSource: alert.fda_source,
        dateCreated: new Date(alert.date_created),
        dateExpires: alert.date_expires ? new Date(alert.date_expires) : undefined,
        acknowledged: alert.acknowledged,
        dismissed: alert.dismissed
      })) || [];
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(userId: string, alertId: string): Promise<void> {
    try {
      await supabase
        .from('safety_alerts')
        .update({ acknowledged: true })
        .eq('id', alertId)
        .eq('user_id', userId);

      const alert = this.activeAlerts.get(alertId);
      if (alert) {
        alert.acknowledged = true;
        this.activeAlerts.set(alertId, alert);
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(userId: string, alertId: string): Promise<void> {
    try {
      await supabase
        .from('safety_alerts')
        .update({ dismissed: true })
        .eq('id', alertId)
        .eq('user_id', userId);

      this.activeAlerts.delete(alertId);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      console.log('Running scheduled medication safety checks...');
      
      for (const [userId, profile] of this.userProfiles) {
        try {
          await this.performSafetyCheck(userId);
        } catch (error) {
          console.error(`Error in scheduled safety check for user ${userId}:`, error);
        }
      }
    }, this.settings.checkInterval * 60 * 60 * 1000); // Convert hours to milliseconds

    console.log(`Medication safety monitoring started (checking every ${this.settings.checkInterval} hours)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Medication safety monitoring stopped');
  }

  /**
   * Update monitoring settings
   */
  updateSettings(newSettings: Partial<MonitoringSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.settings.enabled && this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get monitoring settings
   */
  getSettings(): MonitoringSettings {
    return { ...this.settings };
  }
}

// Export singleton instance
export const medicationSafetyMonitor = new MedicationSafetyMonitor();
export type { SafetyAlert, MedicationProfile, MonitoringSettings };
