# CareAI - Comprehensive Health Management Platform

![CareAI Logo](public/logo.png)

## Overview

CareAI is a modern, comprehensive health management platform designed to help users track, manage, and improve their overall health and wellness. The application combines advanced analytics, personalized recommendations, and user-friendly interfaces to provide a holistic approach to healthcare management.

## Features

### 📊 Health Analytics
- Comprehensive dashboard with visualizations for nutrition, sleep, and activity data
- Personalized health insights and recommendations
- Time-based filtering for data analysis (7 days, 30 days, 90 days)

### 🍎 Nutrition Management
- Meal tracking and logging
- Nutrition plan creation and management
- Calorie and macronutrient tracking
- Custom meal creation and management

### 😴 Sleep Tracking
- Sleep schedule management
- Sleep quality logging and analysis
- Sleep insights and recommendations
- Historical sleep data visualization

### 🏃 Activity Tracking
- Step counting and activity monitoring
- Active minutes tracking
- Calorie burn estimation
- Activity trends and insights

### 💧 Hydration Tracking
- Water intake monitoring
- Hydration goal setting
- Daily water consumption reminders

### 🩺 Medical Appointments
- Doctor appointment scheduling
- Appointment reminders and notifications
- Doctor profiles with credentials and specialties

### 🧠 Health Predictions
- AI-powered health risk assessments
- Disease prediction models for diabetes, skin cancer, brain cancer, and heart disease
- Symptom-based prediction and analysis
- Prediction history comparison to track health changes over time
- Early detection and prevention recommendations
- Shareable prediction results via social media

### 🤖 Digital Twin Health Simulation
- 3D health avatar with visual indicators of health issues
- Current health metrics visualization (BMI, blood pressure, blood sugar, cholesterol)
- Interactive lifestyle simulation (exercise, diet, sleep, stress, medication)
- Medication effects simulation with interaction warnings
- Projected health outcomes timeline

### 🔒 Blockchain-Secured Health Records
- Encrypted health record storage with blockchain verification
- Selective sharing with healthcare providers
- Comprehensive access control system
- Immutable record history

### 🗺️ Community Health Mapping
- Interactive map showing healthcare facilities, outbreaks, and events
- Anonymous symptom reporting system
- Disease outbreak tracking and visualization
- Community health event calendar

### 📱 Social Features
- Social feed with posts, likes, and comments
- Friend connections and real-time chat
- Health journey sharing
- Community support network

### ⚙️ User Settings
- Profile management with account deletion option
- Notification preferences and notification center
- Theme customization (light/dark mode)
- High contrast mode for accessibility
- Font size adjustment options
- Multi-language support (English, Spanish, French)
- PIN protection for enhanced security

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI, Three.js (for 3D visualization)
- **Backend**: Supabase (PostgreSQL), Python ML models
- **Authentication**: Supabase Auth, Multi-factor authentication
- **Data Visualization**: Chart.js, React-Chartjs-2, Leaflet (for maps)
- **State Management**: React Context API
- **Routing**: React Router
- **Form Handling**: React Hook Form
- **Styling**: TailwindCSS, CSS Modules, Framer Motion for animations
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Internationalization**: i18next
- **PWA Support**: Service workers, offline capabilities
- **Security**: End-to-end encryption, blockchain verification
- **Optimization**: Data compression for social content
- **Mapping**: React-Leaflet for interactive maps

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/AlphaFrederic94/CareAI-disease.git
   cd CareAI-disease
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the `config` directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   # or
   yarn dev
   ```

5. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

6. Start the backend models (for prediction features):
   ```bash
   cd backend
   python api/main.py
   ```

7. Open your browser and navigate to `http://localhost:3000`

## Project Structure

The project has been reorganized into a cleaner structure:

```
CareAI/
├── frontend/           # React/TypeScript frontend application
│   ├── src/            # Source code
│   │   ├── api/        # API integration
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React Context providers
│   │   ├── lib/        # Utility functions and services
│   │   ├── pages/      # Page components
│   │   ├── services/   # Service layer
│   │   ├── styles/     # Global styles
│   │   ├── types/      # TypeScript type definitions
│   │   ├── utils/      # Utility functions
│   │   ├── App.tsx     # Main App component
│   │   └── main.tsx    # Entry point
│   ├── public/         # Static assets
│   ├── index.html      # HTML template
│   ├── package.json    # Dependencies and scripts
│   ├── tsconfig.json   # TypeScript configuration
│   └── vite.config.ts  # Vite configuration
│
├── backend/            # Python FastAPI backend for ML models
│   ├── api/            # API endpoints
│   ├── ml/             # Machine learning models
│   │   ├── models/     # Trained models
│   │   └── training/   # Model training scripts
│   ├── services/       # Services including chatbot
│   │   ├── chatbot/    # Medical chatbot service
│   │   ├── diabetes/   # Diabetes prediction service
│   │   ├── heart/      # Heart disease prediction service
│   │   └── symptoms/   # Symptom-based prediction service
│   ├── data/           # Datasets and data processing
│   └── requirements.txt # Python dependencies
│
├── scripts/            # Utility scripts
│   ├── database/       # Database setup and migration scripts
│   ├── deployment/     # Deployment scripts
│   └── utils/          # Utility scripts
│
├── docs/               # Documentation files
│   ├── ADVANCED_FEATURES.md
│   ├── README-FIREBASE-INDEXES.md
│   ├── README-SOCIAL-FIXES.md
│   └── ...
│
├── config/             # Configuration files
│   ├── firebase.json   # Firebase configuration
│   ├── cors.json       # CORS configuration
│   ├── .env            # Environment variables
│   └── ...
│
└── README.md           # Project documentation
```

## Key Components

### Analytics Dashboard
The Analytics dashboard provides comprehensive visualizations of user health data, including nutrition, sleep, and activity metrics. It features:
- Time-based filtering
- Multiple chart types (line, bar, doughnut)
- Personalized health recommendations
- Key health metrics display

### Digital Twin Health Simulation
The Digital Twin feature creates a personalized digital representation of a user's health and allows them to:
- Visualize current health status with a 3D avatar
- Simulate the effects of lifestyle changes
- Explore medication effects and interactions
- View projected health outcomes over time

### Blockchain-Secured Health Records
The Blockchain Health Records system provides:
- Secure, encrypted storage of health records
- Blockchain verification for data integrity
- Selective sharing with healthcare providers
- Complete access control and audit trail

### Community Health Mapping
The Health Map feature enables users to:
- View healthcare facilities and disease outbreaks on an interactive map
- Report symptoms anonymously
- Find health events in their community
- Access facility information and services

### Sleep Program
The Sleep Program module allows users to:
- Set and manage sleep schedules
- Log sleep quality and duration
- View historical sleep data
- Receive personalized sleep recommendations

### Nutrition Management
The Nutrition Management system includes:
- Meal tracking and logging
- Nutrition plan creation
- Custom meal management
- Calorie and macronutrient analysis

### Appointment Scheduling
The Appointment system enables users to:
- Schedule appointments with healthcare providers
- View doctor profiles and credentials
- Receive appointment reminders
- Manage upcoming and past appointments

### Social Features
The Social components allow users to:
- Share health journeys and achievements
- Connect with friends and healthcare providers
- Participate in health discussions
- Receive support from the community

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Chart.js](https://www.chartjs.org/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [i18next](https://www.i18next.com/)
- [Hugging Face](https://huggingface.co/) for medical chatbot models
- [Three.js](https://threejs.org/) for 3D visualization
- [Leaflet](https://leafletjs.com/) for interactive maps
- [CryptoJS](https://github.com/brix/crypto-js) for encryption
- [Pako](https://github.com/nodeca/pako) for data compression
