import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import BackButton from "../../components/layout/BackButton";
import api from "../../services/api";

const ProfilePage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profile: {
      bio: "",
      organization: "",
    },
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const response = await api.get("/api/user/profile");
      // API interceptor returns response.data directly, so response = { success: true, user: {...}, stats: {...} }
      const userData = response.user || response;
      setProfileData(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        profile: {
          bio: userData.profile?.bio || "",
          organization: userData.profile?.organization || "",
        },
      });
    } catch (err) {
      addToast("Failed to load profile data", "error");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get("/api/user/stats");
      // API interceptor returns response.data directly
      setUserStats(response);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Real-time validation
    let errors = [];

    switch (name) {
      case "name":
        errors = validateName(value);
        break;
      case "profile.organization":
        errors = validateOrganization(value);
        break;
      case "profile.bio":
        errors = validateBio(value);
        break;
      default:
        break;
    }

    // Update field errors
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errors.length > 0 ? errors[0] : null,
    }));
  };

  const validateName = (name) => {
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (name && name.trim().length > 50) {
      errors.push("Name must be less than 50 characters");
    }
    if (name && !/^[a-zA-Z\s\-'\.]+$/.test(name.trim())) {
      errors.push(
        "Name can only contain letters, spaces, hyphens, apostrophes, and periods",
      );
    }
    return errors;
  };


  const validateOrganization = (organization) => {
    const errors = [];
    if (organization && organization.length > 100) {
      errors.push("Organization name must be less than 100 characters");
    }
    return errors;
  };

  const validateBio = (bio) => {
    const errors = [];
    if (bio && bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
    }
    return errors;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Comprehensive validation
    const errors = [];

    // Validate name (required)
    const nameErrors = validateName(formData.name);
    errors.push(...nameErrors);

    // Mobile removed from profile form (not collected)

    // Validate organization (optional)
    if (formData.profile.organization) {
      const orgErrors = validateOrganization(formData.profile.organization);
      errors.push(...orgErrors);
    }

    // Validate bio (optional)
    if (formData.profile.bio) {
      const bioErrors = validateBio(formData.profile.bio);
      errors.push(...bioErrors);
    }

    // Display validation errors
    if (errors.length > 0) {
      addToast(errors[0], "error"); // Show first error
      return;
    }

    setUpdateLoading(true);

    try {
      // Don't send email in the update request to prevent changes
      const updateData = {
        name: formData.name.trim(),
        profile: {
          bio: formData.profile.bio?.trim() || "",
          organization: formData.profile.organization?.trim() || "",
        },
      };

      const response = await api.put("/api/user/profile", updateData);
      // API interceptor returns response.data directly
      const userData = response.user || response;
      
      // Update profile data with full user object
      setProfileData(userData);
      
      // Update form data to match saved values
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        profile: {
          bio: userData.profile?.bio || "",
          organization: userData.profile?.organization || "",
        },
      });
      
      addToast("Profile updated successfully!", "success");
      setEditing(false);
    } catch (err) {
      addToast(
        err.response?.data?.error || "Failed to update profile",
        "error",
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <PageLoading message="Loading your profile..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <div className="glass-card rounded-2xl border border-border p-8">
          <h1 className="text-2xl font-bold theme-text mb-4">
            Authentication Required
          </h1>
          <p className="theme-muted">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Floating orbs decoration */}
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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold theme-text mb-2 sm:mb-4 animate-fadeIn">
              <span className="text-gradient">Profile</span>
            </h1>
            <p className="theme-muted text-sm sm:text-base animate-fadeIn">
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        <div className="space-y-6 animate-fadeIn stagger-children">
          {/* Profile Overview Card */}
          <div className="glass-card rounded-2xl border border-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 card-hover" style={{"--stagger-index": 0}}>
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar with Upload Controls */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="relative">
                  {(profileData?.profile?.avatar || profileData?.profilePicture) ? (
                    <img
                      src={profileData?.profile?.avatar || profileData?.profilePicture}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center ring-2 ring-gray-100">
                      <span className="text-2xl font-semibold text-white">
                        {profileData?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Avatar Upload/Remove Icons Below */}
                <div className="flex gap-2 ">
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-upload-input').click()}
                    className="w-8 h-8 rounded-lg bg-accent text-on-accent flex items-center justify-center shadow-sm hover:bg-accent/90 transition-all duration-200 hover:scale-105"
                    title="Upload avatar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    disabled={!profileData?.profile?.avatar}
                    onClick={async () => {
                      const hasUploadedAvatar = profileData?.profile?.avatar;
                      
                      if (!hasUploadedAvatar) {
                        addToast('No uploaded avatar to remove', 'info');
                        return;
                      }
                      
                      try {
                        const response = await api.delete('/api/user/avatar');
                        if (response.success) {
                          addToast('Avatar removed', 'success');
                          // Update with full user object from response
                          const userData = response.user || response;
                          setProfileData(userData);
                        }
                      } catch (err) {
                        addToast('Failed to remove avatar', 'error');
                      }
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200 ${
                      profileData?.profile?.avatar
                        ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-105 cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                    title={
                      profileData?.profile?.avatar
                        ? 'Remove uploaded avatar'
                        : 'No uploaded avatar'
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    if (!validTypes.includes(file.type)) {
                      addToast('Please select a valid image file', 'error');
                      return;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) {
                      addToast('Image must be less than 5MB', 'error');
                      return;
                    }
                    
                    try {
                      const formData = new FormData();
                      formData.append('avatar', file);
                      const response = await api.post('/api/user/avatar', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      if (response.success) {
                        addToast('Avatar updated!', 'success');
                        // Update with full user object from response
                        const userData = response.user || response;
                        setProfileData(userData);
                      }
                    } catch (err) {
                      addToast(err.message || 'Failed to upload avatar', 'error');
                    }
                    e.target.value = '';
                  }}
                />
              </div>

              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold theme-text">
                  {profileData?.name}
                </h2>
                <p className="theme-muted text-sm sm:text-base">
                  {profileData?.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      profileData?.isEmailVerified || profileData?.authProvider === "google"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {profileData?.isEmailVerified || profileData?.authProvider === "google"
                      ? "✓ Verified"
                      : "⚠ Unverified"}
                  </span>
                  {profileData?.authProvider === "google" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Google Account
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 btn-theme btn-theme-accent rounded-lg transition-colors duration-200 text-sm"
              >
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="glass-card rounded-2xl border border-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 card-hover" style={{"--stagger-index": 1}}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold theme-text">
                  Personal Information
                </h2>
              </button>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label={
                  profileOpen
                    ? "Collapse profile section"
                    : "Expand profile section"
                }
                className="p-1 rounded-md hover:bg-theme-surface transition-colors"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${profileOpen ? "rotate-180" : "rotate-0"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {profileOpen && (
              <>
                {editing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium theme-muted mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 bg-theme-surface glass-card  border border-border rounded-lg theme-text focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            fieldErrors.name
                              ? "border-red-300 focus:ring-red-500"
                              : "border-border focus:ring-accent"
                          }`}
                          required
                        />
                        {fieldErrors.name && (
                          <p className="text-xs text-red-600 mt-1">
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium theme-muted mb-2">
                          Email
                          <span className="ml-1 text-xs theme-muted">
                            (cannot be changed)
                          </span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-theme-surface/50 theme-muted cursor-not-allowed focus:outline-none"
                          readOnly
                          disabled
                        />
                        <p className="text-xs theme-muted mt-1">
                          Email cannot be changed for security reasons. Contact
                          support if you need to update your email.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium theme-muted mb-2">
                          Organization
                        </label>
                        <input
                          type="text"
                          name="profile.organization"
                          value={formData.profile.organization}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 bg-theme-surface glass-card border-border border rounded-lg theme-text focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                            fieldErrors["profile.organization"]
                              ? "border-red-300 focus:ring-red-500"
                              : "border-border focus:ring-accent"
                          }`}
                          placeholder="Optional"
                        />
                        {fieldErrors["profile.organization"] && (
                          <p className="text-xs text-red-600 mt-1">
                            {fieldErrors["profile.organization"]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium theme-muted mb-2">
                        Bio
                      </label>
                      <textarea
                        name="profile.bio"
                        value={formData.profile.bio}
                        onChange={handleInputChange}
                        rows={3}
                        maxLength={500}
                        className={`w-full px-3 py-2 bg-theme-surface glass-card border-border border rounded-lg theme-text focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          fieldErrors["profile.bio"]
                            ? "border-red-300 focus:ring-red-500"
                            : "border-border focus:ring-accent"
                        }`}
                        placeholder="Tell us about yourself... (optional)"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <div>
                          {fieldErrors["profile.bio"] && (
                            <p className="text-xs text-red-600">
                              {fieldErrors["profile.bio"]}
                            </p>
                          )}
                        </div>
                        <p
                          className={`text-sm ${formData.profile.bio.length > 450 ? "text-warning" : "theme-muted"}`}
                        >
                          {formData.profile.bio.length}/500 characters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 btn-theme btn-theme-ghost rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <LoadingButton
                        type="submit"
                        loading={updateLoading}
                        className="px-6 py-2 btn-theme btn-theme-accent rounded-lg"
                      >
                        Save Changes
                      </LoadingButton>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      
                      <div className="p-3 glass-card rounded-lg border border-border">
                        <div className="font-medium theme-muted">Organization</div>
                        <div className="theme-text">{profileData?.profile?.organization || "Not provided"}</div>
                      </div>
                      {profileData?.profile?.bio && (
                        <div className="p-3 glass-card rounded-lg border border-border md:col-span-2">
                          <div className="font-medium theme-muted">Bio</div>
                          <div className="theme-text">{profileData.profile.bio}</div>
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Statistics Card */}
          {userStats && (
            <div className="glass-card rounded-2xl border border-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 card-hover" style={{"--stagger-index": 2}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-success to-accent rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold theme-text">
                  Activity Overview
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {userStats.boothsCreated || 0}
                  </div>
                  <div className="theme-muted">Created</div>
                </div>
                <div className="bg-accent/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-accent">
                    {userStats.boothsJoined || 0}
                  </div>
                  <div className="theme-muted">Joined</div>
                </div>
                <div className="bg-secondary/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {userStats.totalVotes || 0}
                  </div>
                  <div className="theme-muted">Votes</div>
                </div>
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-success">
                    {profileData?.loginCount || 0}
                  </div>
                  <div className="theme-muted">Logins</div>
                </div>
              </div>
            </div>
          )}

          {/* Account Details Card */}
          <div className="glass-card rounded-2xl border border-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 card-hover" style={{"--stagger-index": 3}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-accent to-secondary rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-on-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold theme-text">
                Account Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-theme-surface/50 rounded-lg p-3">
                <div className="font-medium theme-muted">Member Since</div>
                <div className="theme-text">
                  {formatDate(profileData?.createdAt)}
                </div>
              </div>
              <div className="bg-theme-surface/50 rounded-lg p-3">
                <div className="font-medium theme-muted">Last Login</div>
                <div className="theme-text">
                  {profileData?.lastLogin
                    ? new Date(profileData.lastLogin).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "Never"}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="glass-card rounded-2xl border border-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 card-hover" style={{"--stagger-index": 4}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold theme-text">
                Recent Activity
              </h2>
            </div>

            <div className="space-y-2">
              <div className="p-3 glass-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-sm theme-text">Last password change</span>
                  </div>
                  <span className="text-xs theme-muted">
                    {profileData?.passwordChangedAt
                      ? formatDate(profileData.passwordChangedAt)
                      : "Never"}
                  </span>
                </div>
              </div>
              <div className="p-3 glass-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-sm theme-text">Total login count</span>
                  </div>
                  <span className="text-xs theme-muted">{profileData?.loginCount || 0}</span>
                </div>
              </div>
              <div className="p-3 glass-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-sm theme-text">Account status</span>
                  </div>
                  <span className="text-xs font-medium text-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
