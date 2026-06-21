import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users, 
  IndianRupee, 
  FileText,
  Bot,
  Layers,
  UserCheck,
  LogOut,
  Bell
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Procurement from './components/Procurement';
import CustomerAnalytics from './components/CustomerAnalytics';
import Finance from './components/Finance';
import Reports from './components/Reports';
import AIAssistant from './components/AIAssistant';

// New portals & auth components
import VendorPortal from './components/VendorPortal';
import BuyerPortal from './components/BuyerPortal';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import AgenticAutomation from './components/AgenticAutomation';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('buyer'); // 'admin' | 'vendor' | 'buyer'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Real-time Notification Center state
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'danger', title: 'Stock Running Low', message: 'Mechanical Keyboard (SKU: ELEC-KEY-MECH) reached low stock.', read: false, time: '10m ago' },
    { id: 2, type: 'success', title: 'Invoice Generated', message: 'Invoice INV-0040 created for Bruce Wayne.', read: false, time: '2h ago' },
    { id: 3, type: 'warning', title: 'Customer Complaint Raised', message: 'Clark Kent logged a support complaint about shipping.', read: false, time: '5h ago' },
    { id: 4, type: 'info', title: 'New Order Received', message: 'Peter Parker placed a sales transaction order.', read: true, time: '1d ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const getNavItemsForRole = (role) => {
    const allItems = [
      { id: 'dashboard', label: 'Smart Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'inventory', label: 'Inventory Module', icon: <Package size={18} /> },
      { id: 'sales', label: 'Sales & Invoices', icon: <ShoppingCart size={18} /> },
      { id: 'procurement', label: 'Procurement (ERP)', icon: <Truck size={18} /> },
      { id: 'customers', label: 'Customer Analytics', icon: <Users size={18} /> },
      { id: 'finance', label: 'Finance Ledger', icon: <IndianRupee size={18} /> },
      { id: 'reports', label: 'AI Report Center', icon: <FileText size={18} /> },
      { id: 'users', label: 'User Accounts', icon: <UserCheck size={18} /> },
      { id: 'automation', label: 'Agentic Automation', icon: <Bot size={18} /> }
    ];

    if (role === 'admin' || role === 'owner') {
      return allItems;
    }
    if (role === 'manager') {
      return allItems.filter(item => item.id !== 'users');
    }
    if (role === 'sales_executive') {
      return allItems.filter(item => ['sales', 'customers', 'automation'].includes(item.id));
    }
    if (role === 'finance_officer') {
      return allItems.filter(item => ['finance', 'reports', 'automation'].includes(item.id));
    }
    if (role === 'warehouse_staff') {
      return allItems.filter(item => ['inventory', 'procurement', 'automation'].includes(item.id));
    }
    return [];
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem('aierp_user') || localStorage.getItem('aierp_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setUserRole(parsed.role);
        
        // Redirect standard roles to their first allowed tab
        if (['admin', 'owner', 'manager', 'sales_executive', 'finance_officer', 'warehouse_staff'].includes(parsed.role)) {
          const allowed = getNavItemsForRole(parsed.role);
          if (allowed.length > 0) {
            setActiveTab(allowed[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setUserRole(user.role);
    sessionStorage.setItem('aierp_user', JSON.stringify(user));
    
    if (['admin', 'owner', 'manager', 'sales_executive', 'finance_officer', 'warehouse_staff'].includes(user.role)) {
      const allowed = getNavItemsForRole(user.role);
      if (allowed.length > 0) {
        setActiveTab(allowed[0].id);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('buyer');
    sessionStorage.removeItem('aierp_user');
    localStorage.removeItem('aierp_user');
  };

  const renderContent = () => {
    if (userRole === 'vendor') {
      return <VendorPortal supplierId={currentUser?.supplier_id} />;
    }
    if (userRole === 'buyer') {
      return <BuyerPortal customerId={currentUser?.customer_id} />;
    }

    // Admin/Staff pages
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'procurement':
        return <Procurement />;
      case 'customers':
        return <CustomerAnalytics />;
      case 'finance':
        return <Finance />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UserManagement currentUser={currentUser} />;
      case 'automation':
        return <AgenticAutomation />;
      default:
        return <Dashboard />;
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-gradient)', color: 'var(--text-muted)' }}>
        <Bot size={40} style={{ animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        {/* Logo and Brand with Notification Bell */}
        <div className="logo-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', borderRadius: '10px', color: 'white' }}>
              <Bot size={20} />
            </div>
            <span className="logo-text" style={{ fontSize: '17px' }}>BusinessOS AI™</span>
          </div>
          
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'none', border: 'none', color: showNotifications ? 'white' : 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s ease' }}
            >
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '4px', background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)' }} />
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="glass-card" style={{ position: 'absolute', top: '35px', left: '-200px', width: '280px', zIndex: 1000, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--panel-border)', maxHeight: '350px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Notifications</span>
                  <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    Mark all read
                  </button>
                </div>
                
                {notifications.map(n => (
                  <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', padding: '8px', borderRadius: '6px', background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.05)', borderLeft: `3px solid ${
                    n.type === 'danger' ? 'var(--danger)' : n.type === 'success' ? 'var(--success)' : n.type === 'warning' ? 'var(--warning)' : 'var(--primary)'
                  }` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span style={{ color: 'white' }}>{n.title}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginTop: '2px' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Perspective Switcher - Admin Only */}
        {currentUser?.role === 'admin' && (
          <div style={{ marginBottom: '24px', padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Layers size={12} />
              <span>Perspective Switcher</span>
            </div>
            <select 
              className="form-select" 
              style={{ width: '100%', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--panel-border)', cursor: 'pointer' }}
              value={userRole}
              onChange={(e) => {
                const val = e.target.value;
                setUserRole(val);
                if (['admin', 'owner', 'manager', 'sales_executive', 'finance_officer', 'warehouse_staff'].includes(val)) {
                  const allowed = getNavItemsForRole(val);
                  if (allowed.length > 0) {
                    setActiveTab(allowed[0].id);
                  }
                }
              }}
            >
              <option value="admin">👤 Owner / Admin View</option>
              <option value="manager">💼 Operations Manager</option>
              <option value="sales_executive">📈 Sales Executive</option>
              <option value="finance_officer">💰 Finance Officer</option>
              <option value="warehouse_staff">📦 Warehouse Staff</option>
              <option value="vendor">🤝 B2B Vendor Portal</option>
              <option value="buyer">🛒 Customer Shop (Buyer)</option>
            </select>
          </div>
        )}

        {/* Navigation Sidebar List */}
        <nav style={{ flexGrow: 1 }}>
          {['admin', 'owner', 'manager', 'sales_executive', 'finance_officer', 'warehouse_staff'].includes(userRole) ? (
            <ul className="nav-list">
              {getNavItemsForRole(userRole).map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.icon}
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : userRole === 'vendor' ? (
            <ul className="nav-list">
              <li>
                <div className="nav-item active">
                  <Truck size={18} />
                  <span>Vendor Supply Hub</span>
                </div>
              </li>
            </ul>
          ) : (
            <ul className="nav-list">
              <li>
                <div className="nav-item active">
                  <ShoppingCart size={18} />
                  <span>Customer Shop</span>
                </div>
              </li>
            </ul>
          )}
        </nav>

        {/* Footer profile & logout */}
        <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'linear-gradient(to right, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: 'white', flexShrink: 0 }}>
              {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div style={{ minWidth: 0 }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentUser.name}>
                {currentUser.name}
              </h5>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userRole === 'admin' ? 'Administrator' : userRole === 'manager' ? 'Ops Manager' : userRole === 'sales_executive' ? 'Sales Exec' : userRole === 'finance_officer' ? 'Finance Officer' : userRole === 'warehouse_staff' ? 'Warehouse Staff' : userRole === 'vendor' ? 'Supplier B2B' : 'Buyer Customer'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Developer Credit */}
        <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '10.5px', color: 'var(--text-dark)', borderTop: '1px dashed var(--panel-border)', paddingTop: '8px', width: '100%', fontFamily: 'var(--font-body)', letterSpacing: '0.2px' }}>
          Developed by <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Aswin Karthik Vijayakumar</span>
        </div>
      </aside>

      {/* Main Content Panels */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Floating AI Business Assistant Chatbot */}
      <AIAssistant />
    </div>
  );
}
