// components/BillTable/BillTable.jsx
import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Plus, Filter, X, Calendar, Building2, Zap, Droplet } from 'lucide-react';
import './BillTable.css';

// LKR formatter
const lkr = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
});

const statusClass = (s) => {
  if (s === 'Paid') return 'status-badge status-paid';
  if (s === 'Overdue') return 'status-badge status-overdue';
  return 'status-badge status-pending';
};

export default function BillTable({ bills, branchMap, onStatusChange, onCreateBill }) {
  const [filter, setFilter] = useState({ branchId: '', type: '' });
  const [newBill, setNewBill] = useState({
    branchId: '',
    type: 'Electricity',
    units: '',
    amount: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return bills.filter(b =>
      (filter.branchId ? b.branchId === filter.branchId : true) &&
      (filter.type ? b.type === filter.type : true)
    );
  }, [bills, filter]);

  const stats = useMemo(() => {
    const totalAmount = filtered.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalUnits = filtered.reduce((sum, b) => sum + (b.units || 0), 0);
    const paidCount = filtered.filter(b => b.status === 'Paid').length;
    return { totalAmount, totalUnits, paidCount, total: filtered.length };
  }, [filtered]);

  const validateForm = () => {
    const newErrors = {};
    if (!newBill.branchId) newErrors.branchId = 'Branch is required';
    if (!newBill.units || Number(newBill.units) <= 0) newErrors.units = 'Valid units required';
    if (!newBill.dueDate) newErrors.dueDate = 'Due date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitNewBill = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const payload = {
      ...newBill,
      units: Number(newBill.units),
      amount: newBill.amount ? Number(newBill.amount) : Number(newBill.units) * 45,
      status: 'Pending',
    };
    
    onCreateBill(payload);
    setNewBill({ branchId: '', type: 'Electricity', units: '', amount: '', dueDate: '' });
    setErrors({});
    setShowForm(false);
  };

  const handleInputChange = (field, value) => {
    setNewBill((s) => ({ ...s, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const clearFilters = () => {
    setFilter({ branchId: '', type: '' });
  };

  const hasActiveFilters = filter.branchId || filter.type;

  return (
    <div className="bill-wrapper">
      {/* Header with Stats */}
      <div className="bill-header-section glass-card">
        <div className="bill-title-row">
          <div className="bill-title">
            <Filter size={22} className="title-icon" />
            <h2>Bill Management</h2>
          </div>
          <button 
            className={`add-bill-btn ${showForm ? 'active' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Add Bill'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-icon blue">
              <Building2 size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Bills</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon green">
              <CheckCircle size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Paid Bills</span>
              <span className="stat-value">{stats.paidCount}</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon purple">
              <Zap size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Units</span>
              <span className="stat-value">{stats.totalUnits.toLocaleString('en-LK')}</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon orange">
              <Calendar size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Amount</span>
              <span className="stat-value">{lkr.format(stats.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Bill Form */}
      {showForm && (
        <form className="bill-form glass-card" onSubmit={submitNewBill}>
          <div className="form-header">
            <h3>
              <Plus size={20} />
              Create New Bill
            </h3>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="branch">Branch *</label>
              <select
                id="branch"
                className={`form-select ${errors.branchId ? 'error' : ''}`}
                value={newBill.branchId}
                onChange={(e) => handleInputChange('branchId', e.target.value)}
                required
              >
                <option value="">Select branch</option>
                {Object.entries(branchMap).map(([id, b]) => (
                  <option key={id} value={id}>{b.name}</option>
                ))}
              </select>
              {errors.branchId && <span className="error-message">{errors.branchId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="type">Utility Type *</label>
              <select
                id="type"
                className="form-select"
                value={newBill.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <option value="Electricity">⚡ Electricity</option>
                <option value="Water">💧 Water</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="units">Units Consumed *</label>
              <input
                id="units"
                className={`form-input ${errors.units ? 'error' : ''}`}
                type="number"
                placeholder="Enter units"
                value={newBill.units}
                onChange={(e) => handleInputChange('units', e.target.value)}
                min="1"
                required
              />
              {errors.units && <span className="error-message">{errors.units}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (LKR)</label>
              <input
                id="amount"
                className="form-input"
                type="number"
                placeholder="Auto: LKR 45/unit"
                value={newBill.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                id="dueDate"
                className={`form-input ${errors.dueDate ? 'error' : ''}`}
                type="date"
                value={newBill.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
              {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="submit-btn">
              <Plus size={18} />
              Create Bill
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="filter-section glass-card">
        <div className="filter-header">
          <h3>Filters</h3>
          {hasActiveFilters && (
            <button className="clear-btn" onClick={clearFilters}>
              <X size={14} />
              Clear
            </button>
          )}
        </div>
        <div className="filter-controls">
          <select
            className="filter-select"
            value={filter.branchId}
            onChange={(e) => setFilter((f) => ({ ...f, branchId: e.target.value }))}
          >
            <option value="">All branches</option>
            {Object.entries(branchMap).map(([id, b]) => (
              <option key={id} value={id}>{b.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filter.type}
            onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">All types</option>
            <option value="Electricity">⚡ Electricity</option>
            <option value="Water">💧 Water</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container glass-card">
        <div className="table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Utility Type</th>
                <th className="col-units">Units</th>
                <th className="col-amount">Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, index) => (
                <tr key={b._id} style={{ '--row-index': index }}>
                  <td>
                    <div className="branch-cell">
                      <div className="branch-name">{branchMap[b.branchId]?.name || '—'}</div>
                      <div className="branch-location">{branchMap[b.branchId]?.location || ''}</div>
                    </div>
                  </td>
                  <td>
                    <div className="utility-cell">
                      <span className="utility-icon">
                        {b.type === 'Electricity' ? <Zap size={16} /> : <Droplet size={16} />}
                      </span>
                      <span>{b.type}</span>
                    </div>
                  </td>
                  <td className="col-units">
                    <span className="numeric-value">{Number(b.units || 0).toLocaleString('en-LK')}</span>
                  </td>
                  <td className="col-amount">
                    <span className="amount-value">{lkr.format(Number(b.amount || 0))}</span>
                  </td>
                  <td>
                    <span className="date-value">
                      {new Date(b.dueDate).toLocaleDateString('en-LK', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </td>
                  <td>
                    <span className={statusClass(b.status)}>
                      <span className="status-dot"></span>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {b.status !== 'Paid' && (
                        <button 
                          className="action-btn success" 
                          onClick={() => onStatusChange(b._id, 'Paid')}
                          title="Mark as Paid"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {b.status !== 'Overdue' && (
                        <button 
                          className="action-btn danger" 
                          onClick={() => onStatusChange(b._id, 'Overdue')}
                          title="Mark as Overdue"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <div className="empty-text">No bills found</div>
                      <div className="empty-subtext">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first bill above'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
