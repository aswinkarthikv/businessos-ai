import React from 'react';
import { FileText, ArrowDown, ShoppingBag, BarChart3, Database } from 'lucide-react';

export default function Reports() {
  const reportCards = [
    {
      type: 'sales',
      title: 'Sales Operations Report',
      description: 'Generates a PDF document compiling invoice records, total transaction values, recent customer purchases, and order tracking statuses.',
      icon: <ShoppingBag size={24} style={{ color: 'var(--success)' }} />,
      endpoint: '/api/reports/download/sales'
    },
    {
      type: 'finance',
      title: 'Financial Statements Sheet',
      description: 'Generates an official corporate statement outlining total sales inflows, supplier procurement costs, logged operation overheads, and net profit margins.',
      icon: <BarChart3 size={24} style={{ color: 'var(--primary)' }} />,
      endpoint: '/api/reports/download/finance'
    },
    {
      type: 'inventory',
      title: 'Inventory & Stock Audit',
      description: 'Generates a warehouse audit listing all SKU codes, in-stock levels, reorder parameters, catalog categories, and flags for critical restocking priorities.',
      icon: <Database size={24} style={{ color: 'var(--accent)' }} />,
      endpoint: '/api/reports/download/inventory'
    }
  ];

  const handleDownloadReport = (endpoint) => {
    // Open in a new tab to trigger direct download headers from Flask send_file
    window.open(endpoint, '_blank');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Report Generator</h1>
          <p className="page-subtitle">One-click PDF generation compiling live operations matrices and historical ledgers.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
        {reportCards.map((report, index) => (
          <div key={index} className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: '12px', width: 'fit-content' }}>
                {report.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '700' }}>{report.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{report.description}</p>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '12px' }}
              onClick={() => handleDownloadReport(report.endpoint)}
            >
              <FileText size={16} /> Compile & Download <ArrowDown size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* System Note */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Report Engine Details</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-dark)', marginTop: '6px', lineHeight: '1.4' }}>
          All PDF documents are compiled dynamically on the server utilizing ReportLab's SimpleDocTemplate and flowable table-paragraph wrappers. Tables feature indigo branding styles, page metadata, confidentiality disclaimers, and auto-adjusted column scales.
        </p>
      </div>
    </>
  );
}
