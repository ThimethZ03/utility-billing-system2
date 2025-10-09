// pages/Dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import PredictionChart from '../../components/PredictionChart/PredictionChart.jsx';
import { fetchBranches, fetchBills, fetchSummary, checkAlerts } from '../../services/api.js';
import { getUnitsPrediction } from '../../services/predictionAPI.js';
import { Building2, FileText, TrendingUp, DollarSign, AlertCircle, Zap, ArrowRight, AlertTriangle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const nav = useNavigate();
  const [branches, setBranches] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ totals: {}, predicted: {} });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [br, bi, su, al] = await Promise.all([
        fetchBranches(),
        fetchBills({ scope: 'recent' }),
        fetchSummary('monthly'),
        checkAlerts(),
      ]);
      setBranches(br);
      setBills(bi);
      setSummary(su);
      setAlerts(al.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!bills.length) return;
    
    const byMonth = {};
    bills.forEach(b => {
      const d = new Date(b.periodStart || b.createdAt || b.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      if (!byMonth[key]) byMonth[key] = { units: 0, amount: 0, month: d.getMonth(), year: d.getFullYear() };
      byMonth[key].units += Number(b.units || 0);
      byMonth[key].amount += Number(b.amount || 0);
    });
    
    const series = Object.values(byMonth)
      .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)
      .slice(-6);

    const chart = series.map(s => ({
      monthLabel: `${monthNames[s.month]} ${String(s.year).slice(2)}`,
      actualUnits: s.units,
      actualAmount: s.amount,
    }));
    setChartData(chart);

    const mlSeries = series.map((s, idx) => ({ month: idx + 1, units: s.units, amount: s.amount }));
    if (mlSeries.length >= 2) {
      getUnitsPrediction(mlSeries).then((res) => {
        setPrediction(res);
        
        const predictedUnits = res.predicted_units ?? null;
        const predictedAmount = res.predicted_amount ?? null;

        setChartData((prev) => [...prev, {
          monthLabel: 'Next',
          predictedUnits,
          predictedAmount,
        }]);
      }).catch(() => {});
    }
  }, [bills]);

  const totals = useMemo(() => ({
    branches: branches.length,
    pending: bills.filter(b => b.status === 'Pending').length,
    avgUsage: Math.round((chartData.filter(d => d.actualUnits).reduce((a,c)=>a+c.actualUnits,0) / Math.max(1, chartData.filter(d => d.actualUnits).length))),
    nextCost: chartData.find(d => d.monthLabel === 'Next')?.predictedAmount ?? 0,
  }), [branches, bills, chartData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-banner">
          <div className="alerts-header">
            <AlertTriangle size={24} />
            <h3>Active Alerts ({alerts.length})</h3>
          </div>
          <div className="alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.severity}`}>
                <Bell size={18} />
                <div className="alert-content">
                  <strong>{alert.type === 'units' ? 'Usage Alert' : 'Budget Alert'}</strong>
                  <p>{alert.message}</p>
                  <div className="alert-progress">
                    <div 
                      className="alert-progress-bar" 
                      style={{ width: `${Math.min((alert.current / alert.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="alert-percentage">
                    {((alert.current / alert.limit) * 100).toFixed(1)}% of limit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Monitor your utility consumption and costs</p>
        </div>
        <button className="refresh-btn" onClick={load}>
          <Zap size={18} />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon">
            <Building2 size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Total Branches</div>
            <div className="stat-card__value">{totals.branches}</div>
            <div className="stat-card__trend">Active locations</div>
          </div>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="stat-card__icon">
            <FileText size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Pending Bills</div>
            <div className="stat-card__value">{totals.pending}</div>
            <div className="stat-card__trend">Awaiting payment</div>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Avg Monthly Usage</div>
            <div className="stat-card__value">{isFinite(totals.avgUsage) ? totals.avgUsage : 0} <span className="unit">units</span></div>
            <div className="stat-card__trend">Last 6 months</div>
          </div>
        </div>

        <div className="stat-card stat-card--info">
          <div className="stat-card__icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Predicted Cost</div>
            <div className="stat-card__value">Rs. {Number(totals.nextCost).toLocaleString('en-LK')}</div>
            <div className="stat-card__trend">Next month estimate</div>
          </div>
        </div>
      </div>

      {/* Prediction Details Card */}
      {prediction && (
        <div className="prediction-details card">
          <h3>
            <TrendingUp size={20} />
            AI Prediction Insights
          </h3>
          <div className="prediction-grid">
            <div className="prediction-item">
              <span className="prediction-label">Trend</span>
              <span className={`prediction-value trend-${prediction.trend}`}>
                {prediction.trend === 'increasing' ? '📈' : prediction.trend === 'decreasing' ? '📉' : '➡️'} {prediction.trend}
              </span>
            </div>
            <div className="prediction-item">
              <span className="prediction-label">Growth Rate</span>
              <span className="prediction-value">{prediction.growth_rate}%</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-label">Confidence</span>
              <span className={`prediction-value confidence-${prediction.confidence}`}>
                {prediction.confidence}
              </span>
            </div>
            <div className="prediction-item">
              <span className="prediction-label">Avg Cost/Unit</span>
              <span className="prediction-value">Rs. {prediction.avg_cost_per_unit}</span>
            </div>
            {prediction.anomaly_detected && (
              <div className="prediction-item anomaly">
                <span className="prediction-label">⚠️ Anomaly</span>
                <span className="prediction-value">Usage spike detected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Section */}
      <PredictionChart data={chartData} />

      {/* Quick Actions Grid */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-cards">
          <button className="action-card" onClick={() => nav('/bills')}>
            <div className="action-card__icon action-card__icon--blue">
              <FileText size={24} />
            </div>
            <div className="action-card__content">
              <h4>Manage Bills</h4>
              <p>View, create, and update utility bills</p>
            </div>
            <ArrowRight size={20} className="action-card__arrow" />
          </button>

          <button className="action-card" onClick={() => nav('/branches')}>
            <div className="action-card__icon action-card__icon--purple">
              <Building2 size={24} />
            </div>
            <div className="action-card__content">
              <h4>Manage Branches</h4>
              <p>Add and organize your locations</p>
            </div>
            <ArrowRight size={20} className="action-card__arrow" />
          </button>

          <button className="action-card" onClick={() => nav('/reports')}>
            <div className="action-card__icon action-card__icon--green">
              <TrendingUp size={24} />
            </div>
            <div className="action-card__content">
              <h4>View Reports</h4>
              <p>Export and analyze usage data</p>
            </div>
            <ArrowRight size={20} className="action-card__arrow" />
          </button>
        </div>
      </div>

      {/* Insights Card */}
      <div className="insights-card">
        <div className="insights-header">
          <AlertCircle size={20} />
          <h3>Insights & Recommendations</h3>
        </div>
        <ul className="insights-list">
          <li className="insight-item">
            <span className="insight-icon">📊</span>
            <div>
              <strong>Usage Trend:</strong> {prediction?.trend === 'increasing' ? 'Increasing' : prediction?.trend === 'decreasing' ? 'Decreasing' : 'Stable'} consumption detected. {prediction?.trend === 'increasing' ? 'Monitor budget allocation.' : 'Good efficiency!'}
            </div>
          </li>
          <li className="insight-item">
            <span className="insight-icon">⏰</span>
            <div>
              <strong>Payment Reminder:</strong> {totals.pending} bills pending. Set reminders for due dates within 5 days.
            </div>
          </li>
          {prediction?.anomaly_detected && (
            <li className="insight-item">
              <span className="insight-icon">⚠️</span>
              <div>
                <strong>Anomaly Alert:</strong> Unusual usage spike detected. Check for equipment malfunction or meter errors.
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
