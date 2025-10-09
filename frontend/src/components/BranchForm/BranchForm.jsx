// components/BranchForm.jsx
import React, { useState } from 'react';
import './BranchForm.css';

export default function BranchForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', location: '' });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit(form);
    setForm({ name: '', location: '' });
  };

  return (
    <form className="card branch__form" onSubmit={submit}>
      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Add Branch</h4>
      <div className="branch__grid">
        <input
          className="input"
          placeholder="Branch Name"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="button" type="submit">Create Branch</button>
      </div>
    </form>
  );
}
