import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface Interactive3DCardProps {
  profileData: {
    full_name: string;
    avatar_url: string;
    date_of_birth: string;
    phone?: string;
    email?: string;
    address?: string;
    emergency_contact?: string;
    emergency_phone?: string;
  };
  medicalData: {
    blood_group: string;
    allergies?: string[];
    medications?: string[];
    medical_conditions?: string[];
    height?: string;
    weight?: string;
    insurance_provider?: string;
    insurance_number?: string;
  };
  className?: string;
}

// CSS-based 3D Card Component with advanced effects
function CSS3DCard({ profileData, medicalData, isHovered }: {
  profileData: any;
  medicalData: any;
  isHovered: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x: x - 0.5, y: y - 0.5 });
      }
    };

    if (isHovered && cardRef.current) {
      cardRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (cardRef.current) {
        cardRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isHovered]);

  const { user } = useAuth();

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const qrData = JSON.stringify({
    name: profileData.full_name || 'User',
    id: user?.id.slice(0, 8) || 'unknown',
    bloodGroup: medicalData.blood_group || 'Unknown',
    age: calculateAge(profileData.date_of_birth),
    type: 'CareAI_Patient_Card'
  });

  return (
    <div
      ref={cardRef}
      className="w-full h-96 relative rounded-xl"
      style={{
        transform: isHovered
          ? `perspective(1200px) rotateX(${mousePosition.y * 6}deg) rotateY(${mousePosition.x * 6}deg) translateZ(40px) scale(1.02)`
          : 'perspective(1200px) rotateX(2deg) rotateY(0deg) translateZ(0px) scale(1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transformStyle: 'preserve-3d',
        overflow: 'visible',
        filter: isHovered ? 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))' : 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
        willChange: 'transform, filter'
      }}
    >
      {/* Background container with overflow hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        {/* Solid base material */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
          {/* Metallic surface texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
                linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)
              `,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Subtle animated highlights */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              background: `
                radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 70% 30%, rgba(147, 51, 234, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 30%)
              `,
              animation: 'subtleGlow 12s ease-in-out infinite'
            }}
          />

          {/* Carbon fiber texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.03) 2px,
                  rgba(255,255,255,0.03) 4px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.02) 2px,
                  rgba(255,255,255,0.02) 4px
                )
              `
            }}
          />
        </div>

        {/* Enhanced glass effect with multiple layers */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-md border-2 border-white/15 rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-xl" />

        {/* Edge lighting effect */}
        <div className="absolute inset-0 rounded-xl shadow-inner" style={{
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.2),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            inset 1px 0 0 rgba(255,255,255,0.1),
            inset -1px 0 0 rgba(0,0,0,0.2)
          `
        }} />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col text-white z-10 overflow-hidden enhanced-text">
        {/* Header section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <img
              src="/images/UKUQALA.svg"
              alt="Ukuqala Logo"
              className="w-8 h-8 filter brightness-0 invert"
            />
            <div>
              <h3 className="font-bold text-lg leading-tight enhanced-text-bold">
                {profileData.full_name || 'User'}
              </h3>
              <p className="text-white/80 text-xs enhanced-text">CareAI Digital Health Card</p>
              <p className="text-white/70 text-xs font-mono">#{user?.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="w-16 h-16 rounded-lg border-2 border-white/30 overflow-hidden bg-white/10 flex-shrink-0">
            <img
              src={profileData.avatar_url || '/images/default_user.jpg'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-3 gap-3 mb-3 min-h-0">
          {/* Personal Info Column */}
          <div className="space-y-2 overflow-hidden">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Age</p>
              <p className="text-base font-bold">{calculateAge(profileData.date_of_birth)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">Blood Type</p>
              <p className="text-base font-bold text-red-300">{medicalData.blood_group || 'Unknown'}</p>
            </div>
            {medicalData.height && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Height</p>
                <p className="text-xs font-semibold">{medicalData.height}</p>
              </div>
            )}
            {medicalData.weight && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Weight</p>
                <p className="text-xs font-semibold">{medicalData.weight}</p>
              </div>
            )}
          </div>

          {/* Medical Info Column */}
          <div className="space-y-2 overflow-hidden">
            {medicalData.allergies && medicalData.allergies.length > 0 && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Allergies</p>
                <div className="space-y-1">
                  {medicalData.allergies.slice(0, 1).map((allergy, index) => (
                    <p key={index} className="text-xs bg-red-500/30 px-2 py-1 rounded text-red-200 truncate">
                      {allergy}
                    </p>
                  ))}
                  {medicalData.allergies.length > 1 && (
                    <p className="text-xs text-white/60">+{medicalData.allergies.length - 1} more</p>
                  )}
                </div>
              </div>
            )}

            {medicalData.medications && medicalData.medications.length > 0 && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Medications</p>
                <div className="space-y-1">
                  {medicalData.medications.slice(0, 1).map((medication, index) => (
                    <p key={index} className="text-xs bg-blue-500/30 px-2 py-1 rounded text-blue-200 truncate">
                      {medication}
                    </p>
                  ))}
                  {medicalData.medications.length > 1 && (
                    <p className="text-xs text-white/60">+{medicalData.medications.length - 1} more</p>
                  )}
                </div>
              </div>
            )}

            {medicalData.medical_conditions && medicalData.medical_conditions.length > 0 && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Conditions</p>
                <div className="space-y-1">
                  {medicalData.medical_conditions.slice(0, 1).map((condition, index) => (
                    <p key={index} className="text-xs bg-yellow-500/30 px-2 py-1 rounded text-yellow-200 truncate">
                      {condition}
                    </p>
                  ))}
                  {medicalData.medical_conditions.length > 1 && (
                    <p className="text-xs text-white/60">+{medicalData.medical_conditions.length - 1} more</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact & Emergency Column */}
          <div className="space-y-2 overflow-hidden">
            {profileData.emergency_contact && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Emergency</p>
                <p className="text-xs font-semibold text-orange-200 truncate">{profileData.emergency_contact}</p>
                {profileData.emergency_phone && (
                  <p className="text-xs text-white/70 truncate">{profileData.emergency_phone}</p>
                )}
              </div>
            )}

            {medicalData.insurance_provider && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Insurance</p>
                <p className="text-xs font-semibold text-green-200 truncate">{medicalData.insurance_provider}</p>
                {medicalData.insurance_number && (
                  <p className="text-xs text-white/70 font-mono truncate">#{medicalData.insurance_number}</p>
                )}
              </div>
            )}

            {profileData.phone && (
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Phone</p>
                <p className="text-xs text-white/80 truncate">{profileData.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer section - Fixed positioning */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex-1 mr-3">
            <p className="text-xs text-white/60 uppercase tracking-wide">Scan for Details</p>
            <p className="text-xs text-white/80">Valid Medical ID • CareAI</p>
            <p className="text-xs text-white/60">{new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white/95 p-2 rounded-lg shadow-lg flex-shrink-0 backdrop-blur-sm">
            <QRCodeSVG
              value={qrData}
              size={60}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </div>

      {/* Holographic scan lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          )`
        }}
      />
    </div>
  );
}

// UI Overlay Component for rendering text and QR code
function UIOverlay({ profileData, medicalData }: { profileData: any; medicalData: any }) {
  const { user } = useAuth();
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Generate QR code data (non-sensitive information only)
  const qrData = JSON.stringify({
    name: profileData.full_name || 'User',
    id: user?.id.slice(0, 8) || 'unknown',
    bloodGroup: medicalData.blood_group || 'Unknown',
    age: calculateAge(profileData.date_of_birth),
    emergencyContact: profileData.emergency_contact || null,
    emergencyPhone: profileData.emergency_phone || null,
    allergies: medicalData.allergies?.slice(0, 3) || [],
    height: medicalData.height || null,
    weight: medicalData.weight || null,
    phone: profileData.phone || null,
    platform: 'CareAI',
    type: 'Digital_Health_Card',
    generated: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top section - Logo and Name */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/images/UKUQALA.svg" 
            alt="Ukuqala Logo" 
            className="w-8 h-8 filter brightness-0 invert"
          />
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">
              {profileData.full_name || 'User'}
            </h3>
            <p className="text-white/70 text-xs">CareAI Patient</p>
          </div>
        </div>
        
        {/* Profile Image */}
        <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden">
          <img 
            src={profileData.avatar_url || '/images/default_user.jpg'} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Middle section - Key Info */}
      <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2">
        <div className="grid grid-cols-2 gap-4 text-white">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">Age</p>
            <p className="text-lg font-bold">{calculateAge(profileData.date_of_birth)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">Blood Group</p>
            <p className="text-lg font-bold">{medicalData.blood_group || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Bottom section - QR Code and ID */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-white/60 uppercase tracking-wide">Patient ID</p>
          <p className="text-sm font-mono text-white">#{user?.id.slice(0, 8)}</p>
        </div>
        
        {/* QR Code */}
        <div className="bg-white p-2 rounded">
          <QRCodeSVG
            value={qrData}
            size={40}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function CardFallback() {
  return (
    <div className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p className="text-sm">Loading Enhanced Medical Card...</p>
      </div>
    </div>
  );
}

// 2D Fallback Card Component
function Card2DFallback({ profileData, medicalData }: { profileData: any; medicalData: any }) {
  const { user } = useAuth();

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const qrData = JSON.stringify({
    name: profileData.full_name || 'User',
    id: user?.id.slice(0, 8) || 'unknown',
    bloodGroup: medicalData.blood_group || 'Unknown',
    age: calculateAge(profileData.date_of_birth),
    type: 'CareAI_Patient_Card'
  });

  return (
    <div className="w-full h-96 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
        {/* Top section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/images/UKUQALA.svg"
              alt="Ukuqala Logo"
              className="w-8 h-8 filter brightness-0 invert"
            />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {profileData.full_name || 'User'}
              </h3>
              <p className="text-white/70 text-xs">CareAI Patient</p>
            </div>
          </div>

          <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden">
            <img
              src={profileData.avatar_url || '/images/default_user.jpg'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Middle section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">Age</p>
            <p className="text-lg font-bold">{calculateAge(profileData.date_of_birth)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">Blood Group</p>
            <p className="text-lg font-bold">{medicalData.blood_group || 'Unknown'}</p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">Patient ID</p>
            <p className="text-sm font-mono">#{user?.id.slice(0, 8)}</p>
          </div>

          <div className="bg-white p-2 rounded">
            <QRCodeSVG
              value={qrData}
              size={40}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Interactive 3D Card Component
const Interactive3DCard: React.FC<Interactive3DCardProps> = ({
  profileData,
  medicalData,
  className = ""
}) => {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative w-full h-96 rounded-xl shadow-2xl card-3d-physics solid-material ${className}`}
      initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 2 }}
      transition={{ duration: 1, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        overflow: 'visible',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* CSS-based 3D Card */}
      <CSS3DCard
        profileData={profileData}
        medicalData={medicalData}
        isHovered={isHovered}
      />

      {/* Hover effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Scan line effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
        initial={{ y: 0, opacity: 0 }}
        animate={{
          y: isHovered ? 256 : 0,
          opacity: isHovered ? [0, 1, 1, 0] : 0
        }}
        transition={{
          duration: 2,
          repeat: isHovered ? Infinity : 0,
          ease: "linear"
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/30"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/30"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/30"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/30"></div>
    </motion.div>
  );
};

export default Interactive3DCard;
