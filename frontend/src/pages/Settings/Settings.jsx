import React, { useState, useEffect } from 'react';
import './Settings.css';
import { Settings as SettingsIcon, Save, AlertTriangle, DollarSign, Zap, Mail, Bell } from 'lucide-react';
import { getAlertSettings, updateAlertSettings } from '../../services/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    maxMonthlyAmount: 80000,
    maxMonthlyUnits: 1500,
    alertEmails: [],
    enableEmailAlerts: false,
    enablePushAlerts: true
  });
  
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getAlertSettings();
      setSettings({
        maxMonthlyAmount: data.maxMonthlyAmount || 80000,
        maxMonthlyUnits: data.maxMonthlyUnits || 1500,
        alertEmails: data.alertEmails || [],
        enableEmailAlerts: data.enableEmailAlerts || false,
        enablePushAlerts: data.enablePushAlerts !== false
      });
    } catch (error) {
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateAlertSettings(settings);
      showMessage('success', 'Settings saved successfully!');
    } catch (error) {
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const addEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newEmail && emailRegex.test(newEmail)) {
      if (!settings.alertEmails.includes(newEmail)) {
        setSettings(prev => ({
          ...prev,
          alertEmails: [...prev.alertEmails, newEmail]
        }));
        setNewEmail('');
      } else {
        showMessage('error', 'Email already added');
      }
    } else {
      showMessage('error', 'Please enter a valid email');
    }
  };

  const removeEmail = (email) => {
    setSettings(prev => ({
      ...prev,
      alertEmails: prev.alertEmails.filter(e => e !== email)
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-large"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">
            <SettingsIcon size={32} />
            Alert Settings
          </h1>
          <p className="settings-subtitle">Configure usage thresholds and notification preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Threshold Settings */}
        <div className="card settings-card">
          <h3 className="card-title">
            <AlertTriangle size={20} />
            Usage Thresholds
          </h3>
          <p className="card-description">
            Set monthly limits for utility usage. You'll receive alerts when consumption exceeds these values.
          </p>

          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-icon amount">
                <DollarSign size={24} />
              </div>
              <div className="setting-content">
                <label htmlFor="maxAmount">Maximum Monthly Amount (LKR)</label>
                <p className="setting-help">Alert when total monthly cost exceeds this limit</p>
                <div className="input-wrapper">
                  <span className="input-prefix">Rs.</span>
                  <input
                    id="maxAmount"
                    type="number"
                    className="input"
                    value={settings.maxMonthlyAmount}
                    onChange={(e) => handleInputChange('maxMonthlyAmount', Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-icon units">
                <Zap size={24} />
              </div>
              <div className="setting-content">
                <label htmlFor="maxUnits">Maximum Monthly Units</label>
                <p className="setting-help">Alert when total monthly usage exceeds this limit</p>
                <div className="input-wrapper">
                  <input
                    id="maxUnits"
                    type="number"
                    className="input"
                    value={settings.maxMonthlyUnits}
                    onChange={(e) => handleInputChange('maxMonthlyUnits', Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                  <span className="input-suffix">units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card settings-card">
          <h3 className="card-title">
            <Bell size={20} />
            Notification Preferences
          </h3>
          <p className="card-description">
            Choose how you want to receive alert notifications
          </p>

          <div className="settings-group">
            <div className="toggle-item">
              <div className="toggle-content">
                <label htmlFor="emailAlerts">Email Notifications</label>
                <p className="setting-help">Send alerts to your email addresses</p>
              </div>
              <label className="toggle-switch">
                <input
                  id="emailAlerts"
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => handleInputChange('enableEmailAlerts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-content">
                <label htmlFor="pushAlerts">Dashboard Alerts</label>
                <p className="setting-help">Show alerts on the dashboard</p>
              </div>
              <label className="toggle-switch">
                <input
                  id="pushAlerts"
                  type="checkbox"
                  checked={settings.enablePushAlerts}
                  onChange={(e) => handleInputChange('enablePushAlerts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Email Management */}
        <div className="card settings-card">
          <h3 className="card-title">
            <Mail size={20} />
            Alert Email Addresses
          </h3>
          <p className="card-description">
            Manage email addresses that will receive alert notifications
          </p>

          <div className="email-input-group">
            <input
              type="email"
              className="input"
              placeholder="Enter email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEmail()}
            />
            <button className="add-email-btn" onClick={addEmail}>
              Add Email
            </button>
          </div>

          {settings.alertEmails.length > 0 ? (
            <div className="email-list">
              {settings.alertEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <Mail size={16} />
                  <span>{email}</span>
                  <button className="remove-email-btn" onClick={() => removeEmail(email)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-emails">
              <p>No email addresses added yet</p>
            </div>
          )}
        </div>

        {/* Preview Card */}
        <div className="card preview-card">
          <h3 className="card-title">Alert Preview</h3>
          <div className="preview-alert warning">
            <AlertTriangle size={20} />
            <div>
              <strong>Usage Alert</strong>
              <p>Monthly units (1650) exceeded limit ({settings.maxMonthlyUnits})</p>
              <div className="preview-progress">
                <div className="preview-progress-bar" style={{ width: '110%' }}></div>
              </div>
              <span className="preview-percentage">110% of limit</span>
            </div>
          </div>

          <div className="preview-alert danger">
            <AlertTriangle size={20} />
            <div>
              <strong>Budget Alert</strong>
              <p>Monthly amount (Rs. {(settings.maxMonthlyAmount * 1.15).toLocaleString('en-LK')}) exceeded limit (Rs. {settings.maxMonthlyAmount.toLocaleString('en-LK')})</p>
              <div className="preview-progress">
                <div className="preview-progress-bar" style={{ width: '115%' }}></div>
              </div>
              <span className="preview-percentage">115% of limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`message-toast ${message.type}`}>
          {message.type === 'success' ? '✓' : '⚠'} {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="save-actions">
        <button className="save-btn" onClick={handleSave} disabled={saveLoading}>
          {saveLoading ? (
            <>
              <div className="spinner"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
