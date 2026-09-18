import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartq_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('smartq_token');
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
          localStorage.setItem('smartq_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Auth verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('smartq_token', res.token);
    const userData = { _id: res._id, name: res.name, email: res.email, role: res.role, phone: res.phone };
    localStorage.setItem('smartq_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone, role = 'user') => {
    const res = await api.post('/auth/register', { name, email, password, phone, role });
    localStorage.setItem('smartq_token', res.token);
    const userData = { _id: res._id, name: res.name, email: res.email, role: res.role, phone: res.phone };
    localStorage.setItem('smartq_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('smartq_token');
    localStorage.removeItem('smartq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
