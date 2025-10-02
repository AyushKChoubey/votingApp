import { useState } from 'react';
import { Link } from 'react-router-dom';

const HelpPage = () => {
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
        { id: 'voting', name: 'Voting & Polls', icon: '🗳️' },
        { id: 'administration', name: 'Administration', icon: '⚙️' },
        { id: 'security', name: 'Security & Privacy', icon: '🔒' },
        { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
        { id: 'api', name: 'API & Integration', icon: '🔌' }
    ];

    const helpContent = {
        'getting-started': [
            {
                question: "How do I create my first voting booth?",
                answer: "To create your first voting booth, log in to your account and click 'Create New Booth' from your dashboard. Fill in the booth details including title, description, voting options, and set your preferences for anonymous voting, result visibility, and voting deadline."
            },
            {
                question: "What's the difference between public and private booths?",
                answer: "Public booths can be discovered and joined by anyone, while private booths require an invitation code. Private booths are perfect for internal company polls or closed group decisions."
            },
            {
                question: "How do I invite people to vote?",
                answer: "You can invite people by sharing the booth link, sending the unique booth code, or using our built-in email invitation system. For private booths, participants will need the invitation code to join."
            },
            {
                question: "Can I customize the look of my voting booth?",
                answer: "Yes! VoteSecure offers various customization options including booth themes, colors, and branding options for Pro and Enterprise users."
            }
        ],
        'voting': [
            {
                question: "How do I cast my vote?",
                answer: "Once you join a booth, you'll see all available voting options. Simply select your preferred choice(s) and click 'Submit Vote'. Your vote is immediately recorded and encrypted."
            },
            {
                question: "Can I change my vote after submitting?",
                answer: "This depends on the booth settings. If the booth creator has enabled vote changing, you can modify your vote until the voting deadline. Otherwise, votes are final once submitted."
            },
            {
                question: "How do I know if my vote was counted?",
                answer: "After submitting your vote, you'll receive a confirmation message and a unique vote confirmation code. You can use this code to verify your vote was recorded in the system."
            },
            {
                question: "What types of voting methods are supported?",
                answer: "VoteSecure supports single choice, multiple choice, ranked choice voting, and approval voting. The booth creator selects the voting method when creating the booth."
            }
        ],
        'administration': [
            {
                question: "How do I manage voting booth settings?",
                answer: "As a booth administrator, you can access booth settings from your dashboard. You can modify voting deadlines, participant permissions, result visibility, and other configuration options."
            },
            {
                question: "Can I export voting results?",
                answer: "Yes! You can export results in various formats including CSV, PDF, and JSON. Real-time analytics and detailed reports are available for Pro and Enterprise users."
            },
            {
                question: "How do I handle booth moderation?",
                answer: "Booth administrators can moderate comments, remove inappropriate content, and manage participant access. Advanced moderation tools are available for Enterprise customers."
            },
            {
                question: "What user roles are available?",
                answer: "VoteSecure supports different user roles: Owner (full control), Administrator (manage settings), Moderator (content moderation), and Participant (voting only). Role permissions can be customized."
            }
        ],
        'security': [
            {
                question: "How secure is my voting data?",
                answer: "All voting data is encrypted end-to-end using industry-standard AES-256 encryption. We follow SOC 2 Type II compliance and undergo regular security audits to ensure your data remains protected."
            },
            {
                question: "Is anonymous voting really anonymous?",
                answer: "Yes! When anonymous voting is enabled, we use zero-knowledge cryptographic protocols to ensure votes cannot be traced back to individual users, even by VoteSecure administrators."
            },
            {
                question: "How do you prevent vote manipulation?",
                answer: "We employ multiple security measures including IP tracking, device fingerprinting, blockchain verification for critical votes, and AI-powered fraud detection to prevent duplicate voting and manipulation."
            },
            {
                question: "What data do you store about me?",
                answer: "We only store essential information: email, encrypted voting preferences, and anonymized participation data. We never sell user data and follow strict GDPR and CCPA compliance standards."
            }
        ],
        'troubleshooting': [
            {
                question: "I can't access my booth. What should I do?",
                answer: "First, check if the booth is still active and hasn't expired. Verify you're using the correct booth code or link. If issues persist, contact our support team with your booth details."
            },
            {
                question: "My vote isn't showing in the results.",
                answer: "Votes may take a few moments to appear in live results. If using anonymous voting, individual votes aren't displayed. Check if the booth has real-time results enabled or if results are only shown after voting ends."
            },
            {
                question: "I'm getting an error when creating a booth.",
                answer: "Common causes include network connectivity issues, invalid characters in booth names, or reaching your account's booth limit. Try refreshing the page and ensure all required fields are properly filled."
            },
            {
                question: "The voting deadline isn't working correctly.",
                answer: "Ensure your timezone settings are correct in your account preferences. Deadlines are based on the booth creator's timezone. Contact support if deadlines appear to be calculated incorrectly."
            }
        ],
        'api': [
            {
                question: "How do I access the VoteSecure API?",
                answer: "API access is available for Pro and Enterprise customers. You can generate API keys from your account settings and access our comprehensive API documentation and SDKs for popular programming languages."
            },
            {
                question: "What can I do with the API?",
                answer: "Our RESTful API allows you to create booths, manage votes, retrieve results, and integrate VoteSecure functionality into your existing applications. Real-time webhooks are also available."
            },
            {
                question: "Are there rate limits on API calls?",
                answer: "Yes, rate limits vary by subscription tier: Free (100 requests/hour), Pro (1,000 requests/hour), Enterprise (custom limits). Rate limit headers are included in all API responses."
            },
            {
                question: "How do I authenticate API requests?",
                answer: "Use API keys for authentication by including the 'Authorization: Bearer YOUR_API_KEY' header in all requests. For enhanced security, we also support OAuth 2.0 for Enterprise customers."
            }
        ]
    };

    const quickLinks = [
        {
            title: "Video Tutorials",
            description: "Step-by-step video guides for common tasks",
            icon: "🎥",
            href: "#"
        },
        {
            title: "Live Chat Support",
            description: "Chat with our support team in real-time",
            icon: "💬",
            href: "#"
        },
        {
            title: "Community Forum",
            description: "Connect with other VoteSecure users",
            icon: "👥",
            href: "#"
        },
        {
            title: "Feature Requests",
            description: "Suggest new features and improvements",
            icon: "💡",
            href: "#"
        },
        {
            title: "System Status",
            description: "Check our current system status and uptime",
            icon: "📊",
            href: "#"
        },
        {
            title: "Contact Support",
            description: "Get help from our support team",
            icon: "📞",
            href: "/contact"
        }
    ];

    const filteredContent = helpContent[activeCategory].filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Help Center
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Find answers to common questions and learn how to make the most of VoteSecure
                    </p>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search for help topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickLinks.map((link, index) => (
                            <Link
                                key={index}
                                to={link.href}
                                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-teal-300"
                            >
                                <div className="flex items-start">
                                    <span className="text-2xl mr-4">{link.icon}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                                        <p className="text-gray-600">{link.description}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Categories Sidebar */}
                        <div className="lg:w-1/4">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                                <nav className="space-y-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
                                                activeCategory === category.id
                                                    ? 'bg-teal-100 text-teal-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span className="mr-3">{category.icon}</span>
                                            {category.name}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        {/* FAQ Content */}
                        <div className="lg:w-3/4">
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {categories.find(cat => cat.id === activeCategory)?.name}
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        {filteredContent.length} article{filteredContent.length !== 1 ? 's' : ''} in this category
                                    </p>
                                </div>
                                
                                <div className="divide-y divide-gray-200">
                                    {filteredContent.length > 0 ? (
                                        filteredContent.map((item, index) => (
                                            <div key={index} className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                    {item.question}
                                                </h3>
                                                <p className="text-gray-700 leading-relaxed">
                                                    {item.answer}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center">
                                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-gray-500">No articles found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Still Need Help Section */}
            <div className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Still need help?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Can't find what you're looking for? Our support team is here to help.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 rounded-lg p-8">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.026a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Support</h3>
                            <p className="text-gray-600 mb-4">Get detailed help via email. We typically respond within 24 hours.</p>
                            <Link 
                                to="/contact"
                                className="inline-flex items-center text-teal-600 font-medium hover:text-teal-700 transition-colors"
                            >
                                Send us an email
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Chat</h3>
                            <p className="text-gray-600 mb-4">Chat with our support team in real-time during business hours.</p>
                            <button className="inline-flex items-center text-green-600 font-medium hover:text-green-700 transition-colors">
                                Start live chat
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;