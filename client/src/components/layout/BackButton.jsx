import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = ({ to, className = '', children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        if (to) {
            // Navigate to specific route
            navigate(to);
        } else {
            // Go back in history, or to dashboard if no history
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 ${className}`}
        >
            <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                />
            </svg>
            {children || 'Back'}
        </button>
    );
};

export default BackButton;