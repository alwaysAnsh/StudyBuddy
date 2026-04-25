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
      title: 'Buddy network',
      description: 'Send requests, build your learning circle, and stay accountable together.',
      icon: '🤝',
    },
    {
      title: 'Task assignment',
      description: 'Assign tasks with categories and due timelines, then track progress clearly.',
      icon: '✅',
    },
    {
      title: 'Study rooms',
      description: 'Create focused rooms with buddies for goals, room tasks, notes, and challenges.',
      icon: '📚',
    },
    {
      title: 'Activity + support',
      description: 'Share wins in an activity feed and support peers to keep momentum high.',
      icon: '🚀',
    },
  ];

  const benefits = [
    {
      title: 'Structured consistency',
      description: 'Design your own learning rhythm and actually stick to it.',
      icon: '📅',
    },
    {
      title: 'Visible growth',
      description: 'XP, levels, streaks, and completed work show your real progress.',
      icon: '📈',
    },
    {
      title: 'Low-noise collaboration',
      description: 'No random clutter: focused spaces, clear ownership, meaningful updates.',
      icon: '🎯',
    },
    {
      title: 'Built for students/devs',
      description: 'A practical workflow for coding prep, exams, and long-term learning goals.',
      icon: '💡',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create your workspace',
      description: 'Sign in, set your profile, and open your personal dashboard.',
    },
    {
      number: '02',
      title: 'Connect with buddies',
      description: 'Send invites to peers and create collaborative study rooms.',
    },
    {
      number: '03',
      title: 'Execute daily',
      description: 'Assign work, track status, share notes, and post activity wins.',
    },
  ];

  const xpRules = [
    { action: 'Assign a task to a buddy', xp: '+5 XP' },
    { action: 'Complete a task first time', xp: '+10 XP' },
    { action: 'Create a shared note', xp: '+3 XP' },
    { action: 'Post in activity feed', xp: '+7 XP' },
    { action: 'Complete a study-room task', xp: '+5 XP' },
    { action: 'Complete a study-room challenge', xp: 'Challenge-defined (0-50 XP)' },
  ];

  const levelTitles = [
    '1: Initiate',
    '2: Adept',
    '3: Scholar',
    '4: Rune Bearer',
    '5: Arcane Coder',
    '6: Shadow Architect',
    '7: Chrono Sage',
    '8: Mythic Engineer',
    '9: Ethereal Overlord',
    '10+: Celestial Ascendant',
  ];

  const marqueeFeatures = [
    { icon: '📚', label: 'Private Study Rooms' },
    { icon: '🤝', label: 'Buddy Connect' },
    { icon: '✅', label: 'Task Assignment' },
    { icon: '📝', label: 'Shared Notes' },
    { icon: '🎯', label: 'Activity Feed' },
    { icon: '🏅', label: 'Level: Scholar' },
    { icon: '⚡', label: 'XP Progression' },
    { icon: '🔥', label: 'Streak Tracking' },
    { icon: '🏆', label: 'Level: Arcane Coder' },
    { icon: '🚀', label: 'Study Challenges' },
  ];

  const faqs = [
    {
      q: 'How do I start using GeekBuddy?',
      a: 'Create an account, add buddies, then assign tasks or create a private study room.',
    },
    {
      q: 'How do levels work?',
      a: 'Your level increases every 100 XP. Level titles update automatically as you progress.',
    },
    {
      q: 'Can I manually pick a level?',
      a: 'No. Levels are progress-based and are unlocked only by earning XP.',
    },
    {
      q: 'Is a study room private?',
      a: 'Yes. Study rooms are buddy-invite based and visible only to members.',
    },
    {
      q: 'What if I forget my password?',
      a: 'Use Forgot Password and answer your saved security question correctly to reset access.',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-on-scroll">
          <h1 className="hero-title">
            GeekBuddy
            <span className="gradient-text"> for collaborative learning</span>
          </h1>
          <p className="hero-subtitle">
            A focused productivity platform where buddies manage tasks, run study rooms,
            share notes, and stay accountable through activity updates.
          </p>
          <p className="desktop-note">For best experience, use laptop/desktop (large screen).</p>
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
          <div className="orbit-core" aria-hidden />
          <div className="floating-card card-1">
            <span className="sr-only">Task Completed</span>
            <div className="card-icon">✓</div>
          </div>
          <div className="floating-card card-2">
            <span className="sr-only">New Note</span>
            <div className="card-icon">📝</div>
          </div>
          <div className="floating-card card-3">
            <span className="sr-only">Achievement Unlocked</span>
            <div className="card-icon">🎯</div>
          </div>
          <div className="floating-card card-4">
            <span className="sr-only">Buddy Connected</span>
            <div className="card-icon">🤝</div>
          </div>
          <div className="floating-card card-5">
            <span className="sr-only">Private Study Room</span>
            <div className="card-icon">📚</div>
          </div>
          <div className="floating-card card-6">
            <span className="sr-only">Level Scholar</span>
            <div className="card-icon">🏆</div>
          </div>
        </div>
      </section>

      <section className="feature-marquee-section" aria-label="GeekBuddy feature highlights">
        <div className="feature-marquee-track">
          {[...marqueeFeatures, ...marqueeFeatures].map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="feature-pill">
              <span className="feature-pill-icon" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="value-section">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Core modules</h2>
          <p className="section-subtitle">
            Everything in the app maps to a real learning workflow
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
          <h2 className="section-title">Why GeekBuddy works</h2>
          <p className="section-subtitle">
            A practical system for solo progress + group accountability
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
          <h2 className="section-title">How to start</h2>
          <p className="section-subtitle">Simple setup, then daily execution</p>
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

      <section className="business-section animate-on-scroll">
        <div className="business-content">
          <h2 className="business-title">Private study rooms, done right</h2>
          <p className="business-description">
            Study rooms are private spaces for you and your buddies. Define a shared goal, invite
            members, assign room tasks, share rich notes and attachments, and run focused
            challenges. The room stays intentional: structure over noise.
          </p>
          <div className="private-room-points">
            <div>Buddy-only invites for privacy</div>
            <div>Room tasks with personal progress</div>
            <div>Shared notes + file resources</div>
            <div>Timed challenges with XP rewards</div>
          </div>
        </div>
      </section>

      <section className="xp-section animate-on-scroll">
        <div className="section-header">
          <h2 className="section-title">XP and level progression</h2>
          <p className="section-subtitle">
            XP tracks consistent work. Every 100 XP moves you to the next level.
          </p>
        </div>
        <div className="xp-grid">
          <div className="xp-card">
            <h3>How XP increases</h3>
            <ul>
              {xpRules.map((rule) => (
                <li key={rule.action}>
                  <span>{rule.action}</span>
                  <strong>{rule.xp}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="xp-card">
            <h3>Level titles as you progress</h3>
            <ul className="level-list">
              {levelTitles.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="faq-section animate-on-scroll">
        <div className="section-header">
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-subtitle">Quick answers for first-time users</p>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section animate-on-scroll">
        <div className="cta-content">
          <h2 className="cta-title">Ready to build consistency?</h2>
          <p className="cta-subtitle">
            Open your dashboard and start with one focused task today.
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