/**
 * FDA Data Processor
 * Processes and analyzes FDA data for digital twin integration
 */

import { openFDAService, AdverseEvent, DrugLabel, NDCProduct, RecallEnforcement } from './openFDAService';

interface MedicationRisk {
  medication: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  adverseEventCount: number;
  seriousEventCount: number;
  commonSideEffects: string[];
  contraindications: string[];
  interactions: string[];
  recalls: RecallEnforcement[];
}

interface HealthImpactAnalysis {
  overallRiskScore: number; // 0-100
  medicationRisks: MedicationRisk[];
  recommendations: string[];
  warnings: string[];
  safetyAlerts: string[];
}

interface PatientProfile {
  age?: number;
  gender?: 'male' | 'female';
  weight?: number;
  conditions?: string[];
  medications: string[];
  allergies?: string[];
}

class FDADataProcessor {
  /**
   * Analyze medication risks for a patient
   */
  async analyzeMedicationRisks(patientProfile: PatientProfile): Promise<HealthImpactAnalysis> {
    const medicationRisks: MedicationRisk[] = [];
    const warnings: string[] = [];
    const safetyAlerts: string[] = [];
    const recommendations: string[] = [];

    // Analyze each medication
    for (const medication of patientProfile.medications) {
      try {
        const medicationRisk = await this.analyzeSingleMedication(medication, patientProfile);
        medicationRisks.push(medicationRisk);

        // Generate warnings based on risk level
        if (medicationRisk.riskLevel === 'critical') {
          warnings.push(`CRITICAL: ${medication} has serious safety concerns. Consult your doctor immediately.`);
        } else if (medicationRisk.riskLevel === 'high') {
          warnings.push(`HIGH RISK: ${medication} requires careful monitoring.`);
        }

        // Add recall alerts
        if (medicationRisk.recalls.length > 0) {
          safetyAlerts.push(`RECALL ALERT: ${medication} has active recalls. Check with your pharmacist.`);
        }
      } catch (error) {
        console.error(`Error analyzing medication ${medication}:`, error);
      }
    }

    // Check for drug interactions
    if (patientProfile.medications.length > 1) {
      const interactions = await openFDAService.checkDrugInteractions(patientProfile.medications);
      
      interactions.interactions.forEach(interaction => {
        if (interaction.riskLevel === 'high') {
          warnings.push(`INTERACTION WARNING: ${interaction.drugs.join(' + ')} may have serious interactions.`);
        }
      });
    }

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore(medicationRisks);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(medicationRisks, patientProfile));

    return {
      overallRiskScore,
      medicationRisks,
      recommendations,
      warnings,
      safetyAlerts
    };
  }

  /**
   * Analyze a single medication
   */
  private async analyzeSingleMedication(medication: string, patientProfile: PatientProfile): Promise<MedicationRisk> {
    const [adverseEvents, drugLabel, recalls] = await Promise.all([
      openFDAService.searchAdverseEvents(medication, 50),
      openFDAService.getDrugLabel(medication),
      openFDAService.getDrugRecalls(medication, 10)
    ]);

    // Analyze adverse events
    const seriousEvents = adverseEvents.filter(event => event.serious === '1');
    const commonSideEffects = this.extractCommonSideEffects(adverseEvents);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(adverseEvents, seriousEvents, recalls);
    
    // Extract risk factors
    const riskFactors = this.extractRiskFactors(adverseEvents, drugLabel, patientProfile);
    
    // Extract contraindications
    const contraindications = this.extractContraindications(drugLabel);
    
    // Extract interactions
    const interactions = this.extractInteractions(drugLabel);

    return {
      medication,
      riskLevel,
      riskFactors,
      adverseEventCount: adverseEvents.length,
      seriousEventCount: seriousEvents.length,
      commonSideEffects,
      contraindications,
      interactions,
      recalls
    };
  }

  /**
   * Extract common side effects from adverse events
   */
  private extractCommonSideEffects(adverseEvents: AdverseEvent[]): string[] {
    const sideEffectCounts = new Map<string, number>();

    adverseEvents.forEach(event => {
      event.reaction?.forEach(reaction => {
        if (reaction.reactionmeddrapt) {
          const effect = reaction.reactionmeddrapt.toLowerCase();
          sideEffectCounts.set(effect, (sideEffectCounts.get(effect) || 0) + 1);
        }
      });
    });

    // Return top 10 most common side effects
    return Array.from(sideEffectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([effect]) => effect);
  }

  /**
   * Determine risk level based on adverse events and recalls
   */
  private determineRiskLevel(
    adverseEvents: AdverseEvent[], 
    seriousEvents: AdverseEvent[], 
    recalls: RecallEnforcement[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Active Class I recalls or high death rate
    if (recalls.some(recall => recall.classification === 'Class I') || 
        seriousEvents.filter(e => e.seriousnessdeath === '1').length > 5) {
      return 'critical';
    }

    // High: Many serious events or Class II recalls
    if (seriousEvents.length > 10 || recalls.some(recall => recall.classification === 'Class II')) {
      return 'high';
    }

    // Medium: Some serious events
    if (seriousEvents.length > 3 || adverseEvents.length > 20) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract risk factors specific to patient profile
   */
  private extractRiskFactors(
    adverseEvents: AdverseEvent[], 
    drugLabel: DrugLabel | null, 
    patientProfile: PatientProfile
  ): string[] {
    const riskFactors: string[] = [];

    // Age-related risks
    if (patientProfile.age) {
      const ageRelatedEvents = adverseEvents.filter(event => {
        const eventAge = parseInt(event.patient?.patientonsetage || '0');
        return Math.abs(eventAge - patientProfile.age) <= 10;
      });

      if (ageRelatedEvents.length > 5) {
        riskFactors.push(`Increased risk in age group ${patientProfile.age}±10 years`);
      }
    }

    // Gender-related risks
    if (patientProfile.gender) {
      const genderCode = patientProfile.gender === 'male' ? '1' : '2';
      const genderRelatedEvents = adverseEvents.filter(event => 
        event.patient?.patientsex === genderCode
      );

      if (genderRelatedEvents.length > adverseEvents.length * 0.7) {
        riskFactors.push(`Higher risk observed in ${patientProfile.gender} patients`);
      }
    }

    // Weight-related risks
    if (patientProfile.weight) {
      const weightRelatedEvents = adverseEvents.filter(event => {
        const eventWeight = parseFloat(event.patient?.patientweight || '0');
        return eventWeight > 0 && Math.abs(eventWeight - patientProfile.weight) <= 20;
      });

      if (weightRelatedEvents.length > 3) {
        riskFactors.push(`Weight-related dosing considerations`);
      }
    }

    // Condition-related contraindications
    if (patientProfile.conditions && drugLabel?.contraindications) {
      patientProfile.conditions.forEach(condition => {
        const hasContraindication = drugLabel.contraindications?.some(contra =>
          contra.toLowerCase().includes(condition.toLowerCase())
        );
        
        if (hasContraindication) {
          riskFactors.push(`Contraindicated with ${condition}`);
        }
      });
    }

    return riskFactors;
  }

  /**
   * Extract contraindications from drug label
   */
  private extractContraindications(drugLabel: DrugLabel | null): string[] {
    if (!drugLabel?.contraindications) return [];
    
    return drugLabel.contraindications
      .map(contra => contra.replace(/<[^>]*>/g, '').trim()) // Remove HTML tags
      .filter(contra => contra.length > 0)
      .slice(0, 5); // Limit to top 5
  }

  /**
   * Extract drug interactions from label
   */
  private extractInteractions(drugLabel: DrugLabel | null): string[] {
    if (!drugLabel?.drug_interactions) return [];
    
    return drugLabel.drug_interactions
      .map(interaction => interaction.replace(/<[^>]*>/g, '').trim())
      .filter(interaction => interaction.length > 0)
      .slice(0, 5);
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private calculateOverallRiskScore(medicationRisks: MedicationRisk[]): number {
    if (medicationRisks.length === 0) return 0;

    const riskScores = medicationRisks.map(risk => {
      let score = 0;
      
      switch (risk.riskLevel) {
        case 'critical': score += 40; break;
        case 'high': score += 30; break;
        case 'medium': score += 20; break;
        case 'low': score += 10; break;
      }

      // Add points for serious events
      score += Math.min(risk.seriousEventCount * 2, 20);
      
      // Add points for recalls
      score += risk.recalls.length * 5;
      
      // Add points for contraindications
      score += risk.contraindications.length * 2;

      return Math.min(score, 100);
    });

    return Math.round(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length);
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(medicationRisks: MedicationRisk[], patientProfile: PatientProfile): string[] {
    const recommendations: string[] = [];

    // High-risk medication recommendations
    const highRiskMeds = medicationRisks.filter(risk => 
      risk.riskLevel === 'high' || risk.riskLevel === 'critical'
    );

    if (highRiskMeds.length > 0) {
      recommendations.push('Schedule regular check-ups to monitor high-risk medications');
      recommendations.push('Keep a medication diary to track any side effects');
    }

    // Multiple medication recommendations
    if (patientProfile.medications.length > 3) {
      recommendations.push('Consider medication review with pharmacist to optimize therapy');
      recommendations.push('Use a pill organizer to ensure proper medication adherence');
    }

    // Age-specific recommendations
    if (patientProfile.age && patientProfile.age > 65) {
      recommendations.push('Regular kidney and liver function monitoring recommended');
      recommendations.push('Start with lower doses and monitor for increased sensitivity');
    }

    // General safety recommendations
    recommendations.push('Always inform healthcare providers about all medications you take');
    recommendations.push('Never stop medications abruptly without consulting your doctor');
    recommendations.push('Store medications properly and check expiration dates regularly');

    return recommendations;
  }

  /**
   * Get medication safety score for digital twin simulation
   */
  async getMedicationSafetyScore(medications: string[]): Promise<number> {
    if (medications.length === 0) return 100;

    try {
      const analysis = await this.analyzeMedicationRisks({ medications });
      return Math.max(0, 100 - analysis.overallRiskScore);
    } catch (error) {
      console.error('Error calculating medication safety score:', error);
      return 75; // Default moderate safety score
    }
  }

  /**
   * Get real-time safety alerts for medications
   */
  async getRealTimeSafetyAlerts(medications: string[]): Promise<string[]> {
    const alerts: string[] = [];

    for (const medication of medications) {
      try {
        const recalls = await openFDAService.getDrugRecalls(medication, 5);
        const recentRecalls = recalls.filter(recall => {
          const recallDate = new Date(recall.recall_initiation_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return recallDate > thirtyDaysAgo;
        });

        recentRecalls.forEach(recall => {
          alerts.push(`${medication}: ${recall.reason_for_recall} (${recall.classification})`);
        });
      } catch (error) {
        console.error(`Error checking alerts for ${medication}:`, error);
      }
    }

    return alerts;
  }
}

// Export singleton instance
export const fdaDataProcessor = new FDADataProcessor();
export type { MedicationRisk, HealthImpactAnalysis, PatientProfile };
