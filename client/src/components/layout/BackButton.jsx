import { useNavigate } from 'react-router-dom';

const BackButton = ({
  to,
  className = '',
  label = 'Back',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go Back"
      className={`
        inline-flex items-center gap-2 
        text-gray-700 hover:text-gray-900 
        transition-all duration-200 
        rounded-lg font-medium
        bg-gray-50 hover:bg-gray-100 
        active:scale-95 shadow-sm
        px-2.5 py-1.5 md:px-4 md:py-2 
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1
        ${className}
      `}
    >
      {/* Back Arrow Icon (always visible) */}
      <svg
        className="w-4 h-4 md:w-5 md:h-5"
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

  {/* Show label on small screens and up (keeps button compact on very small devices) */}
  <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default BackButton;
