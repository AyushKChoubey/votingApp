import { useNavigate } from "react-router-dom";

const BackButton = ({ fallback = "/dashboard" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border theme-surface theme-text shadow-sm transition-colors hover:border-accent hover:bg-accent-50 focus-ring"
      aria-label="Go back"
      title="Go back"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
};

export default BackButton;
