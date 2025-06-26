# Analytics Component Documentation

## Overview

The Analytics component provides a comprehensive dashboard for visualizing and analyzing user health data. It displays nutrition, sleep, and activity metrics with interactive charts and personalized recommendations.

## Features

- **Time-based filtering**: View data for the last 7 days, 30 days, or 90 days
- **Key metrics display**: Weight, height, BMI, and heart rate
- **Nutrition analysis**: Calorie intake, macronutrient distribution
- **Sleep tracking**: Sleep quality, duration, and patterns
- **Activity monitoring**: Steps, active minutes, and calories burned
- **Personalized recommendations**: Tailored health insights based on user data

## Component Structure

The Analytics component is structured as follows:

1. **Header Section**
   - Title
   - Time range selector (7 days, 30 days, 90 days)
   - Refresh button

2. **Key Metrics Section**
   - Weight
   - Height
   - BMI
   - Heart Rate

3. **Sleep Analysis Section**
   - Average quality
   - Average duration
   - Best day
   - Worst day
   - Sleep insights

4. **Activity Tracking Section**
   - Average steps
   - Active minutes
   - Calories burned
   - Activity trends

5. **Charts Section**
   - Nutrition trends chart
   - Sleep quality chart
   - Activity trends chart

6. **Recommendations Section**
   - Nutrition recommendations
   - Sleep recommendations
   - Activity recommendations

## Data Flow

1. User data is fetched from Supabase when the component mounts
2. Data is processed and formatted for display
3. Charts are rendered using Chart.js
4. Recommendations are generated based on the user's data
5. User can filter data by time range (7 days, 30 days, 90 days)
6. User can refresh data manually

## Chart Configurations

### Nutrition Chart
- Line chart showing calorie intake over time
- Y-axis: Calories
- X-axis: Dates

### Sleep Chart
- Bar chart showing sleep quality and duration
- Y-axis: Quality (0-10) and Duration (hours)
- X-axis: Dates

### Activity Chart
- Line chart with dual Y-axes
- Left Y-axis: Steps
- Right Y-axis: Active minutes
- X-axis: Dates

## Responsive Design

The Analytics component is fully responsive:
- On mobile: Charts stack vertically
- On tablet: Two charts per row
- On desktop: Two charts per row with the activity chart spanning full width

## Usage

```tsx
import Analytics from '../pages/Analytics';

function App() {
  return (
    <div>
      <Analytics />
    </div>
  );
}
```

## Dependencies

- React
- Chart.js
- React-Chartjs-2
- Supabase
- TailwindCSS
- Lucide React (for icons)

## Future Enhancements

- Export data functionality
- More advanced filtering options
- Comparison with previous periods
- Goal setting and tracking
- Print/PDF report generation
