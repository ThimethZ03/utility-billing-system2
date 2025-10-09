// components/AdminPanel.jsx
import React, { useMemo, useState } from 'react';
import './AdminPanel.css';
import BranchForm from '../BranchForm/BranchForm.jsx';
import BillTable from '../BillTable/BillTable.jsx';

export default function AdminPanel({ branches, bills, onCreateBranch, onCreateBill, onStatusChange }) {
  const [tab, setTab] = useState('bills'); // 'bills' | 'branches' | 'settings'
  const branchMap = useMemo(() => Object.fromEntries(branches.map(b => [b._id, b])), [branches]);

  return (
    <div className="admin card">
      <div className="admin__tabs">
        <button className={tab === 'bills' ? 'active' : ''} onClick={() => setTab('bills')}>Bills</button>
        <button className={tab === 'branches' ? 'active' : ''} onClick={() => setTab('branches')}>Branches</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
      </div>

      {tab === 'bills' && (
        <div className="admin__section">
          <BillTable bills={bills} branchMap={branchMap} onStatusChange={onStatusChange} onCreateBill={onCreateBill} />
        </div>
      )}

      {tab === 'branches' && (
        <div className="admin__section">
          <BranchForm onSubmit={onCreateBranch} />
          <div className="admin__list">
            {branches.map(b => (
              <div className="admin__branch card" key={b._id}>
                <div className="admin__branch-title">{b.name}</div>
                <div className="admin__branch-sub">{b.location || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="admin__section">
          <p className="admin__muted">Settings panel stub. Integrate roles, budgets, and notifications here.</p>
        </div>
      )}
    </div>
  );
}

