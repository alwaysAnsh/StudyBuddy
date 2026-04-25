import React from 'react';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: April 25, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using GeekBuddy, you agree to these Terms of Service. If you do not
            agree, please discontinue use of the platform.
          </p>
        </section>

        <section>
          <h2>2. User Responsibilities</h2>
          <p>
            You are responsible for the content you post, account security, and respectful behavior
            toward other users. Abuse, harassment, or malicious use is not permitted.
          </p>
        </section>

        <section>
          <h2>3. Account Security</h2>
          <p>
            Keep your credentials and security question details confidential. You are responsible
            for all actions under your account.
          </p>
        </section>

        <section>
          <h2>4. Platform Availability</h2>
          <p>
            We may update, modify, or temporarily suspend features for maintenance and
            improvements. We aim to provide reliable service but do not guarantee uninterrupted
            availability.
          </p>
        </section>

        <section>
          <h2>5. Content and Data</h2>
          <p>
            You retain ownership of your submitted content. By posting on GeekBuddy, you grant the
            app permission to store and display your content inside your account and shared spaces.
          </p>
        </section>

        <section>
          <h2>6. Termination</h2>
          <p>
            Accounts that violate these terms may be restricted or removed. Users may stop using
            the platform at any time.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For policy questions, contact the project owner through the listed profile links on the
            home page.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
