import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/welcome.css';

const Welcome = () => {
  const { darkMode } = useTheme();

  // Force dark mode for welcome page
  const forcedDarkMode = true;
  const [scrollY, setScrollY] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Show content after a short delay for animation purposes
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut'
    }
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse' as const
    }
  };

  const rotateAnimation = {
    rotate: [0, 360],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear'
    }
  };

  return (
    <div className={`welcome-page dark`} style={{ backgroundColor: '#121212', color: '#ffffff' }}>
      {/* Background elements */}
      <div className="welcome-background">
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
        />
        <motion.div
          className="circle circle-3"
          initial={{ opacity: 0, rotate: 0 }}
          animate={{
            opacity: 0.6,
            rotate: 360
          }}
          transition={{
            opacity: { duration: 1, delay: 0.4 },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
        />
      </div>

      {/* Header */}
      <header className="welcome-header">
        <motion.div
          className="logo-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="app-logo"
            animate={pulseAnimation}
          >
            <img
              src="/assets/logos/UKUQALA.svg"
              alt="Ukuqala Logo"
              width="120"
              height="120"
              className="logo-animation"
            />
          </motion.div>
          <h1>Ukuqala</h1>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate={showContent ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <span>Revolutionary Healthcare</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="hero-title">
            <span className="gradient-text">Ukuqala</span> : The Future of <br />
            Healthcare in Africa
          </motion.h1>
          <motion.p variants={itemVariants} className="hero-subtitle">
            Advanced AI-powered health platform designed specifically for Africa,
            bringing revolutionary diagnostics and personalized care to everyone
          </motion.p>
          <motion.div variants={itemVariants} className="hero-buttons">
            <Link to="/login" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Create Account
            </Link>
          </motion.div>
          <motion.div variants={itemVariants} className="hero-features">
            <div className="feature-pill">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
              <span>AI Disease Prediction</span>
            </div>
            <div className="feature-pill">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
              <span>Medical Chatbot</span>
            </div>
            <div className="feature-pill">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
              <span>Health Analytics</span>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="hero-trust">
            <div className="trust-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
              <p>Trusted by thousands of users across Africa</p>
            </div>
            <div className="trust-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor" />
              </svg>
              <p>Available on Web, iOS, and Android</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-devices"
          style={{ y: scrollY * -0.2 }}
        >
          <motion.div
            className="device device-phone"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="device-placeholder phone-placeholder">
              <div className="device-content">
                <div className="device-header"></div>
                <div className="device-screen">
                  <div className="app-icon"></div>
                  <div className="app-text"></div>
                  <div className="app-button"></div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="device device-tablet"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="device-placeholder tablet-placeholder">
              <div className="device-content">
                <div className="device-header"></div>
                <div className="device-screen">
                  <div className="app-sidebar"></div>
                  <div className="app-main">
                    <div className="app-card"></div>
                    <div className="app-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="device device-laptop"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="device-placeholder laptop-placeholder">
              <div className="device-content">
                <div className="device-header"></div>
                <div className="device-screen">
                  <div className="app-sidebar"></div>
                  <div className="app-main">
                    <div className="app-chart"></div>
                    <div className="app-data"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="scroll-indicator"
          animate={floatingAnimation}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <p>SCROLL DOWN</p>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor" />
          </svg>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-badge">Revolutionary Features</div>
          <h2 className="section-title">AI-Powered Healthcare for Africa</h2>
          <p className="section-subtitle">Ukuqala combines cutting-edge AI technology with healthcare expertise to deliver innovative solutions</p>
        </motion.div>

        <div className="features-grid">
          {/* Feature 1 */}
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3>Disease Prediction</h3>
            <p>Advanced AI algorithms to predict and detect diseases early with high accuracy, specifically trained on African health data.</p>
            <div className="feature-footer">
              <span className="feature-tag">AI-Powered</span>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            className="feature-card featured"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
          >
            <div className="feature-badge">Popular</div>
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor" />
                  <path d="M12 15H14V13H16V11H14V9H12V11H10V13H12V15ZM12 7H17V5H12V7ZM7 7H10V5H7V7ZM7 13H9V11H7V13ZM7 17H14V15H7V17Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3>Medical Chatbot</h3>
            <p>Get instant medical advice and information from our AI-powered medical assistant, available 24/7 in multiple African languages.</p>
            <div className="feature-footer">
              <span className="feature-tag">Multilingual</span>
              <span className="feature-tag">24/7</span>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3>Appointment Booking</h3>
            <p>Schedule appointments with healthcare providers and receive SMS reminders, even in areas with limited internet connectivity.</p>
            <div className="feature-footer">
              <span className="feature-tag">SMS Enabled</span>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3>Health Community</h3>
            <p>Connect with others, share experiences, and get support from the health community across Africa with real-time chat and forums.</p>
            <div className="feature-footer">
              <span className="feature-tag">Social</span>
            </div>
          </motion.div>

          {/* Feature 5 */}
          <motion.div
            className="feature-card featured"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
          >
            <div className="feature-badge">New</div>
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V7H9V17ZM13 17H11V11H13V17ZM17 17H15V14H17V17Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3>Health Analytics</h3>
            <p>Track your health metrics and get personalized insights for better health management with beautiful visualizations and AI recommendations.</p>
            <div className="feature-footer">
              <span className="feature-tag">Personalized</span>
              <span className="feature-tag">AI-Powered</span>
            </div>
          </motion.div>

          {/* Feature 6 */}
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
          >
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <h3>Health Tips & News</h3>
            <p>Stay informed with the latest health news, tips, and educational content relevant to African health concerns and developments.</p>
            <div className="feature-footer">
              <span className="feature-tag">Localized</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <motion.div
            className="cta-shape cta-shape-1"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="cta-shape cta-shape-2"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="cta-badge">Ready to Transform Healthcare?</div>
          <h2>Start Your Health Journey Today</h2>
          <p>Join thousands of users across Africa who trust Ukuqala for their healthcare needs. Experience the future of healthcare with our AI-powered platform.</p>

          <div className="cta-features">
            <div className="cta-feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
              <span>Personalized Health Insights</span>
            </div>
            <div className="cta-feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
              <span>24/7 Medical Support</span>
            </div>
            <div className="cta-feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
              </svg>
              <span>Community Support</span>
            </div>
          </div>

          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Create Free Account
            </Link>
            <Link to="/login" className="btn btn-outline">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="welcome-footer">
        <div className="footer-pattern"></div>

        <div className="footer-content">
          <div className="footer-branding">
            <div className="footer-logo">
              <div className="app-logo">
                <img
                  src="/assets/logos/UKUQALA.svg"
                  alt="Ukuqala Logo"
                  width="80"
                  height="80"
                  className="logo-animation"
                />
              </div>
              <h3>Ukuqala</h3>
            </div>
            <p className="footer-tagline">Revolutionizing healthcare in Africa with AI-powered solutions</p>

            <div className="footer-social">
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" fill="currentColor" />
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.46 6C21.69 6.35 20.86 6.58 20 6.69C20.88 6.16 21.56 5.32 21.88 4.31C21.05 4.81 20.13 5.16 19.16 5.36C18.37 4.5 17.26 4 16 4C13.65 4 11.73 5.92 11.73 8.29C11.73 8.63 11.77 8.96 11.84 9.27C8.28 9.09 5.11 7.38 3 4.79C2.63 5.42 2.42 6.16 2.42 6.94C2.42 8.43 3.17 9.75 4.33 10.5C3.62 10.5 2.96 10.3 2.38 10V10.03C2.38 12.11 3.86 13.85 5.82 14.24C5.46 14.34 5.08 14.39 4.69 14.39C4.42 14.39 4.15 14.36 3.89 14.31C4.43 16 6 17.26 7.89 17.29C6.43 18.45 4.58 19.13 2.56 19.13C2.22 19.13 1.88 19.11 1.54 19.07C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79C20.33 8.6 20.33 8.42 20.32 8.23C21.16 7.63 21.88 6.87 22.46 6Z" fill="currentColor" />
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.8 2H16.2C19.4 2 22 4.6 22 7.8V16.2C22 19.4 19.4 22 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2ZM7.6 4C5.61 4 4 5.61 4 7.6V16.4C4 18.39 5.61 20 7.6 20H16.4C18.39 20 20 18.39 20 16.4V7.6C20 5.61 18.39 4 16.4 4H7.6ZM17.25 5.5C17.94 5.5 18.5 6.06 18.5 6.75C18.5 7.44 17.94 8 17.25 8C16.56 8 16 7.44 16 6.75C16 6.06 16.56 5.5 17.25 5.5ZM12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
                </svg>
              </a>
              <a href="#" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H6.5V10H9V17ZM7.75 8.5C6.8 8.5 6 7.7 6 6.75C6 5.8 6.8 5 7.75 5C8.7 5 9.5 5.8 9.5 6.75C9.5 7.7 8.7 8.5 7.75 8.5ZM18 17H15.5V13.25C15.5 12.45 14.85 11.8 14.05 11.8C13.25 11.8 12.6 12.45 12.6 13.25V17H10.1V10H12.6V11.15C13.05 10.45 14 10 15.1 10C16.65 10 18 11.35 18 12.9V17Z" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><Link to="/login">Web App</Link></li>
                <li><a href="#">iOS App</a></li>
                <li><a href="#">Android App</a></li>
                <li><a href="#">API Access</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Features</h4>
              <ul>
                <li><a href="#">Disease Prediction</a></li>
                <li><a href="#">Medical Chatbot</a></li>
                <li><a href="#">Health Analytics</a></li>
                <li><a href="#">Appointment Booking</a></li>
                <li><a href="#">Health Community</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Health Blog</a></li>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Developer API</a></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Ukuqala. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
