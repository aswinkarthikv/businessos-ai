import React, { useState } from 'react';
import { Bot, Play, Pause, Zap, CheckCircle2, ShieldAlert, Cpu, ListCollapse, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export default function AgenticAutomation() {
  const [agents, setAgents] = useState([
    { id: 'sales', name: 'Sales Optimization Agent', tasks: 34, accuracy: 94, status: 'Active', description: 'Monitors checkout velocity and optimizes price markup margins.' },
    { id: 'inventory', name: 'Inventory Replenishment Agent', tasks: 48, accuracy: 96, status: 'Active', description: 'Tracks SKU levels and triggers automated procurement orders.' },
    { id: 'finance', name: 'Finance Ledger Audit Agent', tasks: 12, accuracy: 98, status: 'Active', description: 'Reconciles operational invoices and flags overhead warnings.' },
    { id: 'support', name: 'Customer Support Retention Agent', tasks: 89, accuracy: 91, status: 'Active', description: 'Flags customer churn risks and auto-sends re-engagement promotions.' }
  ]);

  const [rules, setRules] = useState([
    { id: 1, trigger: 'Stock < Reorder Threshold', action: 'Auto-compile suggested B2B PO & notify manager', role: 'Inventory Agent', enabled: true, lastTriggered: '2 hours ago' },
    { id: 2, trigger: 'Churn Probability > 70%', action: 'Dispatch 15% discount code email automatically', role: 'Support Agent', enabled: true, lastTriggered: '1 day ago' },
    { id: 3, trigger: 'Manual Outflow > ₹50,000', action: 'Require Owner multi-signature approval override', role: 'Finance Agent', enabled: false, lastTriggered: 'Never' },
    { id: 4, trigger: 'New B2C customer registration', action: 'Init ML churn feature coefficients', role: 'Sales Agent', enabled: true, lastTriggered: '10 mins ago' }
  ]);

  const [logs, setLogs] = useState([
    { id: 1, timestamp: '10 mins ago', message: 'Sales Agent initialized Churn weights for new buyer Clark Kent', type: 'info' },
    { id: 2, timestamp: '2 hours ago', message: 'Inventory Agent auto-generated replenishment draft for SKU: ELEC-KEY-MECH', type: 'success' },
    { id: 3, timestamp: '5 hours ago', message: 'Support Agent flagged customer Bruce Wayne (98% Churn Risk)', type: 'warning' },
    { id: 4, timestamp: '1 day ago', message: 'Support Agent auto-sent promotional email voucher to Sophia Vance', type: 'success' }
  ]);

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    
    // Add rule toggle event to logs
    const rule = rules.find(r => r.id === id);
    const actionText = rule.enabled ? 'Disabled' : 'Enabled';
    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: 'Just now',
        message: `Owner manually ${actionText} Rule: "${rule.trigger}"`,
        type: 'info'
      },
      ...prev
    ]);
  };

  const triggerAgentJob = (agentId) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          tasks: a.tasks + 1,
          accuracy: Math.min(100, a.accuracy + (Math.random() > 0.5 ? 1 : -1))
        };
      }
      return a;
    }));

    const agent = agents.find(a => a.id === agentId);
    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: 'Just now',
        message: `Forced manual run of ${agent.name} jobs`,
        type: 'success'
      },
      ...prev
    ]);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Agentic Control Center</h1>
          <p className="page-subtitle">Deploy autonomous agent networks, toggle rule-based triggers, and audit real-time model actions.</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
          <Sparkles size={16} style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Agent Engine: Active</span>
        </div>
      </div>

      {/* AI Agents Grid */}
      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Autonomous AI Agents</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {agents.map(a => (
          <div key={a.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', color: 'var(--primary)' }}>
                <Bot size={20} />
              </div>
              <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>{a.status}</span>
            </div>
            
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{a.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', minHeight: '36px' }}>{a.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px', border: '1px solid var(--panel-border)', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Tasks Completed</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'white' }}>{a.tasks}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Accuracy Rate</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--success)' }}>{a.accuracy}%</span>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '6px', fontSize: '11px', justifyContent: 'center', marginTop: '4px' }}
              onClick={() => triggerAgentJob(a.id)}
            >
              <Cpu size={12} /> Force Manual Run
            </button>
          </div>
        ))}
      </div>

      {/* Rules Engine and Logs */}
      <div className="erp-grid-2" style={{ marginTop: '12px' }}>
        {/* Rules Console */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--warning)' }} /> AI Automation Rules
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map(r => (
              <div key={r.id} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: '4px' }}>{r.role}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last triggered: {r.lastTriggered}</span>
                  </div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: '600', marginTop: '6px' }}>IF: <span style={{ fontFamily: 'monospace', color: 'var(--warning)' }}>{r.trigger}</span></h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>THEN: <span style={{ fontWeight: '500' }}>{r.action}</span></p>
                </div>
                
                <button 
                  onClick={() => toggleRule(r.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: r.enabled ? 'var(--success)' : 'var(--text-dark)', transition: 'all 0.2s ease' }}
                  title={r.enabled ? 'Rule Enabled' : 'Rule Disabled'}
                >
                  {r.enabled ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListCollapse size={18} style={{ color: 'var(--primary)' }} /> Agent Event Audit Logs
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
            {logs.map(l => (
              <div key={l.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.15)', borderLeft: `3px solid ${
                l.type === 'success' ? 'var(--success)' : l.type === 'warning' ? 'var(--warning)' : 'var(--primary)'
              }` }}>
                <div style={{ flexGrow: 1 }}>
                  <p style={{ fontSize: '12.5px', color: 'white', lineHeight: '1.4' }}>{l.message}</p>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{l.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
