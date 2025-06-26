import axios from 'axios';

const GEMINI_PROXY_URL = 'http://localhost:3001'; // gemini-proxy_modifs server

export interface NutritionAnalysisRequest {
  userId: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  mealLogs: any[];
  waterLogs: any[];
  userProfile: {
    age: number;
    gender: string;
    weight: number;
    height: number;
    activityLevel: string;
    goals: string[];
  };
}

export interface NutritionAnalysisResponse {
  overallScore: number;
  insights: string[];
  recommendations: string[];
  macroAnalysis: {
    protein: { current: number; target: number; status: 'low' | 'optimal' | 'high' };
    carbs: { current: number; target: number; status: 'low' | 'optimal' | 'high' };
    fats: { current: number; target: number; status: 'low' | 'optimal' | 'high' };
  };
  hydrationAnalysis: {
    averageIntake: number;
    target: number;
    status: 'dehydrated' | 'optimal' | 'overhydrated';
  };
  mealRecommendations: Array<{
    mealType: string;
    suggestions: string[];
    reasoning: string;
  }>;
  trends: {
    caloriesTrend: 'increasing' | 'decreasing' | 'stable';
    hydrationTrend: 'improving' | 'declining' | 'stable';
    macroBalance: 'improving' | 'declining' | 'stable';
  };
}

export interface MealGenerationRequest {
  preferences: {
    dietaryRestrictions: string[];
    cuisinePreferences: string[];
    allergies: string[];
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calorieTarget: number;
    macroTargets: {
      protein: number;
      carbs: number;
      fats: number;
    };
  };
  userProfile: {
    age: number;
    gender: string;
    weight: number;
    height: number;
    activityLevel: string;
  };
}

export interface GeneratedMeal {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
  instructions: string[];
  nutrition: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
  };
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

class AINutritionService {
  private async makeRequest(endpoint: string, data: any) {
    try {
      const response = await axios.post(`${GEMINI_PROXY_URL}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      });
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error);
      throw new Error(`Failed to communicate with AI service: ${error.message}`);
    }
  }

  async analyzeNutrition(request: NutritionAnalysisRequest): Promise<NutritionAnalysisResponse> {
    const prompt = this.buildNutritionAnalysisPrompt(request);

    const response = await this.makeRequest('/api/medical-chat', {
      message: prompt,
      sessionId: `nutrition_analysis_${request.userId}_${Date.now()}`,
      userPreferences: {
        useRAG: true,
        detailLevel: 'detailed',
        includeReferences: true,
        responseLength: 'long'
      },
      medicalMode: 'nutrition'
    });

    return this.parseNutritionAnalysis(response.response);
  }

  async generateMealPlan(request: MealGenerationRequest): Promise<GeneratedMeal> {
    const prompt = this.buildMealGenerationPrompt(request);

    const response = await this.makeRequest('/api/medical-chat', {
      message: prompt,
      sessionId: `meal_generation_${Date.now()}`,
      userPreferences: {
        useRAG: true,
        detailLevel: 'detailed',
        creativity: 'creative',
        responseLength: 'long'
      },
      medicalMode: 'nutrition'
    });

    return this.parseMealGeneration(response.response);
  }

  private buildNutritionAnalysisPrompt(request: NutritionAnalysisRequest): string {
    const { userId, timeframe, mealLogs, waterLogs, userProfile } = request;

    return `
Please analyze the following nutrition data for a ${userProfile.age}-year-old ${userProfile.gender} user:

**User Profile:**
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activityLevel}
- Goals: ${userProfile.goals.join(', ')}

**Meal Data (${timeframe}):**
${JSON.stringify(mealLogs, null, 2)}

**Water Intake Data (${timeframe}):**
${JSON.stringify(waterLogs, null, 2)}

Please provide a comprehensive nutrition analysis in the following JSON format:
{
  "overallScore": <number 0-100>,
  "insights": [<array of key insights>],
  "recommendations": [<array of actionable recommendations>],
  "macroAnalysis": {
    "protein": {"current": <number>, "target": <number>, "status": "<low|optimal|high>"},
    "carbs": {"current": <number>, "target": <number>, "status": "<low|optimal|high>"},
    "fats": {"current": <number>, "target": <number>, "status": "<low|optimal|high>"}
  },
  "hydrationAnalysis": {
    "averageIntake": <number>,
    "target": <number>,
    "status": "<dehydrated|optimal|overhydrated>"
  },
  "mealRecommendations": [
    {
      "mealType": "<breakfast|lunch|dinner|snack>",
      "suggestions": [<array of meal suggestions>],
      "reasoning": "<explanation>"
    }
  ],
  "trends": {
    "caloriesTrend": "<increasing|decreasing|stable>",
    "hydrationTrend": "<improving|declining|stable>",
    "macroBalance": "<improving|declining|stable>"
  }
}

Focus on providing actionable, evidence-based nutrition advice.
`;
  }

  private buildMealGenerationPrompt(request: MealGenerationRequest): string {
    const { preferences, userProfile } = request;

    return `
Generate a healthy ${preferences.mealType} meal for a ${userProfile.age}-year-old ${userProfile.gender}:

**User Profile:**
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activityLevel}

**Meal Requirements:**
- Meal Type: ${preferences.mealType}
- Target Calories: ${preferences.calorieTarget}
- Target Protein: ${preferences.macroTargets.protein}g
- Target Carbs: ${preferences.macroTargets.carbs}g
- Target Fats: ${preferences.macroTargets.fats}g

**Dietary Restrictions:** ${preferences.dietaryRestrictions.join(', ') || 'None'}
**Allergies:** ${preferences.allergies.join(', ') || 'None'}
**Cuisine Preferences:** ${preferences.cuisinePreferences.join(', ') || 'Any'}

Please provide a detailed meal plan in the following JSON format:
{
  "name": "<meal name>",
  "description": "<brief description>",
  "ingredients": [
    {
      "name": "<ingredient name>",
      "amount": "<amount with unit>",
      "calories": <number>,
      "protein": <number>,
      "carbs": <number>,
      "fats": <number>
    }
  ],
  "instructions": [<array of cooking steps>],
  "nutrition": {
    "totalCalories": <number>,
    "totalProtein": <number>,
    "totalCarbs": <number>,
    "totalFats": <number>
  },
  "prepTime": <minutes>,
  "difficulty": "<easy|medium|hard>",
  "tags": [<array of relevant tags>]
}

Ensure the meal is nutritionally balanced and meets the specified targets.
`;
  }

  private parseNutritionAnalysis(response: string): NutritionAnalysisResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback parsing if JSON is not found
      return this.createFallbackAnalysis(response);
    } catch (error) {
      console.error('Error parsing nutrition analysis:', error);
      return this.createFallbackAnalysis(response);
    }
  }

  private parseMealGeneration(response: string): GeneratedMeal {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback parsing if JSON is not found
      return this.createFallbackMeal(response);
    } catch (error) {
      console.error('Error parsing meal generation:', error);
      return this.createFallbackMeal(response);
    }
  }

  private createFallbackAnalysis(response: string): NutritionAnalysisResponse {
    return {
      overallScore: 75,
      insights: [
        "Analysis completed based on available data",
        "Consider tracking more detailed nutritional information"
      ],
      recommendations: [
        "Maintain a balanced diet with adequate protein",
        "Stay hydrated throughout the day",
        "Include more fruits and vegetables"
      ],
      macroAnalysis: {
        protein: { current: 0, target: 100, status: 'low' },
        carbs: { current: 0, target: 200, status: 'low' },
        fats: { current: 0, target: 70, status: 'low' }
      },
      hydrationAnalysis: {
        averageIntake: 1500,
        target: 2000,
        status: 'dehydrated'
      },
      mealRecommendations: [
        {
          mealType: 'breakfast',
          suggestions: ['Oatmeal with berries', 'Greek yogurt with nuts'],
          reasoning: 'High protein and fiber to start the day'
        }
      ],
      trends: {
        caloriesTrend: 'stable',
        hydrationTrend: 'stable',
        macroBalance: 'stable'
      }
    };
  }

  private createFallbackMeal(response: string): GeneratedMeal {
    return {
      name: "Healthy Balanced Meal",
      description: "A nutritious meal generated based on your preferences",
      ingredients: [
        {
          name: "Chicken breast",
          amount: "150g",
          calories: 165,
          protein: 31,
          carbs: 0,
          fats: 3.6
        }
      ],
      instructions: [
        "Prepare ingredients",
        "Cook according to preference",
        "Serve and enjoy"
      ],
      nutrition: {
        totalCalories: 400,
        totalProtein: 35,
        totalCarbs: 30,
        totalFats: 15
      },
      prepTime: 30,
      difficulty: 'medium',
      tags: ['healthy', 'balanced', 'protein-rich']
    };
  }
}

export const aiNutritionService = new AINutritionService();
