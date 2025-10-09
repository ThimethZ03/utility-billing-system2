// pages/Bills/Bills.jsx
import React, { useEffect, useState } from 'react';
import './Bills.css';
import BillTable from '../../components/BillTable/BillTable.jsx';
import { fetchBranches, fetchBills, markBillStatus, createBill } from '../../services/api.js';

export default function Bills() {
  const [branches, setBranches] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [br, bi] = await Promise.all([
        fetchBranches(),
        fetchBills(),
      ]);
      setBranches(br);
      setBills(bi);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const branchMap = branches.reduce((acc, b) => {
    acc[b._id] = b;
    return acc;
  }, {});

  const onStatusChange = async (id, status) => {
    await markBillStatus(id, status);
    load();
  };

  const onCreateBill = async (payload) => {
    await createBill(payload);
    load();
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-large"></div>
        <p>Loading bills...</p>
      </div>
    );
  }

  return (
    <div className="bills-page">
      <div className="page-header">
        <h1>Bill Management</h1>
        <p>Create, view, and manage utility bills for all branches</p>
      </div>

      <BillTable
        bills={bills}
        branchMap={branchMap}
        onStatusChange={onStatusChange}
        onCreateBill={onCreateBill}
      />
    </div>
  );
}
