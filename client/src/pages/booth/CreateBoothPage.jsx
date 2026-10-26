import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import BackButton from "../../components/layout/BackButton";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step")) || 1;

  const setCurrentStep = (newStep) => {
    if (newStep === 1) {
      setSearchParams({}, { replace: false });
    } else {
      setSearchParams({ step: newStep.toString() }, { replace: false });
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    checkCreatePermissions();
  }, []);

  const checkCreatePermissions = async () => {
    try {
      // Check if user has a token first
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/", { replace: true });
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
        navigate("/", { replace: true });
        return;
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

  const isStep1Valid =
    formData.name.trim().length >= 3 &&
    formData.name.trim().length <= 50 &&
    formData.description.trim().length >= 10 &&
    formData.description.trim().length <= 200 &&
    Boolean(formData.maxMembers) &&
    formData.maxMembers >= 2 &&
    formData.maxMembers <= 10000 &&
    (allowedMax === null || formData.maxMembers <= allowedMax);

  const validCandidatesCount = candidates.filter((c) => c.name.trim().length > 0).length;
  const isStep2Valid = validCandidatesCount >= 2;

  const handleNextStep = () => {
    setError("");
    if (currentStep === 1) {
      if (!isStep1Valid) {
        setError("Please complete all required fields properly in Basic Information.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isStep2Valid) {
        setError("Please provide names for at least 2 candidates.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen theme-bg py-4 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Mobile Header: Back Button + Title (Mobile only) */}
        <div className="flex sm:hidden items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border theme-surface theme-text shadow-sm transition-colors hover:border-accent hover:bg-accent-50 focus-ring"
            aria-label="Back to dashboard"
            title="Back to dashboard"
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
          <h1 className="text-xl font-bold theme-text">Create Booth</h1>
        </div>

        {/* Desktop Header: matching Join page format (Desktop only) */}
        <div className="hidden sm:block text-center mb-8 animate-fadeIn">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold theme-text mb-3 sm:mb-4">
            Create New <span className="text-gradient">Booth</span>
          </h1>
          <p
            className="theme-muted text-sm sm:text-lg mb-6 sm:mb-8 px-2 animate-fadeIn"
            style={{ "--stagger-index": 1 }}
          >
            Set up a new voting booth for your community
          </p>
        </div>

        {/* 3-Step Wizard Indicator with connected lines */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-xs sm:max-w-md mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep >= 1
                    ? "btn-theme text-on-primary shadow-sm ring-4 ring-accent/20"
                    : "border-2 border-border theme-surface theme-muted"
                }`}
              >
                1
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  currentStep === 1 ? "text-accent font-bold" : "theme-muted"
                }`}
              >
                Details
              </span>
            </div>

            {/* Line 1 -> 2 */}
            <div
              className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-300 ${
                currentStep > 1 ? "bg-accent" : "bg-border"
              }`}
            />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep >= 2
                    ? "btn-theme text-on-primary shadow-sm ring-4 ring-accent/20"
                    : "border-2 border-border theme-surface theme-muted"
                }`}
              >
                2
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  currentStep === 2 ? "text-accent font-bold" : "theme-muted"
                }`}
              >
                Options
              </span>
            </div>

            {/* Line 2 -> 3 */}
            <div
              className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-300 ${
                currentStep > 2 ? "bg-accent" : "bg-border"
              }`}
            />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep === 3
                    ? "btn-theme text-on-primary shadow-sm ring-4 ring-accent/20"
                    : "border-2 border-border theme-surface theme-muted"
                }`}
              >
                3
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  currentStep === 3 ? "text-accent font-bold" : "theme-muted"
                }`}
              >
                Settings
              </span>
            </div>
          </div>
        </div>

        <div
          className="glass-card p-5 sm:p-8 transition-all duration-300 hover:shadow-xl animate-fadeIn"
          style={{ "--stagger-index": 4 }}
        >
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <h2 className="text-lg sm:text-xl font-bold theme-text border-b border-border pb-2">
                  Basic Information
                </h2>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="name" className="text-sm font-semibold theme-text">
                      Booth Name *
                    </label>
                    <span className="text-xs theme-muted">
                      {formData.name.length}/50
                    </span>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl theme-surface theme-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                      formData.name.trim().length > 0 &&
                      (formData.name.trim().length < 3 ||
                        formData.name.trim().length > 50)
                        ? "border-error focus:ring-error bg-error/5"
                        : "border-border focus:ring-accent"
                    }`}
                    placeholder="e.g. Student Council Election 2026"
                  />
                  {formData.name.trim().length > 0 &&
                    formData.name.trim().length < 3 && (
                      <p className="text-error text-xs mt-1">
                        Booth name must be at least 3 characters
                      </p>
                    )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="description" className="text-sm font-semibold theme-text">
                      Description *
                    </label>
                    <span className="text-xs theme-muted">
                      {formData.description.length}/200
                    </span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl theme-surface theme-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 resize-none text-sm sm:text-base ${
                      formData.description.trim().length > 0 &&
                      (formData.description.trim().length < 10 ||
                        formData.description.trim().length > 200)
                        ? "border-error focus:ring-error bg-error/5"
                        : "border-border focus:ring-accent"
                    }`}
                    placeholder="Vote for your next student council representatives..."
                  />
                  {formData.description.trim().length > 0 &&
                    formData.description.trim().length < 10 && (
                      <p className="text-error text-xs mt-1">
                        Description must be at least 10 characters
                      </p>
                    )}
                </div>

                <div>
                  <label htmlFor="maxMembers" className="block text-sm font-semibold theme-text mb-1.5">
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
                    className="w-full px-4 py-2.5 sm:py-3 border border-border rounded-xl theme-surface theme-text focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300 text-sm sm:text-base"
                    placeholder="50"
                  />
                  <p className="text-xs theme-muted mt-1">
                    Capacity: {formData.maxMembers || "—"} participants
                  </p>
                </div>

                {/* Voting Type (Single / Multiple Choice) */}
                <div>
                  <label className="block text-sm font-semibold theme-text mb-2">
                    Voting Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange({
                          target: { name: "votingType", value: "single" },
                        })
                      }
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        formData.votingType !== "multiple"
                          ? "border-accent bg-accent-50 text-accent"
                          : "border-border theme-surface theme-muted hover:border-accent"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          formData.votingType !== "multiple"
                            ? "border-accent bg-accent"
                            : "border-border"
                        }`}
                      >
                        {formData.votingType !== "multiple" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange({
                          target: { name: "votingType", value: "multiple" },
                        })
                      }
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        formData.votingType === "multiple"
                          ? "border-accent bg-accent-50 text-accent"
                          : "border-border theme-surface theme-muted hover:border-accent"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          formData.votingType === "multiple"
                            ? "border-accent bg-accent"
                            : "border-border"
                        }`}
                      >
                        {formData.votingType === "multiple" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      Multiple Choice
                    </button>
                  </div>
                </div>

                {/* Step 1 Next Button */}
                <div className="pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="w-full btn-theme py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Add Candidates */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h2 className="text-lg sm:text-xl font-bold theme-text">
                    Add Candidates
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-50 text-accent border border-accent/20">
                    {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-3">
                  {candidates.map((candidate, index) => (
                    <div
                      key={index}
                      className="theme-surface rounded-xl border border-border p-3.5 sm:p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold theme-text flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent-50 text-accent flex items-center justify-center text-[11px]">
                            {index + 1}
                          </span>
                          Candidate {index + 1}
                        </span>
                        {candidates.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeCandidate(index)}
                            className="text-error hover:opacity-80 p-1"
                            title="Remove candidate"
                          >
                            <svg
                              className="w-4 h-4"
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

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          required
                          value={candidate.name}
                          onChange={(e) =>
                            handleCandidateChange(index, "name", e.target.value)
                          }
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl theme-surface theme-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Candidate Name *"
                        />
                        <input
                          type="text"
                          value={candidate.description}
                          onChange={(e) =>
                            handleCandidateChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl theme-surface theme-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Position / Role (e.g. General Secretary)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Candidate Button */}
                <button
                  type="button"
                  onClick={addCandidate}
                  className="w-full py-2.5 border-2 border-dashed border-accent/40 rounded-xl text-accent hover:bg-accent-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Candidate</span>
                </button>

                {/* Step 2 Navigation Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-3 border border-border rounded-xl theme-surface theme-text font-bold text-sm hover:bg-accent-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep2Valid}
                    className="flex-1 btn-theme py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Voting Rules & Settings */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fadeIn">
                {/* Voting Rules */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold theme-text mb-3 border-b border-border pb-2">
                    Voting Rules
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl border border-border theme-surface cursor-pointer hover:border-accent/40 transition-colors">
                      <div className="pr-3">
                        <span className="text-sm font-semibold theme-text block">
                          Results visible to voters
                        </span>
                        <span className="text-xs theme-muted">
                          Allow voters to see results after voting
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        name="settings.resultsVisibleToVoters"
                        checked={formData.settings.resultsVisibleToVoters}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded text-accent focus:ring-accent border-border"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-xl border border-border theme-surface cursor-pointer hover:border-accent/40 transition-colors">
                      <div className="pr-3">
                        <span className="text-sm font-semibold theme-text block">
                          Show live results
                        </span>
                        <span className="text-xs theme-muted">
                          Broadcast live results to viewers (opt-in)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        name="settings.showLiveResults"
                        checked={formData.settings.showLiveResults}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded text-accent focus:ring-accent border-border"
                      />
                    </label>
                  </div>
                </div>

                {/* Access Control */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold theme-text mb-3 border-b border-border pb-2">
                    Access Control
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-xl border border-border theme-surface cursor-pointer hover:border-accent/40 transition-colors">
                      <div className="pr-3">
                        <span className="text-sm font-semibold theme-text block">
                          Require approval
                        </span>
                        <span className="text-xs theme-muted">
                          Manually approve new members
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        name="settings.requireApproval"
                        checked={formData.settings.requireApproval}
                        onChange={handleInputChange}
                        className="h-5 w-5 rounded text-accent focus:ring-accent border-border"
                      />
                    </label>

                    <div className="p-3.5 rounded-xl border border-border theme-surface space-y-2.5">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="pr-3">
                          <span className="text-sm font-semibold theme-text block">
                            Restrict by email domain
                          </span>
                          <span className="text-xs theme-muted">
                            Only allow specific email domains
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          name="settings.restrictByEmailDomain"
                          checked={formData.settings.restrictByEmailDomain}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            handleInputChange({
                              target: {
                                name: "settings.restrictByEmailDomain",
                                type: "checkbox",
                                checked,
                              },
                            });
                            if (!checked) {
                              handleInputChange({
                                target: {
                                  name: "settings.allowedEmailDomains",
                                  type: "text",
                                  value: "",
                                },
                              });
                            }
                          }}
                          className="h-5 w-5 rounded text-accent focus:ring-accent border-border"
                        />
                      </label>

                      {formData.settings.restrictByEmailDomain && (
                        <div className="pt-2 border-t border-border">
                          <input
                            id="allowedEmailDomains"
                            name="settings.allowedEmailDomains"
                            type="text"
                            value={(
                              formData.settings.allowedEmailDomains || []
                            ).join(", ")}
                            onChange={handleInputChange}
                            placeholder="example.com, college.edu"
                            className="w-full px-3 py-2 border border-border rounded-lg theme-surface theme-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          <p className="text-[11px] theme-muted mt-1">
                            Comma-separated domains without @
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Voting Schedule (Optional) */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold theme-text mb-3 border-b border-border pb-2">
                    Voting Schedule (Optional)
                  </h3>
                  <div className="p-3.5 rounded-xl border border-border theme-surface space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="pr-3">
                        <span className="text-sm font-semibold theme-text block">
                          Schedule voting
                        </span>
                        <span className="text-xs theme-muted">
                          Set custom start and end time
                        </span>
                      </div>
                      <input
                        id="enableSchedule"
                        type="checkbox"
                        checked={formData.settings.scheduled || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleInputChange({
                            target: {
                              name: "settings.scheduled",
                              type: "checkbox",
                              checked,
                            },
                          });
                          if (!checked) {
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
                        className="h-5 w-5 rounded text-accent focus:ring-accent border-border"
                      />
                    </label>

                    {formData.settings.scheduled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div>
                          <label className="block text-xs font-semibold theme-text mb-1">
                            Start Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            name="settings.votingStartTime"
                            value={formData.settings.votingStartTime || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-lg theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold theme-text mb-1">
                            End Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            name="settings.votingEndTime"
                            value={formData.settings.votingEndTime || ""}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-border rounded-lg theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3 Final Buttons: Back + Create Booth */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-3 border border-border rounded-xl theme-surface theme-text font-bold text-sm hover:bg-accent-50 transition-colors"
                  >
                    Back
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={loading || checkingPermissions}
                    disabled={
                      !isStep1Valid ||
                      !isStep2Valid ||
                      loading ||
                      checkingPermissions
                    }
                    variant="teal"
                    size="lg"
                    className="flex-1 py-3 rounded-xl font-bold text-sm shadow-sm"
                  >
                    Create Booth
                  </LoadingButton>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateBooth;
