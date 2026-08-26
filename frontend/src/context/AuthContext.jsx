import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.warn('Failed to parse cached user state:', e);
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on startup
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    validateToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await API.post('/auth/login', { username, password });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || (error.code === 'ERR_NETWORK' || !error.response ? 'Unable to connect to backend server. Please verify backend is running.' : 'Login failed. Please check your credentials.');
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
