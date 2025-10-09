// pages/Branches/Branches.jsx
import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import './Branches.css';
import { fetchBranches, createBranch, deleteBranch } from '../../services/api.js';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });

  const load = async () => {
    setLoading(true);
    try {
      const br = await fetchBranches();
      setBranches(br);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBranch.name) return;
    await createBranch(newBranch);
    setNewBranch({ name: '', location: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this branch?')) {
      await deleteBranch(id);
      load();
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner-large"></div>
        <p>Loading branches...</p>
      </div>
    );
  }

  return (
    <div className="branches-page">
      <div className="page-header">
        <h1>Branch Management</h1>
        <p>Add and manage your business locations</p>
      </div>

      {/* Add Branch Form */}
      <form className="branch-form card" onSubmit={handleCreate}>
        <h3><Plus size={20} /> Add New Branch</h3>
        <div className="branch-form-grid">
          <input
            className="input"
            placeholder="Branch Name *"
            value={newBranch.name}
            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Location"
            value={newBranch.location}
            onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
          />
          <button className="button primary-btn" type="submit">
            <Plus size={18} />
            Create Branch
          </button>
        </div>
      </form>

      {/* Branch List */}
      <div className="branch-grid">
        {branches.map((b) => (
          <div className="branch-card card" key={b._id}>
            <div className="branch-card-header">
              <h4>{b.name}</h4>
              <button className="delete-btn" onClick={() => handleDelete(b._id)}>
                <Trash2 size={18} />
              </button>
            </div>
            <div className="branch-card-location">
              <MapPin size={16} />
              <span>{b.location || 'No location'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
