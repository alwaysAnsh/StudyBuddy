import React, { useEffect, useRef } from 'react';
import './AboutPage.css';

const AboutPage = () => {
  const observerRef = useRef(null);

  useEffect(() => {
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

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content animate-on-scroll">
          <h1 className="about-hero-title">
            About <span className="gradient-text">Learning App</span>
          </h1>
          <p className="about-hero-subtitle">
            Empowering learners to achieve their goals through collaboration and accountability
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="about-section">
        <div className="about-content animate-on-scroll">
          <h2 className="about-section-title">Who We Are</h2>
          <p className="about-text">
            We are a team of learners who understand the challenges of staying consistent 
            with learning goals. Born from the need to stay accountable with study partners, 
            we built a platform that makes collaborative learning natural and effective.
          </p>
          <p className="about-text">
            Our journey started as a simple task tracker between friends preparing for 
            technical interviews. Today, we've grown into a community of thousands helping 
            each other achieve their learning milestones.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="about-section gray-bg">
        <div className="about-content animate-on-scroll">
          <h2 className="about-section-title">What We Do</h2>
          <div className="about-features">
            <div className="about-feature-item">
              <div className="about-feature-icon">🎯</div>
              <h3 className="about-feature-title">Task Management</h3>
              <p className="about-feature-text">
                Assign and track learning tasks with your study partners. Keep everyone 
                aligned and accountable with clear deadlines and progress tracking.
              </p>
            </div>
            <div className="about-feature-item">
              <div className="about-feature-icon">📝</div>
              <h3 className="about-feature-title">Knowledge Sharing</h3>
              <p className="about-feature-text">
                Create shared notes accessible to all team members. Build a collective 
                knowledge base that grows with your learning journey.
              </p>
            </div>
            <div className="about-feature-item">
              <div className="about-feature-icon">🏆</div>
              <h3 className="about-feature-title">Achievement Tracking</h3>
              <p className="about-feature-text">
                Celebrate wins together in the activity feed. Share accomplishments, 
                inspire others, and stay motivated through community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section">
        <div className="about-content">
          <div className="mission-vision-grid">
            <div className="mission-card animate-on-scroll">
              <h2 className="mission-title">Our Mission</h2>
              <p className="mission-text">
                To make collaborative learning accessible, effective, and enjoyable for 
                everyone. We believe that learning together is more powerful than learning 
                alone, and we're building the tools to make that possible.
              </p>
            </div>
            <div className="vision-card animate-on-scroll">
              <h2 className="vision-title">Our Vision</h2>
              <p className="vision-text">
                A world where every learner has the support, tools, and community they need 
                to achieve their goals. We envision a future where collaborative learning 
                is the norm, not the exception.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section values-section">
        <div className="about-content animate-on-scroll">
          <h2 className="about-section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3 className="value-title">🤝 Collaboration</h3>
              <p className="value-text">
                We believe in the power of learning together and building supportive communities.
              </p>
            </div>
            <div className="value-item">
              <h3 className="value-title">📈 Growth</h3>
              <p className="value-text">
                Continuous improvement for our users and ourselves drives everything we do.
              </p>
            </div>
            <div className="value-item">
              <h3 className="value-title">🎨 Simplicity</h3>
              <p className="value-text">
                Beautiful, intuitive design that gets out of your way and lets you focus on learning.
              </p>
            </div>
            <div className="value-item">
              <h3 className="value-title">💡 Innovation</h3>
              <p className="value-text">
                Always exploring new ways to make collaborative learning more effective.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta animate-on-scroll">
        <h2 className="about-cta-title">Ready to Start Your Learning Journey?</h2>
        <p className="about-cta-text">
          Join thousands of learners achieving their goals together
        </p>
        <button className="about-cta-btn" onClick={() => window.location.href = '/'}>
          Get Started Free
        </button>
      </section>
    </div>
  );
};

export default AboutPage;