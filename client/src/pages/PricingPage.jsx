import { useState } from 'react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            name: "Free",
            description: "Perfect for getting started with basic polling",
            monthlyPrice: 0,
            yearlyPrice: 0,
            features: [
                "Up to 3 polls per month",
                "Up to 50 responses per poll",
                "Basic poll customization",
                "Email notifications",
                "7-day data retention",
                "Community support"
            ],
            buttonText: "Get Started",
            buttonClass: "bg-gray-100 text-gray-800 hover:bg-gray-200",
            popular: false
        },
        {
            name: "Pro",
            description: "Ideal for professionals and small teams",
            monthlyPrice: 19,
            yearlyPrice: 15,
            features: [
                "Unlimited polls",
                "Up to 1,000 responses per poll",
                "Advanced poll customization",
                "Real-time results",
                "Analytics and insights",
                "30-day data retention",
                "Priority email support",
                "Custom branding",
                "Export data (CSV/PDF)"
            ],
            buttonText: "Start Pro Trial",
            buttonClass: "bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300",
            popular: true
        },
        {
            name: "Enterprise",
            description: "For large organizations with advanced needs",
            monthlyPrice: 49,
            yearlyPrice: 39,
            features: [
                "Unlimited everything",
                "Advanced security features",
                "Custom integrations",
                "Dedicated account manager",
                "SLA guarantee",
                "Unlimited data retention",
                "Advanced analytics",
                "White-label solution",
                "API access",
                "Team collaboration tools",
                "Custom training"
            ],
            buttonText: "Contact Sales",
            buttonClass: "bg-gray-900 text-white hover:bg-gray-800",
            popular: false
        }
    ];

    const faqs = [
        {
            question: "Can I change my plan at any time?",
            answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
        },
        {
            question: "What happens to my data if I cancel?",
            answer: "Your data is retained for 30 days after cancellation, giving you time to export it if needed. After 30 days, all data is permanently deleted."
        },
        {
            question: "Do you offer refunds?",
            answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund."
        },
        {
            question: "Is there a free trial for paid plans?",
            answer: "Yes, we offer a 14-day free trial for both Pro and Enterprise plans. No credit card required to start your trial."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise customers."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                        Choose the perfect plan for your needs. Start free, upgrade when you grow.
                        No hidden fees, no surprises.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center mb-16">
                        <span className={`mr-3 ${!isYearly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors ${
                                isYearly ? 'bg-teal-600' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                    isYearly ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className={`ml-3 ${isYearly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            Yearly
                        </span>
                        {isYearly && (
                            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                Save 20%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                                    plan.popular ? 'ring-2 ring-teal-600 transform scale-105' : ''
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-gray-600 mb-6">{plan.description}</p>
                                    
                                    <div className="mb-6">
                                        <span className="text-5xl font-bold text-gray-900">
                                            ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                        </span>
                                        <span className="text-gray-600 ml-1">
                                            /month{isYearly && plan.yearlyPrice > 0 ? ' (billed yearly)' : ''}
                                        </span>
                                    </div>
                                    
                                    <button className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${plan.buttonClass}`}>
                                        {plan.buttonText}
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {plan.features.map((feature, featureIndex) => (
                                        <div key={featureIndex} className="flex items-center">
                                            <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enterprise Features */}
            <div className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Enterprise-Grade Security & Features
                        </h2>
                        <p className="text-xl text-gray-600">
                            Built for organizations that demand the highest standards
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Security</h3>
                            <p className="text-gray-600">End-to-end encryption, SSO integration, and compliance with industry standards.</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                            <p className="text-gray-600">Deep insights, custom reports, and data visualization tools for better decision making.</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25A9.75 9.75 0 1012 21.75 9.75 9.75 0 0012 2.25z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                            <p className="text-gray-600">Dedicated support team, phone support, and guaranteed response times.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600">
                            Everything you need to know about our pricing and plans
                        </p>
                    </div>
                    
                    <div className="space-y-8">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    {faq.question}
                                </h3>
                                <p className="text-gray-600">
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;