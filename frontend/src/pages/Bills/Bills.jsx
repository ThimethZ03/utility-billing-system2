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

  // NEW: Import handler
  const onImportData = async (importedData) => {
    try {
      if (branches.length === 0) {
        alert('❌ Please create at least one branch before importing bills');
        return;
      }

      // Use first branch as default or ask user
      const defaultBranch = branches[0];
      
      console.log('Importing data:', importedData);
      
      let successCount = 0;
      let failCount = 0;

      // Import each bill
      for (const data of importedData) {
        try {
          const billPayload = {
            branchId: defaultBranch._id,
            type: data.type || 'Electricity',
            units: Number(data.units),
            amount: Number(data.amount),
            dueDate: data.dueDate,
            status: 'Pending',
            periodStart: new Date().toISOString().split('T')[0]
          };

          await createBill(billPayload);
          successCount++;
        } catch (error) {
          console.error('Failed to import bill:', data, error);
          failCount++;
        }
      }

      // Reload bills
      await load();

      // Show result
      if (successCount > 0) {
        alert(`✅ Successfully imported ${successCount} bills${failCount > 0 ? `\n⚠️ ${failCount} bills failed` : ''}!\n\n📊 Bills added to: ${defaultBranch.name}`);
      } else {
        alert('❌ Failed to import bills. Please check the CSV format.');
      }

    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Import failed. Please check console for details.');
    }
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
        onImportData={onImportData}
      />
    </div>
  );
}
