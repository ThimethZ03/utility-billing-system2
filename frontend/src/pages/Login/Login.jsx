// pages/Login/Login.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Building2, Mail, Lock, ArrowRight } from "lucide-react";
import './Login.css';
import { login } from '../../services/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const nav = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await login(formData.email, formData.password);
      if (response?.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setTimeout(() => nav('/'), 300);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <div className="login-page">
      {/* Left side - Branding */}
      <div className="login-left">
        <div className="brand-section">
          <div className="brand-icon">
            <Building2 size={48} />
          </div>
          <h1>Smart Utility Manager</h1>
          <p>Streamline your multi-branch utility bill payments with our comprehensive management platform</p>
          
          <div className="features">
            <div className="feature">
              <div className="feature-icon">✓</div>
              <span>Multi-Branch Support</span>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <span>Real-Time Analytics</span>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <span>ML-Based Predictions</span>
            </div>
          </div>
        </div>
        
        {/* Animated gradient background */}
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className={`input-group ${focusedField === 'email' ? 'focused' : ''} ${formData.email ? 'filled' : ''}`}>
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                placeholder=" "
              />
              <label>Email Address</label>
              <span className="input-border"></span>
            </div>

            {/* Password Field */}
            <div className={`input-group ${focusedField === 'password' ? 'focused' : ''} ${formData.password ? 'filled' : ''}`}>
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                placeholder=" "
              />
              <label>Password</label>
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <span className="input-border"></span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-alert">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? (
                <>
                  <span className="loader"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} className="arrow-icon" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="demo-section">
            <div className="divider">
              <span>Quick Access</span>
            </div>
            
            <div className="demo-cards">
              <button 
                className="demo-card"
                onClick={() => fillDemo('admin@utility.com', 'admin123')}
                type="button"
              >
                <div className="demo-badge admin">Admin</div>
                <p>admin@utility.com</p>
              </button>
              
              <button 
                className="demo-card"
                onClick={() => fillDemo('viewer@utility.com', 'viewer123')}
                type="button"
              >
                <div className="demo-badge viewer">Viewer</div>
                <p>viewer@utility.com</p>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <p>&copy; 2025 Smart Utilities. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;