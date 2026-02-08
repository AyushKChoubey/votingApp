import React from 'react';

const FeaturesPage = () => {
  const features = [
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Secure Voting Booths",
      description: "Create private voting booths with unique invite codes. Only authorized members can participate in your polls.",
      variant: "primary"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "User Management",
      description: "Invite participants with unique codes, track membership, and manage voting permissions with an intuitive admin dashboard.",
      variant: "secondary"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Real-Time Results",
      description: "Watch voting results update live as votes are cast. Control result visibility with customizable privacy settings.",
      variant: "accent"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: "Flexible Voting Rules",
      description: "Configure anonymous voting, vote changes, scheduled voting periods, and result visibility to match your needs.",
      variant: "success"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Mobile Optimized",
      description: "Vote from anywhere, anytime. Our responsive design works seamlessly on all devices and screen sizes.",
      variant: "info"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      title: "Vote Tracking & Analytics",
      description: "Complete audit trail with detailed vote tracking, member statistics, and voting participation insights.",
      variant: "warning"
    }
  ];

  return (
    <div className="min-h-screen theme-bg">
      {/* Hero Section */}
      <div className="relative py-16 sm:py-24 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center stagger-children">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-6 animate-fadeIn" style={{"--stagger-index": 0}}>
              <span className="text-sm font-semibold text-accent">✨ POWERFUL FEATURES</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold theme-text mb-6 leading-tight animate-slideUp" style={{"--stagger-index": 1}}>
              Everything You Need for
              <span className="block text-gradient mt-2">Secure Voting</span>
            </h1>
            
            <p className="text-lg sm:text-xl theme-muted max-w-3xl mx-auto leading-relaxed animate-fadeIn" style={{"--stagger-index": 2}}>
              Create private voting booths, invite participants, and conduct secure polls with our modern, user-friendly platform.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 sm:py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative animate-pop"
                style={{"--stagger-index": index}}
              >
                {/* Card with enhanced styling */}
                <div className={`h-full theme-surface rounded-2xl p-8 border-2 border-border hover:border-accent/50 transition-all duration-500 relative overflow-hidden card-hover`}>
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon with animated background */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className={`glass-card p-4 rounded-2xl w-fit relative backdrop-blur-xl border-2 border-accent/20 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500`}>
                        <div className="w-8 h-8 text-accent">
                          {feature.icon}
                        </div>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold theme-text mb-4 group-hover:text-gradient transition-all duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="theme-muted leading-relaxed text-[15px]">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 sm:py-20 theme-surface relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{backgroundImage: "radial-gradient(circle at 2px 2px, var(--color-border) 1px, transparent 0)", backgroundSize: "32px 32px"}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16 stagger-children">
            <div className="inline-block glass-card px-4 py-2 rounded-full mb-4 animate-fadeIn" style={{"--stagger-index": 0}}>
              <span className="text-sm font-semibold text-accent">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold theme-text mb-4 animate-slideUp" style={{"--stagger-index": 1}}>
              Start Voting in 3 Simple Steps
            </h2>
            <p className="text-lg theme-muted max-w-2xl mx-auto animate-fadeIn" style={{"--stagger-index": 2}}>
              Get up and running with secure voting in minutes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 stagger-children">
            {[
              {
                step: "01",
                title: "Create Your Booth",
                description: "Set up your voting booth with candidates, configure privacy settings, and get a unique invite code.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Invite Participants",
                description: "Share your unique invite code with participants. Members join using the code and start voting immediately.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Vote & View Results",
                description: "Cast votes securely and view real-time results. Track participation and analyze voting trends.",
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

      
    </div>
  );
};

export default FeaturesPage;
