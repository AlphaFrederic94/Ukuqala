/**
 * FDA-Enhanced Health Analytics
 * Integrates FDA adverse event data and drug efficacy information into health predictions
 */

import { openFDAService, AdverseEvent, DrugLabel } from './openFDAService';
import { fdaDataProcessor, MedicationRisk, PatientProfile } from './fdaDataProcessor';

export interface HealthPrediction {
  timeframe: '1month' | '3months' | '6months' | '1year';
  healthScore: number;
  confidence: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
  fdaInsights: FDAInsight[];
}

export interface RiskFactor {
  type: 'medication' | 'lifestyle' | 'genetic' | 'environmental';
  factor: string;
  impact: number; // -100 to +100
  confidence: number; // 0 to 1
  fdaEvidence?: {
    adverseEventCount: number;
    seriousEventCount: number;
    populationAffected: number;
  };
}

export interface FDAInsight {
  type: 'safety' | 'efficacy' | 'interaction' | 'population';
  medication: string;
  insight: string;
  evidence: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface HealthTrend {
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: 'improving' | 'stable' | 'declining';
  fdaFactors: {
    medicationEffects: number;
    adverseEventRisk: number;
    populationComparison: number;
  };
}

export interface PopulationComparison {
  demographic: string;
  userRisk: number;
  populationAverage: number;
  percentile: number;
  fdaDataPoints: number;
}

class FDAEnhancedHealthAnalytics {
  /**
   * Generate comprehensive health predictions with FDA data
   */
  async generateHealthPredictions(
    patientProfile: PatientProfile,
    currentHealthMetrics: {
      healthScore: number;
      bmi: number;
      bloodPressure: { systolic: number; diastolic: number };
      bloodSugar: number;
      cholesterol: number;
    },
    lifestyleFactors: {
      exerciseLevel: number; // 1-10
      dietQuality: number;   // 1-10
      sleepHours: number;
      stressLevel: number;   // 1-10
      smokingStatus: 'never' | 'former' | 'current';
      alcoholConsumption: 'none' | 'light' | 'moderate' | 'heavy';
    }
  ): Promise<HealthPrediction[]> {
    const predictions: HealthPrediction[] = [];
    const timeframes: ('1month' | '3months' | '6months' | '1year')[] = ['1month', '3months', '6months', '1year'];

    // Get FDA medication analysis
    const medicationAnalysis = await fdaDataProcessor.analyzeMedicationRisks(patientProfile);

    for (const timeframe of timeframes) {
      const prediction = await this.generateSinglePrediction(
        timeframe,
        patientProfile,
        currentHealthMetrics,
        lifestyleFactors,
        medicationAnalysis
      );
      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Generate single timeframe prediction
   */
  private async generateSinglePrediction(
    timeframe: '1month' | '3months' | '6months' | '1year',
    patientProfile: PatientProfile,
    currentMetrics: any,
    lifestyleFactors: any,
    medicationAnalysis: any
  ): Promise<HealthPrediction> {
    const timeMultiplier = this.getTimeMultiplier(timeframe);
    
    // Base health score calculation
    let predictedHealthScore = currentMetrics.healthScore;
    
    // Lifestyle impact
    const lifestyleImpact = this.calculateLifestyleImpact(lifestyleFactors, timeMultiplier);
    predictedHealthScore += lifestyleImpact;

    // FDA medication impact
    const medicationImpact = await this.calculateFDAMedicationImpact(
      patientProfile.medications,
      patientProfile,
      timeMultiplier
    );
    predictedHealthScore += medicationImpact.totalImpact;

    // Generate risk factors
    const riskFactors = await this.generateRiskFactors(
      patientProfile,
      lifestyleFactors,
      medicationAnalysis
    );

    // Generate FDA insights
    const fdaInsights = await this.generateFDAInsights(
      patientProfile.medications,
      patientProfile,
      medicationAnalysis
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      riskFactors,
      fdaInsights,
      medicationAnalysis
    );

    // Calculate confidence based on data availability
    const confidence = this.calculatePredictionConfidence(
      patientProfile,
      medicationAnalysis,
      timeframe
    );

    return {
      timeframe,
      healthScore: Math.max(0, Math.min(100, Math.round(predictedHealthScore))),
      confidence,
      riskFactors,
      recommendations,
      fdaInsights
    };
  }

  /**
   * Calculate FDA medication impact on health
   */
  private async calculateFDAMedicationImpact(
    medications: string[],
    patientProfile: PatientProfile,
    timeMultiplier: number
  ): Promise<{ totalImpact: number; medicationEffects: Array<{ medication: string; impact: number; reason: string }> }> {
    let totalImpact = 0;
    const medicationEffects: Array<{ medication: string; impact: number; reason: string }> = [];

    for (const medication of medications) {
      try {
        // Get adverse events for this medication
        const adverseEvents = await openFDAService.searchAdverseEvents(medication, 100);
        const drugLabel = await openFDAService.getDrugLabel(medication);

        // Calculate medication-specific impact
        const medicationImpact = this.calculateSingleMedicationImpact(
          medication,
          adverseEvents,
          drugLabel,
          patientProfile,
          timeMultiplier
        );

        totalImpact += medicationImpact.impact;
        medicationEffects.push(medicationImpact);

      } catch (error) {
        console.error(`Error calculating FDA impact for ${medication}:`, error);
        // Default to neutral impact if FDA data unavailable
        medicationEffects.push({
          medication,
          impact: 0,
          reason: 'FDA data unavailable'
        });
      }
    }

    return { totalImpact, medicationEffects };
  }

  /**
   * Calculate impact of single medication based on FDA data
   */
  private calculateSingleMedicationImpact(
    medication: string,
    adverseEvents: AdverseEvent[],
    drugLabel: DrugLabel | null,
    patientProfile: PatientProfile,
    timeMultiplier: number
  ): { medication: string; impact: number; reason: string } {
    let impact = 0;
    const reasons: string[] = [];

    // Analyze adverse events
    const seriousEvents = adverseEvents.filter(event => event.serious === '1');
    const totalEvents = adverseEvents.length;

    if (totalEvents > 0) {
      // Calculate adverse event risk
      const seriousEventRate = seriousEvents.length / totalEvents;
      const adverseEventPenalty = seriousEventRate * 10 * timeMultiplier; // Max 10 point penalty
      impact -= adverseEventPenalty;
      
      if (adverseEventPenalty > 2) {
        reasons.push(`High serious adverse event rate (${(seriousEventRate * 100).toFixed(1)}%)`);
      }

      // Check for demographic-specific risks
      const demographicRisk = this.calculateDemographicRisk(adverseEvents, patientProfile);
      impact -= demographicRisk * timeMultiplier;
      
      if (demographicRisk > 1) {
        reasons.push('Increased risk for your demographic profile');
      }
    }

    // Analyze drug label for therapeutic benefits
    if (drugLabel?.indications_and_usage) {
      // Assume therapeutic benefit for indicated conditions
      const therapeuticBenefit = 5 * timeMultiplier; // Base therapeutic benefit
      impact += therapeuticBenefit;
      reasons.push('Therapeutic benefit for indicated condition');
    }

    // Check for contraindications
    if (drugLabel?.contraindications && patientProfile.conditions) {
      const hasContraindication = patientProfile.conditions.some(condition =>
        drugLabel.contraindications?.some(contra =>
          contra.toLowerCase().includes(condition.toLowerCase())
        )
      );
      
      if (hasContraindication) {
        impact -= 15 * timeMultiplier; // Significant penalty for contraindications
        reasons.push('Contraindicated for your medical conditions');
      }
    }

    return {
      medication,
      impact: Math.max(-20, Math.min(10, impact)), // Cap impact between -20 and +10
      reason: reasons.length > 0 ? reasons.join('; ') : 'Standard medication effect'
    };
  }

  /**
   * Calculate demographic-specific risk from adverse events
   */
  private calculateDemographicRisk(adverseEvents: AdverseEvent[], patientProfile: PatientProfile): number {
    let riskScore = 0;

    // Age-based risk
    if (patientProfile.age) {
      const ageMatchingEvents = adverseEvents.filter(event => {
        const eventAge = parseInt(event.patient?.patientonsetage || '0');
        return eventAge > 0 && Math.abs(eventAge - patientProfile.age!) <= 10;
      });

      if (ageMatchingEvents.length > adverseEvents.length * 0.3) {
        riskScore += 2; // Higher risk for age group
      }
    }

    // Gender-based risk
    if (patientProfile.gender) {
      const genderCode = patientProfile.gender === 'male' ? '1' : '2';
      const genderMatchingEvents = adverseEvents.filter(event =>
        event.patient?.patientsex === genderCode
      );

      if (genderMatchingEvents.length > adverseEvents.length * 0.6) {
        riskScore += 1.5; // Higher risk for gender
      }
    }

    return riskScore;
  }

  /**
   * Generate risk factors with FDA evidence
   */
  private async generateRiskFactors(
    patientProfile: PatientProfile,
    lifestyleFactors: any,
    medicationAnalysis: any
  ): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Medication risk factors
    for (const medicationRisk of medicationAnalysis.medicationRisks) {
      if (medicationRisk.riskLevel === 'high' || medicationRisk.riskLevel === 'critical') {
        riskFactors.push({
          type: 'medication',
          factor: `${medicationRisk.medication} safety concerns`,
          impact: medicationRisk.riskLevel === 'critical' ? -15 : -10,
          confidence: 0.8,
          fdaEvidence: {
            adverseEventCount: medicationRisk.adverseEventCount,
            seriousEventCount: medicationRisk.seriousEventCount,
            populationAffected: Math.round(medicationRisk.adverseEventCount / 1000) // Rough estimate
          }
        });
      }
    }

    // Lifestyle risk factors
    if (lifestyleFactors.exerciseLevel < 4) {
      riskFactors.push({
        type: 'lifestyle',
        factor: 'Low physical activity',
        impact: -8,
        confidence: 0.9
      });
    }

    if (lifestyleFactors.dietQuality < 4) {
      riskFactors.push({
        type: 'lifestyle',
        factor: 'Poor diet quality',
        impact: -6,
        confidence: 0.8
      });
    }

    if (lifestyleFactors.sleepHours < 6 || lifestyleFactors.sleepHours > 9) {
      riskFactors.push({
        type: 'lifestyle',
        factor: 'Inadequate sleep',
        impact: -5,
        confidence: 0.7
      });
    }

    if (lifestyleFactors.stressLevel > 7) {
      riskFactors.push({
        type: 'lifestyle',
        factor: 'High stress levels',
        impact: -7,
        confidence: 0.6
      });
    }

    if (lifestyleFactors.smokingStatus === 'current') {
      riskFactors.push({
        type: 'lifestyle',
        factor: 'Current smoking',
        impact: -20,
        confidence: 0.95
      });
    }

    return riskFactors.sort((a, b) => a.impact - b.impact); // Sort by impact (most negative first)
  }

  /**
   * Generate FDA insights
   */
  private async generateFDAInsights(
    medications: string[],
    patientProfile: PatientProfile,
    medicationAnalysis: any
  ): Promise<FDAInsight[]> {
    const insights: FDAInsight[] = [];

    for (const medicationRisk of medicationAnalysis.medicationRisks) {
      // Safety insights
      if (medicationRisk.seriousEventCount > 10) {
        insights.push({
          type: 'safety',
          medication: medicationRisk.medication,
          insight: `${medicationRisk.seriousEventCount} serious adverse events reported to FDA`,
          evidence: `Based on FDA Adverse Event Reporting System (FAERS) data`,
          impact: 'negative',
          confidence: 0.7
        });
      }

      // Common side effects insight
      if (medicationRisk.commonSideEffects.length > 0) {
        insights.push({
          type: 'safety',
          medication: medicationRisk.medication,
          insight: `Most commonly reported side effects: ${medicationRisk.commonSideEffects.slice(0, 3).join(', ')}`,
          evidence: `Based on ${medicationRisk.adverseEventCount} FDA adverse event reports`,
          impact: 'neutral',
          confidence: 0.6
        });
      }

      // Recall insights
      if (medicationRisk.recalls.length > 0) {
        insights.push({
          type: 'safety',
          medication: medicationRisk.medication,
          insight: `${medicationRisk.recalls.length} FDA recall(s) on record`,
          evidence: `FDA Drug Recall Database`,
          impact: 'negative',
          confidence: 0.9
        });
      }
    }

    // Population comparison insights
    if (patientProfile.age && patientProfile.gender) {
      insights.push({
        type: 'population',
        medication: 'Overall medication profile',
        insight: `Your medication risk profile compared to similar demographics`,
        evidence: `FDA adverse event data for ${patientProfile.gender}s aged ${patientProfile.age}±10 years`,
        impact: 'neutral',
        confidence: 0.5
      });
    }

    return insights;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    riskFactors: RiskFactor[],
    fdaInsights: FDAInsight[],
    medicationAnalysis: any
  ): string[] {
    const recommendations: string[] = [];

    // High-risk medication recommendations
    const highRiskMedications = medicationAnalysis.medicationRisks.filter(
      (risk: any) => risk.riskLevel === 'high' || risk.riskLevel === 'critical'
    );

    if (highRiskMedications.length > 0) {
      recommendations.push('Schedule medication review with healthcare provider due to FDA safety concerns');
      recommendations.push('Monitor for side effects and report any adverse reactions to your doctor');
    }

    // Lifestyle recommendations based on risk factors
    const lifestyleRisks = riskFactors.filter(rf => rf.type === 'lifestyle');
    if (lifestyleRisks.length > 0) {
      recommendations.push('Address lifestyle risk factors to improve overall health outcomes');
    }

    // FDA-specific recommendations
    const safetyInsights = fdaInsights.filter(insight => insight.type === 'safety' && insight.impact === 'negative');
    if (safetyInsights.length > 0) {
      recommendations.push('Stay informed about FDA safety updates for your medications');
      recommendations.push('Consider discussing alternative medications with lower adverse event rates');
    }

    // General recommendations
    recommendations.push('Maintain regular health monitoring and check-ups');
    recommendations.push('Keep an updated list of all medications and share with all healthcare providers');

    return recommendations;
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(
    patientProfile: PatientProfile,
    medicationAnalysis: any,
    timeframe: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on available data
    if (patientProfile.medications.length > 0) {
      confidence += 0.2;
    }

    if (patientProfile.age && patientProfile.gender) {
      confidence += 0.1;
    }

    if (patientProfile.conditions && patientProfile.conditions.length > 0) {
      confidence += 0.1;
    }

    // FDA data availability
    const medicationsWithFDAData = medicationAnalysis.medicationRisks.filter(
      (risk: any) => risk.adverseEventCount > 0
    ).length;

    if (medicationsWithFDAData > 0) {
      confidence += (medicationsWithFDAData / patientProfile.medications.length) * 0.2;
    }

    // Reduce confidence for longer timeframes
    const timeframePenalty = {
      '1month': 0,
      '3months': 0.05,
      '6months': 0.1,
      '1year': 0.15
    };

    confidence -= timeframePenalty[timeframe as keyof typeof timeframePenalty] || 0;

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Calculate lifestyle impact
   */
  private calculateLifestyleImpact(lifestyleFactors: any, timeMultiplier: number): number {
    let impact = 0;

    // Exercise impact
    const exerciseImpact = (lifestyleFactors.exerciseLevel - 5) * 0.8 * timeMultiplier;
    impact += exerciseImpact;

    // Diet impact
    const dietImpact = (lifestyleFactors.dietQuality - 5) * 1.0 * timeMultiplier;
    impact += dietImpact;

    // Sleep impact
    const optimalSleep = 7.5;
    const sleepDeviation = Math.abs(lifestyleFactors.sleepHours - optimalSleep);
    const sleepImpact = -sleepDeviation * 0.5 * timeMultiplier;
    impact += sleepImpact;

    // Stress impact
    const stressImpact = -(lifestyleFactors.stressLevel - 5) * 0.6 * timeMultiplier;
    impact += stressImpact;

    // Smoking impact
    if (lifestyleFactors.smokingStatus === 'current') {
      impact -= 5 * timeMultiplier;
    } else if (lifestyleFactors.smokingStatus === 'former') {
      impact -= 1 * timeMultiplier;
    }

    // Alcohol impact
    const alcoholImpact = {
      'none': 0,
      'light': 0.5,
      'moderate': -0.5,
      'heavy': -3
    };
    impact += (alcoholImpact[lifestyleFactors.alcoholConsumption] || 0) * timeMultiplier;

    return impact;
  }

  /**
   * Get time multiplier for different prediction timeframes
   */
  private getTimeMultiplier(timeframe: string): number {
    const multipliers = {
      '1month': 0.25,
      '3months': 0.5,
      '6months': 0.75,
      '1year': 1.0
    };
    return multipliers[timeframe as keyof typeof multipliers] || 1.0;
  }

  /**
   * Generate health trends with FDA factors
   */
  async generateHealthTrends(
    patientProfile: PatientProfile,
    currentMetrics: any,
    predictions: HealthPrediction[]
  ): Promise<HealthTrend[]> {
    const trends: HealthTrend[] = [];

    // Health score trend
    const oneYearPrediction = predictions.find(p => p.timeframe === '1year');
    if (oneYearPrediction) {
      const medicationAnalysis = await fdaDataProcessor.analyzeMedicationRisks(patientProfile);
      
      trends.push({
        metric: 'Overall Health Score',
        currentValue: currentMetrics.healthScore,
        predictedValue: oneYearPrediction.healthScore,
        trend: oneYearPrediction.healthScore > currentMetrics.healthScore ? 'improving' : 
               oneYearPrediction.healthScore < currentMetrics.healthScore ? 'declining' : 'stable',
        fdaFactors: {
          medicationEffects: this.calculateMedicationEffectScore(medicationAnalysis),
          adverseEventRisk: this.calculateAdverseEventRisk(medicationAnalysis),
          populationComparison: 0.5 // Placeholder - would need population data
        }
      });
    }

    return trends;
  }

  /**
   * Calculate medication effect score
   */
  private calculateMedicationEffectScore(medicationAnalysis: any): number {
    const totalMedications = medicationAnalysis.medicationRisks.length;
    if (totalMedications === 0) return 0;

    const riskScores = {
      'low': 0.8,
      'medium': 0.5,
      'high': 0.2,
      'critical': -0.2
    };

    const averageScore = medicationAnalysis.medicationRisks.reduce((sum: number, risk: any) => {
      return sum + (riskScores[risk.riskLevel as keyof typeof riskScores] || 0.5);
    }, 0) / totalMedications;

    return averageScore;
  }

  /**
   * Calculate adverse event risk score
   */
  private calculateAdverseEventRisk(medicationAnalysis: any): number {
    const totalEvents = medicationAnalysis.medicationRisks.reduce(
      (sum: number, risk: any) => sum + risk.adverseEventCount, 0
    );
    const seriousEvents = medicationAnalysis.medicationRisks.reduce(
      (sum: number, risk: any) => sum + risk.seriousEventCount, 0
    );

    if (totalEvents === 0) return 0;

    const seriousEventRate = seriousEvents / totalEvents;
    return Math.min(1, seriousEventRate * 2); // Normalize to 0-1 scale
  }
}

// Export singleton instance
export const fdaEnhancedHealthAnalytics = new FDAEnhancedHealthAnalytics();
export type { HealthPrediction, RiskFactor, FDAInsight, HealthTrend, PopulationComparison };
