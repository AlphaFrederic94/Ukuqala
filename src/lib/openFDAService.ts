/**
 * OpenFDA API Service
 * Provides access to FDA drug data including adverse events, labeling, NDC directory, and recalls
 */

interface OpenFDAConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

interface AdverseEvent {
  receivedate: string;
  patient: {
    patientonsetage?: string;
    patientageunit?: string;
    patientsex?: string;
    patientweight?: string;
  };
  drug: Array<{
    medicinalproduct?: string;
    drugindication?: string;
    drugdosagetext?: string;
    drugadministrationroute?: string;
  }>;
  reaction: Array<{
    reactionmeddrapt?: string;
    reactionoutcome?: string;
  }>;
  serious?: string;
  seriousnesscongenitalanomali?: string;
  seriousnessdeath?: string;
  seriousnessdisabling?: string;
  seriousnesshospitalization?: string;
  seriousnesslifethreatening?: string;
  seriousnessother?: string;
}

interface DrugLabel {
  id: string;
  set_id: string;
  version: string;
  effective_time: string;
  openfda: {
    application_number?: string[];
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    ndc?: string[];
    product_ndc?: string[];
    product_type?: string[];
    route?: string[];
    substance_name?: string[];
    rxcui?: string[];
  };
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  contraindications?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  overdosage?: string[];
  clinical_pharmacology?: string[];
}

interface NDCProduct {
  product_ndc: string;
  generic_name: string;
  labeler_name: string;
  brand_name: string;
  active_ingredients: Array<{
    name: string;
    strength: string;
  }>;
  dosage_form: string;
  route: string[];
  product_type: string;
  pharm_class: string[];
  dea_schedule?: string;
}

interface RecallEnforcement {
  recall_number: string;
  reason_for_recall: string;
  status: string;
  distribution_pattern: string;
  product_quantity: string;
  recall_initiation_date: string;
  state: string;
  event_id: string;
  product_type: string;
  product_description: string;
  country: string;
  city: string;
  recalling_firm: string;
  report_date: string;
  voluntary_mandated: string;
  classification: string;
  code_info: string;
  initial_firm_notification: string;
}

interface OpenFDAResponse<T> {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: T[];
}

class OpenFDAService {
  private config: OpenFDAConfig;
  private requestCount: { minute: number; day: number; lastReset: { minute: number; day: number } };
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor() {
    this.config = {
      apiKey: 'eG7WIHusJI5OVDXetHgLLAa8VoboXzU0syw5KqXq',
      baseUrl: 'https://api.fda.gov',
      rateLimit: {
        requestsPerMinute: 240, // With API key
        requestsPerDay: 120000  // With API key
      }
    };

    this.requestCount = {
      minute: 0,
      day: 0,
      lastReset: {
        minute: Date.now(),
        day: Date.now()
      }
    };

    this.cache = new Map();
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset minute counter if a minute has passed
    if (now - this.requestCount.lastReset.minute >= 60000) {
      this.requestCount.minute = 0;
      this.requestCount.lastReset.minute = now;
    }

    // Reset day counter if a day has passed
    if (now - this.requestCount.lastReset.day >= 86400000) {
      this.requestCount.day = 0;
      this.requestCount.lastReset.day = now;
    }

    // Check if we're within limits
    if (this.requestCount.minute >= this.config.rateLimit.requestsPerMinute) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }

    if (this.requestCount.day >= this.config.rateLimit.requestsPerDay) {
      throw new Error('Rate limit exceeded: too many requests per day');
    }

    return true;
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any, ttlMinutes: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  /**
   * Generic API request method
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}, cacheTTL: number = 60): Promise<OpenFDAResponse<T>> {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Check rate limits
    this.checkRateLimit();

    // Build URL with parameters
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.config.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`OpenFDA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update request counters
      this.requestCount.minute++;
      this.requestCount.day++;

      // Cache the response
      this.setCachedData(cacheKey, data, cacheTTL);

      return data;
    } catch (error) {
      console.error('OpenFDA API request failed:', error);
      throw error;
    }
  }

  /**
   * Search adverse events for a specific drug
   */
  async searchAdverseEvents(drugName: string, limit: number = 10): Promise<AdverseEvent[]> {
    try {
      const response = await this.makeRequest<AdverseEvent>('/drug/event.json', {
        search: `patient.drug.medicinalproduct:"${drugName}"`,
        limit
      });

      return response.results || [];
    } catch (error) {
      console.error('Error searching adverse events:', error);
      return [];
    }
  }

  /**
   * Get drug labeling information
   */
  async getDrugLabel(drugName: string): Promise<DrugLabel | null> {
    try {
      const response = await this.makeRequest<DrugLabel>('/drug/label.json', {
        search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
        limit: 1
      });

      return response.results?.[0] || null;
    } catch (error) {
      console.error('Error getting drug label:', error);
      return null;
    }
  }

  /**
   * Search NDC directory
   */
  async searchNDC(query: string, limit: number = 10): Promise<NDCProduct[]> {
    try {
      const response = await this.makeRequest<NDCProduct>('/drug/ndc.json', {
        search: `generic_name:"${query}" OR brand_name:"${query}"`,
        limit
      });

      return response.results || [];
    } catch (error) {
      console.error('Error searching NDC:', error);
      return [];
    }
  }

  /**
   * Get drug recalls
   */
  async getDrugRecalls(drugName?: string, limit: number = 10): Promise<RecallEnforcement[]> {
    try {
      const searchParam = drugName 
        ? `product_description:"${drugName}"`
        : 'product_type:"Drugs"';

      const response = await this.makeRequest<RecallEnforcement>('/drug/enforcement.json', {
        search: searchParam,
        limit
      });

      return response.results || [];
    } catch (error) {
      console.error('Error getting drug recalls:', error);
      return [];
    }
  }

  /**
   * Get comprehensive drug information
   */
  async getComprehensiveDrugInfo(drugName: string): Promise<{
    label: DrugLabel | null;
    adverseEvents: AdverseEvent[];
    ndcProducts: NDCProduct[];
    recalls: RecallEnforcement[];
  }> {
    try {
      const [label, adverseEvents, ndcProducts, recalls] = await Promise.all([
        this.getDrugLabel(drugName),
        this.searchAdverseEvents(drugName, 5),
        this.searchNDC(drugName, 5),
        this.getDrugRecalls(drugName, 5)
      ]);

      return {
        label,
        adverseEvents,
        ndcProducts,
        recalls
      };
    } catch (error) {
      console.error('Error getting comprehensive drug info:', error);
      throw error;
    }
  }

  /**
   * Check for drug interactions based on adverse events
   */
  async checkDrugInteractions(medications: string[]): Promise<{
    interactions: Array<{
      drugs: string[];
      adverseEvents: AdverseEvent[];
      riskLevel: 'low' | 'medium' | 'high';
    }>;
  }> {
    const interactions: Array<{
      drugs: string[];
      adverseEvents: AdverseEvent[];
      riskLevel: 'low' | 'medium' | 'high';
    }> = [];

    // For each pair of medications, check for adverse events
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = medications[i];
        const drug2 = medications[j];

        try {
          // Search for adverse events involving both drugs
          const response = await this.makeRequest<AdverseEvent>('/drug/event.json', {
            search: `patient.drug.medicinalproduct:"${drug1}" AND patient.drug.medicinalproduct:"${drug2}"`,
            limit: 10
          });

          if (response.results && response.results.length > 0) {
            // Determine risk level based on serious adverse events
            const seriousEvents = response.results.filter(event => event.serious === '1');
            let riskLevel: 'low' | 'medium' | 'high' = 'low';

            if (seriousEvents.length > 5) {
              riskLevel = 'high';
            } else if (seriousEvents.length > 2) {
              riskLevel = 'medium';
            }

            interactions.push({
              drugs: [drug1, drug2],
              adverseEvents: response.results,
              riskLevel
            });
          }
        } catch (error) {
          console.error(`Error checking interaction between ${drug1} and ${drug2}:`, error);
        }
      }
    }

    return { interactions };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const openFDAService = new OpenFDAService();
export type { AdverseEvent, DrugLabel, NDCProduct, RecallEnforcement };
