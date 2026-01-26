import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const observerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      title: 'Task Management',
      description: 'Assign and track tasks with multiple status options and categories',
      icon: '✓'
    },
    {
      title: 'Shared Notes',
      description: 'Collaborate with shared notes visible to all team members',
      icon: '📝'
    },
    {
      title: 'Activity Feed',
      description: 'Share achievements and track what everyone has accomplished',
      icon: '🎯'
    },
    {
      title: 'Real-time Sync',
      description: 'All updates sync instantly across all users',
      icon: '⚡'
    }
  ];

  const benefits = [
    {
      title: 'Stay Organized',
      description: 'Keep all your learning tasks and goals in one place',
      icon: '📊'
    },
    {
      title: 'Track Progress',
      description: 'Monitor your growth and accomplishments over time',
      icon: '📈'
    },
    {
      title: 'Collaborate',
      description: 'Work together with your study partners seamlessly',
      icon: '🤝'
    },
    {
      title: 'Stay Motivated',
      description: 'See what others are doing and celebrate wins together',
      icon: '💪'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up and set up your profile in seconds'
    },
    {
      number: '02',
      title: 'Invite Partners',
      description: 'Add your study buddies to collaborate'
    },
    {
      number: '03',
      title: 'Start Tracking',
      description: 'Assign tasks, share notes, and post achievements'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-on-scroll">
          <h1 className="hero-title">
            Master Your Learning Journey
            <span className="gradient-text"> Together</span>
          </h1>
          <p className="hero-subtitle">
            A collaborative platform to track tasks, share knowledge, and celebrate 
            achievements with your study partners. Stay organized, motivated, and on track.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started Free
            </button>
            <button className="btn-secondary" onClick={() => navigate('/about')}>
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-visual animate-on-scroll">
          <div className="floating-card card-1">
            <div className="card-icon">✓</div>
            <div className="card-text">Task Completed</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">📝</div>
            <div className="card-text">New Note</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">🎯</div>
            <div className="card-text">Achievement Unlocked</div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="value-section">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <p className="section-subtitle">
            A complete toolkit for collaborative learning and productivity
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card animate-on-scroll"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Why Join Us?</h2>
          <p className="section-subtitle">
            Join thousands of learners achieving their goals together
          </p>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="benefit-card animate-on-scroll"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="benefit-icon">{benefit.icon}</div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Get Started in Minutes</h2>
          <p className="section-subtitle">Simple, fast, and effective</p>
        </div>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="step-item animate-on-scroll"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </section>

      {/* Business Info */}
      <section className="business-section animate-on-scroll">
        <div className="business-content">
          <h2 className="business-title">Built for Learners, By Learners</h2>
          <p className="business-description">
            We understand the challenges of staying consistent with learning goals. 
            That's why we created a platform that makes collaboration natural, 
            progress visible, and achievements worth celebrating.
          </p>
          <div className="business-stats">
            <div className="stat-item">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">50K+</div>
              <div className="stat-label">Tasks Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section animate-on-scroll">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Level Up Your Learning?</h2>
          <p className="cta-subtitle">
            Join our community and start achieving your goals today
          </p>
          <button className="btn-primary-large" onClick={handleGetStarted}>
            Get Started Now →
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;