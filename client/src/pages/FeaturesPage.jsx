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
      color: "teal"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "User Management",
      description: "Invite participants with unique codes, track membership, and manage voting permissions with our intuitive admin dashboard.",
      color: "green"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Real-Time Results",
      description: "Watch voting results update live as votes are cast. Control result visibility with customizable privacy settings.",
      color: "purple"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: "Flexible Voting Rules",
      description: "Configure anonymous voting, vote changes, scheduled voting periods, and result visibility to match your needs.",
      color: "yellow"
    },
    {
      icon: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Mobile Optimized",
      description: "Vote from anywhere, anytime. Our responsive design works seamlessly on all devices and screen sizes.",
      color: "indigo"
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
      color: "red"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      teal: "bg-teal-100 text-teal-600",
      green: "bg-emerald-100 text-emerald-600",
      purple: "bg-purple-100 text-purple-600",
      yellow: "bg-cyan-100 text-cyan-600",
      indigo: "bg-indigo-100 text-indigo-600",
      red: "bg-rose-100 text-rose-600"
    };
    return colors[color] || colors.teal;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center px-2 sm:px-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Everything You Need for
              <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Secure Voting</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Create private voting booths, invite participants, and conduct secure polls with our 
              modern, user-friendly voting platform.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 mx-1 sm:mx-0 shadow-sm">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl ${getColorClasses(feature.color)} flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 flex-shrink-0`}>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 leading-tight">{feature.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">How VoteBooth Works</h2>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">Get started with secure voting in just three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Create Your Booth",
                description: "Set up your voting booth with candidates, configure privacy settings, and set voting rules. Get a unique invite code.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Invite Participants",
                description: "Share your unique invite code with participants. Members join using the code and can start voting immediately.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Vote & View Results",
                description: "Cast votes securely and view real-time results. Track participation and export detailed voting analytics.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              }
            ].map((step, index) => (
              <div key={index} className="text-center px-3 sm:px-4 lg:px-0">
                <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg transform hover:scale-110 transition-all duration-300">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                    {step.icon}
                  </div>
                </div>
                <div className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3 lg:mb-4 shadow-sm">
                  STEP {step.step}
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-3 leading-tight">{step.title}</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default FeaturesPage;
