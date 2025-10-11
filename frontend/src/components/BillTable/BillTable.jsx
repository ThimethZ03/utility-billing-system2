// components/BillTable/BillTable.jsx
import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Plus, Filter, X, Calendar, Building2, Zap, Droplet, FileSpreadsheet, Upload, Download, Search } from 'lucide-react';
import './BillTable.css';
import { exportCSV } from '../../services/api';

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

export default function BillTable({ bills, branchMap, onStatusChange, onCreateBill, onImportData }) {
  const [filter, setFilter] = useState({ branchId: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [newBill, setNewBill] = useState({
    branchId: '',
    type: 'Electricity',
    units: '',
    amount: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Normalize text for search (remove accents, lowercase)
  const normalize = (text) => {
    return (text || '').toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Apply filters and search
  const filtered = useMemo(() => {
    let result = bills;

    // Apply dropdown filters
    if (filter.branchId) {
      result = result.filter(b => b.branchId === filter.branchId);
    }
    if (filter.type) {
      result = result.filter(b => b.type === filter.type);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = normalize(searchQuery);
      result = result.filter(b => {
        const branchName = normalize(branchMap[b.branchId]?.name || '');
        const branchLocation = normalize(branchMap[b.branchId]?.location || '');
        const type = normalize(b.type || '');
        const status = normalize(b.status || '');
        const amount = normalize(b.amount?.toString() || '');
        const units = normalize(b.units?.toString() || '');
        const dueDate = normalize(new Date(b.dueDate).toLocaleDateString('en-LK'));

        return (
          branchName.includes(query) ||
          branchLocation.includes(query) ||
          type.includes(query) ||
          status.includes(query) ||
          amount.includes(query) ||
          units.includes(query) ||
          dueDate.includes(query)
        );
      });
    }

    return result;
  }, [bills, filter, searchQuery, branchMap]);

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
    setSearchQuery('');
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        console.log('📄 CSV Content:', csv);

        // Split by newline (handle both \n and \r\n)
        const lines = csv.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('❌ CSV file is empty or has no data rows\n\nPlease ensure:\n- File has header row\n- File has at least one data row');
          return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        console.log('📋 Headers found:', headers);

        // Validate required headers
        if (!headers.includes('units') || !headers.includes('amount')) {
          alert(`❌ CSV must contain required columns: units, amount\n\nFound columns: ${headers.join(', ')}\n\nDownload the sample CSV to see correct format.`);
          return;
        }

        const importedBills = [];
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Split and clean values (remove quotes)
          const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          const bill = {};

          // Map values to headers
          headers.forEach((header, index) => {
            bill[header] = values[index] || '';
          });

          // Validate and parse numbers
          const units = parseFloat(bill.units);
          const amount = parseFloat(bill.amount);

          if (isNaN(units) || isNaN(amount) || units <= 0 || amount <= 0) {
            console.warn(`⚠️ Skipping invalid row ${i}:`, bill);
            continue;
          }

          importedBills.push({
            month: i,
            units: units,
            amount: amount,
            type: bill.type || 'Electricity',
            dueDate: bill.duedate || bill.dueDate || new Date().toISOString().split('T')[0]
          });
        }

        console.log('✅ Parsed bills:', importedBills);

        if (importedBills.length > 0) {
          onImportData(importedBills);
          setShowImport(false);
          e.target.value = ''; // Reset file input
        } else {
          alert(`❌ No valid data found in CSV\n\nPlease ensure:\n✓ Units and Amount columns exist\n✓ Values are numeric and positive\n✓ At least one valid data row\n\n💡 Download the sample CSV for reference`);
        }

      } catch (error) {
        console.error('❌ CSV import error:', error);
        alert(`❌ Failed to parse CSV file\n\nError: ${error.message}\n\n💡 Tips:\n- Use sample CSV as template\n- Save as UTF-8 CSV\n- Don't use Excel formulas`);
      }
    };

    reader.onerror = (error) => {
      console.error('File read error:', error);
      alert('❌ Failed to read file. Please try again.');
    };

    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csv = `units,amount,type,duedate
500,22500,Electricity,2025-10-15
520,23400,Electricity,2025-11-15
510,22950,Electricity,2025-12-15
180,3600,Water,2025-10-20
190,3800,Water,2025-11-20
200,4000,Water,2025-12-20`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_bills_import.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    setTimeout(() => {
      alert(`📥 Sample CSV downloaded!\n\n✅ Required columns:\n  • units (number)\n  • amount (number)\n\n📝 Optional columns:\n  • type (Electricity/Water)\n  • duedate (YYYY-MM-DD)\n\n💡 Fill with your data and upload!`);
    }, 300);
  };

  const hasActiveFilters = filter.branchId || filter.type || searchQuery;

  return (
    <div className="bill-wrapper">
      {/* Header with Stats */}
      <div className="bill-header-section glass-card">
        <div className="bill-title-row">
          <div className="bill-title">
            <Filter size={22} className="title-icon" />
            <h2>Bill Management</h2>
          </div>
          <div className="header-buttons">
            <button 
              className="import-btn"
              onClick={() => setShowImport(!showImport)}
            >
              <Upload size={18} />
              Import Data
            </button>
            <button 
              className="export-btn"
              onClick={exportCSV}
            >
              <Download size={18} />
              Export CSV
            </button>
            <button 
              className={`add-bill-btn ${showForm ? 'active' : ''}`}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? 'Cancel' : 'Add Bill'}
            </button>
          </div>
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

      {/* Import Section */}
      {showImport && (
        <div className="import-section glass-card">
          <div className="import-header">
            <h3>📥 Import Historical Bills</h3>
            <button className="close-import-btn" onClick={() => setShowImport(false)}>
              <X size={18} />
            </button>
          </div>
          
          <p className="import-description">
            Upload a CSV file to import multiple bills at once. Perfect for adding historical data!
          </p>
          
          <div className="import-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Download Sample</strong>
                <span>Get the CSV template</span>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Fill Data</strong>
                <span>Add your bill information</span>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Upload File</strong>
                <span>Import to database</span>
              </div>
            </div>
          </div>

          <div className="import-actions">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              id="csv-import"
              className="file-input-hidden"
            />
            <label htmlFor="csv-import" className="file-upload-btn">
              <Upload size={18} />
              Choose CSV File
            </label>
            <button className="sample-download-btn" onClick={downloadSampleCSV}>
              <Download size={18} />
              Download Sample
            </button>
          </div>

          <div className="csv-format-help">
            <div className="help-section">
              <strong>✅ Required Columns:</strong>
              <ul>
                <li><code>units</code> - Number of units consumed (e.g., 500)</li>
                <li><code>amount</code> - Bill amount in LKR (e.g., 22500)</li>
              </ul>
            </div>
            
            <div className="help-section">
              <strong>📝 Optional Columns:</strong>
              <ul>
                <li><code>type</code> - Electricity or Water (default: Electricity)</li>
                <li><code>duedate</code> - Format: YYYY-MM-DD (default: today)</li>
              </ul>
            </div>

            <div className="help-example">
              <strong>💡 Example CSV:</strong>
              <pre>units,amount,type,duedate
500,22500,Electricity,2025-10-15
180,3600,Water,2025-11-20</pre>
            </div>

            <div className="help-tips">
              <strong>⚡ Tips:</strong>
              <ul>
                <li>Bills will be added to: <strong>{Object.values(branchMap)[0]?.name || 'your first branch'}</strong></li>
                <li>Use Excel, Google Sheets, or any text editor</li>
                <li>Save as CSV (UTF-8) format</li>
              </ul>
            </div>
          </div>
        </div>
      )}

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

      {/* Search and Filters */}
      <div className="filter-section glass-card">
        <div className="filter-header">
          <h3>Search & Filters</h3>
          {hasActiveFilters && (
            <button className="clear-btn" onClick={clearFilters}>
              <X size={14} />
              Clear All
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by branch, type, amount, status, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
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

        {/* Active Search/Filter Indicator */}
        {hasActiveFilters && (
          <div className="active-filters">
            <span className="filter-count">
              {filtered.length} of {bills.length} bills shown
            </span>
            {searchQuery && (
              <span className="filter-tag">
                Search: "{searchQuery}"
              </span>
            )}
            {filter.branchId && (
              <span className="filter-tag">
                Branch: {branchMap[filter.branchId]?.name}
              </span>
            )}
            {filter.type && (
              <span className="filter-tag">
                Type: {filter.type}
              </span>
            )}
          </div>
        )}
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
                      <div className="empty-icon">🔍</div>
                      <div className="empty-text">No bills found</div>
                      <div className="empty-subtext">
                        {hasActiveFilters ? 'Try adjusting your search or filters' : 'Create your first bill above'}
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
