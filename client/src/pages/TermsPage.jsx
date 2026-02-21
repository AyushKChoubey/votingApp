import React from "react";
import { Link } from "react-router-dom";

const TermsPage = () => {
  const lastUpdated = "February 22, 2026";

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
              Terms of Service
            </h1>
            <p className="text-lg sm:text-xl theme-muted max-w-3xl mx-auto leading-relaxed animate-fadeIn">
              Please read these terms carefully before using VoteBooth.
            </p>
            <p className="text-sm theme-muted mt-4">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 -translate-y-12 -translate-x-12 pointer-events-none float">
          <div
            className="w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-15"
            style={{
              background:
                "radial-gradient(circle, var(--color-secondary), var(--color-primary))",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-6 sm:p-10 space-y-10">
            {/* Acceptance of Terms */}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  1. Acceptance of Terms
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  By accessing or using VoteBooth ("the Service"), you agree to
                  be bound by these Terms of Service. If you disagree with any
                  part of these terms, you may not use our service.
                </p>
                <p>
                  VoteBooth is a platform that enables users to create voting
                  booths, invite participants, and collect votes on various
                  topics. We reserve the right to modify these terms at any
                  time.
                </p>
              </div>
            </section>

            {/* Account Responsibilities */}
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  2. Account Responsibilities
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>When you create an account with VoteBooth, you agree to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Provide accurate and complete registration information
                  </li>
                  <li>Maintain the security of your password and account</li>
                  <li>
                    Accept responsibility for all activities under your account
                  </li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Be at least 13 years old to create an account</li>
                </ul>
              </div>
            </section>

            {/* Acceptable Use */}
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  3. Acceptable Use
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  <strong className="theme-text">
                    You agree NOT to use VoteBooth to:
                  </strong>
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Conduct illegal activities or voting fraud</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>
                    Create booths with offensive, discriminatory, or illegal
                    content
                  </li>
                  <li>
                    Attempt to manipulate voting results through fake accounts
                  </li>
                  <li>Reverse engineer or compromise the service's security</li>
                  <li>Use bots or automated systems to submit votes</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </div>
            </section>

            {/* Booth Creator Responsibilities */}
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  4. Booth Creator Responsibilities
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>If you create a voting booth, you are responsible for:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Ensuring the booth's purpose is lawful and appropriate
                  </li>
                  <li>
                    Managing member access and removing harmful participants
                  </li>
                  <li>
                    Setting clear voting rules and communicating them to
                    participants
                  </li>
                  <li>
                    Respecting participants' privacy and not sharing their
                    individual votes
                  </li>
                  <li>
                    Accepting responsibility for the booth's content and
                    participants
                  </li>
                </ul>
              </div>
            </section>

            {/* Voting Integrity */}
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  5. Voting Integrity
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  VoteBooth is designed to ensure fair and transparent voting:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Each verified user can vote only once per booth</li>
                  <li>
                    Votes are recorded securely and cannot be altered after
                    submission
                  </li>
                  <li>
                    Individual votes remain confidential; only aggregated
                    results are shown
                  </li>
                  <li>
                    We employ measures to detect and prevent voting manipulation
                  </li>
                </ul>
                <p className="mt-4">
                  <em>
                    Note: While we strive for voting integrity, VoteBooth is not
                    designed for legally binding elections or official
                    government voting. Use for informal polls, community
                    decisions, and organizational voting only.
                  </em>
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  6. Intellectual Property
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  The VoteBooth service, including its design, features, and
                  content (excluding user-generated content), is owned by us and
                  protected by copyright and other laws.
                </p>
                <p>
                  You retain ownership of the content you create (booth titles,
                  descriptions, candidate information). By using the service,
                  you grant us a license to display this content as needed to
                  operate the platform.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
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
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  7. Termination
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  We may terminate or suspend your account immediately, without
                  prior notice, for any reason including:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Breach of these Terms of Service</li>
                  <li>Fraudulent or illegal activities</li>
                  <li>Harmful behavior toward other users</li>
                  <li>Upon your request for account deletion</li>
                </ul>
                <p className="mt-4">
                  You may delete your account at any time from your Settings
                  page. Upon termination, your right to use the service ceases
                  immediately.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 7 }}
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  8. Disclaimers
                </h2>
              </div>
              <div className="pl-13 space-y-4 theme-muted leading-relaxed">
                <p>
                  VoteBooth is provided "as is" without warranties of any kind.
                  We do not guarantee:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Uninterrupted or error-free service</li>
                  <li>That the service will meet your specific requirements</li>
                  <li>
                    The accuracy of voting results in case of technical failures
                  </li>
                </ul>
                <p className="mt-4">
                  We are not liable for any indirect, incidental, or
                  consequential damages arising from your use of the service.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 8 }}
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  9. Changes to Terms
                </h2>
              </div>
              <div className="pl-13 theme-muted leading-relaxed">
                <p>
                  We reserve the right to modify these terms at any time. We
                  will notify users of significant changes via email or through
                  the service. Your continued use of VoteBooth after changes
                  constitutes acceptance of the new terms.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section
              className="animate-slideUp"
              style={{ "--stagger-index": 9 }}
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold theme-text">
                  10. Contact Us
                </h2>
              </div>
              <div className="pl-13 theme-muted leading-relaxed">
                <p>
                  If you have questions about these Terms, please contact us
                  through our{" "}
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
              to="/privacy"
              className="text-accent hover:underline font-medium"
            >
              View Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
