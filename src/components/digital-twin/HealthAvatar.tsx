import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import '../../styles/digitalTwin.css';

// Avatar model component
function AvatarModel({ healthScore, bodyParts, ...props }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/models/health-avatar.glb');
  const { actions, names } = useAnimations(animations, group);
  
  // Map health score to animation state
  useEffect(() => {
    // Play different animations based on health score
    if (healthScore > 80) {
      actions['Healthy_Idle']?.reset().fadeIn(0.5).play();
    } else if (healthScore > 50) {
      actions['Moderate_Idle']?.reset().fadeIn(0.5).play();
    } else {
      actions['Unhealthy_Idle']?.reset().fadeIn(0.5).play();
    }
    
    return () => {
      // Cleanup animations
      actions[names[0]]?.fadeOut(0.5);
    };
  }, [healthScore, actions, names]);

  // Highlight body parts based on health issues
  useEffect(() => {
    if (!scene) return;
    
    // Reset all materials
    scene.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive.set(0x000000);
        node.material.emissiveIntensity = 0;
      }
    });
    
    // Highlight specific body parts
    bodyParts.forEach(part => {
      const bodyPart = scene.getObjectByName(part.name);
      if (bodyPart) {
        bodyPart.traverse((node) => {
          if (node.isMesh) {
            // Set color based on health status (red for issues, yellow for warnings)
            const color = part.status === 'issue' ? 0xff0000 : 0xffff00;
            node.material.emissive.set(color);
            node.material.emissiveIntensity = 0.5;
          }
        });
      }
    });
  }, [scene, bodyParts]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} scale={1.75} position={[0, -1.75, 0]} />
    </group>
  );
}

const HealthAvatar: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState({
    healthScore: 75,
    bodyParts: [
      { name: 'Heart', status: 'normal', risk: 'low' },
      { name: 'Lungs', status: 'normal', risk: 'low' },
      { name: 'Liver', status: 'normal', risk: 'low' },
      { name: 'Kidneys', status: 'normal', risk: 'low' },
      { name: 'Brain', status: 'normal', risk: 'low' }
    ],
    metrics: {
      bmi: 24.5,
      bloodPressure: '120/80',
      bloodSugar: 95,
      cholesterol: 180
    }
  });
  
  // Fetch user health data
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!user) return;
      
      try {
        // Fetch health metrics from database
        const { data, error } = await supabase
          .from('health_metrics')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Calculate health score and body part statuses based on metrics
          // This is a simplified example - real implementation would use medical algorithms
          const calculatedHealthScore = calculateHealthScore(data);
          const bodyPartStatuses = determineBodyPartStatuses(data);
          
          setHealthData({
            healthScore: calculatedHealthScore,
            bodyParts: bodyPartStatuses,
            metrics: {
              bmi: data.bmi || 24.5,
              bloodPressure: data.blood_pressure || '120/80',
              bloodSugar: data.blood_sugar || 95,
              cholesterol: data.cholesterol || 180
            }
          });
        }
      } catch (error) {
        console.error('Error fetching health data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHealthData();
  }, [user]);
  
  // Placeholder functions for health calculations
  const calculateHealthScore = (data) => {
    // Simplified health score calculation
    let score = 75; // Default score
    
    // Adjust based on BMI
    if (data.bmi) {
      if (data.bmi < 18.5 || data.bmi > 30) score -= 10;
      else if (data.bmi > 25) score -= 5;
    }
    
    // Adjust based on blood pressure
    if (data.blood_pressure) {
      const [systolic, diastolic] = data.blood_pressure.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) score -= 15;
      else if (systolic > 130 || diastolic > 85) score -= 7;
    }
    
    // Adjust based on blood sugar
    if (data.blood_sugar) {
      if (data.blood_sugar > 126) score -= 15;
      else if (data.blood_sugar > 100) score -= 7;
    }
    
    // Adjust based on cholesterol
    if (data.cholesterol) {
      if (data.cholesterol > 240) score -= 15;
      else if (data.cholesterol > 200) score -= 7;
    }
    
    return Math.max(0, Math.min(100, score));
  };
  
  const determineBodyPartStatuses = (data) => {
    // Simplified body part status determination
    const bodyParts = [
      { name: 'Heart', status: 'normal', risk: 'low' },
      { name: 'Lungs', status: 'normal', risk: 'low' },
      { name: 'Liver', status: 'normal', risk: 'low' },
      { name: 'Kidneys', status: 'normal', risk: 'low' },
      { name: 'Brain', status: 'normal', risk: 'low' }
    ];
    
    // Check heart health based on blood pressure and cholesterol
    if (data.blood_pressure) {
      const [systolic, diastolic] = data.blood_pressure.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) {
        bodyParts[0].status = 'issue';
        bodyParts[0].risk = 'high';
      } else if (systolic > 130 || diastolic > 85) {
        bodyParts[0].status = 'warning';
        bodyParts[0].risk = 'medium';
      }
    }
    
    if (data.cholesterol && data.cholesterol > 240) {
      bodyParts[0].status = 'issue';
      bodyParts[0].risk = 'high';
    } else if (data.cholesterol && data.cholesterol > 200) {
      bodyParts[0].status = 'warning';
      bodyParts[0].risk = 'medium';
    }
    
    // Check liver health based on liver enzymes if available
    if (data.alt && data.alt > 50) {
      bodyParts[2].status = 'issue';
      bodyParts[2].risk = 'high';
    } else if (data.alt && data.alt > 35) {
      bodyParts[2].status = 'warning';
      bodyParts[2].risk = 'medium';
    }
    
    // Check kidney health based on creatinine if available
    if (data.creatinine && data.creatinine > 1.2) {
      bodyParts[3].status = 'issue';
      bodyParts[3].risk = 'high';
    } else if (data.creatinine && data.creatinine > 1.0) {
      bodyParts[3].status = 'warning';
      bodyParts[3].risk = 'medium';
    }
    
    return bodyParts;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="digital-twin-container"
    >
      <div className="health-score-container">
        <div className="health-score-ring" style={{ 
          background: `conic-gradient(
            ${healthData.healthScore > 80 ? '#10B981' : 
              healthData.healthScore > 60 ? '#FBBF24' : 
              healthData.healthScore > 40 ? '#F59E0B' : '#EF4444'} 
            ${healthData.healthScore * 3.6}deg, 
            #f3f4f6 ${healthData.healthScore * 3.6}deg 360deg)`
        }}>
          <div className="health-score-inner">
            <span className="health-score-value">{healthData.healthScore}</span>
            <span className="health-score-label">Health Score</span>
          </div>
        </div>
      </div>
      
      <div className="avatar-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <AvatarModel 
            healthScore={healthData.healthScore} 
            bodyParts={healthData.bodyParts.filter(part => part.status !== 'normal')} 
          />
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/1.5} />
        </Canvas>
      </div>
      
      <div className="health-metrics-container">
        <h3 className="metrics-title">Your Health Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">BMI</span>
            <span className="metric-value">{healthData.metrics.bmi}</span>
            <span className="metric-status">
              {healthData.metrics.bmi < 18.5 ? 'Underweight' :
               healthData.metrics.bmi < 25 ? 'Normal' :
               healthData.metrics.bmi < 30 ? 'Overweight' : 'Obese'}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Blood Pressure</span>
            <span className="metric-value">{healthData.metrics.bloodPressure}</span>
            <span className="metric-status">
              {(() => {
                const [systolic, diastolic] = healthData.metrics.bloodPressure.split('/').map(Number);
                if (systolic < 120 && diastolic < 80) return 'Normal';
                if (systolic < 130 && diastolic < 85) return 'Elevated';
                if (systolic < 140 && diastolic < 90) return 'Stage 1 Hypertension';
                return 'Stage 2 Hypertension';
              })()}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Blood Sugar</span>
            <span className="metric-value">{healthData.metrics.bloodSugar} mg/dL</span>
            <span className="metric-status">
              {healthData.metrics.bloodSugar < 100 ? 'Normal' :
               healthData.metrics.bloodSugar < 126 ? 'Prediabetes' : 'Diabetes Range'}
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Cholesterol</span>
            <span className="metric-value">{healthData.metrics.cholesterol} mg/dL</span>
            <span className="metric-status">
              {healthData.metrics.cholesterol < 200 ? 'Desirable' :
               healthData.metrics.cholesterol < 240 ? 'Borderline High' : 'High'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="body-parts-container">
        <h3 className="body-parts-title">Body Health Status</h3>
        <div className="body-parts-grid">
          {healthData.bodyParts.map((part, index) => (
            <div key={index} className={`body-part-card ${part.status}`}>
              <span className="body-part-name">{part.name}</span>
              <span className="body-part-status">
                {part.status === 'normal' ? 'Healthy' :
                 part.status === 'warning' ? 'Needs Attention' : 'Requires Care'}
              </span>
              <span className="body-part-risk">
                Risk Level: <strong>{part.risk.charAt(0).toUpperCase() + part.risk.slice(1)}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HealthAvatar;
