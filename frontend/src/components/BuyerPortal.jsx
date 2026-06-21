import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, CheckCircle2, User, RefreshCw, ShoppingBag, Trash2, Eye } from 'lucide-react';

export default function BuyerPortal({ customerId }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ? customerId.toString() : '');
  
  // Shopping Cart state
  const [cart, setCart] = useState({}); // { product_id: quantity }
  const [loading, setLoading] = useState(true);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, prodRes, salesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/sales')
      ]);
      const [custData, prodData, salesData] = await Promise.all([
        custRes.json(),
        prodRes.json(),
        salesRes.json()
      ]);
      setCustomers(custData);
      setProducts(prodData);
      setSalesOrders(salesData);
      
      if (customerId) {
        setSelectedCustomerId(customerId.toString());
      } else if (custData.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custData[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  // Filter sales orders for this specific customer
  const customerOrders = salesOrders.filter(so => so.customer_id.toString() === selectedCustomerId);

  const handleAddToCart = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    
    const currentQty = cart[prodId] || 0;
    if (prod.stock_quantity <= currentQty) {
      alert(`Cannot add more. Only ${prod.stock_quantity} units available in stock.`);
      return;
    }
    
    setCart(prev => ({ ...prev, [prodId]: currentQty + 1 }));
  };

  const handleUpdateCartQty = (prodId, qty) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    
    if (qty <= 0) {
      handleRemoveFromCart(prodId);
      return;
    }
    
    if (prod.stock_quantity < qty) {
      alert(`Cannot exceed available stock of ${prod.stock_quantity} units.`);
      return;
    }
    
    setCart(prev => ({ ...prev, [prodId]: qty }));
  };

  const handleRemoveFromCart = (prodId) => {
    setCart(prev => {
      const updated = { ...prev };
      delete updated[prodId];
      return updated;
    });
  };

  const handleCheckout = async () => {
    setErrorMsg('');
    setOrderSuccessMsg('');

    const items = Object.entries(cart).map(([prodId, qty]) => ({
      product_id: parseInt(prodId),
      quantity: qty
    }));

    if (items.length === 0) return;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(selectedCustomerId),
          items
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Checkout failed.");
        return;
      }

      setOrderSuccessMsg("Order placed successfully! Stocks decremented and AI models retrained.");
      setCart({});
      fetchData(); // reload datasets
      setTimeout(() => setOrderSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg("Failed to place order.");
    }
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((sum, [prodId, qty]) => {
      const prod = products.find(p => p.id === parseInt(prodId));
      if (!prod) return sum;
      return sum + (prod.sell_price * qty);
    }, 0);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buyer Portal</h1>
          <p className="page-subtitle">B2C/B2B Customer store: place orders, view invoices, and track your loyalty rankings.</p>
        </div>
        {!customerId ? (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderRadius: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Acting Customer Profile:</span>
            <select
              className="form-select"
              style={{ padding: '4px 10px', fontSize: '13px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px' }}
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setCart({}); // clear cart on switching user
              }}
            >
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', border: '1px solid var(--success-glow)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Buyer Customer:</span>{' '}
            <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
              {customers.find(c => c.id.toString() === selectedCustomerId)?.name || 'Syncing...'}
            </span>
          </div>
        )}
      </div>

      {orderSuccessMsg && (
        <div style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--success)', fontSize: '14px', animation: 'fadeIn 0.3s ease' }}>
          {orderSuccessMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--danger)', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
          <p>Connecting to catalog database...</p>
        </div>
      ) : (
        <>
          {/* Customer Overview Panel */}
          {activeCustomer && (
            <div className="kpi-grid">
              <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">Total Purchases</span>
                  <div className="kpi-icon-wrapper" style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.06)' }}>
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div className="kpi-value">₹{activeCustomer.total_spent.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cumulative amount spent with BusinessOS AI™</div>
              </div>

              <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">Loyalty Segment</span>
                  <div className="kpi-icon-wrapper" style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.06)' }}>
                    <User size={18} />
                  </div>
                </div>
                <div className="kpi-value">
                  <span className={`badge ${
                    activeCustomer.segment === 'Loyal' ? 'badge-success' : activeCustomer.segment === 'At Risk' ? 'badge-danger' : 'badge-info'
                  }`}>
                    {activeCustomer.segment} Tier
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Based on purchase frequency</div>
              </div>

              <div className="glass-card kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div className="kpi-header">
                  <span className="kpi-title">AI Churn Risk score</span>
                  <div className="kpi-icon-wrapper" style={{ color: 'var(--warning)', background: 'rgba(245,158,11,0.06)' }}>
                    <RefreshCw size={18} />
                  </div>
                </div>
                <div className="kpi-value" style={{ color: activeCustomer.churn_probability >= 70 ? 'var(--danger)' : activeCustomer.churn_probability >= 40 ? 'var(--warning)' : 'var(--success)' }}>
                  {activeCustomer.churn_probability}% Churn Risk
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Predicted by Logistic Regression</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '24px' }}>
            {/* Products grid */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Shop Products</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {products.map(p => {
                  const inCartQty = cart[p.id] || 0;
                  const isAvailable = p.stock_quantity > inCartQty;
                  return (
                    <div key={p.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                          {p.category}
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>{p.name}</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>SKU: {p.sku}</p>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>₹{p.sell_price.toFixed(2)}</span>
                          <span className={`badge ${p.stock_quantity <= p.reorder_level ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {p.stock_quantity} left
                          </span>
                        </div>

                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                          disabled={!isAvailable || p.stock_quantity === 0}
                          onClick={() => handleAddToCart(p.id)}
                        >
                          {p.stock_quantity === 0 ? "Sold Out" : inCartQty > 0 ? `In Cart (${inCartQty})` : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shopping Cart and Purchase History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Cart Summary */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={18} /> Cart Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '150px' }}>
                  {Object.entries(cart).map(([prodId, qty]) => {
                    const prod = products.find(p => p.id === parseInt(prodId));
                    if (!prod) return null;
                    return (
                      <div key={prodId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div style={{ flexGrow: 1 }}>
                          <p style={{ fontWeight: '500' }}>{prod.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{prod.sell_price.toFixed(2)} each</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input 
                            type="number"
                            min="0"
                            max={prod.stock_quantity}
                            style={{ width: '50px', padding: '2px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}
                            value={qty}
                            onChange={(e) => handleUpdateCartQty(parseInt(prodId), parseInt(e.target.value) || 0)}
                          />
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px', borderRadius: '4px' }}
                            onClick={() => handleRemoveFromCart(parseInt(prodId))}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(cart).length === 0 && (
                    <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--panel-border)', borderRadius: '8px', padding: '20px' }}>
                      Your shopping cart is empty.
                    </div>
                  )}
                </div>

                {Object.keys(cart).length > 0 && (
                  <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>
                      <span>Grand Total:</span>
                      <span style={{ color: 'var(--success)' }}>₹{getCartTotal().toFixed(2)}</span>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCheckout}>
                      Checkout & Place Order
                    </button>
                  </div>
                )}
              </div>

              {/* Purchase History */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>My Purchase History</h3>
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerOrders.map(o => (
                    <div key={o.id} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                        <span style={{ fontFamily: 'monospace' }}>INV-{o.id.toString().padStart(4, '0')}</span>
                        <span style={{ color: 'var(--success)' }}>₹{o.total_amount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} />
                          {new Date(o.order_date).toLocaleDateString()}
                        </div>
                        <span className={`badge ${o.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {customerOrders.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '10px' }}>No purchase invoices recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
