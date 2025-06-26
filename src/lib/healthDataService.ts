export const fetchWeightData = async (dateRange: DateRange) => {
  const { data, error } = await supabase
    .from('weight_measurements')
    .select('*')
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: true });

  if (error) throw error;

  return {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Weight (kg)',
      data: data.map(d => d.weight),
      borderColor: 'rgb(59, 130, 246)',
      tension: 0.1
    }]
  };
};

export const fetchActivityData = async (dateRange: DateRange) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: true });

  if (error) throw error;

  const averageScore = calculateActivityScore(data);
  
  return {
    averageScore,
    chartData: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: 'Calories Burned',
        data: data.map(d => d.calories_burned),
        backgroundColor: 'rgb(34, 197, 94)',
      }]
    }
  };
};

export const fetchSleepData = async (dateRange: DateRange) => {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: true });

  if (error) throw error;

  const averageQuality = calculateAverageSleepQuality(data);

  return {
    averageQuality,
    chartData: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: 'Sleep Quality',
        data: data.map(d => d.quality),
        borderColor: 'rgb(147, 51, 234)',
        tension: 0.1
      }]
    }
  };
};

const calculateActivityScore = (data: any[]): number => {
  // Implement activity score calculation logic
  return Math.round(data.reduce((acc, curr) => acc + curr.calories_burned, 0) / data.length / 10);
};

const calculateAverageSleepQuality = (data: any[]): number => {
  return Number((data.reduce((acc, curr) => acc + curr.quality, 0) / data.length).toFixed(1));
};