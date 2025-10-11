// services/api.js
import axios from 'axios';
import { sendThresholdAlert } from './emailServiceWeb3';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Create axios instance
const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor - add auth token
http.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor - handle errors
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('user');
      window.location.href = '/login';
    }
    console.error('API error:', err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ==================== MOCK DATA ====================

const MOCK_BRANCHES = [
  { _id: 'br1', name: 'Colombo Main Office', location: 'Fort, Colombo 01' },
  { _id: 'br2', name: 'Kandy Branch', location: 'Kandy City Centre' },
  { _id: 'br3', name: 'Galle Branch', location: 'Galle Fort Area' },
];

const MOCK_BILLS = [
  { _id: 'b1', branchId: 'br1', type: 'Electricity', units: 520, amount: 23400, dueDate: '2025-10-15', status: 'Pending', periodStart: '2025-09-01', createdAt: '2025-09-28' },
  { _id: 'b2', branchId: 'br1', type: 'Water', units: 180, amount: 3600, dueDate: '2025-10-15', status: 'Pending', periodStart: '2025-09-01', createdAt: '2025-09-28' },
  { _id: 'b3', branchId: 'br2', type: 'Electricity', units: 450, amount: 20250, dueDate: '2025-10-12', status: 'Paid', periodStart: '2025-09-01', createdAt: '2025-09-27' },
  { _id: 'b4', branchId: 'br3', type: 'Electricity', units: 610, amount: 27450, dueDate: '2025-10-18', status: 'Pending', periodStart: '2025-09-01', createdAt: '2025-09-29' },
  { _id: 'b5', branchId: 'br1', type: 'Electricity', units: 500, amount: 22500, dueDate: '2025-09-15', status: 'Paid', periodStart: '2025-08-01', createdAt: '2025-08-28' },
  { _id: 'b6', branchId: 'br2', type: 'Electricity', units: 430, amount: 19350, dueDate: '2025-09-12', status: 'Paid', periodStart: '2025-08-01', createdAt: '2025-08-27' },
  { _id: 'b7', branchId: 'br3', type: 'Electricity', units: 580, amount: 26100, dueDate: '2025-09-18', status: 'Paid', periodStart: '2025-08-01', createdAt: '2025-08-29' },
];

let localBranches = [...MOCK_BRANCHES];
let localBills = [...MOCK_BILLS];
let idCounter = 100;

// Track last alert sent to prevent spam
let lastAlertSent = {
  units: null,
  amount: null
};

// ==================== BRANCHES ====================

export const fetchBranches = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...localBranches]), 300);
  });
};

export const createBranch = async (payload) => {
  return new Promise((resolve) => {
    const newBranch = { 
      _id: `br${idCounter++}`, 
      ...payload,
      createdAt: new Date().toISOString()
    };
    localBranches.push(newBranch);
    setTimeout(() => resolve(newBranch), 200);
  });
};

export const updateBranch = async (id, payload) => {
  return new Promise((resolve, reject) => {
    const idx = localBranches.findIndex((b) => b._id === id);
    if (idx >= 0) {
      localBranches[idx] = { 
        ...localBranches[idx], 
        ...payload,
        updatedAt: new Date().toISOString()
      };
      setTimeout(() => resolve(localBranches[idx]), 200);
    } else {
      reject(new Error('Branch not found'));
    }
  });
};

export const deleteBranch = async (id) => {
  return new Promise((resolve) => {
    localBranches = localBranches.filter((b) => b._id !== id);
    setTimeout(() => resolve({ success: true }), 200);
  });
};

// ==================== BILLS ====================

export const fetchBills = async (params = {}) => {
  return new Promise((resolve) => {
    const enriched = localBills.map((b) => {
      const branch = localBranches.find((br) => br._id === b.branchId);
      return {
        ...b,
        branchName: branch?.name || 'Unknown Branch',
        branchLocation: branch?.location || '',
      };
    });
    setTimeout(() => resolve(enriched), 300);
  });
};

export const getAllBills = fetchBills;

export const createBill = async (payload) => {
  return new Promise((resolve) => {
    const newBill = {
      _id: `b${idCounter++}`,
      ...payload,
      createdAt: new Date().toISOString(),
      periodStart: payload.periodStart || new Date().toISOString().split('T')[0],
    };
    localBills.push(newBill);
    setTimeout(() => resolve(newBill), 200);
  });
};

export const updateBill = async (id, payload) => {
  return new Promise((resolve, reject) => {
    const idx = localBills.findIndex((b) => b._id === id);
    if (idx >= 0) {
      localBills[idx] = { 
        ...localBills[idx], 
        ...payload,
        updatedAt: new Date().toISOString()
      };
      setTimeout(() => resolve(localBills[idx]), 200);
    } else {
      reject(new Error('Bill not found'));
    }
  });
};

export const markBillStatus = async (id, status) => {
  return updateBill(id, { status });
};

export const deleteBill = async (id) => {
  return new Promise((resolve) => {
    localBills = localBills.filter((b) => b._id !== id);
    setTimeout(() => resolve({ success: true }), 200);
  });
};

// ==================== SUMMARIES ====================

export const fetchSummary = async (scope = 'monthly') => {
  return new Promise((resolve) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyBills = localBills.filter((b) => {
      const d = new Date(b.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalUnits = monthlyBills.reduce((sum, b) => sum + Number(b.units || 0), 0);
    const totalAmount = monthlyBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalBills = monthlyBills.length;
    const paidBills = monthlyBills.filter(b => b.status === 'Paid').length;
    const pendingBills = monthlyBills.filter(b => b.status === 'Pending').length;

    setTimeout(() => resolve({
      totalUnits,
      totalAmount,
      totalBills,
      paidBills,
      pendingBills,
      scope
    }), 200);
  });
};

// ==================== PREDICTIONS ====================

export const fetchPredictions = async (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([]), 200);
  });
};

// ==================== ALERT SYSTEM ====================

/**
 * Get alert settings from localStorage or defaults
 */
export const getAlertSettings = async () => {
  return new Promise((resolve) => {
    try {
      const saved = localStorage.getItem('alert_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setTimeout(() => resolve(settings), 200);
        return;
      }
    } catch (e) {
      console.error('Error loading saved settings:', e);
    }

    const defaultSettings = {
      maxMonthlyAmount: 80000,
      maxMonthlyUnits: 1500,
      alertEmails: [],
      enableEmailAlerts: false,
      enablePushAlerts: true,
    };

    setTimeout(() => resolve(defaultSettings), 200);
  });
};

/**
 * Update alert settings and save to localStorage
 */
export const updateAlertSettings = async (payload) => {
  return new Promise((resolve) => {
    try {
      const saved = localStorage.getItem('alert_settings');
      const existing = saved ? JSON.parse(saved) : {};

      const updated = {
        ...existing,
        ...payload,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('alert_settings', JSON.stringify(updated));

      setTimeout(() => resolve(updated), 200);
    } catch (error) {
      console.error('Error saving settings:', error);
      setTimeout(() => resolve(payload), 200);
    }
  });
};

/**
 * Check if we should send alert (prevent spam - max 1 per day per type)
 */
const shouldSendAlert = (alertType) => {
  const lastSent = lastAlertSent[alertType];
  if (!lastSent) return true;
  
  const hoursSince = (Date.now() - lastSent) / (1000 * 60 * 60);
  return hoursSince >= 24; // Send max once per 24 hours
};

/**
 * Mark alert as sent
 */
const markAlertSent = (alertType) => {
  lastAlertSent[alertType] = Date.now();
  localStorage.setItem('last_alert_sent', JSON.stringify(lastAlertSent));
};

/**
 * Check if current usage exceeds limits and send emails
 */
export const checkAlerts = async () => {
  return new Promise(async (resolve) => {
    try {
      const settings = await getAlertSettings();

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyBills = localBills.filter((b) => {
        const d = new Date(b.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const totalUnits = monthlyBills.reduce((sum, b) => sum + Number(b.units || 0), 0);
      const totalAmount = monthlyBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

      const alerts = [];
      const emailResults = [];

      // Check units threshold
      if (totalUnits > settings.maxMonthlyUnits) {
        const percentage = Math.round((totalUnits / settings.maxMonthlyUnits) * 100);
        
        const alert = {
          type: 'units',
          message: `Monthly units (${totalUnits}) exceeded limit (${settings.maxMonthlyUnits})`,
          severity: 'warning',
          current: totalUnits,
          limit: settings.maxMonthlyUnits,
          percentage
        };
        
        alerts.push(alert);

        // Send email if enabled and not sent recently
        if (settings.enableEmailAlerts && shouldSendAlert('units')) {
          try {
            const emailResult = await sendThresholdAlert(settings, alert);
            emailResults.push({ type: 'units', ...emailResult });
            
            if (emailResult.success) {
              markAlertSent('units');
              console.log('✅ Units alert email sent');
            }
          } catch (emailError) {
            console.error('Email send error:', emailError);
            emailResults.push({ type: 'units', success: false, error: emailError.message });
          }
        }
      }

      // Check amount threshold
      if (totalAmount > settings.maxMonthlyAmount) {
        const percentage = Math.round((totalAmount / settings.maxMonthlyAmount) * 100);
        
        const alert = {
          type: 'amount',
          message: `Monthly amount (Rs. ${totalAmount.toLocaleString('en-IN')}) exceeded limit (Rs. ${settings.maxMonthlyAmount.toLocaleString('en-IN')})`,
          severity: 'danger',
          current: totalAmount,
          limit: settings.maxMonthlyAmount,
          percentage
        };
        
        alerts.push(alert);

        // Send email if enabled and not sent recently
        if (settings.enableEmailAlerts && shouldSendAlert('amount')) {
          try {
            const emailResult = await sendThresholdAlert(settings, alert);
            emailResults.push({ type: 'amount', ...emailResult });
            
            if (emailResult.success) {
              markAlertSent('amount');
              console.log('✅ Amount alert email sent');
            }
          } catch (emailError) {
            console.error('Email send error:', emailError);
            emailResults.push({ type: 'amount', success: false, error: emailError.message });
          }
        }
      }

      setTimeout(() => resolve({ 
        alerts, 
        totalUnits, 
        totalAmount,
        settings,
        emailResults,
        emailsSent: emailResults.filter(r => r.success).length
      }), 200);

    } catch (error) {
      console.error('Check alerts error:', error);
      resolve({ 
        alerts: [], 
        totalUnits: 0, 
        totalAmount: 0,
        emailResults: [],
        emailsSent: 0
      });
    }
  });
};

// ==================== EXPORTS ====================

/**
 * Export bills as CSV
 */
export const exportCSV = () => {
  try {
    const headers = ['Branch', 'Type', 'Units', 'Amount', 'Due Date', 'Status'];
    const rows = localBills.map(b => {
      const branch = localBranches.find(br => br._id === b.branchId);
      return [
        branch?.name || 'Unknown',
        b.type,
        b.units,
        b.amount,
        new Date(b.dueDate).toLocaleDateString('en-IN'),
        b.status
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utility_bills_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export error:', error);
    alert('Failed to export CSV');
  }
};

/**
 * Export bills as Excel (browser download)
 */
export const exportExcel = () => {
  const token = localStorage.getItem('auth_token');
  window.open(`${API_BASE_URL}/exports/excel?token=${token}`, '_blank');
};

/**
 * Export summary report as Excel
 */
export const exportSummaryExcel = () => {
  const token = localStorage.getItem('auth_token');
  window.open(`${API_BASE_URL}/exports/summary-excel?token=${token}`, '_blank');
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Reset mock data to initial state (for testing)
 */
export const resetMockData = () => {
  localBranches = [...MOCK_BRANCHES];
  localBills = [...MOCK_BILLS];
  idCounter = 100;
  localStorage.removeItem('alert_settings');
  localStorage.removeItem('last_alert_sent');
  lastAlertSent = { units: null, amount: null };
  return { success: true };
};

/**
 * Get mock data statistics
 */
export const getMockStats = () => {
  return {
    branches: localBranches.length,
    bills: localBills.length,
    totalUnits: localBills.reduce((sum, b) => sum + b.units, 0),
    totalAmount: localBills.reduce((sum, b) => sum + b.amount, 0)
  };
};

/**
 * Manually trigger alert check (for testing)
 */
export const triggerAlertCheck = async () => {
  console.log('🔔 Manually checking alerts...');
  const result = await checkAlerts();
  console.log('Alert check result:', result);
  return result;
};
