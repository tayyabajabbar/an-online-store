// ====================================================================
// 👑 ADMIN PANEL COMPONENT (Dukaan Ke Maalik Ka Private Dashboard)
// ====================================================================
// Yeh file sirf aur sirf aapke (Admin) ke liye hai.
// Iske zariye aap:
// 1. Supabase se tamam customer orders live dekh sakti hain.
// 2. Order status badal sakti hain (Pending -> Shipped -> Delivered).
// 3. Naye winter sweaters dukaan mein shamil (add) kar sakti hain.
// 4. Total kamai aur orders ke hisaab kitaab (analytics) dekh sakti hain.

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function AdminPanel({ onBackToStore, initialProducts = [], onAddProduct, onDeleteProduct, onResetProducts }) {
  // ----------------------------------------------------
  // 🔐 1. ADMIN AUTHENTICATION (Supabase Verified)
  // ----------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('store_admin_pin') || '1234');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // PIN badalne ka tareeqa (Client apni marzi ka PIN khud rakh sake)
  const handleChangePin = () => {
    const newCode = prompt('Enter new secret Admin PIN (minimum 4 digits):');
    if (newCode && newCode.trim().length >= 4) {
      setAdminPin(newCode.trim());
      localStorage.setItem('store_admin_pin', newCode.trim());
      alert('✅ Admin PIN updated successfully!');
    } else if (newCode !== null) {
      alert('PIN must be at least 4 digits long!');
    }
  };

  // ----------------------------------------------------
  // 📌 2. ACTIVE TAB & DATA STATES
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  // Naya product add karne ka form
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'women',
    price: '',
    image: '',
    description: '',
    rating: 4.8
  });

  // ----------------------------------------------------
  // 📦 3. SUPABASE SE ORDERS FETCH KARNA (Live Database)
  // ----------------------------------------------------
  const fetchOrdersFromSupabase = async () => {
    setLoadingOrders(true);
    setOrdersError('');

    try {
      // Supabase ke 'orders' table se saara data le kar aao:
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setOrdersError('Supabase Notice: ' + error.message);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      setOrdersError('Connection Error: ' + err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersFromSupabase();
    }
  }, [isAuthenticated]);

  // ----------------------------------------------------
  // 🔑 4. PIN VERIFICATION FUNCTION
  // ----------------------------------------------------
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid PIN code! Please try again.');
    }
  };

  // ----------------------------------------------------
  // 🚚 5. ORDER STATUS UPDATE (Shipped / Delivered)
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // 1. Local state update
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );

    // 2. Supabase update
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Status update note:', err);
    }
  };

  // ----------------------------------------------------
  // 🧥 6. NAYA SWEATER ADD KARNA
  // ----------------------------------------------------
  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.image) {
      alert('Please provide product Name, Price, and Image URL!');
      return;
    }

    const createdItem = {
      id: Date.now(),
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      rating: Number(newProduct.rating) || 4.8,
      description: newProduct.description || 'Exclusive Winter Knitwear collection.',
      image: newProduct.image
    };

    if (onAddProduct) {
      onAddProduct(createdItem);
    }

    setNewProduct({
      name: '',
      category: 'women',
      price: '',
      image: '',
      description: '',
      rating: 4.8
    });

    alert(`🎉 "${createdItem.name}" has been added to the store successfully!`);
  };

  // Calculations for Stats:
  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  const totalOrdersCount = orders.length;

  // ====================================================
  // 🔒 SCREEN A: AGAR PIN VERIFY NAHI HUA (Login Gate)
  // ====================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-card">
          <div className="admin-badge-icon">👑</div>
          <h2>Admin Private Portal</h2>
          <p>Please enter your secret PIN to access the Admin Dashboard:</p>

          <form onSubmit={handlePinSubmit} className="admin-pin-form">
            <input
              type="password"
              maxLength="20"
              placeholder="Enter Admin PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="admin-pin-input"
              autoFocus
            />

            {pinError && <p className="pin-error-text">{pinError}</p>}

            <button type="submit" className="admin-unlock-btn">
              Unlock Dashboard 🔓
            </button>
          </form>

          <button onClick={onBackToStore} className="back-to-store-link">
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  // ====================================================
  // 👑 SCREEN B: ASALI ADMIN DASHBOARD
  // ====================================================
  return (
    <div className="admin-dashboard-container">
      {/* 🧭 ADMIN TOP HEADER */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo-icon">👑</span>
          <div>
            <h1>WinterWarmth Admin Office</h1>
            <p className="admin-role-tag">Store Owner Dashboard</p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            onClick={() => setActiveTab('products')}
            className="admin-quick-add-btn"
            title="Add new sweater to the store"
          >
            ➕ Add New Sweater
          </button>
          <button
            onClick={handleChangePin}
            className="admin-pin-btn"
            title="Change your secret PIN code"
          >
            🔐 Change PIN
          </button>
          <button onClick={fetchOrdersFromSupabase} className="admin-refresh-btn" title="Live Supabase Data Refresh">
            🔄 Refresh Supabase
          </button>
          <button onClick={onBackToStore} className="admin-exit-btn">
            🛍️ View Customer Store
          </button>
        </div>
      </header>

      {/* 📊 KPI STATS CARDS (Total Revenue & Orders) */}
      <section className="admin-kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon">💰</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Revenue</span>
            <strong className="kpi-value">Rs. {totalRevenue.toLocaleString()}</strong>
            <span className="kpi-sub">From live Supabase orders</span>
          </div>
        </div>

        <div className="kpi-card orders">
          <div className="kpi-icon">📦</div>
          <div className="kpi-details">
            <span className="kpi-label">Total Orders</span>
            <strong className="kpi-value">{totalOrdersCount}</strong>
            <span className="kpi-sub">Customer orders</span>
          </div>
        </div>

        <div
          className="kpi-card items clickable-kpi"
          onClick={() => setActiveTab('products')}
          title="Click to add / manage sweaters"
        >
          <div className="kpi-icon">🧥</div>
          <div className="kpi-details">
            <span className="kpi-label">Active Sweaters</span>
            <strong className="kpi-value">{initialProducts.length} Items</strong>
            <span className="kpi-sub-action">👉 Click to Add / Manage Sweaters</span>
          </div>
        </div>
      </section>

      {/* 🏷️ ADMIN NAVIGATION TABS */}
      <div className="admin-tabs-bar">
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Customer Orders ({totalOrdersCount})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          ➕ Add New Sweater & Manage ({initialProducts.length})
        </button>
      </div>

      {/* ============================================== */}
      {/* 📦 TAB 1: CUSTOMER ORDERS LIST (From Supabase) */}
      {/* ============================================== */}
      {activeTab === 'orders' && (
        <section className="admin-section">
          <div className="section-title-row">
            <div>
              <h3>Customer Orders (From Supabase Database)</h3>
              <p>Live incoming customer orders from the store are listed below:</p>
            </div>
            <button onClick={fetchOrdersFromSupabase} className="btn-small-refresh">
              🔄 Fetch Latest
            </button>
          </div>

          {loadingOrders ? (
            <div className="admin-loading-box">
              <span className="spinner">⏳</span>
              <p>Loading orders from database...</p>
            </div>
          ) : ordersError ? (
            <div className="admin-notice-box">
              <p>⚠️ {ordersError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="admin-empty-box">
              <span className="empty-icon">📭</span>
              <h4>No Orders Yet</h4>
              <p>When customers place orders on the website, they will appear here in real time.</p>
              <button onClick={onBackToStore} className="btn-action-primary">
                Go to Store & Place an Order
              </button>
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Info</th>
                    <th>Phone & City</th>
                    <th>Delivery Address</th>
                    <th>Payment</th>
                    <th>Bill (Total)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id || ord.order_id}>
                      <td>
                        <strong className="order-id-code">{ord.order_id || `ORD-${ord.id}`}</strong>
                        <div className="order-date-small">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Today'}
                        </div>
                      </td>
                      <td>
                        <div className="cust-name">👤 {ord.customer_name || 'Customer'}</div>
                        <div className="cust-email">{ord.customer_email || 'No Email'}</div>
                      </td>
                      <td>
                        <div>📞 {ord.phone || 'N/A'}</div>
                        <span className="city-pill">📍 {ord.city || 'Pakistan'}</span>
                      </td>
                      <td className="address-cell">
                        <p title={ord.address}>{ord.address || 'Standard Delivery'}</p>
                      </td>
                      <td>
                        <span className={`payment-pill ${ord.payment_method}`}>
                          {ord.payment_method === 'cod' ? '💵 COD' : ord.payment_method === 'jazzcash' ? '📱 Mobile' : '💳 Card'}
                        </span>
                      </td>
                      <td>
                        <strong className="bill-highlight">
                          Rs. {Number(ord.total_amount || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <select
                          className={`status-select ${(ord.status || 'Pending').toLowerCase()}`}
                          value={ord.status || 'Pending'}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        >
                          <option value="Pending">🟡 Pending</option>
                          <option value="Shipped">🚚 Shipped</option>
                          <option value="Delivered">🟢 Delivered</option>
                          <option value="Cancelled">🔴 Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ============================================== */}
      {/* 🧥 TAB 2: PRODUCTS MANAGER (Add New Sweaters)  */}
      {/* ============================================== */}
      {activeTab === 'products' && (
        <section className="admin-section">
          {/* Add Product Form */}
          <div className="add-product-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>➕ Add New Winter Sweater</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Fill in the details below to add a new sweater directly to the store:
                </p>
              </div>
              {onResetProducts && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset products to the original 20 items?')) {
                      onResetProducts();
                      alert('✅ Store products reset to original 20 items successfully!');
                    }
                  }}
                  className="btn-small-refresh"
                  title="Reset to default items"
                >
                  🔄 Reset to Original 20
                </button>
              )}
            </div>

            <form onSubmit={handleCreateProduct} className="add-product-form">
              <div className="form-grid">
                <div className="admin-form-group">
                  <label>Sweater Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Women's Velvet Winter Hoodie"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Category:</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="women">👩 Women</option>
                    <option value="men">🧔 Men</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Price (Rs.):</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2999"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Photo URL (Image Link):</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Description:</label>
                <input
                  type="text"
                  placeholder="Pure soft wool, comfortable winter wear..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-add-product">
                + Add Sweater To Website
              </button>
            </form>
          </div>

          {/* Current Products List */}
          <div className="current-products-section">
            <h4>🧥 Current Store Sweaters ({initialProducts.length} Items)</h4>
            <div className="admin-products-grid">
              {initialProducts.map((prod) => (
                <div key={prod.id} className="admin-product-row">
                  <img src={prod.image} alt={prod.name} className="admin-prod-thumb" />
                  <div className="admin-prod-info">
                    <strong>{prod.name}</strong>
                    <span className="prod-cat">
                      {prod.category === 'men' ? '🧔 Men' : '👩 Women'} • Rs. {prod.price.toLocaleString()}
                    </span>
                  </div>
                  {onDeleteProduct && (
                    <button
                      className="btn-del-prod"
                      onClick={() => onDeleteProduct(prod.id)}
                      title="Delete sweater from store"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
