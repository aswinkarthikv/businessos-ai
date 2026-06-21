import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, Calendar, CheckCircle2, AlertTriangle, Package } from 'lucide-react';

export default function VendorPortal({ supplierId }) {
  const [suppliers, setSuppliers] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(supplierId ? supplierId.toString() : '');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [supRes, poRes, prodRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/procurement'),
        fetch('/api/products')
      ]);
      const [supData, poData, prodData] = await Promise.all([
        supRes.json(),
        poRes.json(),
        prodRes.json()
      ]);
      setSuppliers(supData);
      setProcurements(poData);
      setProducts(prodData);
      
      // Auto select supplier
      if (supplierId) {
        setSelectedSupplierId(supplierId.toString());
      } else if (supData.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supData[0].id.toString());
      }
    } catch (err) {
      console.error("Error loading vendor portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShipAndDeliver = async (poId) => {
    try {
      const res = await fetch(`/api/procurement/${poId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Received' })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeVendor = suppliers.find(s => s.id.toString() === selectedSupplierId);

  // Filter procurements sent to this vendor
  const vendorOrders = procurements.filter(po => po.supplier_id.toString() === selectedSupplierId);

  // Filter products supplied by this vendor.
  // We can map products based on SKU prefixes or categories:
  // Global Tech (1) -> Electronics
  // Apex Office (2) -> Office Supplies
  // Prime Supply (3) -> Accessories
  const getSuppliedProducts = () => {
    if (!selectedSupplierId) return [];
    const catMap = {
      '1': 'Electronics',
      '2': 'Office Supplies',
      '3': 'Accessories'
    };
    const targetCat = catMap[selectedSupplierId] || 'Electronics';
    return products.filter(p => p.category === targetCat);
  };

  const suppliedProducts = getSuppliedProducts();

  // Calculate metrics
  const totalCost = vendorOrders.reduce((sum, o) => sum + o.total_cost, 0);
  const pendingOrders = vendorOrders.filter(o => o.status === 'Ordered').length;
  const fulfilledOrders = vendorOrders.filter(o => o.status === 'Received').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Supplier Portal</h1>
          <p className="page-subtitle">B2B interface: view procurement demands, process shipments, and manage product inventory.</p>
        </div>
        {!supplierId ? (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Logged in as Supplier:</span>
            <select
              className="form-select"
              style={{ padding: '4px 10px', fontSize: '13px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px' }}
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', border: '1px solid var(--success-glow)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Logged in Vendor:</span>{' '}
            <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
              {suppliers.find(s => s.id.toString() === selectedSupplierId)?.name || 'Syncing...'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p>Syncing supply chains...</p>
        </div>
      ) : (
        <>
          {/* Supplier Info Alert */}
          {activeVendor && (
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Vendor Details</span>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{activeVendor.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Email: {activeVendor.email} | Phone: {activeVendor.phone} | Address: {activeVendor.address}
              </p>
            </div>
          )}

          {/* Supplier Dashboard Cards */}
          <div className="kpi-grid">
            <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="kpi-header">
                <span className="kpi-title">Total Orders Value</span>
                <div className="kpi-icon-wrapper" style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.06)' }}>
                  <Truck size={18} />
                </div>
              </div>
              <div className="kpi-value">₹{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cumulative demand orders value</div>
            </div>

            <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="kpi-header">
                <span className="kpi-title">Pending Orders</span>
                <div className="kpi-icon-wrapper" style={{ color: 'var(--warning)', background: 'rgba(245,158,11,0.06)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value">{pendingOrders} orders</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting dispatch & logistics</div>
            </div>

            <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="kpi-header">
                <span className="kpi-title">Fulfilled Demands</span>
                <div className="kpi-icon-wrapper" style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.06)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="kpi-value">{fulfilledOrders} orders</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Successfully received at BusinessOS AI™ warehouse</div>
            </div>
          </div>

          <div className="erp-grid-2">
            {/* Procurement Orders list */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>ERP Purchase Orders</h3>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>PO ID</th>
                      <th>Order Date</th>
                      <th>Total cost</th>
                      <th>Delivery Status</th>
                      <th>Logistics Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorOrders.length > 0 ? (
                      vendorOrders.map(po => (
                        <tr key={po.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>PO-{po.id.toString().padStart(4, '0')}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                              {new Date(po.order_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td style={{ fontWeight: '600' }}>₹{po.total_cost.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${po.status === 'Received' ? 'badge-success' : 'badge-warning'}`}>
                              {po.status === 'Received' ? 'Fulfilled' : po.status}
                            </span>
                          </td>
                          <td>
                            {po.status === 'Ordered' ? (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--success)', boxShadow: 'none' }}
                                onClick={() => handleShipAndDeliver(po.id)}
                              >
                                Ship & Deliver
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={13} style={{ color: 'var(--success)' }} /> Received by Admin
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No Purchase Orders dispatched to your firm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplied products list */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Our Supplied SKUs</h3>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU Code</th>
                      <th>Wholesale Cost</th>
                      <th>Warehouse Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliedProducts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '500' }}>{p.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                        <td>₹{p.buy_price.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${p.stock_quantity <= p.reorder_level ? 'badge-danger' : 'badge-success'}`}>
                            {p.stock_quantity} units
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
