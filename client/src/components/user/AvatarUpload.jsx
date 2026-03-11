import React, { useState, useRef } from "react";
import { useToast } from "../layout/Toast";
import api from "../../services/api";

const AvatarUpload = ({ currentAvatar, onAvatarUpdate, userName = "User" }) => {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar || null);
  const fileInputRef = useRef(null);

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      addToast(
        "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        "error",
      );
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast("Image size must be less than 5MB", "error");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post("/api/user/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success) {
        addToast("Avatar updated successfully!", "success");
        setPreviewUrl(response.avatar);
        if (onAvatarUpdate) {
          onAvatarUpdate(response.avatar);
        }
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      addToast(error.message || "Failed to upload avatar", "error");
      setPreviewUrl(currentAvatar); // Revert to original
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!currentAvatar && !previewUrl) return;

    if (!window.confirm("Are you sure you want to remove your avatar?")) {
      return;
    }

    setDeleting(true);

    try {
      const response = await api.delete("/api/user/avatar");

      if (response.success) {
        addToast("Avatar removed successfully", "success");
        setPreviewUrl(null);
        if (onAvatarUpdate) {
          onAvatarUpdate(null);
        }
      }
    } catch (error) {
      console.error("Avatar delete error:", error);
      addToast(error.message || "Failed to remove avatar", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-3 glass-card rounded-lg border border-border flex items-center gap-4">
      <div className="relative flex-shrink-0">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover ring-1 ring-white"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-semibold">
            {getInitials(userName)}
          </div>
        )}

        {(uploading || deleting) && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <div className="text-sm font-medium theme-text truncate">
              {userName}
            </div>
            <div className="text-xs theme-muted">
              {previewUrl ? "Custom avatar" : "No avatar"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading || deleting}
              className="px-3 py-1 rounded-md text-sm btn-theme btn-theme-ghost"
            >
              {uploading ? "Uploading..." : previewUrl ? "Change" : "Upload"}
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading || deleting}
                className="px-3 py-1 rounded-md text-sm btn-theme btn-theme-danger"
              >
                {deleting ? "Removing..." : "Remove"}
              </button>
            )}
          </div>
        </div>
        <p className="text-xs theme-muted mt-1">
          Accepts JPEG, PNG, GIF, WebP — max 5MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default AvatarUpload;
