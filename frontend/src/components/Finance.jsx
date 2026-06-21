import React, { useState, useEffect } from 'react';
import { Plus, IndianRupee, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function Finance() {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Log expense state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expense, setExpense] = useState({ category: 'Utilities', amount: '', description: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchFinance = () => {
    setLoading(true);
    fetch('/api/finance')
      .then(res => res.json())
      .then(data => {
        setFinanceData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleLogExpense = (e) => {
    e.preventDefault();
    if (!expense.amount || isNaN(expense.amount) || parseFloat(expense.amount) <= 0) {
      setErrorMsg("Please enter a valid positive cost amount.");
      return;
    }

    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: expense.category,
        amount: parseFloat(expense.amount),
        description: expense.description
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to record expense.");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        setExpense({ category: 'Utilities', amount: '', description: '' });
        fetchFinance(); // refresh financial sheets
      })
      .catch(err => setErrorMsg(err.message));
  };

  if (loading || !financeData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        <h2 className="page-title">Syncing Financial Ledgers...</h2>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite' }} />
        </div>
      </div>
    );
  }

  const { summary, expenses_by_category, expense_list } = financeData;
  const profitPercentage = summary.sales_revenue > 0 ? (summary.net_profit / summary.sales_revenue * 100).toFixed(1) : '0.0';

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance Module</h1>
          <p className="page-subtitle">Track accounts receivable, business operations overhead, and net profit margins.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* Financial Statement Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Sales Revenue (Inflow)</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.06)' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{summary.sales_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From customer invoices</div>
        </div>

        <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Procurement Costs (Outflow)</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.06)' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{summary.procurement_costs.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Inventory replenishments (Received)</div>
        </div>

        <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Operating Overhead</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--warning)', background: 'rgba(245,158,11,0.06)' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{summary.operational_expenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rent, Salaries, Utilities, Ads</div>
        </div>

        <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Net Profit Margin</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.06)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: summary.net_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{summary.net_profit.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '4px' }}>
            <span>Margin percentage: </span>
            <span style={{ fontWeight: 'bold', color: summary.net_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {profitPercentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="erp-grid-2">
        {/* Expenses List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Expense Ledger</h3>
          <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expense_list.length > 0 ? (
                  expense_list.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontSize: '12px' }}>{new Date(e.date).toLocaleDateString()}</td>
                      <td><span className="badge badge-info">{e.category}</span></td>
                      <td style={{ fontSize: '13px' }}>{e.description || '-'}</td>
                      <td style={{ fontWeight: '600', color: 'var(--danger)' }}>-₹{e.amount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No expenses logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses By Category Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Outflow Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {expenses_by_category.map((cat, index) => {
              const maxVal = Math.max(...expenses_by_category.map(c => c.amount), 1);
              const percentage = ((cat.amount / maxVal) * 100).toFixed(0);
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: '500' }}>{cat.category}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>₹{cat.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)' 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
            {expenses_by_category.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No categories mapped.</p>
            )}
          </div>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass-card">
            <div className="modal-header">
              <h3 className="modal-title">Record Operations Overhead</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleLogExpense}>
              {errorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Category *</label>
                  <select
                    className="form-select"
                    value={expense.category}
                    onChange={(e) => setExpense(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Rent">Rent & Lease</option>
                    <option value="Utilities">Utilities & Power</option>
                    <option value="Salaries">Salaries & Contractor Fees</option>
                    <option value="Marketing">Marketing & Advertising</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Outflow Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={expense.amount}
                    onChange={(e) => setExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="250.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Overhead Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={expense.description}
                    onChange={(e) => setExpense(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Monthly cloud server hosting hosting fees"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Cost</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
