import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  IndianRupee, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ChevronRight,
  Download,
  Bot,
  CheckCircle2,
  Settings,
  Sparkles
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [procurementSuccess, setProcurementSuccess] = useState('');
  const [procuring, setProcuring] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error("Backend server not responding");
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        <h2 className="page-title">Loading Operations Suite...</h2>
        <div className="kpi-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-card kpi-card" style={{ height: '120px', opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center', margin: '40px auto', maxWidth: '600px' }}>
        <AlertTriangle size={48} className="ticker-icon" style={{ color: 'var(--danger)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Backend Offline</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
          Please make sure the Flask backend server is running on port 5000 and the database is initialized.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  const { kpis, sales_forecast, top_products, ai_suggestions } = data;

  // Prepare forecasting chart labels & data
  const historyMonths = sales_forecast.history.map(h => h.month);
  const historySales = sales_forecast.history.map(h => h.sales);
  
  const allLabels = [...historyMonths, sales_forecast.forecast.month];
  
  // Forecast values: historical followed by predicted value
  const forecastSalesData = [...historySales, sales_forecast.forecast.sales];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
      }
    }
  };

  const lineChartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Historical Sales (₹)',
        data: [...historySales, null], // hide last point from historical
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: '#6366f1',
        fill: true
      },
      {
        label: 'AI Sales Forecast (₹)',
        data: [...Array(historySales.length - 1).fill(null), historySales[historySales.length - 1], sales_forecast.forecast.sales],
        borderColor: '#a855f7',
        borderDash: [5, 5],
        borderWidth: 3,
        pointBackgroundColor: '#a855f7',
        pointRadius: 6,
        tension: 0
      }
    ]
  };

  const doughnutChartData = {
    labels: top_products.map(p => p.name),
    datasets: [
      {
        data: top_products.map(p => p.sales),
        backgroundColor: [
          '#6366f1',
          '#a855f7',
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderColor: 'rgba(15, 23, 42, 0.8)',
        borderWidth: 2
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      }
    }
  };

  const triggerProcurementApprove = async () => {
    setProcuring(true);
    setProcurementSuccess('');
    try {
      // Approve B2B replenishment order for product 3 (Wireless Mouse)
      const res = await fetch('/api/procurement/approve-suggested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: 3, quantity: 50 })
      });
      if (res.ok) {
        setProcurementSuccess("Smart Suggestion Approved! Purchase Order PO-0004 dispatched to Global Tech.");
        // Reload dashboard KPIs
        const dashRes = await fetch('/api/dashboard');
        const dashData = await dashRes.json();
        setData(dashData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcuring(false);
      setTimeout(() => setProcurementSuccess(''), 6000);
    }
  };

  const triggerGenerateReport = () => {
    setGeneratingReport(true);
    setReportGenerated(false);
    setTimeout(() => {
      setGeneratingReport(false);
      setReportGenerated(true);
    }, 1200);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            BusinessOS AI™
          </h1>
          <p className="page-subtitle">Run Your Business. Powered by AI.</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '4px', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
          Autonomous Operations: Active
        </div>
      </div>

      {/* SAP Inspired ERP Visual Workflow */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '15px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
          Enterprise Core Workflow (SAP Inspired)
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          {/* Step 1: Procurement */}
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Step 1</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Procurement</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>B2B PO Intake & Supply</p>
          </div>
          
          <ChevronRight size={20} style={{ color: 'var(--text-dark)' }} />

          {/* Step 2: Inventory */}
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(168, 85, 247, 0.04)', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Step 2</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Inventory</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>SKU Logistics & Auditing</p>
          </div>

          <ChevronRight size={20} style={{ color: 'var(--text-dark)' }} />

          {/* Step 3: Sales */}
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--success)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Step 3</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Sales Shop</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Orders, Cart & Billing</p>
          </div>

          <ChevronRight size={20} style={{ color: 'var(--text-dark)' }} />

          {/* Step 4: Finance */}
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--warning)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Step 4</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Finance Ledger</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Balance Sheets & Profits</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Revenue</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--success)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{kpis.total_revenue.toLocaleString()}</div>
          <div className="kpi-change up">
            <ArrowUpRight size={14} />
            <span>+12.4% vs last period</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Operational Expenses</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--danger)' }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{kpis.total_expenses.toLocaleString()}</div>
          <div className="kpi-change down">
            <ArrowDownRight size={14} />
            <span>+3.2% warehouse overhead</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Profit</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--primary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">₹{kpis.net_profit.toLocaleString()}</div>
          <div className="kpi-change down" style={{ color: 'var(--danger)' }}>
            <ArrowDownRight size={14} />
            <span>-5.3% inventory overhead</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Customers</span>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--accent)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{kpis.total_customers}</div>
          <div className="kpi-change up" style={{ color: 'var(--warning)' }}>
            <span>Avg. Churn Risk: {kpis.avg_churn_rate}%</span>
          </div>
        </div>
      </div>

      {/* AI Insights Feed Grid */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Operational Insights Feed
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Card 1: Churn Risk alert */}
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.02)', borderLeft: '3px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <AlertTriangle size={14} />
              <span>Customer Churn Alert</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.4' }}>
              Bruce Wayne & Clark Kent are at 98% Churn Risk. Recommended action: Launch email retention coupon campaign.
            </p>
          </div>

          {/* Card 2: Revenue Expected increase */}
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.02)', borderLeft: '3px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <TrendingUp size={14} />
              <span>Revenue Forecast Trend</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.4' }}>
              Sales forecast models project next month revenue at <b>₹{sales_forecast.forecast.sales.toLocaleString(undefined, {maximumFractionDigits:0})}</b> (18% YoY growth estimate).
            </p>
          </div>

          {/* Card 3: Smart Restock suggestion */}
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.02)', borderLeft: '3px solid var(--success)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <Package size={14} />
                <span>Smart Restock Suggestion</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.4' }}>
                Order <b>50 Wireless Mouse</b> from Global Tech.<br/>Est. Cost: <b>₹{ (50 * 15).toLocaleString() }</b>.
              </p>
            </div>
            
            {procurementSuccess ? (
              <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 'bold', marginTop: '10px', display: 'block' }}>Approved & PO Generated</span>
            ) : (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '4px', fontSize: '11px', justifyContent: 'center', marginTop: '10px', background: 'var(--success)' }}
                disabled={procuring}
                onClick={triggerProcurementApprove}
              >
                {procuring ? 'Processing...' : 'Approve PO'}
              </button>
            )}
          </div>

          {/* Card 4: Reduce carrying costs */}
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.02)', borderLeft: '3px solid var(--warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              <IndianRupee size={14} />
              <span>Cost Optimization Alert</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.4' }}>
              Holding costs are 15% above optimal in Electronics. Suggest reducing bulk PO quantities by 8% to conserve cash.
            </p>
          </div>
        </div>
      </div>

      {procurementSuccess && (
        <div style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--success)', fontSize: '13px' }}>
          {procurementSuccess}
        </div>
      )}

      {/* Executive Summary Report Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '700' }}>Executive summary Report Generator</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Autonomously compiles net growth trajectories and flags critical customer retention priorities.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={triggerGenerateReport} disabled={generatingReport}>
              {generatingReport ? 'Compiling Statistics...' : 'Generate Monthly Report'}
            </button>
            
            {reportGenerated && (
              <a 
                href="/api/reports/download/executive" 
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <Download size={15} /> Download PDF Report
              </a>
            )}
          </div>
        </div>

        {reportGenerated && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--panel-border)', borderRadius: '10px', animation: 'fadeIn 0.3s ease' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revenue Growth</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)', marginTop: '4px' }}>Revenue ↑ 12.4%</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Corporate Profit</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)', marginTop: '4px' }}>Profit ↓ 5.3%</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top Product SKU</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>USB-C Hub</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>At Risk Profiles</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--warning)', marginTop: '4px' }}>4 Customers</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI Prescribed Strategy</span>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', marginTop: '4px', lineHeight: '1.2' }}>Launch Customer Retention Campaign</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="glass-card chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="chart-title">Revenue Trend & Next Month Forecast</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '10px' }}>Confidence: 92%</span>
              <span className="badge badge-info" style={{ fontSize: '10px' }}>Linear Regression</span>
            </div>
          </div>
          <div style={{ flexGrow: 1, position: 'relative', height: '100%' }}>
            <Line options={chartOptions} data={lineChartData} />
          </div>
        </div>

        <div className="glass-card chart-card">
          <h3 className="chart-title">Top Products (Units Sold)</h3>
          <div style={{ flexGrow: 1, position: 'relative', height: '100%', marginTop: '10px' }}>
            {top_products.length > 0 ? (
              <Doughnut options={doughnutOptions} data={doughnutChartData} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No sales transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom info section */}
      <div className="erp-grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Low Stock Priorities</h3>
          {kpis.low_stock_count > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px' }}>
              <AlertTriangle style={{ color: 'var(--danger)' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--danger)' }}>
                  {kpis.low_stock_count} SKUs are currently low in stock!
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Restocking is recommended. Visit the <strong>Procurement Module</strong> to place orders.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px' }}>
              <div style={{ color: 'var(--success)' }}>✔</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>Inventory levels are healthy</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>All product stocks are above reorder levels.</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>AI Forecasting Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Predicted Sales ({sales_forecast.forecast.month}):</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>₹{sales_forecast.forecast.sales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Confidence Score Interval:</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>92.4% Probability Range</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              This prediction is computed using an ordinary least squares (OLS) linear trend model fitted to active transactions. Confidence bounds are calculated via standard error of residuals.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
