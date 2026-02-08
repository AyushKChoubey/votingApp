import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/layout/Button';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen theme-bg">
      {/* Hero Section - Modern & Engaging */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="text-center stagger-children">
            {/* Feature Badge */}
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 animate-fadeIn" style={{"--stagger-index": 0}}>
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium theme-text">Free to Start </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold theme-text mb-4 sm:mb-6 leading-tight animate-fadeIn" style={{"--stagger-index": 1}}>
              Secure Online Voting
              <span className="block text-gradient mt-2 sm:mt-3">Made Simple</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl theme-muted mb-8 sm:mb-10 max-w-3xl mx-auto px-2 leading-relaxed animate-fadeIn" style={{"--stagger-index": 2}}>
              Create, manage, and participate in secure online voting with VoteBooth. 
              <span className="block mt-1">Perfect for organizations, communities, and teams of all sizes.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto mb-8 animate-pop" style={{"--stagger-index": 3}}>
              {!isAuthenticated ? (
                <>
                  <Button 
                    variant="primary" 
                    size="xl"
                    to="/register"
                    fullWidth
                    className="sm:w-auto"
                    icon={<span>→</span>}
                    iconPosition="right"
                  >
                    Get Started Free
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="xl"
                    to="/login"
                    fullWidth
                    className="sm:w-auto"
                  >
                    Sign In
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="primary" 
                    size="xl"
                    to="/dashboard"
                    fullWidth
                    className="sm:w-auto"
                    icon={<span>→</span>}
                    iconPosition="right"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="xl"
                    to="/booth/create"
                    fullWidth
                    className="sm:w-auto"
                  >
                    Create Booth
                  </Button>
                </>
              )}
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 text-center animate-fadeIn" style={{"--stagger-index": 4}}>
              
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gradient">99.9%</div>
                <div className="text-xs sm:text-sm theme-muted mt-1">Uptime</div>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gradient">24/7</div>
                <div className="text-xs sm:text-sm theme-muted mt-1">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Background decoration with float animation */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
          <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, var(--color-primary), var(--color-accent))' }} />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 pointer-events-none float" style={{"--stagger-index": 1}}>
          <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, var(--color-accent), var(--color-secondary))' }} />
        </div>
        
        {/* Floating orbs for depth */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-2xl opacity-10 float pointer-events-none" style={{ background: 'var(--color-success)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full blur-2xl opacity-10 float pointer-events-none" style={{ background: 'var(--color-warning)', animationDelay: '2s' }} />
      </div>

      {/* How It Works Section */}
      <div className="py-16 sm:py-24 theme-surface relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{backgroundImage: "radial-gradient(circle at 2px 2px, var(--color-border) 1px, transparent 0)", backgroundSize: "32px 32px"}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-12 sm:mb-16 stagger-children">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-4 animate-fadeIn" style={{"--stagger-index": 0}}>
              <span className="text-sm font-semibold text-accent">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold theme-text mb-4 animate-slideUp" style={{"--stagger-index": 1}}>
              Start Voting in Minutes
            </h2>
            <p className="text-lg theme-muted max-w-2xl mx-auto animate-fadeIn" style={{"--stagger-index": 2}}>
              Three simple steps to secure, transparent voting
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 stagger-children">
            {[
              {
                step: "01",
                title: "Create Your Booth",
                description: "Set up your voting booth with custom options, configure privacy settings, and get a unique invite code instantly.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Invite Participants",
                description: "Share your unique code with participants. They join instantly and can start voting right away—no complicated setup required.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Track Results Live",
                description: "Watch votes come in real-time with instant updates. Download detailed reports and analyze voting patterns anytime.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              }
            ].map((step, index) => (
              <div key={index} className="relative animate-fadeIn" style={{"--stagger-index": index}}>
                {/* Connector line (hidden on mobile) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-accent via-accent/50 to-transparent z-0"></div>
                )}
                
                <div className="text-center relative z-10">
                  <div className="relative inline-block mb-6">
                    <div className="glass-card w-16 h-16 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-xl border-2 border-accent/20 group-hover:border-accent/40 transition-all duration-300 interactive-scale">
                      <div className="w-8 h-8 text-accent">
                        {step.icon}
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 glass-card px-2.5 py-1 rounded-full text-xs font-bold text-accent border border-accent/20">
                      {step.step}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold theme-text mb-3">{step.title}</h3>
                  <p className="theme-muted leading-relaxed max-w-sm mx-auto">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 stagger-children">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-4 animate-fadeIn" style={{"--stagger-index": 0}}>
              <span className="text-sm font-semibold text-accent">USE CASES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold theme-text mb-4 animate-slideUp" style={{"--stagger-index": 1}}>
              Perfect for Every Occasion
            </h2>
            <p className="text-lg theme-muted max-w-2xl mx-auto animate-fadeIn" style={{"--stagger-index": 2}}>
              From small teams to large organizations, VoteBooth adapts to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 stagger-children">
            {[
              {
                title: "Organizations & NGOs",
                description: "Run board elections, policy decisions, and member votes with complete transparency and security.",
                icon: "🏢",
                items: ["Board elections", "Policy voting", "Member decisions"]
              },
              {
                title: "Educational Institutions",
                description: "Student council elections, faculty votes, and course evaluations made simple and accessible.",
                icon: "🎓",
                items: ["Student elections", "Faculty votes", "Course feedback"]
              },
              {
                title: "Community Groups",
                description: "Neighborhood decisions, event planning votes, and community initiatives with easy participation.",
                icon: "👥",
                items: ["Community decisions", "Event planning", "Budget allocation"]
              },
              {
                title: "Businesses & Teams",
                description: "Team decisions, feature prioritization, and company polls for better collaboration.",
                icon: "💼",
                items: ["Team decisions", "Feature voting", "Company surveys"]
              }
            ].map((useCase, index) => (
              <div 
                key={index} 
                className="group theme-surface rounded-2xl p-6 sm:p-8 border-2 border-border hover:border-accent/50 transition-all duration-500 relative overflow-hidden animate-pop"
                style={{"--stagger-index": index}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <h3 className="text-xl font-bold theme-text mb-3">{useCase.title}</h3>
                  <p className="theme-muted mb-4 leading-relaxed">{useCase.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {useCase.items.map((item, i) => (
                      <span key={i} className="glass-card px-3 py-1.5 text-xs font-medium theme-text rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Modern with gradient */}
      <div className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-accent) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="border-gradient rounded-3xl p-8 sm:p-12 backdrop-blur">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold theme-text mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl theme-muted mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join thousands of organizations using VoteBooth for secure, transparent voting. 
              <span className="block mt-2 font-semibold text-gradient">Start free, no credit card required.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="primary" 
                size="xl"
                to="/register"
                fullWidth
                className="sm:w-auto"
                icon={<span>→</span>}
                iconPosition="right"
              >
                Create Your First Booth
              </Button>
              <Button 
                variant="secondary" 
                size="xl"
                to="/features"
                fullWidth
                className="sm:w-auto"
              >
                Learn More
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm theme-muted">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm theme-muted">Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm theme-muted">Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;