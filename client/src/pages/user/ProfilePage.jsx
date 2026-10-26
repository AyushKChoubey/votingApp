import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import api from "../../services/api";

const ProfilePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Desktop editing state
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
  const [fieldErrors, setFieldErrors] = useState({});

  // Mobile Edit Profile Drawer State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    organization: "",
    bio: "",
  });
  const [savingChanges, setSavingChanges] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Mobile Sign Out Drawer State
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("token")) {
      navigate("/", { replace: true });
      return;
    }
    if (user) {
      fetchProfileData();
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, navigate]);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsEditModalOpen(false);
        setIsSignOutModalOpen(false);
      }
    };
    if (isEditModalOpen || isSignOutModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isEditModalOpen, isSignOutModalOpen]);

  const fetchProfileData = async () => {
    try {
      const response = await api.get("/api/user/profile");
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
      setEditFormData({
        name: userData.name || "",
        organization: userData.profile?.organization || "",
        bio: userData.profile?.bio || "",
      });
    } catch (err) {
      addToast("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get("/api/user/stats");
      setUserStats(response);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  // Validation functions
  const validateName = (name) => {
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (name && name.trim().length > 50) {
      errors.push("Name must be less than 50 characters");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const nameErrors = validateName(formData.name);
    if (nameErrors.length > 0) {
      addToast(nameErrors[0], "error");
      return;
    }

    setUpdateLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        profile: {
          bio: formData.profile.bio?.trim() || "",
          organization: formData.profile.organization?.trim() || "",
        },
      };

      const response = await api.put("/api/user/profile", updateData);
      const userData = response.user || response;
      setProfileData(userData);
      setEditFormData({
        name: userData.name || "",
        organization: userData.profile?.organization || "",
        bio: userData.profile?.bio || "",
      });
      addToast("Profile updated successfully!", "success");
      setEditing(false);
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please select an image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image size must be less than 5MB", "error");
      return;
    }

    try {
      setAvatarUploading(true);
      const data = new FormData();
      data.append("avatar", file);

      const response = await api.post("/api/user/avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.user || response;
      setProfileData((prev) => ({
        ...prev,
        profile: {
          ...prev?.profile,
          avatar: updatedUser.profile?.avatar || response.avatarUrl,
        },
      }));
      addToast("Profile photo updated successfully!", "success");
    } catch (err) {
      addToast(err.message || "Failed to upload photo", "error");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      await api.delete("/api/user/avatar");
      setProfileData((prev) => ({
        ...prev,
        profile: {
          ...prev?.profile,
          avatar: null,
        },
        profilePicture: null,
      }));
      addToast("Profile photo removed", "success");
    } catch (err) {
      addToast(err.message || "Failed to remove photo", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleMobileSave = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim() || editFormData.name.trim().length < 2) {
      addToast("Name must be at least 2 characters long", "error");
      return;
    }

    try {
      setSavingChanges(true);
      const updatePayload = {
        name: editFormData.name.trim(),
        profile: {
          organization: editFormData.organization.trim(),
          bio: editFormData.bio.trim(),
        },
      };

      const response = await api.put("/api/user/profile", updatePayload);
      const updatedUser = response.user || response;
      setProfileData(updatedUser);
      setFormData({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        profile: {
          bio: updatedUser.profile?.bio || "",
          organization: updatedUser.profile?.organization || "",
        },
      });
      addToast("Profile updated successfully!", "success");
      setIsEditModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setSavingChanges(false);
    }
  };

  const handleSignOutConfirm = async () => {
    try {
      setSigningOut(true);
      setIsSignOutModalOpen(false);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMemberSince = () => {
    const dateStr = userStats?.memberSince || profileData?.createdAt || user?.createdAt;
    if (!dateStr) return "Oct 2025";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const isGoogleAccount = Boolean(
    user?.authProvider === "google" ||
    profileData?.authProvider === "google" ||
    user?.googleId ||
    profileData?.googleId
  );

  const currentAvatar =
    profileData?.profile?.avatar ||
    profileData?.profilePicture ||
    user?.profile?.avatar ||
    user?.profilePicture;

  if (!isAuthenticated || !user || !localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <PageLoading message="Loading profile..." />;
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) Matching Image 1 ────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-lg mx-auto overflow-x-hidden px-4 pt-3 pb-24 animate-fadeIn">
        {/* Single Header: Back button + Title on Left, Settings gear on Top Right Corner */}
        <div className="flex items-center justify-between mb-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border theme-surface theme-text shadow-xs hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
              aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold theme-text">Profile</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/user/settings")}
            className="w-10 h-10 rounded-xl border border-border theme-surface text-accent hover:bg-accent/10 active:scale-95 flex items-center justify-center shadow-xs transition-all"
            aria-label="Settings"
            title="Account Settings"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* User Info Card */}
        <div className="rounded-3xl border border-border theme-surface p-4 shadow-xs mb-4">
          <div className="flex items-center gap-3.5 mb-3.5">
            {/* Avatar with Camera Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border/80 bg-accent-50 dark:bg-accent/15 text-accent font-bold text-xl flex items-center justify-center shadow-inner">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{profileData?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
              <div
                onClick={() => setIsEditModalOpen(true)}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center border-2 border-[var(--color-surface)] shadow-xs cursor-pointer hover:scale-105 transition-transform"
                title="Change photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" strokeWidth={2} />
                </svg>
              </div>
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold theme-text leading-snug truncate">
                {profileData?.name || user?.name || "User"}
              </h2>
              <p className="text-xs theme-muted truncate">
                {profileData?.email || user?.email || ""}
              </p>
              <p className="text-[11px] theme-muted mt-0.5">
                Member since {formatMemberSince()}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verified</span>
                </span>

                {isGoogleAccount ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google Account</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent border border-accent/20">
                    <span>Standard Account</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Full Width Button */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full py-2.5 rounded-2xl border border-accent/30 bg-accent/5 hover:bg-accent/10 text-accent font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Edit Profile</span>
          </button>
        </div>

        {/* 3 Stats Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl border border-border theme-surface p-3 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-extrabold text-base mb-1">
              {userStats?.boothsCreated ?? 0}
            </div>
            <svg className="w-4.5 h-4.5 mx-auto mb-1 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div className="text-[11px] theme-muted font-medium">Created</div>
          </div>

          <div className="rounded-2xl border border-border theme-surface p-3 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-extrabold text-base mb-1">
              {userStats?.boothsJoined ?? 0}
            </div>
            <svg className="w-4.5 h-4.5 mx-auto mb-1 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-[11px] theme-muted font-medium">Joined</div>
          </div>

          <div className="rounded-2xl border border-border theme-surface p-3 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-extrabold text-base mb-1">
              {userStats?.totalVotes ?? 0}
            </div>
            <svg className="w-4.5 h-4.5 mx-auto mb-1 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-[11px] theme-muted font-medium">Votes</div>
          </div>
        </div>

        {/* About Section - No unwanted dark horizontal divider lines */}
        <div className="mb-5">
          <h3 className="text-sm font-bold theme-text mb-2.5">About</h3>
          <div className="rounded-2xl border border-border theme-surface p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs theme-muted flex items-center gap-2 font-medium w-28 shrink-0">
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Organization</span>
              </div>
              <div className="text-xs font-semibold theme-text text-right flex-1 truncate">
                {profileData?.profile?.organization || "Not set"}
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div className="text-xs theme-muted flex items-center gap-2 font-medium w-28 shrink-0 pt-0.5">
                <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Bio</span>
              </div>
              <div className="text-xs theme-text text-right flex-1 leading-relaxed">
                {profileData?.profile?.bio || "No bio added yet"}
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out Card - Normal text on solid red background */}
        <div
          onClick={() => setIsSignOutModalOpen(true)}
          className="rounded-2xl bg-red-600 hover:bg-red-700 text-white p-3.5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsSignOutModalOpen(true);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="text-white font-medium text-sm">Sign Out</span>
          </div>
          <svg className="w-4 h-4 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Mobile Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
          id="profile-avatar-input-mobile"
        />

        {/* Screen 2: Edit Profile Bottom Sheet */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setIsEditModalOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto rounded-t-[32px] theme-surface border-t border-border shadow-2xl p-5 pb-8 animate-slideIn max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
              <h2 className="text-xl font-bold theme-text mb-4">Edit Profile</h2>

              <div className="flex items-center gap-4 mb-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-accent-50 dark:bg-accent/15 text-accent font-bold text-xl flex items-center justify-center">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{editFormData.name?.charAt(0)?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center border-2 border-[var(--color-surface)] shadow-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-accent-50 dark:bg-accent/10 text-accent border border-accent/20 text-xs font-semibold hover:bg-accent-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span>{avatarUploading ? "Uploading..." : "Change photo"}</span>
                  </button>

                  {currentAvatar && (
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={handleRemoveAvatar}
                      className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-1.5 pl-1 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove photo</span>
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleMobileSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">Organization</label>
                  <input
                    type="text"
                    value={editFormData.organization}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, organization: e.target.value }))}
                    maxLength={100}
                    placeholder="e.g. IT industry"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">Bio</label>
                  <textarea
                    rows={3}
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
                    maxLength={200}
                    placeholder="Tell others a little about yourself"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent resize-none"
                  />
                  <div className="text-right text-[11px] theme-muted mt-1">
                    {editFormData.bio.length}/200
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingChanges}
                  className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md mt-3 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {savingChanges ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full py-2.5 text-center text-sm theme-muted hover:theme-text font-semibold active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Screen 3: Sign Out Bottom Sheet */}
        {isSignOutModalOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setIsSignOutModalOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto rounded-t-[32px] theme-surface border-t border-border shadow-2xl p-6 pb-8 animate-slideIn text-center">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-500 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>

              <h2 className="text-xl font-bold theme-text mb-1.5">Sign out?</h2>
              <p className="text-xs theme-muted mb-6 max-w-xs mx-auto leading-relaxed">
                You will need to sign in again to manage your booths.
              </p>

              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOutConfirm}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm shadow-md mb-2.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {signingOut ? "Signing Out..." : "Sign Out"}
              </button>

              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border theme-text font-semibold text-sm hover:bg-black/10 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEW ONLY (hidden md:block) Untouched Desktop ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block min-h-screen theme-bg py-6 lg:py-8 px-4 lg:px-8 relative overflow-hidden">
        {/* Floating orbs decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
          <div
            className="w-64 h-64 rounded-full blur-3xl opacity-20"
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
            className="w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{
              background:
                "radial-gradient(circle, var(--color-accent), var(--color-secondary))",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Desktop Header */}
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-3xl lg:text-5xl font-bold theme-text mb-4 animate-fadeIn">
                <span className="text-gradient">Profile</span>
              </h1>
              <p className="theme-muted text-base animate-fadeIn">
                Manage your personal information and preferences
              </p>
            </div>
          </div>

          <div className="space-y-6 animate-fadeIn stagger-children">
            {/* Profile Overview Card */}
            <div
              className="glass-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 card-hover"
              style={{ "--stagger-index": 0 }}
            >
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar with Upload Controls */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    {profileData?.profile?.avatar || profileData?.profilePicture ? (
                      <img
                        src={profileData?.profile?.avatar || profileData?.profilePicture}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center ring-2 ring-gray-100">
                        <span className="text-2xl font-semibold text-white">
                          {profileData?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById("avatar-upload-input-desktop")?.click()}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-accent transition-colors"
                      title="Upload avatar"
                      aria-label="Upload avatar image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    {profileData?.profile?.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 hover:text-red-600 transition-colors"
                        title="Remove uploaded avatar"
                        aria-label="Remove uploaded avatar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    id="avatar-upload-input-desktop"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold theme-text">
                    {profileData?.name || user?.name}
                  </h2>
                  <p className="theme-muted text-sm">{profileData?.email || user?.email}</p>
                  <p className="text-xs theme-muted mt-1">
                    Member since {formatDate(profileData?.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(!editing)}
                    className="btn-theme text-on-primary px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {editing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>
              </div>

              {/* Desktop Inline Edit Form */}
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="mt-6 border-t border-border pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium theme-text mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-border bg-theme-surface theme-text focus:outline-none focus:border-accent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium theme-text mb-1">Organization</label>
                      <input
                        type="text"
                        name="profile.organization"
                        value={formData.profile.organization}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-theme-surface theme-text focus:outline-none focus:border-accent text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium theme-text mb-1">Bio</label>
                    <textarea
                      name="profile.bio"
                      rows={3}
                      value={formData.profile.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-theme-surface theme-text focus:outline-none focus:border-accent text-sm resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 rounded-lg border border-border theme-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <LoadingButton
                      type="submit"
                      loading={updateLoading}
                      className="btn-theme text-on-primary px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Save Changes
                    </LoadingButton>
                  </div>
                </form>
              ) : (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium theme-muted">Organization:</span>
                      <p className="theme-text mt-0.5">{profileData?.profile?.organization || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="font-medium theme-muted">Bio:</span>
                      <p className="theme-text mt-0.5">{profileData?.profile?.bio || "No bio provided"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Statistics Overview */}
            <div
              className="glass-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 card-hover"
              style={{ "--stagger-index": 1 }}
            >
              <h2 className="text-lg font-bold theme-text mb-4">Voting Activity</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-theme-surface/50 rounded-xl p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-accent mb-1">{userStats?.boothsCreated ?? 0}</div>
                  <div className="text-xs theme-muted font-medium">Booths Created</div>
                </div>
                <div className="bg-theme-surface/50 rounded-xl p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-accent mb-1">{userStats?.boothsJoined ?? 0}</div>
                  <div className="text-xs theme-muted font-medium">Booths Joined</div>
                </div>
                <div className="bg-theme-surface/50 rounded-xl p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-accent mb-1">{userStats?.totalVotes ?? 0}</div>
                  <div className="text-xs theme-muted font-medium">Votes Cast</div>
                </div>
              </div>
            </div>

            {/* Desktop Account Details */}
            <div
              className="glass-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 card-hover"
              style={{ "--stagger-index": 2 }}
            >
              <h2 className="text-lg font-bold theme-text mb-4">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-theme-surface/50 rounded-xl p-3 border border-border">
                  <div className="font-medium theme-muted text-xs">Member Since</div>
                  <div className="theme-text font-semibold mt-1">{formatDate(profileData?.createdAt)}</div>
                </div>
                <div className="bg-theme-surface/50 rounded-xl p-3 border border-border">
                  <div className="font-medium theme-muted text-xs">Last Login</div>
                  <div className="theme-text font-semibold mt-1">
                    {profileData?.lastLogin
                      ? new Date(profileData.lastLogin).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
