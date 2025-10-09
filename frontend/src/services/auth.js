// services/auth.js
import axios from 'axios';

const AUTH_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Demo credentials for instant testing
const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@utility.com',
    password: 'admin123',
  },
  viewer: {
    email: 'viewer@utility.com',
    password: 'viewer123',
  }
};

/**
 * Login function - supports both demo and real API
 */
export const login = async (email, password) => {
  // Demo mode check
  if (email === DEMO_CREDENTIALS.admin.email && password === DEMO_CREDENTIALS.admin.password) {
    return {
      token: 'demo_jwt_token_admin_' + Date.now(),
      user: {
        id: 'demo_admin_1',
        name: 'Admin User',
        email: email,
        role: 'admin',
        avatar: '⚡',
      },
    };
  }

  if (email === DEMO_CREDENTIALS.viewer.email && password === DEMO_CREDENTIALS.viewer.password) {
    return {
      token: 'demo_jwt_token_viewer_' + Date.now(),
      user: {
        id: 'demo_viewer_1',
        name: 'Viewer User',
        email: email,
        role: 'viewer',
        avatar: '👤',
      },
    };
  }

  // Real API call
  try {
    const { data } = await axios.post(`${AUTH_BASE_URL}/auth/login`, { 
      email, 
      password 
    }, { 
      withCredentials: true 
    });
    return data;
  } catch (err) {
    console.error('Login error:', err);
    throw new Error(err.response?.data?.message || 'Invalid credentials');
  }
};

/**
 * Register function - real API only
 */
export const register = async (name, email, password) => {
  try {
    const { data } = await axios.post(`${AUTH_BASE_URL}/auth/register`, {
      name,
      email,
      password
    }, {
      withCredentials: true
    });
    return data;
  } catch (err) {
    console.error('Register error:', err);
    throw new Error(err.response?.data?.message || 'Registration failed');
  }
};

/**
 * Logout function
 */
export const logout = async () => {
  try {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Try to call API logout (optional, won't fail if backend not available)
    try {
      await axios.post(`${AUTH_BASE_URL}/auth/logout`, {}, { 
        withCredentials: true 
      });
    } catch (e) {
      // Ignore logout API errors
      console.log('API logout skipped (demo mode or offline)');
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    // Fallback for demo mode
    return {
      email: 'admin@utility.com',
      name: 'Admin User',
      role: 'admin'
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

/**
 * Set auth data after login
 */
export const setAuthData = (token, user) => {
  try {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Set auth data error:', error);
    return false;
  }
};

/**
 * Get auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Clear auth data
 */
export const clearAuthData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};
