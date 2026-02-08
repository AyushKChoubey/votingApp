import React from "react";
import { Link } from "react-router-dom";

const PrivacyPage = () => {
  const lastUpdated = "February 8, 2026";

  return (
    <div className="min-h-screen theme-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="text-center relative z-10">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-6 animate-fadeIn">
              <span className="text-xs sm:text-sm font-semibold text-accent">
                LEGAL
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold theme-text mb-6 animate-fadeIn">
              Privacy Policy
            </h1>
            <p className="text-lg sm:text-xl theme-muted max-w-3xl mx-auto leading-relaxed animate-fadeIn">
              Your privacy is important to us. This policy explains how we
              collect, use, and protect your information.
            </p>
            <p className="text-sm theme-muted mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
          <div
            className="w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-15"
            style={{
              background:
                "radial-gradient(circle, var(--color-primary), var(--color-accent))",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-6 sm:p-10 space-y-10">
            {/* Information We Collect */}
            <section className="animate-slideUp">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  1. Information We Collect
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  <strong className="theme-text">Account Information:</strong>{" "}
                  When you create an account, we collect your name, email
                  address, and encrypted password. If you sign in with Google,
                  we receive your name and email from Google.
                </p>
                <p>
                  <strong className="theme-text">Voting Data:</strong> We store
                  your votes to ensure accurate results and prevent duplicate
                  voting. Your individual votes are kept confidential.
                </p>
                <p>
                  <strong className="theme-text">Usage Information:</strong> We
                  collect information about how you use VoteBooth, including
                  pages visited and features used, to improve our service.
                </p>
                <p>
                  <strong className="theme-text">Device Information:</strong> We
                  may collect device type, browser type, and IP address for
                  security and analytics purposes.
                </p>
              </div>
            </section>

            {/* How We Use Information */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  2. How We Use Your Information
                </h2>
              </div>
              <div className="pl-13 space-y-3 theme-muted leading-relaxed">
                <ul className="list-disc list-inside space-y-2">
                  <li>Provide, maintain, and improve the VoteBooth service</li>
                  <li>Process and record your votes accurately</li>
                  <li>Send important updates about your account and booths</li>
                  <li>Prevent fraud and ensure voting integrity</li>
                  <li>Respond to your questions and support requests</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                </ul>
              </div>
            </section>

            {/* Data Protection */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  3. Data Protection
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  We implement industry-standard security measures to protect
                  your data:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="theme-text">Encryption:</strong> All data
                    is encrypted in transit (HTTPS) and passwords are hashed
                    using bcrypt
                  </li>
                  <li>
                    <strong className="theme-text">
                      Secure Authentication:
                    </strong>{" "}
                    JWT tokens with expiration and refresh mechanisms
                  </li>
                  <li>
                    <strong className="theme-text">Rate Limiting:</strong>{" "}
                    Protection against brute-force attacks
                  </li>
                  <li>
                    <strong className="theme-text">
                      Regular Security Audits:
                    </strong>{" "}
                    We regularly review our security practices
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Sharing */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  4. Data Sharing
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  <strong className="theme-text">
                    We do not sell your personal data.
                  </strong>{" "}
                  We may share information only in these limited circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="theme-text">Booth Creators:</strong> Can
                    see member lists and aggregate voting results (not
                    individual votes)
                  </li>
                  <li>
                    <strong className="theme-text">Service Providers:</strong>{" "}
                    Trusted third parties that help operate our service
                    (hosting, email)
                  </li>
                  <li>
                    <strong className="theme-text">Legal Requirements:</strong>{" "}
                    When required by law or to protect rights and safety
                  </li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  5. Your Rights
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>You have control over your data:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="theme-text">Access:</strong> View your
                    profile and account information anytime
                  </li>
                  <li>
                    <strong className="theme-text">Update:</strong> Edit your
                    name, email, and profile settings
                  </li>
                  <li>
                    <strong className="theme-text">Delete:</strong> Request
                    complete account deletion from Settings
                  </li>
                  <li>
                    <strong className="theme-text">Export:</strong> Booth
                    creators can export their booth data
                  </li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  6. Cookies & Local Storage
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>We use cookies and local storage for:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="theme-text">Authentication:</strong>{" "}
                    Keeping you logged in securely
                  </li>
                  <li>
                    <strong className="theme-text">Preferences:</strong>{" "}
                    Remembering your theme (light/dark) settings
                  </li>
                  <li>
                    <strong className="theme-text">Security:</strong> CSRF
                    protection tokens
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">7. Contact Us</h2>
              </div>
              <div className="pl-13 theme-muted leading-relaxed">
                <p>
                  If you have questions about this Privacy Policy, please
                  contact us through our{" "}
                  <Link
                    to="/contact"
                    className="text-accent hover:underline font-medium"
                  >
                    Contact Page
                  </Link>
                  .
                </p>
              </div>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-10 text-center">
            <Link
              to="/terms"
              className="text-accent hover:underline font-medium"
            >
              View Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
