import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: '', sku: '', category: 'Electronics', stock_quantity: 0, reorder_level: 5, buy_price: '', sell_price: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentProduct({
      name: '', sku: '', category: 'Electronics', stock_quantity: 0, reorder_level: 5, buy_price: '', sell_price: ''
    });
    setIsEditing(false);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setCurrentProduct(prod);
    setIsEditing(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    fetch(`/api/products/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setProducts(prev => prev.filter(p => p.id !== id));
      })
      .catch(err => console.error(err));
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!currentProduct.name || !currentProduct.sku || !currentProduct.buy_price || !currentProduct.sell_price) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    const url = isEditing ? `/api/products/${currentProduct.id}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentProduct)
    })
      .then(res => {
        if (!res.ok) throw new Error("SKU code must be unique!");
        return res.json();
      })
      .then(() => {
        setIsModalOpen(false);
        fetchProducts();
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  };

  // Filter products
  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    const matchesLowStock = !showLowStockOnly || p.stock_quantity <= p.reorder_level;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockAlerts = products.filter(p => p.stock_quantity <= p.reorder_level);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Catalog</h1>
          <p className="page-subtitle">Track, add, edit product variants, and inspect warehouse thresholds.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* AI Restocking Suggestions Ticker */}
      {lowStockAlerts.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div className="glass-card" style={{ flexGrow: 1, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--danger)' }}>
            <AlertCircle className="ticker-icon" style={{ color: 'var(--danger)' }} />
            <div>
              <h5 style={{ fontSize: '14px', fontWeight: '700' }}>AI Stock Prediction Alerts</h5>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                We recommend ordering: {lowStockAlerts.map(p => `'${p.name}'`).join(', ')}. Restock parameters have been sent to Procurement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '600px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-dark)' }} />
            </div>

            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              style={{ width: '16px', height: '16px' }}
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            Show Low Stock Only
          </label>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 2s linear infinite', marginBottom: '8px' }} />
            <p>Syncing inventory records...</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock Qty</th>
                  <th>Reorder Level</th>
                  <th>Buy Cost</th>
                  <th>Sell Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.sku}</td>
                      <td style={{ fontWeight: '500' }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td>
                        <span className={`badge ${p.stock_quantity <= p.reorder_level ? 'badge-danger' : 'badge-success'}`}>
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td>{p.reorder_level} units</td>
                      <td>₹{p.buy_price.toFixed(2)}</td>
                      <td>₹{p.sell_price.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', borderRadius: '6px' }}
                            onClick={() => handleOpenEditModal(p)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px', borderRadius: '6px' }}
                            onClick={() => handleDeleteProduct(p.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No products match the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container glass-card">
            <div className="modal-header">
              <h3 className="modal-title">{isEditing ? "Edit Product Details" : "Create New Product SKU"}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {errorMsg && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Mechanical Keyboard"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">SKU Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={currentProduct.sku}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                      placeholder="e.g. ELEC-KEY-MECH"
                      disabled={isEditing}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={currentProduct.category}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Buy Cost (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={currentProduct.buy_price}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, buy_price: e.target.value }))}
                      placeholder="45.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sell Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={currentProduct.sell_price}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, sell_price: e.target.value }))}
                      placeholder="79.99"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Stock Level</label>
                    <input
                      type="number"
                      className="form-input"
                      value={currentProduct.stock_quantity}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="10"
                      disabled={isEditing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reorder Level Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      value={currentProduct.reorder_level}
                      onChange={(e) => setCurrentProduct(prev => ({ ...prev, reorder_level: parseInt(e.target.value) || 0 }))}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
