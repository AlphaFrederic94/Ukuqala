/**
 * Medication Verification System
 * Uses OpenFDA NDC Directory for accurate medication identification and error prevention
 */

import { openFDAService, NDCProduct } from './openFDAService';
import { supabase } from './supabaseClient';

export interface MedicationVerification {
  id: string;
  inputName: string;
  verifiedName: string;
  ndc: string;
  confidence: number;
  status: 'verified' | 'partial_match' | 'not_found' | 'multiple_matches';
  matches: NDCProduct[];
  warnings: string[];
  suggestions: string[];
}

export interface MedicationError {
  type: 'name_mismatch' | 'dosage_mismatch' | 'route_mismatch' | 'discontinued' | 'recall';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
}

export interface VerificationResult {
  verification: MedicationVerification;
  errors: MedicationError[];
  ndcProduct: NDCProduct | null;
  alternativeProducts: NDCProduct[];
}

class MedicationVerificationSystem {
  private verificationCache: Map<string, VerificationResult> = new Map();
  private commonMedicationNames: Map<string, string[]> = new Map();

  constructor() {
    this.initializeCommonNames();
  }

  /**
   * Initialize common medication name mappings
   */
  private initializeCommonNames(): void {
    // Common brand name to generic name mappings
    this.commonMedicationNames.set('lipitor', ['atorvastatin']);
    this.commonMedicationNames.set('crestor', ['rosuvastatin']);
    this.commonMedicationNames.set('zocor', ['simvastatin']);
    this.commonMedicationNames.set('glucophage', ['metformin']);
    this.commonMedicationNames.set('norvasc', ['amlodipine']);
    this.commonMedicationNames.set('prilosec', ['omeprazole']);
    this.commonMedicationNames.set('cozaar', ['losartan']);
    this.commonMedicationNames.set('synthroid', ['levothyroxine']);
    this.commonMedicationNames.set('plavix', ['clopidogrel']);
    this.commonMedicationNames.set('nexium', ['esomeprazole']);
  }

  /**
   * Verify a medication name against FDA NDC directory
   */
  async verifyMedication(
    inputName: string,
    dosage?: string,
    route?: string
  ): Promise<VerificationResult> {
    const cacheKey = `${inputName}_${dosage || ''}_${route || ''}`;
    
    // Check cache first
    if (this.verificationCache.has(cacheKey)) {
      return this.verificationCache.get(cacheKey)!;
    }

    try {
      // Clean and normalize input
      const normalizedName = this.normalizeInput(inputName);
      
      // Search NDC directory
      const ndcResults = await this.searchNDCDirectory(normalizedName);
      
      // Create verification result
      const verification = await this.createVerification(inputName, normalizedName, ndcResults);
      
      // Check for errors and warnings
      const errors = await this.checkForErrors(verification, dosage, route);
      
      // Find best match and alternatives
      const { bestMatch, alternatives } = this.findBestMatch(ndcResults, dosage, route);
      
      const result: VerificationResult = {
        verification,
        errors,
        ndcProduct: bestMatch,
        alternativeProducts: alternatives
      };

      // Cache result
      this.verificationCache.set(cacheKey, result);
      
      // Save verification to database
      await this.saveVerificationToDatabase(result);

      return result;

    } catch (error) {
      console.error('Error verifying medication:', error);
      
      // Return error result
      return {
        verification: {
          id: `error_${Date.now()}`,
          inputName,
          verifiedName: inputName,
          ndc: '',
          confidence: 0,
          status: 'not_found',
          matches: [],
          warnings: ['Verification service temporarily unavailable'],
          suggestions: ['Please verify medication name manually']
        },
        errors: [{
          type: 'name_mismatch',
          severity: 'medium',
          message: 'Unable to verify medication against FDA database',
          recommendation: 'Double-check medication name and consult healthcare provider'
        }],
        ndcProduct: null,
        alternativeProducts: []
      };
    }
  }

  /**
   * Normalize input for better matching
   */
  private normalizeInput(input: string): string {
    let normalized = input.toLowerCase().trim();
    
    // Remove common suffixes
    normalized = normalized.replace(/\s+(tablet|capsule|injection|cream|ointment|solution)s?$/i, '');
    
    // Remove dosage information
    normalized = normalized.replace(/\s+\d+\s*(mg|mcg|g|ml|units?)$/i, '');
    
    // Check for brand name mappings
    const genericNames = this.commonMedicationNames.get(normalized);
    if (genericNames && genericNames.length > 0) {
      return genericNames[0];
    }
    
    return normalized;
  }

  /**
   * Search FDA NDC directory
   */
  private async searchNDCDirectory(medicationName: string): Promise<NDCProduct[]> {
    try {
      // Search by generic name first
      let results = await openFDAService.searchNDC(medicationName, 20);
      
      // If no results, try brand name search
      if (results.length === 0) {
        // Try variations of the name
        const variations = this.generateNameVariations(medicationName);
        for (const variation of variations) {
          results = await openFDAService.searchNDC(variation, 20);
          if (results.length > 0) break;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching NDC directory:', error);
      return [];
    }
  }

  /**
   * Generate name variations for better matching
   */
  private generateNameVariations(name: string): string[] {
    const variations: string[] = [];
    
    // Add original name
    variations.push(name);
    
    // Add name without spaces
    variations.push(name.replace(/\s+/g, ''));
    
    // Add name with different spacing
    variations.push(name.replace(/\s+/g, ' '));
    
    // Add partial matches (first word)
    const words = name.split(' ');
    if (words.length > 1) {
      variations.push(words[0]);
    }
    
    return variations;
  }

  /**
   * Create verification object
   */
  private async createVerification(
    inputName: string,
    normalizedName: string,
    ndcResults: NDCProduct[]
  ): Promise<MedicationVerification> {
    const verification: MedicationVerification = {
      id: `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputName,
      verifiedName: inputName,
      ndc: '',
      confidence: 0,
      status: 'not_found',
      matches: ndcResults,
      warnings: [],
      suggestions: []
    };

    if (ndcResults.length === 0) {
      verification.status = 'not_found';
      verification.warnings.push('Medication not found in FDA NDC directory');
      verification.suggestions.push('Check spelling and try generic name');
      return verification;
    }

    if (ndcResults.length === 1) {
      const match = ndcResults[0];
      verification.status = 'verified';
      verification.verifiedName = match.generic_name || match.brand_name;
      verification.ndc = match.product_ndc;
      verification.confidence = this.calculateConfidence(inputName, match);
    } else {
      verification.status = 'multiple_matches';
      verification.warnings.push(`Found ${ndcResults.length} possible matches`);
      verification.suggestions.push('Please specify dosage form or strength for better matching');
      
      // Find best match
      const bestMatch = this.findBestTextMatch(normalizedName, ndcResults);
      if (bestMatch) {
        verification.verifiedName = bestMatch.generic_name || bestMatch.brand_name;
        verification.ndc = bestMatch.product_ndc;
        verification.confidence = this.calculateConfidence(inputName, bestMatch);
        
        if (verification.confidence > 0.8) {
          verification.status = 'verified';
        } else {
          verification.status = 'partial_match';
        }
      }
    }

    return verification;
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateConfidence(input: string, ndcProduct: NDCProduct): number {
    const inputLower = input.toLowerCase();
    const genericName = (ndcProduct.generic_name || '').toLowerCase();
    const brandName = (ndcProduct.brand_name || '').toLowerCase();
    
    let confidence = 0;
    
    // Exact match gets highest score
    if (inputLower === genericName || inputLower === brandName) {
      confidence = 1.0;
    }
    // Partial match
    else if (genericName.includes(inputLower) || brandName.includes(inputLower)) {
      confidence = 0.8;
    }
    // Word match
    else if (this.hasWordMatch(inputLower, genericName) || this.hasWordMatch(inputLower, brandName)) {
      confidence = 0.6;
    }
    // Fuzzy match
    else {
      const genericSimilarity = this.calculateStringSimilarity(inputLower, genericName);
      const brandSimilarity = this.calculateStringSimilarity(inputLower, brandName);
      confidence = Math.max(genericSimilarity, brandSimilarity);
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Check if there's a word match between input and target
   */
  private hasWordMatch(input: string, target: string): boolean {
    const inputWords = input.split(/\s+/);
    const targetWords = target.split(/\s+/);
    
    return inputWords.some(inputWord => 
      targetWords.some(targetWord => 
        inputWord.length > 2 && targetWord.includes(inputWord)
      )
    );
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Find best text match from NDC results
   */
  private findBestTextMatch(input: string, ndcResults: NDCProduct[]): NDCProduct | null {
    if (ndcResults.length === 0) return null;
    
    let bestMatch = ndcResults[0];
    let bestScore = this.calculateConfidence(input, bestMatch);
    
    for (const product of ndcResults.slice(1)) {
      const score = this.calculateConfidence(input, product);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
      }
    }
    
    return bestMatch;
  }

  /**
   * Check for medication errors and warnings
   */
  private async checkForErrors(
    verification: MedicationVerification,
    dosage?: string,
    route?: string
  ): Promise<MedicationError[]> {
    const errors: MedicationError[] = [];
    
    // Check if medication was found
    if (verification.status === 'not_found') {
      errors.push({
        type: 'name_mismatch',
        severity: 'high',
        message: 'Medication not found in FDA database',
        recommendation: 'Verify medication name with healthcare provider'
      });
    }
    
    // Check confidence level
    if (verification.confidence < 0.5 && verification.status !== 'not_found') {
      errors.push({
        type: 'name_mismatch',
        severity: 'medium',
        message: 'Low confidence in medication match',
        recommendation: 'Double-check medication name and dosage'
      });
    }
    
    // Check for dosage mismatches
    if (dosage && verification.matches.length > 0) {
      const hasMatchingDosage = verification.matches.some(match =>
        match.active_ingredients?.some(ingredient =>
          ingredient.strength?.toLowerCase().includes(dosage.toLowerCase())
        )
      );
      
      if (!hasMatchingDosage) {
        errors.push({
          type: 'dosage_mismatch',
          severity: 'medium',
          message: 'Specified dosage not found in available formulations',
          recommendation: 'Verify dosage with prescribing information'
        });
      }
    }
    
    // Check for route mismatches
    if (route && verification.matches.length > 0) {
      const hasMatchingRoute = verification.matches.some(match =>
        match.route?.some(r => r.toLowerCase().includes(route.toLowerCase()))
      );
      
      if (!hasMatchingRoute) {
        errors.push({
          type: 'route_mismatch',
          severity: 'medium',
          message: 'Specified route of administration not available',
          recommendation: 'Check available formulations and routes'
        });
      }
    }
    
    return errors;
  }

  /**
   * Find best match and alternatives
   */
  private findBestMatch(
    ndcResults: NDCProduct[],
    dosage?: string,
    route?: string
  ): { bestMatch: NDCProduct | null; alternatives: NDCProduct[] } {
    if (ndcResults.length === 0) {
      return { bestMatch: null, alternatives: [] };
    }
    
    // Score products based on criteria
    const scoredProducts = ndcResults.map(product => ({
      product,
      score: this.scoreProduct(product, dosage, route)
    }));
    
    // Sort by score
    scoredProducts.sort((a, b) => b.score - a.score);
    
    const bestMatch = scoredProducts[0].product;
    const alternatives = scoredProducts.slice(1, 6).map(sp => sp.product); // Top 5 alternatives
    
    return { bestMatch, alternatives };
  }

  /**
   * Score a product based on matching criteria
   */
  private scoreProduct(product: NDCProduct, dosage?: string, route?: string): number {
    let score = 1; // Base score
    
    // Prefer products with active ingredients
    if (product.active_ingredients && product.active_ingredients.length > 0) {
      score += 0.5;
    }
    
    // Prefer products with matching dosage
    if (dosage && product.active_ingredients) {
      const hasMatchingDosage = product.active_ingredients.some(ingredient =>
        ingredient.strength?.toLowerCase().includes(dosage.toLowerCase())
      );
      if (hasMatchingDosage) score += 1;
    }
    
    // Prefer products with matching route
    if (route && product.route) {
      const hasMatchingRoute = product.route.some(r =>
        r.toLowerCase().includes(route.toLowerCase())
      );
      if (hasMatchingRoute) score += 1;
    }
    
    // Prefer prescription drugs over OTC for accuracy
    if (product.product_type === 'HUMAN PRESCRIPTION DRUG') {
      score += 0.3;
    }
    
    return score;
  }

  /**
   * Save verification result to database
   */
  private async saveVerificationToDatabase(result: VerificationResult): Promise<void> {
    try {
      // Only save if we have a database connection
      if (supabase) {
        await supabase
          .from('medication_verifications')
          .insert({
            id: result.verification.id,
            input_name: result.verification.inputName,
            verified_name: result.verification.verifiedName,
            ndc: result.verification.ndc,
            confidence: result.verification.confidence,
            status: result.verification.status,
            matches_count: result.verification.matches.length,
            errors_count: result.errors.length,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving verification to database:', error);
    }
  }

  /**
   * Batch verify multiple medications
   */
  async batchVerifyMedications(medications: Array<{
    name: string;
    dosage?: string;
    route?: string;
  }>): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    for (const medication of medications) {
      try {
        const result = await this.verifyMedication(
          medication.name,
          medication.dosage,
          medication.route
        );
        results.push(result);
      } catch (error) {
        console.error(`Error verifying ${medication.name}:`, error);
        // Add error result
        results.push({
          verification: {
            id: `error_${Date.now()}`,
            inputName: medication.name,
            verifiedName: medication.name,
            ndc: '',
            confidence: 0,
            status: 'not_found',
            matches: [],
            warnings: ['Verification failed'],
            suggestions: []
          },
          errors: [],
          ndcProduct: null,
          alternativeProducts: []
        });
      }
    }
    
    return results;
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    totalVerifications: number;
    successRate: number;
    averageConfidence: number;
    cacheSize: number;
  } {
    const verifications = Array.from(this.verificationCache.values());
    const successful = verifications.filter(v => v.verification.status === 'verified').length;
    const totalConfidence = verifications.reduce((sum, v) => sum + v.verification.confidence, 0);
    
    return {
      totalVerifications: verifications.length,
      successRate: verifications.length > 0 ? successful / verifications.length : 0,
      averageConfidence: verifications.length > 0 ? totalConfidence / verifications.length : 0,
      cacheSize: this.verificationCache.size
    };
  }

  /**
   * Clear verification cache
   */
  clearCache(): void {
    this.verificationCache.clear();
  }
}

// Export singleton instance
export const medicationVerificationSystem = new MedicationVerificationSystem();
export type { MedicationVerification, MedicationError, VerificationResult };
