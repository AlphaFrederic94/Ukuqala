interface CalorieBurnParams {
  heartRate: number;
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
  intensity: 'low' | 'medium' | 'high';
  weight: number;
}

export const calculateCaloriesBurned = ({
  heartRate,
  bodyType,
  intensity,
  weight
}: CalorieBurnParams): number => {
  // Base multiplier based on body type
  const bodyTypeMultiplier = {
    ectomorph: 1.1,  // Higher metabolism
    mesomorph: 1.0,  // Average metabolism
    endomorph: 0.9   // Lower metabolism
  }[bodyType];

  // Intensity multiplier
  const intensityMultiplier = {
    low: 0.8,
    medium: 1.0,
    high: 1.2
  }[intensity];

  // Calculate calories using heart rate method
  // (0.4472 × heart rate - 0.05741 × weight + 0.074 × age - 20.4022) × time / 4.184
  const baseCalories = (0.4472 * heartRate - 0.05741 * weight) * bodyTypeMultiplier * intensityMultiplier;
  
  return Math.max(0, baseCalories);
};