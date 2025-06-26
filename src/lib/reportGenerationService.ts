import { supabase } from './supabaseClient';
import { format } from 'date-fns';

interface ReportOptions {
  type: 'progress' | 'summary' | 'detailed';
  startDate: string;
  endDate: string;
  categories: string[];
}

interface HealthMetrics {
  exercise: {
    totalSessions: number;
    totalDuration: number;
    caloriesBurned: number;
  };
  nutrition: {
    averageCalories: number;
    mealCount: number;
    macroDistribution: {
      protein: number;
      carbs: number;
      fats: number;
    };
  };
  sleep: {
    averageDuration: number;
    averageQuality: number;
    totalSleepHours: number;
  };
}

export const reportGenerationService = {
  async generateReport(userId: string, options: ReportOptions) {
    const metrics = await this.calculateMetrics(userId, options);
    const insights = this.generateInsights(metrics);
    const recommendations = this.generateRecommendations(metrics);

    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: options.startDate,
        end: options.endDate,
      },
      metrics,
      insights,
      recommendations,
    };

    return this.formatReport(report, options.type);
  },

  private async calculateMetrics(userId: string, options: ReportOptions): Promise<HealthMetrics> {
    const metrics: HealthMetrics = {
      exercise: {
        totalSessions: 0,
        totalDuration: 0,
        caloriesBurned: 0,
      },
      nutrition: {
        averageCalories: 0,
        mealCount: 0,
        macroDistribution: { protein: 0, carbs: 0, fats: 0 },
      },
      sleep: {
        averageDuration: 0,
        averageQuality: 0,
        totalSleepHours: 0,
      },
    };

    // Calculate exercise metrics
    const { data: exerciseData } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', options.startDate)
      .lte('created_at', options.endDate);

    if (exerciseData) {
      metrics.exercise = this.calculateExerciseMetrics(exerciseData);
    }

    // Calculate nutrition metrics
    const { data: nutritionData } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', options.startDate)
      .lte('created_at', options.endDate);

    if (nutritionData) {
      metrics.nutrition = this.calculateNutritionMetrics(nutritionData);
    }

    // Calculate sleep metrics
    const { data: sleepData } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', options.startDate)
      .lte('date', options.endDate);

    if (sleepData) {
      metrics.sleep = this.calculateSleepMetrics(sleepData);
    }

    return metrics;
  },

  private calculateExerciseMetrics(data: any[]): HealthMetrics['exercise'] {
    return {
      totalSessions: data.length,
      totalDuration: data.reduce((acc, curr) => acc + curr.duration, 0),
      caloriesBurned: data.reduce((acc, curr) => acc + curr.calories_burned, 0),
    };
  },

  private calculateNutritionMetrics(data: any[]): HealthMetrics['nutrition'] {
    const totalCalories = data.reduce((acc, curr) => acc + curr.calories, 0);
    return {
      averageCalories: totalCalories / data.length,
      mealCount: data.length,
      macroDistribution: {
        protein: data.reduce((acc, curr) => acc + curr.protein, 0) / data.length,
        carbs: data.reduce((acc, curr) => acc + curr.carbs, 0) / data.length,
        fats: data.reduce((acc, curr) => acc + curr.fats, 0) / data.length,
      },
    };
  },

  private calculateSleepMetrics(data: any[]): HealthMetrics['sleep'] {
    return {
      averageDuration: data.reduce((acc, curr) => acc + curr.duration, 0) / data.length,
      averageQuality: data.reduce((acc, curr) => acc + curr.quality, 0) / data.length,
      totalSleepHours: data.reduce((acc, curr) => acc + curr.duration, 0),
    };
  },

  private generateInsights(metrics: HealthMetrics) {
    const insights = [];

    // Exercise insights
    if (metrics.exercise.totalSessions > 0) {
      insights.push({
        category: 'exercise',
        message: `You completed ${metrics.exercise.totalSessions} workouts and burned ${metrics.exercise.caloriesBurned} calories.`,
      });
    }

    // Nutrition insights
    if (metrics.nutrition.mealCount > 0) {
      insights.push({
        category: 'nutrition',
        message: `Your average daily calorie intake was ${Math.round(metrics.nutrition.averageCalories)} calories.`,
      });
    }

    // Sleep insights
    if (metrics.sleep.averageDuration > 0) {
      insights.push({
        category: 'sleep',
        message: `Your average sleep duration was ${Math.round(metrics.sleep.averageDuration)} hours with a quality rating of ${metrics.sleep.averageQuality.toFixed(1)}/5.`,
      });
    }

    return insights;
  },

  private generateRecommendations(metrics: HealthMetrics) {
    const recommendations = [];

    // Exercise recommendations
    if (metrics.exercise.totalSessions < 3) {
      recommendations.push({
        category: 'exercise',
        message: 'Try to increase your workout frequency to at least 3 times per week.',
      });
    }

    // Nutrition recommendations
    if (metrics.nutrition.averageCalories < 1500) {
      recommendations.push({
        category: 'nutrition',
        message: 'Consider increasing your daily calorie intake to maintain healthy energy levels.',
      });
    }

    // Sleep recommendations
    if (metrics.sleep.averageDuration < 7) {
      recommendations.push({
        category: 'sleep',
        message: 'Aim for 7-9 hours of sleep per night for optimal health.',
      });
    }

    return recommendations;
  },

  private formatReport(report: any, type: string) {
    switch (type) {
      case 'summary':
        return {
          period: report.period,
          insights: report.insights,
          recommendations: report.recommendations,
        };
      case 'detailed':
        return report;
      case 'progress':
        return {
          period: report.period,
          metrics: report.metrics,
          insights: report.insights,
        };
      default:
        throw new Error('Unsupported report type');
    }
  }
};