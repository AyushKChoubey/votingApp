import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authService } from "../services/api";

// Auth state management
const getInitialState = () => {
  const token = localStorage.getItem("token");
  return {
    user: null,
    isAuthenticated: false,
    isLoading: !!token, // Only show loading if there's a token to verify
    error: null,
  };
};

const initialState = getInitialState();

const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_ERROR":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "VERIFICATION_REQUIRED":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch({ type: "AUTH_ERROR", payload: "No token found" });
        return;
      }

      try {
        // authService.getProfile() may return an envelope { success, user, stats }
        // normalize to ensure `user` in context is the actual user object
        const resp = await authService.getProfile();
        const userObj = resp && resp.user ? resp.user : resp;
        dispatch({ type: "AUTH_SUCCESS", payload: userObj });
      } catch (error) {
        // Token is invalid or expired - logout immediately
        localStorage.removeItem("token");
        dispatch({ type: "AUTH_LOGOUT" });
        
        // If this is a 401 error (token expired), redirect will be handled by interceptor
        // For other errors, log for debugging
        if (error.status !== 401) {
          console.error('Auth check failed:', error.message);
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // NOTE: We do NOT dispatch AUTH_START here because PublicRoute shows a loading
      // spinner when isLoading is true, which unmounts the Login component. This would
      // cause any errors to be lost when the component remounts. The LoginPage has its
      // own loading state which handles the button spinner.
      const response = await authService.login(email, password);

      // Check if email verification is required (success response case)
      if (response.requiresVerification) {
        dispatch({ type: "VERIFICATION_REQUIRED" });
        return {
          success: false,
          requiresVerification: true,
          email: response.email,
          error: response.error,
        };
      }

      localStorage.setItem("token", response.token);
      dispatch({ type: "AUTH_SUCCESS", payload: response.user });

      return { success: true };
    } catch (error) {
      // Check if this is a verification required error (403 response)
      // The server returns { error, requiresVerification, email } on 403
      const responseData = error.response?.data || error.data || {};

      if (responseData.requiresVerification) {
        dispatch({ type: "VERIFICATION_REQUIRED" });
        return {
          success: false,
          requiresVerification: true,
          email: responseData.email,
          error: responseData.error,
        };
      }

      // Extract error message properly
      const errorMessage =
        responseData.error ||
        responseData.message ||
        error.message ||
        "Login failed. Please try again.";

      dispatch({ type: "AUTH_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authService.register(userData);

      // Check if email verification is required
      if (response.requiresVerification) {
        // Don't authenticate user - they need to verify email first
        dispatch({ type: "VERIFICATION_REQUIRED" });
        return {
          success: true,
          requiresVerification: true,
          email: response.email,
        };
      }

      // OAuth users or if verification not required (shouldn't happen now)
      localStorage.setItem("token", response.token);
      dispatch({ type: "AUTH_SUCCESS", payload: response.user });

      return { success: true };
    } catch (error) {
      dispatch({ type: "AUTH_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: "AUTH_SUCCESS", payload: updatedUser });
      return { success: true };
    } catch (error) {
      dispatch({ type: "AUTH_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
