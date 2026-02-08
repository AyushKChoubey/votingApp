import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HelpPage = () => {
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');
    const [openAccordion, setOpenAccordion] = useState(null);

    const categories = [
        { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
        { id: 'voting', name: 'Voting & Polls', icon: '🗳️' },
        { id: 'administration', name: 'Managing Booths', icon: '⚙️' },
        { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' }
    ];

    const helpContent = {
        'getting-started': [
            {
                question: "How do I create my first voting booth?",
                answer: "Log in to your account and click 'Create Booth' from your dashboard. Fill in the booth name, description, and add at least 2 candidates. Set the maximum number of members and choose your voting settings. Once created, you'll receive an invite code to share with participants."
            },
            {
                question: "How do I invite people to vote?",
                answer: "After creating a booth, you can share the unique invite code or direct link with participants. You can copy the invite code, share the link, or show a QR code from your booth's admin panel. Participants will need this code to join your voting booth."
            },
            {
                question: "What booth settings can I configure?",
                answer: "You can set the maximum number of members, choose whether results are visible to voters, enable live results, require approval for join requests, and set voting start and end times. All settings can be adjusted from the booth admin panel."
            },
            {
                question: "How do booths work?",
                answer: "Each booth is a private voting space with a unique invite code. Only people with the code can join. Once members join, they can cast their vote for one of the candidates. Booth creators can view results and manage settings through the admin panel."
            }
        ],
        'voting': [
            {
                question: "How do I cast my vote?",
                answer: "Join a booth using the invite code, then navigate to the booth page. You'll see all available candidates. Select your choice and click 'Vote'. Your vote is recorded immediately. You'll see a confirmation once your vote is submitted."
            },
            {
                question: "Can I change my vote after submitting?",
                answer: "Currently, votes are final once submitted. Make sure you've selected the correct candidate before confirming your vote. This ensures voting integrity and prevents vote manipulation."
            },
            {
                question: "How do I know if my vote was counted?",
                answer: "After submitting your vote, you'll see a confirmation message on the booth page. If live results are enabled, you'll see the vote count update. You can also check your voted status on the dashboard."
            },
            {
                question: "Can I see voting results?",
                answer: "Result visibility depends on the booth settings configured by the booth creator. If results are visible to voters, you can view them from the booth page. Otherwise, only the booth creator can see results through the admin panel."
            }
        ],
        'administration': [
            {
                question: "How do I manage my voting booth?",
                answer: "Access your booth admin panel by clicking 'Manage' on your booth card in the dashboard. From there, you can view detailed statistics, manage member requests, toggle booth status, reset invite codes, and export results."
            },
            {
                question: "Can I close or reopen a booth?",
                answer: "Yes! From the booth admin panel, you can toggle the booth status between active and closed. Closed booths don't accept new votes, but you can still view results and member information."
            },
            {
                question: "How do I export voting results?",
                answer: "In the booth admin panel, use the export feature to download results in CSV or JSON format. The export includes candidate names, vote counts, and timestamps."
            },
            {
                question: "Can I remove members from a booth?",
                answer: "Yes, booth administrators can remove members from the admin panel. Navigate to the members section and use the remove option next to each member. This prevents them from accessing the booth."
            }
        ],
        'troubleshooting': [
            {
                question: "I can't toggle booth status (reopen/close)",
                answer: "If the toggle to reopen a booth fails, common reasons include:\n\n- You are not the booth creator (only the creator can change status).\n- The booth was auto-closed because the scheduled voting end time has already passed. In this case you'll see a warning and the admin panel will prompt you to update or disable the schedule.\n- Network or server errors prevented the action — try again after a refresh.\n\nWhat to do: Open the booth admin panel, check the 'Voting Schedule' settings and either set a new end time or turn scheduling off, then try toggling the status again. If you still can't toggle the status, contact support and include the booth invite code so we can investigate."
            },
            {
                question: "I can't access my booth. What should I do?",
                answer: "Make sure you're logged in with the correct account. Verify you're using the correct invite code. Check if the booth is still active (not closed or deleted). If you were removed from the booth, you'll need to request access again from the booth creator."
            },
            {
                question: "The invite code isn't working.",
                answer: "Double-check the invite code for typos - codes are case-sensitive. Ensure the booth is still active. If the booth creator reset the invite code, request the new code. If issues persist, ask the booth creator to verify the code."
            },
            {
                question: "I'm getting an error when creating a booth.",
                answer: "Ensure all required fields are filled: booth name (3-50 characters), description (10-200 characters), and at least 2 candidates. Check your internet connection. If you've reached your booth limit, you'll need to delete an existing booth before creating a new one."
            },
            {
                question: "My vote didn't submit.",
                answer: "Check your internet connection and try again. Ensure the booth is still active. Make sure you haven't already voted (votes can only be cast once). If the error persists, refresh the page and try again."
            }
        ]
    };

    const quickLinks = [
        {
            title: "Contact Support",
            description: "Get help from our support team",
            icon: "📧",
            href: "/contact"
        },
        {
            title: "Feature Requests",
            description: "Suggest new features for VoteBooth",
            icon: "💡",
            href: "/contact"
        },
        {
            title: "Report an Issue",
            description: "Report bugs or technical problems",
            icon: "🐛",
            href: "/contact"
        }
    ];

    const filteredContent = helpContent[activeCategory].filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index);
    };

    // Reset accordion when category or search changes
    useEffect(() => {
        setOpenAccordion(null);
    }, [activeCategory, searchQuery]);

    return (
        <div className="min-h-screen theme-bg">
            {/* Hero Section */}
            <div className="py-8 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold theme-text mb-2 sm:mb-4 animate-fadeIn">
                        <span className="text-gradient">Help Center</span>
                    </h1>
                    <p className="theme-muted text-sm sm:text-base mb-6 sm:mb-8 animate-fadeIn">
                        Find answers to common questions about VoteBooth
                    </p>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search for help topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 sm:py-3 border border-border rounded-lg theme-surface theme-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-base sm:text-lg"
                        />
                    </div>
                </div>
            </div>

            

            {/* FAQ Section */}
            <div className="py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        {/* Categories Sidebar */}
                        <div className="lg:w-1/4">
                            <div className="theme-surface rounded-lg shadow-sm p-3 sm:p-4 sticky top-4 border border-border">
                                <h3 className="text-lg font-semibold theme-text mb-4">Categories</h3>
                                <nav className="space-y-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center text-sm sm:text-base ${
                                                activeCategory === category.id
                                                    ? 'btn-theme font-medium shadow-sm'
                                                    : 'theme-text hover:bg-accent/10 border border-transparent hover:border-accent/30'
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
                            <div className="theme-surface rounded-lg shadow-sm p-3 sm:p-4 border border-border">
                                <div className="mb-2 pb-2">
                                    <h2 className="text-xl sm:text-2xl font-bold theme-text">
                                        {categories.find(cat => cat.id === activeCategory)?.name}
                                    </h2>
                                    <p className="theme-muted mt-1 text-sm">
                                        {filteredContent.length} article{filteredContent.length !== 1 ? 's' : ''} in this category
                                    </p>
                                </div>

                                <div className="divide-y divide-border">
                                    {filteredContent.length > 0 ? (
                                        filteredContent.map((item, index) => (
                                            <div key={index} className="border-b border-border last:border-b-0">
                                                <button
                                                    onClick={() => toggleAccordion(index)}
                                                    className="w-full text-left p-3 sm:p-4 hover:bg-accent/5 transition-colors flex items-center justify-between gap-4"
                                                >
                                                    <h3 className="text-base sm:text-lg font-semibold theme-text flex-1">
                                                        {item.question}
                                                    </h3>
                                                    <svg
                                                        className={`w-5 h-5 theme-muted transition-transform flex-shrink-0 ${
                                                            openAccordion === index ? 'rotate-180' : ''
                                                        }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <div
                                                    className={`overflow-hidden transition-all duration-300 ${
                                                        openAccordion === index ? 'max-h-72' : 'max-h-0'
                                                    }`}
                                                >
                                                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                                                        <p className="theme-muted leading-relaxed text-sm sm:text-base">
                                                            {item.answer}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center">
                                            <svg className="w-12 h-12 theme-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="theme-muted">No articles found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Still Need Help Section */}
            <div className="py-6 sm:py-8 ">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="theme-surface rounded-xl p-4 sm:p-6 shadow-sm border border-border text-center">
                        <div className="w-10 h-10 btn-theme rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.026a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold theme-text mb-1">Still need help?</h2>
                        <p className="theme-muted mb-4 text-sm sm:text-base">
                            Can't find what you're looking for? Contact our support team.
                        </p>
                        <Link 
                            to="/contact"
                            className="btn-theme inline-flex items-center px-5 py-2 rounded-lg font-medium transition-all hover:shadow-lg text-sm sm:text-base"
                        >
                            <span>Send Message</span>
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;