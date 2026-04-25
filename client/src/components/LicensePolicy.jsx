import React from 'react';
import './LegalPages.css';

const LicensePolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>License Policy</h1>
        <p className="legal-updated">Last updated: April 25, 2026</p>

        <section>
          <h2>1. Platform License</h2>
          <p>
            GeekBuddy is provided for personal and educational productivity use. You are granted a
            limited, non-exclusive, revocable right to use the service.
          </p>
        </section>

        <section>
          <h2>2. Permitted Use</h2>
          <p>
            You may use the platform to manage tasks, study rooms, notes, and activity posts.
            Automated abuse, reverse engineering, and unauthorized data scraping are prohibited.
          </p>
        </section>

        <section>
          <h2>3. Intellectual Property</h2>
          <p>
            Product identity, branding, and interface assets remain property of the project owner
            unless explicitly stated otherwise.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Components</h2>
          <p>
            GeekBuddy may include open-source dependencies that are governed by their respective
            licenses. Such licenses remain in effect for those components.
          </p>
        </section>

        <section>
          <h2>5. Policy Changes</h2>
          <p>
            This policy may be updated as the product evolves. Continued usage after updates
            implies acceptance of the revised policy.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LicensePolicy;
