// pages/Dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import PredictionChart from '../../components/PredictionChart/PredictionChart.jsx';
import { fetchBranches, fetchBills, fetchSummary, checkAlerts, getAllBranchesPredictions } from '../../services/api.js';
import { getUnitsPrediction } from '../../services/predictionAPI.js';
import { 
  Building2, FileText, TrendingUp, DollarSign, AlertCircle, Zap, 
  ArrowRight, AlertTriangle, Bell, Calendar, CheckCircle, Activity,
  TrendingDown, Minus, Settings, Download, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const nav = useNavigate();
  const [branches, setBranches] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ totals: {}, predicted: {} });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [branchPredictions, setBranchPredictions] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [br, bi, su, al, bp] = await Promise.all([
        fetchBranches(),
        fetchBills({ scope: 'recent' }),
        fetchSummary('monthly'),
        checkAlerts(),
        getAllBranchesPredictions(),
      ]);
      setBranches(br);
      setBills(bi);
      setSummary(su);
      setAlerts(al.alerts || []);
      setBranchPredictions(bp.predictions || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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

  const totals = useMemo(() => {
    const totalAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const paidAmount = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.amount || 0), 0);
    const pendingAmount = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (b.amount || 0), 0);
    
    return {
      branches: branches.length,
      totalBills: bills.length,
      paid: bills.filter(b => b.status === 'Paid').length,
      pending: bills.filter(b => b.status === 'Pending').length,
      overdue: bills.filter(b => b.status === 'Overdue').length,
      totalAmount,
      paidAmount,
      pendingAmount,
      avgUsage: Math.round((chartData.filter(d => d.actualUnits).reduce((a,c)=>a+c.actualUnits,0) / Math.max(1, chartData.filter(d => d.actualUnits).length))),
      nextCost: chartData.find(d => d.monthLabel === 'Next')?.predictedAmount ?? 0,
    };
  }, [branches, bills, chartData]);

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="trend-up" size={18} />;
    if (trend === 'decreasing') return <TrendingDown className="trend-down" size={18} />;
    return <Minus className="trend-stable" size={18} />;
  };

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
        <div className="alerts-banner glass-card">
          <div className="alerts-header">
            <div className="alerts-title">
              <AlertTriangle size={24} />
              <h3>Active Alerts ({alerts.length})</h3>
            </div>
            <button className="alerts-settings-btn" onClick={() => nav('/settings')}>
              <Settings size={16} />
              Settings
            </button>
          </div>
          <div className="alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.severity}`}>
                <Bell size={18} />
                <div className="alert-content">
                  <strong>{alert.type === 'units' ? '⚡ Usage Alert' : '💰 Budget Alert'}</strong>
                  <p>{alert.message}</p>
                  <div className="alert-progress">
                    <div 
                      className="alert-progress-bar" 
                      style={{ width: `${Math.min(alert.percentage || (alert.current / alert.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="alert-percentage">
                    {(alert.percentage || (alert.current / alert.limit) * 100).toFixed(1)}% of limit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="dashboard-header glass-card">
        <div>
          <h1 className="dashboard-title">📊 Dashboard Overview</h1>
          <p className="dashboard-subtitle">Real-time monitoring of utility consumption and costs</p>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-cards">
        <div className="stat-card stat-card--primary glass-card">
          <div className="stat-card__icon">
            <Building2 size={28} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Total Branches</div>
            <div className="stat-card__value">{totals.branches}</div>
            <div className="stat-card__trend">
              <Activity size={14} />
              Active locations
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--warning glass-card">
          <div className="stat-card__icon">
            <FileText size={28} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Pending Bills</div>
            <div className="stat-card__value">{totals.pending}</div>
            <div className="stat-card__trend">
              <Calendar size={14} />
              Rs. {totals.pendingAmount.toLocaleString('en-LK')}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--success glass-card">
          <div className="stat-card__icon">
            <CheckCircle size={28} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Paid Bills</div>
            <div className="stat-card__value">{totals.paid}</div>
            <div className="stat-card__trend">
              <DollarSign size={14} />
              Rs. {totals.paidAmount.toLocaleString('en-LK')}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card--info glass-card">
          <div className="stat-card__icon">
            <TrendingUp size={28} />
          </div>
          <div className="stat-card__content">
            <div className="stat-card__label">Avg Monthly Usage</div>
            <div className="stat-card__value">
              {isFinite(totals.avgUsage) ? totals.avgUsage : 0} 
              <span className="unit">units</span>
            </div>
            <div className="stat-card__trend">
              <Zap size={14} />
              Last 6 months
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Chart Section */}
        <div className="chart-section">
          <PredictionChart data={chartData} />
        </div>

        {/* Prediction Details */}
        {prediction && (
          <div className="prediction-details glass-card">
            <h3 className="section-header">
              <TrendingUp size={20} />
              AI Prediction Insights
            </h3>
            <div className="prediction-grid">
              <div className="prediction-item">
                <span className="prediction-label">Next Month Cost</span>
                <span className="prediction-value highlight">
                  Rs. {Number(prediction.predicted_amount || 0).toLocaleString('en-LK')}
                </span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Predicted Usage</span>
                <span className="prediction-value">
                  {prediction.predicted_units} units
                </span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Trend</span>
                <span className={`prediction-value trend-${prediction.trend}`}>
                  {getTrendIcon(prediction.trend)}
                  {prediction.trend}
                </span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Growth Rate</span>
                <span className={`prediction-value ${prediction.growth_rate > 0 ? 'positive' : 'negative'}`}>
                  {prediction.growth_rate > 0 ? '+' : ''}{prediction.growth_rate}%
                </span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Confidence</span>
                <span className={`prediction-value confidence-${prediction.confidence}`}>
                  {prediction.confidence}
                </span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Avg Cost/Unit</span>
                <span className="prediction-value">
                  Rs. {prediction.avg_cost_per_unit}
                </span>
              </div>
            </div>
            {prediction.anomaly_detected && (
              <div className="anomaly-alert">
                <AlertTriangle size={16} />
                <span>Unusual usage spike detected - investigate equipment</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Branch Predictions */}
      {branchPredictions.length > 0 && (
        <div className="branch-predictions">
          <h3 className="section-title">
            <Building2 size={20} />
            Branch-wise Predictions
          </h3>
          <div className="branch-predictions-grid">
            {branchPredictions.filter(p => p.status === 'success').map((pred, idx) => (
              <div key={idx} className="branch-prediction-card glass-card">
                <div className="branch-prediction-header">
                  <div>
                    <h4>{pred.branch.name}</h4>
                    <p className="branch-location">{pred.branch.location}</p>
                  </div>
                  <span className={`trend-badge trend-${pred.trend}`}>
                    {getTrendIcon(pred.trend)}
                  </span>
                </div>
                <div className="branch-prediction-stats">
                  <div className="branch-stat">
                    <span className="branch-stat-label">Next Month</span>
                    <span className="branch-stat-value">{pred.predicted_units} units</span>
                  </div>
                  <div className="branch-stat">
                    <span className="branch-stat-label">Est. Cost</span>
                    <span className="branch-stat-value">Rs. {pred.predicted_amount.toLocaleString('en-LK')}</span>
                  </div>
                  <div className="branch-stat">
                    <span className="branch-stat-label">Growth</span>
                    <span className={`branch-stat-value ${parseFloat(pred.growth_rate) > 0 ? 'positive' : 'negative'}`}>
                      {pred.growth_rate > 0 ? '+' : ''}{pred.growth_rate}%
                    </span>
                  </div>
                </div>
                <div className="branch-prediction-footer">
                  <span className={`confidence-badge confidence-${pred.confidence}`}>
                    {pred.confidence} confidence
                  </span>
                  <span className="data-points">
                    {pred.data_points} months data
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-cards">
          <button className="action-card glass-card" onClick={() => nav('/bills')}>
            <div className="action-card__icon action-card__icon--blue">
              <FileText size={24} />
            </div>
            <div className="action-card__content">
              <h4>Manage Bills</h4>
              <p>View, create, and update utility bills</p>
            </div>
            <ArrowRight size={20} className="action-card__arrow" />
          </button>

          <button className="action-card glass-card" onClick={() => nav('/branches')}>
            <div className="action-card__icon action-card__icon--purple">
              <Building2 size={24} />
            </div>
            <div className="action-card__content">
              <h4>Manage Branches</h4>
              <p>Add and organize your locations</p>
            </div>
            <ArrowRight size={20} className="action-card__arrow" />
          </button>

          <button className="action-card glass-card" onClick={() => nav('/settings')}>
            <div className="action-card__icon action-card__icon--green">
              <Settings size={24} />
            </div>
            <div className="action-card__content">
              <h4>Settings</h4>
              <p>Configure alerts and preferences</p>
            </div>
            <ArrowRight size={20} className="action-card__arrow" />
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-card glass-card">
        <div className="insights-header">
          <AlertCircle size={20} />
          <h3>Insights & Recommendations</h3>
        </div>
        <ul className="insights-list">
          <li className="insight-item">
            <span className="insight-icon">📊</span>
            <div>
              <strong>Usage Trend:</strong> {prediction?.trend === 'increasing' ? 'Increasing' : prediction?.trend === 'decreasing' ? 'Decreasing' : 'Stable'} consumption detected. 
              {prediction?.trend === 'increasing' ? ' Monitor budget allocation and consider energy-saving measures.' : ' Good efficiency maintained!'}
            </div>
          </li>
          <li className="insight-item">
            <span className="insight-icon">⏰</span>
            <div>
              <strong>Payment Reminder:</strong> {totals.pending} bills pending (Rs. {totals.pendingAmount.toLocaleString('en-LK')}). Set reminders for upcoming due dates.
            </div>
          </li>
          {totals.overdue > 0 && (
            <li className="insight-item warning">
              <span className="insight-icon">⚠️</span>
              <div>
                <strong>Overdue Alert:</strong> {totals.overdue} bills are overdue. Take immediate action to avoid penalties.
              </div>
            </li>
          )}
          {prediction?.anomaly_detected && (
            <li className="insight-item warning">
              <span className="insight-icon">🔍</span>
              <div>
                <strong>Anomaly Detected:</strong> Unusual usage spike identified. Check for equipment malfunction or meter reading errors.
              </div>
            </li>
          )}
          <li className="insight-item">
            <span className="insight-icon">💡</span>
            <div>
              <strong>Cost Saving Tip:</strong> Average cost per unit is Rs. {prediction?.avg_cost_per_unit || 45}. Compare across branches to identify optimization opportunities.
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
