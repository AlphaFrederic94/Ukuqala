import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Brain, Microscope, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  alternateLink: {
    text: string;
    to: string;
    label: string;
  };
}

export default function NewAuthLayout({ children, title, subtitle, alternateLink }: AuthLayoutProps) {
  const { darkMode, toggleDarkMode } = useTheme();

  // Force dark mode for auth pages
  const forcedDarkMode = true;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <div className={`auth-page dark`} style={{ backgroundColor: '#121212', color: '#ffffff' }}>
      {/* Left side - Branding and features */}
      <div className="auth-left-side">
        <div className="auth-left-content">
          <div className="auth-logo-container">
            <img 
              src="/assets/logos/UKUQALA.svg" 
              alt="Ukuqala Logo" 
              className="auth-logo"
            />
            <h1 className="auth-logo-text">Ukuqala</h1>
          </div>

          <div className="auth-features">
            <div className="auth-feature auth-feature-1">
              <Heart className="auth-feature-icon" />
              <h3 className="auth-feature-title">Health Monitoring</h3>
              <p className="auth-feature-description">Track your vital signs and health metrics in real-time</p>
            </div>
            <div className="auth-feature auth-feature-2">
              <Brain className="auth-feature-icon" />
              <h3 className="auth-feature-title">AI Diagnostics</h3>
              <p className="auth-feature-description">Advanced AI-powered health predictions and analysis</p>
            </div>
            <div className="auth-feature auth-feature-3">
              <Microscope className="auth-feature-icon" />
              <h3 className="auth-feature-title">Lab Results</h3>
              <p className="auth-feature-description">Quick access to your medical test results</p>
            </div>
            <div className="auth-feature auth-feature-4">
              <Activity className="auth-feature-icon" />
              <h3 className="auth-feature-title">24/7 Monitoring</h3>
              <p className="auth-feature-description">Continuous health tracking and alerts</p>
            </div>
          </div>

          <div className="prose prose-lg text-white">
            <h2 className="text-2xl font-bold text-white mb-4">Transform Your Healthcare Experience</h2>
            <p className="text-white/80">
              Ukuqala combines cutting-edge artificial intelligence with comprehensive health monitoring
              to provide you with personalized healthcare insights and predictions specifically designed for Africa.
            </p>
          </div>
        </div>

        <div className="auth-background-shapes">
          <motion.div 
            className="auth-shape auth-shape-1"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="auth-shape auth-shape-2"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="auth-shape auth-shape-3"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 10, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="auth-right-side">
        <div className="auth-right-background">
          <motion.div 
            className="circle circle-1"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ 
              opacity: 0.6,
              rotate: 360
            }}
            transition={{ 
              opacity: { duration: 1 },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
            style={{
              position: 'absolute',
              width: '80vw',
              height: '80vw',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              top: '-40vw',
              right: '-40vw',
              filter: 'blur(80px)',
              opacity: 'var(--circle-opacity)'
            }}
          />
          <motion.div 
            className="circle circle-2"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ 
              opacity: 0.6,
              rotate: 360
            }}
            transition={{ 
              opacity: { duration: 1, delay: 0.2 },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
            style={{
              position: 'absolute',
              width: '60vw',
              height: '60vw',
              borderRadius: '50%',
              background: 'var(--gradient-secondary)',
              bottom: '-30vw',
              left: '-30vw',
              filter: 'blur(80px)',
              opacity: 'var(--circle-opacity)'
            }}
          />
        </div>

        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-2 rounded-full bg-spotify-light-gray text-spotify-text-light hover:bg-spotify-lighter-gray z-10"
          aria-label="Theme Toggle"
        >
          <Moon size={20} />
        </button>

        <div className="auth-form-container">
          <motion.div 
            className="auth-form-header"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className="auth-form-title" variants={itemVariants}>{title}</motion.h1>
            {subtitle && (
              <motion.p className="auth-form-subtitle" variants={itemVariants}>{subtitle}</motion.p>
            )}
          </motion.div>

          {children}

          <motion.p 
            className="auth-footer"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            {alternateLink.text}{' '}
            <Link
              to={alternateLink.to}
              className="auth-footer-link"
            >
              {alternateLink.label}
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
