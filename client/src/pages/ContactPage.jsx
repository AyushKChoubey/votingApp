import { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate form submission
        setTimeout(() => {
            setLoading(false);
            alert('Thank you for your message! We\'ll get back to you soon.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1000);
    };

    const contactInfo = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.026a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            title: "Email Us",
            description: "Send us an email and we'll respond within 24 hours.",
            contact: "support@votebooth.com"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            title: "GitHub",
            description: "Report issues or contribute to our open source project.",
            contact: "github.com/votebooth"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Response Time",
            description: "Our typical response times for support requests.",
            contact: "< 24 hours"
        }
    ];

    const team = [
        {
            name: "Alex Chen",
            role: "Lead Developer",
            email: "alex@votebooth.com",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
        },
        {
            name: "Sarah Kim",
            role: "Product Manager",
            email: "sarah@votebooth.com",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
        },
        {
            name: "Jordan Smith",
            role: "Support Lead",
            email: "jordan@votebooth.com",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
                    <div className="text-center px-2 sm:px-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                            Get in 
                            <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Touch</span>
                        </h1>
                        <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                            We're here to help you create secure voting experiences. Reach out with any questions,
                            feedback, or support needs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href="mailto:support@votebooth.com" 
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Email Support
                            </a>
                            <a 
                                href="#contact-form" 
                                className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-sm sm:text-base transition-all duration-300 transform hover:scale-105"
                            >
                                Send Message
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 sm:p-8 shadow-lg text-center transition-all duration-300 hover:shadow-xl hover:shadow-teal-100 transform hover:scale-105 mx-2 sm:mx-0 border border-gray-100">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 text-teal-600 transition-all duration-300 hover:scale-110 shadow-md">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7">
                                        {info.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{info.title}</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">{info.description}</p>
                                <p className="text-sm sm:text-base text-teal-600 font-semibold break-words bg-teal-50 px-3 py-2 rounded-lg">{info.contact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Form & Info */}
            <div className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                        {/* Contact Form */}
                        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-3xl mx-2 sm:mx-0 border border-gray-100" id="contact-form">
                            <div className="mb-6 sm:mb-8">
                                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">Send us a message</h2>
                                <p className="text-gray-600">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-base placeholder-gray-400"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-base placeholder-gray-400"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-base placeholder-gray-400"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 resize-none text-base placeholder-gray-400"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 shadow-lg hover:shadow-xl text-base"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : 'Send Message'}
                                </button>
                            </form>
                        </div>

                        {/* Support Information */}
                        <div className="space-y-6 sm:space-y-8">
                            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 mx-2 sm:mx-0 border border-gray-100">
                                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">Need Help?</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
                                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-lg mb-2">Documentation</p>
                                            <p className="text-gray-600 leading-relaxed">Check our comprehensive guides and tutorials to get started quickly with VoteBooth.</p>
                                            <a href="/help" className="text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block">View Docs →</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
                                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-lg mb-2">FAQ</p>
                                            <p className="text-gray-600 leading-relaxed">Find quick answers to the most commonly asked questions about our platform.</p>
                                            <a href="#faq" className="text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block">View FAQ →</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
                                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-lg mb-2">Priority Support</p>
                                            <p className="text-gray-600 leading-relaxed">Got an urgent issue? Our priority support ensures faster response times for critical problems.</p>
                                            <a href="mailto:urgent@votebooth.com" className="text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block">Get Priority Help →</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Response Time Card
                            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-3xl shadow-xl p-6 sm:p-8 mx-2 sm:mx-0 text-white">
                                <h3 className="text-xl font-bold mb-4">Our Response Commitment</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-teal-100">General Support</span>
                                        <span className="font-semibold">&lt; 24 hours</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-teal-100">Bug Reports</span>
                                        <span className="font-semibold">&lt; 12 hours</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-teal-100">Urgent Issues</span>
                                        <span className="font-semibold">&lt; 4 hours</span>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className="py-12 sm:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-16 px-2 sm:px-0">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">Meet Our Team</h2>
                        <p className="text-base sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                            The passionate team behind VoteBooth is here to help you create secure, transparent voting experiences.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-0">
                        {team.map((member, index) => (
                            <div key={index} className="text-center group">
                                <div className="relative mb-4 sm:mb-6">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto object-cover shadow-lg ring-4 ring-white transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-cyan-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                                <p className="text-sm sm:text-base text-teal-600 font-semibold mb-3">{member.role}</p>
                                <a
                                    href={`mailto:${member.email}`}
                                    className="inline-flex items-center text-xs sm:text-sm text-gray-600 hover:text-teal-600 transition-colors px-4 py-2 rounded-lg hover:bg-teal-50"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.026a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {member.email}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-gray-100" id="faq">
                <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-16 px-2 sm:px-0">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-base sm:text-xl text-gray-600 leading-relaxed">
                            Quick answers to common questions about VoteBooth
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 mx-2 sm:mx-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                                How do I create a voting booth?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Simply register for an account, click "Create Booth" on your dashboard, configure your voting options and settings, then share the invite code with participants.
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 mx-2 sm:mx-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                                Is my voting data secure?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Yes! We use industry-standard encryption and security measures to protect all voting data. Your votes are anonymous and securely stored.
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 mx-2 sm:mx-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                                Can I see real-time results?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Absolutely! Booth administrators can view live results as votes come in, and you can choose whether to display results to voters in real-time or after voting ends.
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 mx-2 sm:mx-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                                How do participants join my booth?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Share the unique invite code generated for your booth. Participants enter this code on the "Join Booth" page to access your voting session.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;