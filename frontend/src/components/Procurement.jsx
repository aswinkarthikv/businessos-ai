import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Calendar, CheckCircle2, User, RefreshCw } from 'lucide-react';

export default function Procurement() {
  const [procurements, setProcurements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'suppliers'

  // PO creation state
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState([{ product_id: '', quantity: 10 }]);
  const [errorMsg, setErrorMsg] = useState('');

  // Supplier creation state
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, supRes, prodRes] = await Promise.all([
        fetch('/api/procurement'),
        fetch('/api/suppliers'),
        fetch('/api/products')
      ]);
      const [poData, supData, prodData] = await Promise.all([
        poRes.json(),
        supRes.json(),
        prodRes.json()
      ]);
      setProcurements(poData);
      setSuppliers(supData);
      setProducts(prodData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenPOModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setPoItems([{ product_id: products[0]?.id || '', quantity: 10 }]);
    setErrorMsg('');
    setIsPOModalOpen(true);
  };

  const handleAddPOItem = () => {
    setPoItems(prev => [...prev, { product_id: products[0]?.id || '', quantity: 10 }]);
  };

  const handleRemovePOItem = (idx) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePOItemChange = (idx, field, value) => {
    const updated = [...poItems];
    updated[idx][field] = value;
    setPoItems(updated);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSupplierId) {
      setErrorMsg("Please select a supplier.");
      return;
    }

    for (const item of poItems) {
      if (!item.product_id || item.quantity <= 0) {
        setErrorMsg("Please select a product and enter a positive quantity.");
        return;
      }
    }

    try {
      const res = await fetch('/api/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: parseInt(selectedSupplierId),
          items: poItems.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: parseInt(item.quantity)
          }))
        })
      });

      if (!res.ok) throw new Error("Failed to create PO.");

      setIsPOModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleMarkAsReceived = async (poId) => {
    try {
      const res = await fetch(`/api/procurement/${poId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Received' })
      });
      if (res.ok) {
        fetchData(); // reload lists and inventory increments
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      });
      if (res.ok) {
        setIsSupModalOpen(false);
        setNewSupplier({ name: '', email: '', phone: '', address: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePOTotal = () => {
    return poItems.reduce((acc, item) => {
      const prod = products.find(p => p.id === parseInt(item.product_id));
      if (!prod) return acc;
      return acc + (prod.buy_price * (parseInt(item.quantity) || 0));
    }, 0);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement Module</h1>
          <p className="page-subtitle">SAP-Inspired ERP Flow: Manage suppliers, track replenishment orders, and intake stocks.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsSupModalOpen(true)}>
            + Add Supplier
          </button>
          <button className="btn btn-primary" onClick={handleOpenPOModal} disabled={suppliers.length === 0 || products.length === 0}>
            <Truck size={16} /> Create PO
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px' }}
          onClick={() => setActiveTab('orders')}
        >
          Purchase Orders
        </button>
        <button 
          className={`btn ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px' }}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers Directory
        </button>
      </div>

      {/* Main Content Pane */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p>Connecting to ERP nodes...</p>
        </div>
      ) : activeTab === 'orders' ? (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Cost Outflow</th>
                  <th>Status</th>
                  <th>ERP Actions</th>
                </tr>
              </thead>
              <tbody>
                {procurements.length > 0 ? (
                  procurements.map(po => (
                    <tr key={po.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>PO-{po.id.toString().padStart(4, '0')}</td>
                      <td style={{ fontWeight: '500' }}>{po.supplier_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          {new Date(po.order_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--danger)' }}>₹{po.total_cost.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${po.status === 'Received' ? 'badge-success' : 'badge-warning'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td>
                        {po.status === 'Ordered' ? (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--success)', boxShadow: 'none' }}
                            onClick={() => handleMarkAsReceived(po.id)}
                          >
                            Mark as Received
                          </button>
                        ) : po.status === 'Received' ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} style={{ color: 'var(--success)' }} /> Stock Added
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No Purchase Orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Mailing Address</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(sup => (
                  <tr key={sup.id}>
                    <td style={{ fontWeight: '600' }}>{sup.name}</td>
                    <td>{sup.email}</td>
                    <td>{sup.phone}</td>
                    <td>{sup.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {isPOModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Draft Purchase Order (PO)</h3>
              <button className="modal-close" onClick={() => setIsPOModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreatePO}>
              {errorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vendor Link *</label>
                  <select
                    className="form-select"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label">Ordered Materials *</label>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleAddPOItem}>
                      + Add SKU
                    </button>
                  </div>

                  {poItems.map((item, idx) => {
                    const prod = products.find(p => p.id === parseInt(item.product_id));
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ flexGrow: 2 }}>
                          <select
                            className="form-select"
                            style={{ width: '100%' }}
                            value={item.product_id}
                            onChange={(e) => handlePOItemChange(idx, 'product_id', e.target.value)}
                            required
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Cost: ₹{p.buy_price.toFixed(2)}) [In Stock: {p.stock_quantity}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ width: '90px' }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="form-input"
                            style={{ width: '100%' }}
                            value={item.quantity}
                            onChange={(e) => handlePOItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>

                        <div style={{ width: '80px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                          ₹{prod ? (prod.buy_price * item.quantity).toFixed(2) : '0.00'}
                        </div>

                        {poItems.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            style={{ padding: '8px', borderRadius: '6px' }}
                            onClick={() => handleRemovePOItem(idx)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--panel-border)', marginTop: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Estimated Cost:</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>
                    ₹{calculatePOTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPOModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isSupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass-card">
            <div className="modal-header">
              <h3 className="modal-title">Register Supplier Vendor</h3>
              <button className="modal-close" onClick={() => setIsSupModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateSupplier}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Vendor Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Apex Electronics Corp"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="orders@apex.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1-555-1299"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="12 Logistics Ave, Suite B"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsSupModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
