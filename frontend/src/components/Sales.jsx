import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, ShoppingBag, Eye, Calendar, RefreshCw } from 'lucide-react';

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([{ product_id: '', quantity: 1 }]);
  
  // View details modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, custRes, prodRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      const [ordersData, custData, prodData] = await Promise.all([
        ordersRes.json(),
        custRes.json(),
        prodRes.json()
      ]);
      setOrders(ordersData);
      setCustomers(custData);
      setProducts(prodData);
    } catch (err) {
      console.error("Error fetching sales data: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setInvoiceItems([{ product_id: products[0]?.id || '', quantity: 1 }]);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setInvoiceItems(prev => [...prev, { product_id: products[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...invoiceItems];
    updated[idx][field] = value;
    setInvoiceItems(updated);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }

    // Validate quantities and stock levels
    for (const item of invoiceItems) {
      if (!item.product_id) {
        setErrorMsg("Please select a product for all rows.");
        return;
      }
      const prod = products.find(p => p.id === parseInt(item.product_id));
      if (prod) {
        if (item.quantity <= 0) {
          setErrorMsg(`Quantity for '${prod.name}' must be at least 1.`);
          return;
        }
        if (prod.stock_quantity < item.quantity) {
          setErrorMsg(`Insufficient stock for '${prod.name}'. Only ${prod.stock_quantity} available.`);
          return;
        }
      }
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(selectedCustomerId),
          items: invoiceItems.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: parseInt(item.quantity)
          }))
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to log sales order.");
        return;
      }

      setIsModalOpen(false);
      fetchData(); // refresh lists & stock counts
    } catch (err) {
      setErrorMsg("Failed to connect to backend server.");
    }
  };

  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce((acc, item) => {
      const prod = products.find(p => p.id === parseInt(item.product_id));
      if (!prod) return acc;
      return acc + (prod.sell_price * (parseInt(item.quantity) || 0));
    }, 0);
  };

  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    `INV-${o.id.toString().padStart(4, '0')}`.includes(searchTerm)
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Management</h1>
          <p className="page-subtitle">Draft customer sales invoices, track shipments, and dispatch invoices.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} disabled={customers.length === 0 || products.length === 0}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '450px' }}>
            <input
              type="text"
              placeholder="Search by Invoice ID or Customer Name..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-dark)' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
            <p>Retrieving transaction history...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Total Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>INV-{o.id.toString().padStart(4, '0')}</td>
                      <td style={{ fontWeight: '500' }}>{o.customer_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          {new Date(o.order_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--success)' }}>₹{o.total_amount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${o.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedOrder(o)}
                          >
                            <Eye size={12} /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No sales invoices recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass-card" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Sales Invoice</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              {errorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Customer Link *</label>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label">Invoice Items *</label>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleAddItemRow}>
                      + Add Item
                    </button>
                  </div>

                  {invoiceItems.map((item, idx) => {
                    const prod = products.find(p => p.id === parseInt(item.product_id));
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ flexGrow: 2 }}>
                          <select
                            className="form-select"
                            style={{ width: '100%' }}
                            value={item.product_id}
                            onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                            required
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.sell_price.toFixed(2)}) [Stock: {p.stock_quantity}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ width: '80px' }}>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ width: '100%' }}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>

                        <div style={{ width: '80px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                          ₹{prod ? (prod.sell_price * item.quantity).toFixed(2) : '0.00'}
                        </div>

                        {invoiceItems.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            style={{ padding: '8px', borderRadius: '6px' }}
                            onClick={() => handleRemoveItemRow(idx)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--panel-border)', marginTop: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Invoice Value:</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>
                    ₹{calculateInvoiceTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-container glass-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontFamily: 'monospace' }}>Invoice INV-{selectedOrder.id.toString().padStart(4, '0')}</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CUSTOMER DETAILS</p>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px' }}>{selectedOrder.customer_name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Order Date: {new Date(selectedOrder.order_date).toLocaleString()}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>ORDER ITEMS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>{item.product_name} <font color="var(--text-muted)">× {item.quantity}</font></span>
                      <span style={{ fontWeight: '500' }}>₹{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Grand Total:</span>
                <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--success)' }}>₹{selectedOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
