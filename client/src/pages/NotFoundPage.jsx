import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-50 text-accent ring-8 ring-accent-50/60">
          <svg
            className="h-10 w-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6m0-6l-6 6" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
        </div>

        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-accent">
          Error 404
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight theme-text sm:text-5xl">
          This page is not on the ballot.
        </h1>
        <p className="mx-auto mb-8 max-w-md text-base leading-7 theme-muted sm:text-lg">
          The link may be outdated, or this page may have moved. Let&apos;s get
          you back to a place where you can keep things moving.
        </p>

        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-11 rounded-xl border border-border px-5 py-3 font-semibold theme-text transition-colors hover:border-accent hover:bg-accent-50 focus-ring"
          >
            Go back
          </button>
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="btn-theme min-h-11 rounded-xl px-5 py-3 font-semibold shadow-sm focus-ring"
          >
            {isAuthenticated ? "Go to dashboard" : "Go to home"}
          </Link>
        </div>

        <p className="mt-8 text-sm theme-muted">
          Need help? <Link to="/help" className="font-semibold text-accent hover:underline">Visit the Help Center</Link>
        </p>
      </div>
    </section>
  );
};

export default NotFoundPage;
