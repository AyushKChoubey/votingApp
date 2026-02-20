import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";

export function CreateBooth() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxMembers: 50,
    settings: {
      resultsVisibleToVoters: true,
      showLiveResults: false,
      requireApproval: false,
      votingStartTime: "",
      votingEndTime: "",
      restrictByEmailDomain: false,
      allowedEmailDomains: [],
    },
  });
  const [candidates, setCandidates] = useState([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);
  const [canCreate, setCanCreate] = useState(false);
  const [maxBooths, setMaxBooths] = useState(5);
  const [currentBooths, setCurrentBooths] = useState(0);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [allowedMax, setAllowedMax] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    checkCreatePermissions();
  }, []);

  const checkCreatePermissions = async () => {
    try {
      // Check if user has a token first
      const token = localStorage.getItem("token");
      if (!token) {
        setCanCreate(false);
        setError("Please log in to create booths");
        setCheckingPermissions(false);
        return;
      }

      const response = await api.get("/api/user/profile");

      if (response.success && response.user) {
        const user = response.user;
        const userMaxBooths = 10;
        const userCurrentBooths = user.createdBooths?.length || 0;

        setCanCreate(userCurrentBooths < userMaxBooths);
        setMaxBooths(userMaxBooths);
        setCurrentBooths(userCurrentBooths);
        setIsFreeUser(false);
        setAllowedMax(10000);
      } else if (response.user) {
        // Handle case where response doesn't have success field but has user
        const user = response.user || response;
        const userMaxBooths = 10;
        const userCurrentBooths = user.createdBooths?.length || 0;

        setCanCreate(userCurrentBooths < userMaxBooths);
        setMaxBooths(userMaxBooths);
        setCurrentBooths(userCurrentBooths);
        setIsFreeUser(false);
        setAllowedMax(10000);
      } else {
        setCanCreate(false);
        setError("Unable to verify permissions");
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 401) {
        setError("Please log in to create booths");
        // Optionally redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError("Failed to check permissions. Please try again.");
      }
      setCanCreate(false);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("settings.")) {
      const settingName = name.split(".")[1];
      // special-case allowedEmailDomains: accept comma-separated string and store as array
      if (settingName === "allowedEmailDomains") {
        const arr = String(value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        setFormData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            [settingName]: arr,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            [settingName]:
              type === "checkbox"
                ? checked
                : type === "number"
                  ? parseInt(value) || 0
                  : value,
          },
        }));
      }
    } else if (name === "maxMembers") {
      // Handle maxMembers specially: allow blank, enforce min 2 when typing
      let numValue = value;
      if (value === "" || value === null || value === undefined) {
        numValue = "";
      } else {
        numValue = parseInt(value) || "";
      }
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
              ? parseInt(value) || 0
              : value,
      }));
    }
  };

  const handleCandidateChange = (index, field, value) => {
    const updatedCandidates = [...candidates];
    updatedCandidates[index] = {
      ...updatedCandidates[index],
      [field]: value.trim(),
    };
    setCandidates(updatedCandidates);
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: "", description: "" }]);
  };

  const removeCandidate = (index) => {
    if (candidates.length > 2) {
      const updatedCandidates = candidates.filter((_, i) => i !== index);
      setCandidates(updatedCandidates);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Check authentication before submitting
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to create booths");
      setLoading(false);
      return;
    }

    // Client-side validation
    const errors = [];

    // Validate booth name
    if (
      !formData.name.trim() ||
      formData.name.trim().length < 3 ||
      formData.name.trim().length > 50
    ) {
      errors.push("Booth name must be 3-50 characters");
    }

    // Validate description
    if (
      !formData.description.trim() ||
      formData.description.trim().length < 10 ||
      formData.description.trim().length > 200
    ) {
      errors.push("Description must be 10-200 characters");
    }

    // Validate max members
    if (
      !formData.maxMembers ||
      formData.maxMembers === "" ||
      formData.maxMembers < 2 ||
      formData.maxMembers > 10000
    ) {
      errors.push("Maximum members must be between 2 and 10,000");
    }

    // Free plan: warn if they exceed 100 members (no acknowledgement required)
    if (isFreeUser && formData.maxMembers > 100) {
      // Just a UX warning — server must still enforce the limit if desired
    }

    // Validate candidates
    const validCandidates = candidates.filter((c) => c.name.trim());
    if (validCandidates.length < 2) {
      errors.push("At least 2 candidates are required");
    }

    // Check for duplicate candidate names
    const candidateNames = validCandidates.map((c) =>
      c.name.trim().toLowerCase(),
    );
    if (new Set(candidateNames).size !== candidateNames.length) {
      errors.push("Candidate names must be unique");
    }

    // Validate time settings if provided
    if (formData.settings.votingStartTime && formData.settings.votingEndTime) {
      const startTime = new Date(formData.settings.votingStartTime);
      const endTime = new Date(formData.settings.votingEndTime);
      if (startTime >= endTime) {
        errors.push("Voting end time must be after start time");
      }
    }

    if (errors.length > 0) {
      setError(errors.join(". "));
      setLoading(false);
      return;
    }

    try {
      // Prepare submission data
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        maxMembers: parseInt(formData.maxMembers) || 50,
        candidates: validCandidates.map((c) => ({
          name: c.name.trim(),
          description: c.description.trim(),
        })),
        settings: {
          ...formData.settings,
          // Convert date strings to Date objects if they exist
          votingStartTime: formData.settings.votingStartTime
            ? new Date(formData.settings.votingStartTime)
            : null,
          votingEndTime: formData.settings.votingEndTime
            ? new Date(formData.settings.votingEndTime)
            : null,
        },
      };

      const response = await api.post("/api/booth/create", submitData);

      if (response.success) {
        const successMessage = `Booth created successfully! Invite code: ${response.booth.inviteCode}`;
        setSuccess(successMessage);

        // Also update the booth count immediately
        setCurrentBooths((prev) => prev + 1);
        setCanCreate(currentBooths < maxBooths - 1);

        // Navigate immediately to the newly created booth
        if (response.booth.boothId || response.booth.id) {
          const boothIdentifier = response.booth.boothId || response.booth.id;
          navigate(`/booth/${boothIdentifier}`, { replace: true });
        } else {
          // Force dashboard refresh by adding state
          navigate("/dashboard", { state: { refresh: true }, replace: true });
        }
      } else {
        setError(response.error || "Failed to create booth. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      // Handle create error
      // If server enforces a plan cap it may return 403 with allowedMax
      if (err.response && err.response.status === 403) {
        const data = err.response.data || {};
        if (data.allowedMax) {
          setAllowedMax(data.allowedMax);
        }
        setError(
          data.error ||
            "Your plan does not allow the requested maximum members",
        );
      } else {
        setError(err.message || "Failed to create booth. Please try again.");
      }
      setLoading(false);
    }
  };

  // Use a single central loading view for permission checks and submission
  if (checkingPermissions || loading) {
    return (
      <PageLoading
        message={
          checkingPermissions ? "Checking permissions..." : "Creating booth..."
        }
      />
    );
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="glass-card p-8 transition-all duration-300 hover:shadow-xl animate-fadeIn">
            <svg
              className="w-16 h-16 text-error mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 className="text-2xl font-bold theme-text mb-4">
              Booth Limit Reached
            </h2>
            <div className="theme-surface rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">
                  {currentBooths}/{maxBooths}
                </div>
                <div className="text-sm theme-muted">Booths Created</div>
              </div>
            </div>
            <p className="theme-muted mb-6">
              You've reached your limit of {maxBooths} booths.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-theme py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary), var(--color-accent))",
          }}
        />
      </div>
      <div
        className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 pointer-events-none float"
        style={{ "--stagger-index": 1 }}
      >
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent), var(--color-secondary))",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12 animate-fadeIn">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold theme-text mb-3 sm:mb-4">
            Create New <span className="text-gradient">Booth</span>
          </h1>
          <p
            className="theme-muted text-sm sm:text-lg mb-6 sm:mb-8 px-2 animate-fadeIn"
            style={{ "--stagger-index": 1 }}
          >
            Set up a new voting booth for your community
          </p>

          {/* Booth Statistics */}
          <div
            className="grid grid-cols-3 gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto animate-fadeIn"
            style={{ "--stagger-index": 2 }}
          >
            <div className="glass-card p-3 sm:p-4 card-hover transition-all duration-300">
              <div className="text-lg sm:text-2xl font-bold text-accent">
                {currentBooths}/{maxBooths}
              </div>
              <div className="text-xs sm:text-sm theme-muted">Created</div>
            </div>
            <div className="glass-card p-3 sm:p-4 card-hover transition-all duration-300">
              <div className="text-lg sm:text-2xl font-bold text-success">
                {maxBooths - currentBooths}
              </div>
              <div className="text-xs sm:text-sm theme-muted">Remaining</div>
            </div>
            <div className="glass-card p-3 sm:p-4 card-hover transition-all duration-300">
              <div className="text-lg sm:text-2xl font-bold text-secondary">
                {Math.round((currentBooths / maxBooths) * 100)}%
              </div>
              <div className="text-xs sm:text-sm theme-muted">Usage</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="max-w-xs sm:max-w-md mx-auto mt-3 sm:mt-4 animate-fadeIn"
            style={{ "--stagger-index": 3 }}
          >
            <div
              className="rounded-full h-2 sm:h-3 overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((currentBooths / maxBooths) * 100, currentBooths > 0 ? 4 : 0)}%`,
                  background:
                    "linear-gradient(90deg, var(--color-accent), var(--color-success))",
                }}
              ></div>
            </div>
          </div>
        </div>

        <div
          className="glass-card p-6 sm:p-8 transition-all duration-300 hover:shadow-xl animate-fadeIn"
          style={{ "--stagger-index": 4 }}
        >
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Basic Information */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold theme-text border-b border-border pb-2">
                Basic Information
              </h2>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium theme-text mb-2"
                >
                  Booth Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl theme-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                    formData.name.trim().length > 0 &&
                    (formData.name.trim().length < 3 ||
                      formData.name.trim().length > 50)
                      ? "border-error focus:ring-error bg-error/5"
                      : "border-border focus:ring-accent"
                  }`}
                  placeholder="Enter booth name (e.g., 'Student Council Election 2024')"
                />
                {formData.name.trim().length > 0 &&
                  formData.name.trim().length < 3 && (
                    <p className="text-error text-sm mt-1">
                      Booth name must be at least 3 characters long
                    </p>
                  )}
                {formData.name.trim().length > 50 && (
                  <p className="text-error text-sm mt-1">
                    Booth name must be less than 50 characters
                  </p>
                )}
                <p className="theme-muted text-sm mt-1">
                  {formData.name.length}/50 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium theme-text mb-2"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl theme-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 resize-none text-sm sm:text-base ${
                    formData.description.trim().length > 0 &&
                    (formData.description.trim().length < 10 ||
                      formData.description.trim().length > 200)
                      ? "border-error focus:ring-error bg-error/5"
                      : "border-border focus:ring-accent"
                  }`}
                  placeholder="Describe the purpose and details of this voting booth..."
                />
                {formData.description.trim().length > 0 &&
                  formData.description.trim().length < 10 && (
                    <p className="text-error text-sm mt-1">
                      Description must be at least 10 characters long
                    </p>
                  )}
                {formData.description.trim().length > 200 && (
                  <p className="text-error text-sm mt-1">
                    Description must be less than 200 characters
                  </p>
                )}
                <p className="theme-muted text-sm mt-1">
                  {formData.description.length}/200 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="maxMembers"
                  className="block text-sm font-medium theme-text mb-2"
                >
                  Maximum Members *
                </label>
                <input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  max="10000"
                  required
                  value={formData.maxMembers}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl theme-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                    !formData.maxMembers ||
                    formData.maxMembers === "" ||
                    formData.maxMembers < 2 ||
                    formData.maxMembers > 10000 ||
                    (allowedMax !== null && formData.maxMembers > allowedMax)
                      ? "border-error focus:ring-error bg-error/5"
                      : "border-border focus:ring-accent"
                  }`}
                  placeholder="Enter minimum 2"
                />
                {(!formData.maxMembers || formData.maxMembers === "") && (
                  <p className="text-error text-sm mt-1">
                    Maximum members is required
                  </p>
                )}
                {formData.maxMembers && formData.maxMembers < 2 && (
                  <p className="text-error text-sm mt-1">
                    Must be at least 2 members
                  </p>
                )}
                {formData.maxMembers && formData.maxMembers > 10000 && (
                  <p className="text-error text-sm mt-1">
                    Cannot exceed 10,000 members
                  </p>
                )}
                {allowedMax !== null ? (
                  formData.maxMembers > allowedMax ? (
                    <p className="text-sm text-error mt-1">
                      Number of people who can join this booth (2-{allowedMax})
                      — you've entered {formData.maxMembers}, which exceeds your
                      plan limit.
                    </p>
                  ) : (
                    <p className="text-sm theme-muted mt-1">
                      Capacity: {formData.maxMembers || "—"} participants.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Capacity: {formData.maxMembers || "—"} participants.
                  </p>
                )}
              </div>
            </div>

            {/* Candidates */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-semibold theme-text">
                  Candidates
                </h2>
                <button
                  type="button"
                  onClick={addCandidate}
                  className="btn-theme btn-theme-accent w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold"
                >
                  Add Candidate
                </button>
              </div>

              {candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="glass-card p-4 sm:p-6 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-medium theme-text">
                      Candidate {index + 1}
                    </h3>
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCandidate(index)}
                        className="text-red-500 hover:text-red-600 transition-colors transform hover:scale-110 p-1"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium theme-text mb-2 required:*">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={candidate.name}
                        onChange={(e) =>
                          handleCandidateChange(index, "name", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-xl theme-surface focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base ${
                          candidate.name.trim().length > 0 &&
                          candidate.name.trim().length < 1
                            ? "border-error focus:ring-error bg-error/5"
                            : "border-border focus:ring-accent"
                        }`}
                        placeholder="Enter candidate name"
                      />
                      {candidate.name.trim().length === 0 && index < 2 && (
                        <p className="text-warning text-xs sm:text-sm mt-1">
                          This candidate is required
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium theme-text mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={candidate.description}
                        onChange={(e) =>
                          handleCandidateChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-3 border border-border rounded-xl theme-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                        placeholder="Brief description (optional)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Settings */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-semibold theme-text border-b border-border pb-2">
                Booth Settings
              </h2>

              {/* Voting Rules */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium theme-text">
                  Voting Rules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-start space-x-3">
                    <input
                      id="resultsVisibleToVoters"
                      name="settings.resultsVisibleToVoters"
                      type="checkbox"
                      checked={formData.settings.resultsVisibleToVoters}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-accent bg-theme-surface border-border rounded focus:ring-accent"
                    />
                    <div>
                      <label
                        htmlFor="resultsVisibleToVoters"
                        className="text-sm font-medium theme-text"
                      >
                        Results visible to voters
                      </label>
                      <p className="text-sm theme-muted">
                        Allow voters to see results after voting
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      id="showLiveResults"
                      name="settings.showLiveResults"
                      type="checkbox"
                      checked={formData.settings.showLiveResults}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-accent bg-theme-surface border-border rounded focus:ring-accent"
                    />
                    <div>
                      <label
                        htmlFor="showLiveResults"
                        className="text-sm font-medium theme-text"
                      >
                        Show live results
                      </label>
                      <p className="text-sm theme-muted">
                        Broadcast live aggregate results to viewers (opt-in)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Control */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium theme-text">
                  Access Control
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <input
                      id="requireApproval"
                      name="settings.requireApproval"
                      type="checkbox"
                      checked={formData.settings.requireApproval}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-accent bg-theme-surface border-border rounded focus:ring-accent"
                    />
                    <div>
                      <label
                        htmlFor="requireApproval"
                        className="text-sm font-medium theme-text"
                      >
                        Require approval
                      </label>
                      <p className="text-sm theme-muted">
                        Manually approve new members
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      id="restrictByEmailDomain"
                      name="settings.restrictByEmailDomain"
                      type="checkbox"
                      checked={formData.settings.restrictByEmailDomain}
                      onChange={(e) => {
                        // toggle and clear domains when disabling
                        const checked = e.target.checked;
                        handleInputChange({
                          target: {
                            name: "settings.restrictByEmailDomain",
                            type: "checkbox",
                            checked,
                          },
                        });
                        if (!checked) {
                          // clear domains when restriction disabled
                          handleInputChange({
                            target: {
                              name: "settings.allowedEmailDomains",
                              type: "text",
                              value: "",
                            },
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-accent bg-theme-surface border-border rounded focus:ring-accent"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="restrictByEmailDomain"
                        className="text-sm font-medium theme-text"
                      >
                        Restrict by email domain
                      </label>
                      <p className="text-sm theme-muted">
                        Only allow members with emails from listed domains to
                        join.
                      </p>

                      {formData.settings.restrictByEmailDomain && (
                        <div className="mt-2">
                          <input
                            id="allowedEmailDomains"
                            name="settings.allowedEmailDomains"
                            type="text"
                            value={(
                              formData.settings.allowedEmailDomains || []
                            ).join(", ")}
                            onChange={handleInputChange}
                            placeholder="example.com, organization.org"
                            className="w-full px-4 py-3 border border-border rounded-xl theme-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                          />
                          <p className="text-xs theme-muted mt-1">
                            Enter comma-separated domains (no @). Leave blank to
                            allow any domain.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Settings (admin-style) */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium theme-text">
                  Voting Schedule (Optional)
                </h3>

                <label className="flex items-start sm:items-center justify-between p-3 theme-surface hover:bg-accent/5 rounded-xl cursor-pointer transition-all border border-border">
                  <div className="flex-1 pr-3">
                    <span className="text-xs sm:text-sm theme-text font-medium">
                      Schedule voting
                    </span>
                    <p className="text-sm theme-muted">
                      Enable start/end times to schedule when voting is allowed.
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <input
                      id="enableSchedule"
                      type="checkbox"
                      checked={formData.settings.scheduled || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        // toggle scheduled flag
                        handleInputChange({
                          target: {
                            name: "settings.scheduled",
                            type: "checkbox",
                            checked,
                          },
                        });
                        if (!checked) {
                          // clear times when disabling schedule
                          handleInputChange({
                            target: {
                              name: "settings.votingStartTime",
                              type: "text",
                              value: "",
                            },
                          });
                          handleInputChange({
                            target: {
                              name: "settings.votingEndTime",
                              type: "text",
                              value: "",
                            },
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 text-accent theme-surface border-border rounded focus:ring-accent"
                    />
                  </div>
                </label>

                {formData.settings.scheduled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium theme-text mb-1">
                        Voting Start Time
                      </label>
                      <input
                        type="datetime-local"
                        name="settings.votingStartTime"
                        value={formData.settings.votingStartTime || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 theme-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent theme-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium theme-text mb-1">
                        Voting End Time
                      </label>
                      <input
                        type="datetime-local"
                        name="settings.votingEndTime"
                        value={formData.settings.votingEndTime || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 theme-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent theme-text"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn-theme btn-theme-ghost w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>

              <LoadingButton
                type="submit"
                loading={loading || checkingPermissions}
                disabled={
                  formData.name.trim().length < 3 ||
                  formData.description.trim().length < 10 ||
                  candidates.filter((c) => c.name.trim()).length < 2 ||
                  !formData.maxMembers ||
                  formData.maxMembers === "" ||
                  formData.maxMembers < 2 ||
                  (allowedMax !== null && formData.maxMembers > allowedMax)
                }
                variant="teal"
                size="lg"
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {formData.name.trim().length >= 3 &&
                formData.description.trim().length >= 10 &&
                candidates.filter((c) => c.name.trim()).length >= 2
                  ? "Create Booth"
                  : "Complete Required Fields"}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateBooth;
