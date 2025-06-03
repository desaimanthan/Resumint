'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
  handleSessionExpired: () => void;
}

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get stored access token
  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  };

  // Set access token
  const setAccessToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  };

  // Track if we're currently refreshing to prevent infinite loops
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const MAX_REFRESH_ATTEMPTS = 3;
  const REFRESH_COOLDOWN = 5000; // 5 seconds

  // API call helper with automatic token refresh
  const apiCall = async (endpoint: string, options: RequestInit = {}, skipTokenRefresh = false) => {
    const makeRequest = async (token: string | null) => {
      const config: RequestInit = {
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        credentials: 'include',
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.message?.includes('token')) {
          throw new Error('TOKEN_EXPIRED');
        }
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    };

    try {
      const token = getAccessToken();
      return await makeRequest(token);
    } catch (error) {
      // If token expired and we're not already refreshing and this isn't a refresh call itself
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED' && !skipTokenRefresh && !isRefreshing && endpoint !== '/auth/refresh-token') {
        try {
          console.log('Token expired, attempting refresh...');
          setIsRefreshing(true);
          await refreshTokenInternal();
          const newToken = getAccessToken();
          return await makeRequest(newToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Use the handleSessionExpired function for proper toast and redirect
          handleSessionExpired();
          throw new Error('Session expired. Please login again.');
        } finally {
          setIsRefreshing(false);
        }
      }
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
    } catch (error) {
      throw error;
    }
  };

  // Signup function
  const signup = async (userData: SignupData) => {
    try {
      const data = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  // Internal refresh token function (doesn't use apiCall to avoid loops)
  const refreshTokenInternal = async () => {
    const now = Date.now();
    
    // Check if we're in cooldown period
    if (now - lastRefreshTime < REFRESH_COOLDOWN) {
      throw new Error('Token refresh in cooldown period');
    }
    
    // Check if we've exceeded max attempts
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.error('Max refresh attempts exceeded');
      handleSessionExpired();
      throw new Error('Max refresh attempts exceeded');
    }
    
    try {
      setRefreshAttempts(prev => prev + 1);
      setLastRefreshTime(now);
      
      const config: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      };

      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      setAccessToken(data.data.accessToken);
      // Reset attempts on successful refresh
      setRefreshAttempts(0);
      return data.data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If this was the last attempt, clear auth state
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS - 1) {
        setUser(null);
        setAccessToken(null);
      }
      throw error;
    }
  };

  // Public refresh token function
  const refreshToken = async () => {
    if (isRefreshing) {
      throw new Error('Token refresh already in progress');
    }
    return refreshTokenInternal();
  };

  // Get current user
  const getCurrentUser = async () => {
    try {
      const data = await apiCall('/auth/me');
      setUser(data.data.user);
    } catch (error) {
      // If this fails, the apiCall will handle token refresh automatically
      // Don't manually refresh here to avoid infinite loops
      console.error('Failed to get current user:', error);
      setUser(null);
      setAccessToken(null);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      
      if (token) {
        await getCurrentUser();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    await getCurrentUser();
  };

  // Handle session expiration with toast and redirect
  const handleSessionExpired = () => {
    setUser(null);
    setAccessToken(null);
    
    if (typeof window !== 'undefined') {
      // Show toast notification
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
      });
      
      // Don't redirect to login if we're on a portfolio page (public pages)
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/portfolio/')) {
        // Use a small delay to ensure toast is shown before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshToken,
    refreshUser,
    apiCall,
    handleSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
