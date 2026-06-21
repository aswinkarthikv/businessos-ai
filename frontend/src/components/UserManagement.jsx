import React, { useState, useEffect } from 'react';
import { User, UserPlus, Trash2, Shield, ShoppingBag, Truck, Mail, RefreshCw, AlertCircle, X, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    customer_id: 'none', // 'none' | 'new' | int id
    supplier_id: 'none'  // 'none' | 'new' | int id
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [usersRes, custRes, supRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/customers'),
        fetch('/api/suppliers')
      ]);
      
      if (!usersRes.ok || !custRes.ok || !supRes.ok) {
        throw new Error("Failed to load user directories.");
      }
      
      const [usersData, custData, supData] = await Promise.all([
        usersRes.json(),
        custRes.json(),
        supRes.json()
      ]);
      
      setUsers(usersData);
      setCustomers(custData);
      setSuppliers(supData);
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while fetching directories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-set linking parameters when role changes
      if (name === 'role') {
        if (value === 'buyer') {
          updated.customer_id = 'new';
          updated.supplier_id = 'none';
        } else if (value === 'vendor') {
          updated.supplier_id = 'new';
          updated.customer_id = 'none';
        } else {
          updated.customer_id = 'none';
          updated.supplier_id = 'none';
        }
      }
      return updated;
    });
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'buyer',
      customer_id: 'new',
      supplier_id: 'none'
    });
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitLoading(true);

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setErrorMsg("Please fill in all required fields.");
      setSubmitLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user account.");
      }
      
      setSuccessMsg(`Account for ${data.name} created successfully!`);
      setModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      alert("Self-termination is not allowed. You cannot delete the logged-in administrator account.");
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this user account? The associated customer/supplier profiles will remain intact.")) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccessMsg("User account deleted successfully.");
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Accounts Control</h1>
          <p className="page-subtitle">Manage administrative privileges, partner supplier logins, and buyer shopping accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <UserPlus size={16} />
          <span>Add User Credential</span>
        </button>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          color: 'var(--success)',
          fontSize: '14px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          color: 'var(--danger)',
          fontSize: '14px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p>Accessing secure user repository...</p>
        </div>
      ) : (
        <div className="glass-card data-card">
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Registered Core Logins</h3>
          
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email Login</th>
                  <th>Platform Role</th>
                  <th>Linked Business Entity</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} style={{ opacity: isCurrent ? 0.9 : 1 }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>USR-{u.id.toString().padStart(4, '0')}</td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{u.name}</span>
                        {isCurrent && <span style={{ marginLeft: '8px', fontSize: '9px', background: 'rgba(99,102,241,0.2)', color: 'var(--primary)', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>YOU</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                          {u.email}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          u.role === 'admin' ? 'badge-danger' : u.role === 'vendor' ? 'badge-info' : 'badge-success'
                        }`}>
                          {u.role === 'admin' ? 'SYSTEM ADMIN' : u.role === 'vendor' ? 'SUPPLIER B2B' : 'CUSTOMER BUYER'}
                        </span>
                      </td>
                      <td>
                        {u.role === 'admin' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={12} /> Root Operator Context
                          </span>
                        )}
                        {u.role === 'vendor' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={12} style={{ color: 'var(--primary)' }} />
                            {u.supplier_name || `Supplier ID: ${u.supplier_id}`}
                          </span>
                        )}
                        {u.role === 'buyer' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ShoppingBag size={12} style={{ color: 'var(--success)' }} />
                            {u.customer_name || `Customer ID: ${u.customer_id}`}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px', opacity: isCurrent ? 0.3 : 1, cursor: isCurrent ? 'not-allowed' : 'pointer' }}
                          disabled={isCurrent}
                          onClick={() => handleDeleteUser(u.id)}
                          title={isCurrent ? "Cannot delete yourself" : "Delete account"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-container" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus style={{ color: 'var(--primary)' }} /> Add User Account
              </h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-name">Full Name</label>
                <input
                  className="form-input"
                  id="new-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Tony Stark"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-email">Email Address</label>
                <input
                  className="form-input"
                  id="new-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. tony@stark.corp"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">Password</label>
                <input
                  className="form-input"
                  id="new-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-role">System Access Role</label>
                <select
                  className="form-select"
                  id="new-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="buyer">🛒 Customer / Buyer</option>
                  <option value="vendor">🤝 B2B Supplier / Vendor</option>
                  <option value="admin">👤 System Administrator</option>
                </select>
              </div>

              {/* Conditional linking for Customer / Buyer role */}
              {formData.role === 'buyer' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="new-customer-link">Link Customer Profile</label>
                  <select
                    className="form-select"
                    id="new-customer-link"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                  >
                    <option value="new">🆕 Create new Customer profile under this name</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>🔗 Link to: {c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional linking for Supplier / Vendor role */}
              {formData.role === 'vendor' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="new-supplier-link">Link Supplier Profile</label>
                  <select
                    className="form-select"
                    id="new-supplier-link"
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                  >
                    <option value="new">🆕 Create new Supplier profile under this name</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>🔗 Link to: {s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> <span>{errorMsg}</span>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
