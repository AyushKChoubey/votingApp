import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              About VoteBooth
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Democratizing decision-making through secure, transparent, and accessible online voting solutions
            </p>
          </div>
        </div>
      </div>

      {/* Mission / Story Section */}
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="px-2 sm:px-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">What We Do</h2>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                VoteBooth helps groups make decisions together — simply and fairly. Whether it's a school choosing
                a student council, a neighborhood deciding on a community project, or a club picking a meeting time,
                VoteBooth provides an easy way to collect choices and share the results.
              </p>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                Our focus is on making participation welcoming: clear instructions, straightforward options, and
                results everyone can understand. We remove the confusion so groups can focus on what matters — the
                decision itself.
              </p>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-teal-100 p-2 sm:p-3 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base text-gray-700 font-medium">Trusted by communities and organizations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Guides Us (values, non-technical) */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">The Story & Our Values</h2>
            <p className="text-base sm:text-lg text-gray-600">Why we started VoteBooth and what we care about</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-0">
            <div className="text-center px-2 sm:px-4">
              <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2v4h4v-4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">People First</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We design for people — clear language, simple choices, and a friendly experience so everyone can join in.
              </p>
            </div>
            
            <div className="text-center px-2 sm:px-4">
              <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2 5 5 .5-4 3 1.5 5L12 14l-4.5 2.5L9 10 5 7.5 10 7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Fairness</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We make options clear and results easy to read so groups can reach fair outcomes without confusion.
              </p>
            </div>
            
            <div className="text-center px-2 sm:px-4">
              <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Simplicity</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                No jargon, no complicated steps — just a straightforward way for groups to gather opinions and decide together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Meet Our Team</h2>
            <p className="text-base sm:text-lg text-gray-600">Passionate experts dedicated to democratic innovation</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-2 sm:px-0">
            {[
              { name: "Sarah Chen", role: "CEO & Founder", image: "https://images.unsplash.com/photo-1494790108755-2616b612b123?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
              { name: "Michael Rodriguez", role: "CTO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
              { name: "Emily Watson", role: "Head of Security", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
              { name: "David Kim", role: "Lead Developer", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" }
            ].map((member, index) => (
              <div key={index} className="text-center px-3 sm:px-4">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-3 sm:mb-4 object-cover shadow-lg"
                />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm sm:text-base text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
