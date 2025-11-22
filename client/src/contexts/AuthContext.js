import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_BASE_URL = 'http://localhost:5000/api';

  axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`);
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
        email,
        password,
      });

      if (response.data.message) {
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const sendMessage = async (message, chatId = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/message`, {
        message,
        chatId,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const createNewChat = async (title = 'New Chat') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/new`, {
        title,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create new chat');
    }
  };

  const getChatList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/list`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get chat list');
    }
  };

  const getChatMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${chatId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get chat messages');
    }
  };

  const searchChat = async (chatId, searchTerm) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/search`, {
        chatId,
        searchTerm,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search chat');
    }
  };

  const updateChatTitle = async (chatId, title) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/chat/title/${chatId}`, {
        title,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update chat title');
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/chat/delete/${chatId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    sendMessage,
    createNewChat,
    getChatList,
    getChatMessages,
    searchChat,
    updateChatTitle,
    deleteChat,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};