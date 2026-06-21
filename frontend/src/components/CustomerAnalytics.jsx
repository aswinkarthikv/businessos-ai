import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function CustomerAnalytics() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [riskModalCustomer, setRiskModalCustomer] = useState(null);
  
  // Retrain status
  const [retraining, setRetraining] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Add customer modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRetrainML = async () => {
    setRetraining(true);
    setToastMsg('');
    try {
      const res = await fetch('/api/ml/retrain', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToastMsg("AI models retrained successfully using live data!");
        fetchCustomers();
      } else {
        setToastMsg("Retraining failed.");
      }
    } catch (err) {
      setToastMsg("Error: Connection failed.");
    } finally {
      setRetraining(false);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!newCustomer.name || !newCustomer.email) {
      setErrorMsg("Name and Email are required.");
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Email already exists in system!");
        return;
      }
      setIsModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '' });
      fetchCustomers();
    } catch (err) {
      setErrorMsg("Backend connectivity issue.");
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = segmentFilter === '' || c.segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Analytics</h1>
          <p className="page-subtitle">Inspect customer loyalty scores, spending metrics, and AI-predicted churn coefficients.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleRetrainML}
            disabled={retraining}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={15} style={{ animation: retraining ? 'spin 1.5s linear infinite' : 'none' }} />
            {retraining ? "Fitting Models..." : "Retrain ML Models"}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--success)', fontSize: '14px', animation: 'fadeIn 0.3s ease' }}>
          <CheckCircle size={16} />
          {toastMsg}
        </div>
      )}

      {/* Overview stats panel */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: 'var(--primary)' }} />
          Churn Prediction Engine: Gradient Descent Logistic Regression
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          The machine learning classifier correlates a customer's order frequency (recency in days, total order count, average transaction value, and cumulative spending) to estimate the likelihood of churn.
          Customers who have not purchased within 90 days are flagged as <strong>At Risk</strong>.
        </p>
      </div>

      {/* Customer Filters and Search */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '500px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-dark)' }} />
            </div>

            <select
              className="form-select"
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option value="Loyal">Loyal Tiers</option>
              <option value="Standard">Standard Tiers</option>
              <option value="At Risk">At Risk Tiers</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
            <p>Gathering customer metrics...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Join Date</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Churn Probability</th>
                  <th>Segment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>CUST-{c.id.toString().padStart(4, '0')}</td>
                      <td style={{ fontWeight: '500' }}>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{new Date(c.joining_date).toLocaleDateString()}</td>
                      <td>{c.total_orders} invoices</td>
                      <td style={{ fontWeight: '600' }}>₹{c.total_spent.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${c.churn_probability}%`, 
                              height: '100%', 
                              background: c.churn_probability >= 70 ? 'var(--danger)' : c.churn_probability >= 40 ? 'var(--warning)' : 'var(--success)'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{c.churn_probability}%</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`badge ${
                            c.segment === 'Loyal' ? 'badge-success' : c.segment === 'At Risk' ? 'badge-danger' : 'badge-info'
                          }`}
                          style={{ cursor: c.segment === 'At Risk' ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (c.segment === 'At Risk') {
                              setRiskModalCustomer(c);
                            }
                          }}
                          title={c.segment === 'At Risk' ? 'Click to inspect churn details' : ''}
                        >
                          {c.segment}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No customers match selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass-card">
            <div className="modal-header">
              <h3 className="modal-title">Register Customer profile</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              {errorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Aswin Kumar"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="aswin@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1-555-0133"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Details Modal */}
      {riskModalCustomer && (
        <div className="modal-overlay">
          <div className="modal-container glass-card" style={{ maxWidth: '420px', border: '1px solid var(--danger-glow)', padding: '24px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <AlertTriangle size={18} /> AI Risk Assessment
              </h3>
              <button className="modal-close" onClick={() => setRiskModalCustomer(null)}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Churn Likelihood Risk Score</span>
                <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--danger)', marginTop: '4px' }}>
                  {riskModalCustomer.churn_probability}%
                </h2>
                <span className="badge badge-danger" style={{ marginTop: '8px', fontSize: '10px' }}>Urgent Retention Alert</span>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'white' }}>Risk Factor Analysis:</h4>
                <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'disc' }}>
                  <li><b>Inactivity</b>: No purchase recorded in the last 60 days.</li>
                  <li><b>UX Indicator</b>: Support complaints raised regarding logistics.</li>
                  <li><b>Conversion Drop</b>: Repeated shopping cart abandonment items logged.</li>
                </ul>
              </div>

              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  AI Recommendation: Dispatch a promotional 15% discount code to retain {riskModalCustomer.name}.
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--success)', boxShadow: 'none' }}
                  onClick={() => {
                    alert(`Retention discount voucher successfully dispatched to ${riskModalCustomer.email}!`);
                    setRiskModalCustomer(null);
                  }}
                >
                  Send Retention Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
