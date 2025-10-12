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
            contact: "support@votesecure.com"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            ),
            title: "Call Us",
            description: "Call us during business hours for immediate assistance.",
            contact: "+1 (555) 123-4567"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            title: "Visit Us",
            description: "Come visit our office for in-person consultations.",
            contact: "123 Tech Street, San Francisco, CA 94105"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Business Hours",
            description: "We're available to help you during these hours.",
            contact: "Mon-Fri: 9AM-6PM PST"
        }
    ];

    const team = [
        {
            name: "Sarah Johnson",
            role: "Customer Success Manager",
            email: "sarah@votesecure.com",
            image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
        },
        {
            name: "Michael Chen",
            role: "Technical Support Lead",
            email: "michael@votesecure.com",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
        },
        {
            name: "Emily Rodriguez",
            role: "Sales Director",
            email: "emily@votesecure.com",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 sm:px-0">
                        Get in Touch
                    </h1>
                    <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
                        We're here to help you succeed with VoteSecure. Reach out with any questions,
                        feedback, or partnership opportunities.
                    </p>
                </div>
            </div>

            {/* Contact Information */}
            <div className="pb-12 sm:pb-16">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        {contactInfo.map((info, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 sm:p-6 shadow-lg text-center transition-all duration-300 hover:shadow-xl transform hover:scale-105 mx-2 sm:mx-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 text-teal-600 transition-all duration-300 hover:scale-110">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6">
                                        {info.icon}
                                    </div>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 leading-relaxed">{info.description}</p>
                                <p className="text-sm sm:text-base text-teal-600 font-medium break-words">{info.contact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Form & Map */}
            <div className="pb-12 sm:pb-16">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-3xl mx-2 sm:mx-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Send us a message</h2>
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 resize-none text-sm sm:text-base"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-teal-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
                                >
                                    {loading ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>

                        {/* Map/Office Info */}
                        <div className="space-y-6 sm:space-y-8">
                            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mx-2 sm:mx-0">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Our Office</h2>
                                <div className="aspect-w-16 aspect-h-12 mb-4 sm:mb-6">
                                    <div className="bg-gray-200 rounded-lg flex items-center justify-center min-h-[150px] sm:min-h-[200px]">
                                        <div className="text-center text-gray-500">
                                            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-base sm:text-lg font-medium">Interactive Map</p>
                                            <p className="text-xs sm:text-sm">Map integration coming soon</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mt-1 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">Address</p>
                                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">123 Tech Street<br />San Francisco, CA 94105</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mt-1 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">Office Hours</p>
                                            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Monday - Friday: 9AM - 6PM PST<br />Saturday: 10AM - 4PM PST<br />Sunday: Closed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className="py-12 sm:py-16 bg-white">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-16 px-2 sm:px-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Meet Our Team</h2>
                        <p className="text-base sm:text-xl text-gray-600 leading-relaxed">
                            The people behind VoteSecure are here to help you succeed
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-0">
                        {team.map((member, index) => (
                            <div key={index} className="text-center px-2 sm:px-4">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-3 sm:mb-4 object-cover"
                                />
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">{member.name}</h3>
                                <p className="text-sm sm:text-base text-teal-600 font-medium mb-1 sm:mb-2">{member.role}</p>
                                <a
                                    href={`mailto:${member.email}`}
                                    className="text-xs sm:text-sm text-gray-600 hover:text-teal-600 transition-colors break-words"
                                >
                                    {member.email}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-12 sm:py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 sm:mb-16 px-2 sm:px-0">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                            Common Questions
                        </h2>
                        <p className="text-base sm:text-xl text-gray-600 leading-relaxed">
                            Quick answers to questions you might have
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        <div className="bg-white rounded-lg p-5 sm:p-6 shadow-sm mx-2 sm:mx-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                How quickly do you respond to support requests?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                We typically respond to all inquiries within 24 hours. For urgent technical issues, 
                                our premium customers receive priority support with faster response times.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-5 sm:p-6 shadow-sm mx-2 sm:mx-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                Do you offer phone support?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Yes! Phone support is available during business hours (9AM-6PM PST) for Pro and 
                                Enterprise customers. Free tier users can reach us via email or chat.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-5 sm:p-6 shadow-sm mx-2 sm:mx-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                Can I schedule a demo?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Absolutely! We'd love to show you how VoteSecure can help your organization. 
                                Contact our sales team to schedule a personalized demo.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg p-5 sm:p-6 shadow-sm mx-2 sm:mx-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                Do you offer training and onboarding?
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                Yes, we provide comprehensive onboarding for all new customers, plus ongoing 
                                training resources and documentation to help you get the most out of VoteSecure.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;