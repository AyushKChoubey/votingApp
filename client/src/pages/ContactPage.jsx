import { useState } from 'react';
import api from '../services/api';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

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
        setError('');
        setSuccess(false);
        
        try {
            await api.post('/api/contact', formData);
            setSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.026a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            title: "Email",
            description: "Response within 24 hours",
            contact: "votebooth1@gmail.com"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Support",
            description: "Comprehensive documentation",
            contact: "/help"
        }
    ];

    return (
        <div className="min-h-screen theme-bg">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12">
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold theme-text mb-2 sm:mb-4 animate-fadeIn">
                            <span className="text-gradient">Contact Us</span>
                        </h1>
                        <p className="theme-muted text-sm sm:text-base animate-fadeIn">
                            Have questions? We're here to help.
                        </p>
                    </div>
                </div>
            </div>

            {/* Contact Options */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {contactInfo.map((info, index) => (
                        <div key={index} className="glass-card p-6 text-center card-hover animate-fadeIn" style={{"--stagger-index": index}}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-accent" style={{ background: 'var(--color-accent)'}}>
                                <div className="text-white">
                                    {info.icon}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold theme-text mb-2">{info.title}</h3>
                            <p className="text-sm theme-muted mb-3">{info.description}</p>
                            <p className="text-sm font-semibold text-accent break-all">{info.contact}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Form */}
            <div className="theme-surface py-12 sm:py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="glass-card p-6 sm:p-8">
                            <div className="mb-6">
                                <h2 className="text-2xl sm:text-3xl font-bold theme-text mb-3">Send a Message</h2>
                                <p className="theme-muted">We'll respond within 24 hours</p>
                            </div>

                            {success && (
                                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-500">
                                    <p className="text-green-700 font-medium">Thank you! We'll get back to you soon.</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-500">
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold theme-text mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 theme-surface rounded-xl focus:ring-2 focus:ring-accent transition-all border-0"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold theme-text mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 theme-surface rounded-xl focus:ring-2 focus:ring-accent transition-all border-0"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold theme-text mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 theme-surface rounded-xl focus:ring-2 focus:ring-accent transition-all border-0"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold theme-text mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 theme-surface rounded-xl focus:ring-2 focus:ring-accent transition-all resize-none border-0"
                                        placeholder="Tell us more..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-theme ripple w-full py-4 px-6 rounded-xl font-semibold disabled:opacity-50 text-base"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : 'Send Message'}
                                </button>
                            </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;