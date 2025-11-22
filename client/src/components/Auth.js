import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/chat');
        }, 1500);
      } else {
        setMessage(result.message);
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setMessage('Passwords do not match!');
        setLoading(false);
        return;
      }

      const result = await register(formData.username, formData.email, formData.password);
      if (result.success) {
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      } else {
        setMessage(result.message);
      }
    }
    setLoading(false);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setMessage('');
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-form">
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin}
                  minLength="3"
                  maxLength="30"
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  minLength="6"
                />
              </div>
            )}
            
            <button type="submit" disabled={loading} className="auth-button">
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
          
          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="toggle-button"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
          
          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;