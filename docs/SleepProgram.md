# Sleep Program Component Documentation

## Overview

The Sleep Program component provides a comprehensive interface for users to manage their sleep schedules, track sleep quality, and view historical sleep data. It helps users establish healthy sleep habits and monitor their progress over time.

## Features

- **Sleep Schedule Management**: Set and save sleep and wake times
- **Sleep Quality Logging**: Record sleep quality on a scale of 1-10
- **Sleep History Visualization**: View historical sleep quality data
- **Sleep Insights**: Receive personalized recommendations based on sleep patterns
- **Alarm Settings**: Enable/disable sleep alarms

## Component Structure

The Sleep Program component is structured as follows:

1. **Sleep Schedule Section**
   - Sleep time picker
   - Wake time picker
   - Duration calculation
   - Alarm toggle
   - Save button

2. **Sleep Quality Logging Section**
   - Quality slider (1-10)
   - Notes input
   - Log button

3. **Sleep History Section**
   - Sleep quality visualization
   - Historical sleep data
   - Quality indicators with color coding

4. **Sleep Tips Section**
   - Healthy sleep habits
   - Recommendations for better sleep
   - Toggle to show/hide tips

## Data Flow

1. User's active sleep program is loaded from Supabase when the component mounts
2. Sleep logs are fetched and displayed in the history section
3. When a user saves a sleep schedule:
   - Previous programs are deactivated
   - New program is saved to the database
   - UI is updated to reflect the change
4. When a user logs sleep quality:
   - Data is saved to the sleep_logs table
   - History visualization is updated
   - Confirmation message is displayed

## Database Schema

### sleep_programs Table
- id (uuid): Primary key
- user_id (uuid): Foreign key to users table
- sleep_time (time): Scheduled sleep time
- wake_time (time): Scheduled wake time
- duration (text): Calculated sleep duration
- active (boolean): Whether this program is currently active
- alarm_enabled (boolean): Whether alarm is enabled
- created_at (timestamp): When the program was created

### sleep_logs Table
- id (uuid): Primary key
- user_id (uuid): Foreign key to users table
- sleep_time (time): Actual sleep time
- wake_time (time): Actual wake time
- quality (integer): Sleep quality rating (1-10)
- notes (text): Optional notes about sleep
- created_at (timestamp): When the log was created

## Sleep Quality Visualization

The sleep quality visualization uses a bar chart to display:
- Sleep quality ratings (1-10)
- Color coding based on quality:
  - Red: Poor quality (1-3)
  - Orange: Below average (4-5)
  - Yellow: Average (6-7)
  - Green: Good (8-10)
- Tooltips with detailed information:
  - Date
  - Quality rating
  - Sleep time
  - Wake time
  - Notes (if any)

## Error Handling

The component includes comprehensive error handling:
- Validation of sleep and wake times
- Quality value constraints (1-10)
- User authentication checks
- Database error handling with user-friendly messages
- Fallback UI when data is unavailable

## Responsive Design

The Sleep Program component is fully responsive:
- On mobile: Sections stack vertically
- On tablet and desktop: Two-column layout for better space utilization
- Adaptive chart sizing based on screen width

## Usage

```tsx
import SleepProgram from '../pages/sleep/SleepProgram';

function App() {
  return (
    <div>
      <SleepProgram />
    </div>
  );
}
```

## Dependencies

- React
- Supabase
- TailwindCSS
- date-fns (for time calculations)
- Lucide React (for icons)
- React Toast (for notifications)

## Future Enhancements

- Sleep cycle analysis
- Integration with wearable devices
- Sleep goal setting
- Weekly and monthly sleep reports
- Smart alarm recommendations based on sleep cycles
