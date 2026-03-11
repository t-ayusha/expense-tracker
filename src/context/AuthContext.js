import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = 'https://expense-tracker-w5ch.onrender.com/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load current user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('expense_current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Sign up new user
  const signUp = async (email, password, name) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      const user = data.user;
      setCurrentUser(user);
      localStorage.setItem('expense_current_user', JSON.stringify(user));
      return user;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please make sure the server is running.');
      }
      throw new Error(error.message);
    }
  };

  // Sign in existing user
  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      const user = data.user;
      setCurrentUser(user);
      localStorage.setItem('expense_current_user', JSON.stringify(user));
      return user;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please make sure the server is running.');
      }
      throw new Error(error.message);
    }
  };

  // Sign out current user
  const signOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('expense_current_user');
  };

  // Update user profile
  const updateProfile = (updates) => {
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('expense_current_user', JSON.stringify(updatedUser));
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

