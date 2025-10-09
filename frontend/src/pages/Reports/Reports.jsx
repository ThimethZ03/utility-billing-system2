// pages/Reports/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './Reports.css';
import { fetchBills } from '../../services/api';
import { FileSpreadsheet, Search, TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react';

// Locale formatters (Sri Lanka)
const lkr = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat('en-LK', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

// Helpers
const parseDue = (d) => {
  const dt = d && d !== 'N/A' ? new Date(d) : null;
  return Number.isFinite(dt?.getTime?.()) ? dt : null;
};
const normalize = (v) =>
  (v ?? '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Reports() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('branchName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBills();
        const rows = data.map((bill) => {
          const due = parseDue(bill.dueDate);
          return {
            id: bill._id,
            branchName: bill.branchName || 'Unknown Branch',
            type: bill.type || 'N/A',
            units: Number.isFinite(bill.units) ? bill.units : 0,
            amount: Number.isFinite(bill.amount) ? bill.amount : 0,
            dueDateRaw: due ? due : null,
            dueDate: due ? dateFmt.format(due) : 'N/A',
            status: bill.status || 'Pending',
          };
        });
        setBills(rows);
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
    const totalUnits = bills.reduce((sum, b) => sum + b.units, 0);
    const pendingCount = bills.filter(b => b.status === 'Pending').length;
    return { totalAmount, totalUnits, pendingCount, totalBills: bills.length };
  }, [bills]);

  // Filter
  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return bills;
    return bills.filter((b) => {
      return (
        normalize(b.branchName).includes(q) ||
        normalize(b.type).includes(q) ||
        normalize(b.status).includes(q)
      );
    });
  }, [bills, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let valA;
      let valB;

      switch (sortField) {
        case 'amount':
        case 'units':
          valA = a[sortField] ?? 0;
          valB = b[sortField] ?? 0;
          break;
        case 'dueDate':
          valA = a.dueDateRaw ? a.dueDateRaw.getTime() : -Infinity;
          valB = b.dueDateRaw ? b.dueDateRaw.getTime() : -Infinity;
          break;
        default:
          valA = (a[sortField] ?? '').toString();
          valB = (b[sortField] ?? '').toString();
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      const diff = numA - numB;
      return sortOrder === 'asc' ? diff : -diff;
    });
    return arr;
  }, [filtered, sortField, sortOrder]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortIndicator = (field) => {
    if (field !== sortField) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // CSV export
  const exportCSV = () => {
    const header = ['Branch Name', 'Utility Type', 'Units', 'Amount (LKR)', 'Due Date', 'Status'];
    const rows = sorted.map((b) => [
      b.branchName,
      b.type,
      b.units,
      b.amount,
      b.dueDate,
      b.status,
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? '');
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `utility-reports-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-container">
      {/* Header with glassmorphism */}
      <div className="reports-header glass-card">
        <div className="header-content">
          <div className="title-section">
            <h2>Utility Reports</h2>
            <p>Branch-wise utility bills overview and analytics</p>
          </div>
          
          <div className="header-actions">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search branch, type, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                aria-label="Search"
              />
            </div>
            <button className="export-btn" onClick={exportCSV} aria-label="Export CSV">
              <FileSpreadsheet size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards with glassmorphism */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Bills</p>
            <h3 className="stat-value">{stats.totalBills}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Amount</p>
            <h3 className="stat-value">{lkr.format(stats.totalAmount)}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon purple">
            <Filter size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Units</p>
            <h3 className="stat-value">{stats.totalUnits.toLocaleString('en-LK')}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-icon orange">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Bills</p>
            <h3 className="stat-value">{stats.pendingCount}</h3>
          </div>
        </div>
      </div>

      {/* Table with enhanced interactions */}
      <div className="table-wrapper glass-card">
        {isLoading ? (
          <div className="loading-skeleton">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th role="button" tabIndex={0} onClick={() => handleSort('branchName')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('branchName')}>
                  <span className="th-content">Branch Name {sortIndicator('branchName')}</span>
                </th>
                <th role="button" tabIndex={0} onClick={() => handleSort('type')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('type')}>
                  <span className="th-content">Utility Type {sortIndicator('type')}</span>
                </th>
                <th className="col-units" role="button" tabIndex={0} onClick={() => handleSort('units')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('units')}>
                  <span className="th-content">Units {sortIndicator('units')}</span>
                </th>
                <th className="col-amount" role="button" tabIndex={0} onClick={() => handleSort('amount')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('amount')}>
                  <span className="th-content">Amount {sortIndicator('amount')}</span>
                </th>
                <th role="button" tabIndex={0} onClick={() => handleSort('dueDate')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('dueDate')}>
                  <span className="th-content">Due Date {sortIndicator('dueDate')}</span>
                </th>
                <th><span className="th-content">Status</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((bill, index) => (
                <tr key={bill.id} style={{ '--row-index': index }}>
                  <td>
                    <div className="cell-content">
                      <span className="branch-name">{bill.branchName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-content utility-type">
                      <span className="utility-icon">{bill.type === 'Electricity' ? '⚡' : '💧'}</span>
                      <span>{bill.type}</span>
                    </div>
                  </td>
                  <td className="col-units">
                    <span className="numeric-value">{Number(bill.units).toLocaleString('en-LK')}</span>
                  </td>
                  <td className="col-amount">
                    <span className="numeric-value amount">{lkr.format(Number(bill.amount))}</span>
                  </td>
                  <td>
                    <span className="date-value">{bill.dueDate}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        bill.status === 'Paid'
                          ? 'status-paid'
                          : bill.status === 'Overdue'
                          ? 'status-overdue'
                          : 'status-pending'
                      }`}
                    >
                      <span className="status-dot"></span>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-results">
                    <div className="empty-state">
                      <Search size={48} />
                      <p>No matching records found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
