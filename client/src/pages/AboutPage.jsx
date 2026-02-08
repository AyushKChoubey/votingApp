import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen theme-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 sm:pb-20">
          <div className="text-center relative z-10">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-6 animate-fadeIn">
              <span className="text-xs sm:text-sm font-semibold text-accent">ABOUT VOTEBOOTH</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold theme-text mb-6 animate-fadeIn" style={{"--stagger-index": 1}}>
              Democratizing Decision-Making
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl theme-muted max-w-4xl mx-auto leading-relaxed animate-fadeIn" style={{"--stagger-index": 2}}>
              A secure, transparent, and accessible online voting platform for communities and organizations
            </p>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
          <div className="w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, var(--color-primary), var(--color-accent))' }} />
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-slideUp">
            <h2 className="text-3xl sm:text-4xl font-bold theme-text mb-6">Our Mission</h2>
            <p className="text-lg sm:text-xl theme-muted mb-6 leading-relaxed">
              VoteBooth helps groups make decisions together — simply and fairly. Whether it's a school choosing
              a student council, a neighborhood deciding on a community project, or a club picking a meeting time,
              VoteBooth provides an easy way to collect votes and share results.
            </p>
            <p className="text-lg sm:text-xl theme-muted leading-relaxed">
              Our focus is on making participation welcoming: clear instructions, straightforward options, and
              results everyone can understand. We remove the confusion so groups can focus on what matters — the
              decision itself.
            </p>
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="py-16 sm:py-20 relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-accent) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-4">
              <span className="text-xs sm:text-sm font-semibold text-accent">OUR VALUES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold theme-text mb-4">What Guides Us</h2>
            <p className="text-base sm:text-lg theme-muted max-w-2xl mx-auto">
              The principles that shape how we build VoteBooth
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            <div className="card-hover card-variant-primary text-center p-8 rounded-2xl border-2 border-border theme-surface animate-fadeIn" style={{"--stagger-index": 0}}>
              <div className="glass-card w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold theme-text mb-3">People First</h3>
              <p className="text-sm sm:text-base theme-muted leading-relaxed">
                Clear language, simple choices, and a welcoming experience so everyone can participate with confidence.
              </p>
            </div>
            
            <div className="card-hover card-variant-secondary text-center p-8 rounded-2xl border-2 border-border theme-surface animate-fadeIn" style={{"--stagger-index": 1}}>
              <div className="glass-card w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold theme-text mb-3">Security</h3>
              <p className="text-sm sm:text-base theme-muted leading-relaxed">
                Your votes and data are protected with industry-standard security measures, ensuring privacy and integrity throughout the voting process.
              </p>
            </div>
            
            <div className="card-hover card-variant-accent text-center p-8 rounded-2xl border-2 border-border theme-surface animate-fadeIn" style={{"--stagger-index": 2}}>
              <div className="glass-card w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold theme-text mb-3">Simplicity</h3>
              <p className="text-sm sm:text-base theme-muted leading-relaxed">
                No jargon, no complexity — just a straightforward way for groups to gather opinions and decide together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Who It's For Section */}
      <div className="py-16 sm:py-20 theme-surface relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{backgroundImage: "radial-gradient(circle at 2px 2px, var(--color-border) 1px, transparent 0)", backgroundSize: "32px 32px"}}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="mb-12 sm:mb-16">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-semibold text-accent">WHO WE SERVE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold theme-text mb-4">Built for Everyone</h2>
            <p className="text-lg theme-muted max-w-2xl mx-auto">
              From small teams to large organizations, VoteBooth adapts to your voting needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <div className="glass-card p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-all duration-500 group">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold theme-text mb-3">Organizations</h3>
              <p className="theme-muted leading-relaxed">Board elections, policy decisions, and member votes with complete transparency</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-all duration-500 group">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold theme-text mb-3">Educational Institutions</h3>
              <p className="theme-muted leading-relaxed">Student council elections, faculty votes, and course evaluations made simple</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-all duration-500 group">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold theme-text mb-3">Communities</h3>
              <p className="theme-muted leading-relaxed">Neighborhood decisions and community initiatives with easy participation</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-all duration-500 group">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-bold theme-text mb-3">Teams & Businesses</h3>
              <p className="theme-muted leading-relaxed">Team decisions, feature prioritization, and company polls for better collaboration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
