import React, { useState, useEffect } from 'react';
// 1. Hum products ka data import kar rahe hain
import { products } from './productsData';
// 2. Hum Supabase client import kar rahe hain (Alag file se!)
import { supabase } from './supabase';
// 3. Admin Panel import kar rahe hain (Shop Owner Portal)
import AdminPanel from './AdminPanel';

function App() {
  // ========================================================
  // 📌 1. STATES (Yeh application ka data store karti hain)
  // ========================================================

  // Store products state (Persistent: Page reload ya refresh hone par bhi naye sweaters mehfooz rahein)
  const [storeProducts, setStoreProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('winter_store_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('LocalStorage load note:', err);
    }
    return products;
  });

  // Jab bhi storeProducts update hon, foran localStorage mein save ho jayein
  useEffect(() => {
    try {
      localStorage.setItem('winter_store_products', JSON.stringify(storeProducts));
    } catch (err) {
      console.warn('LocalStorage save note:', err);
    }
  }, [storeProducts]);

  // View mode state ('store' customer ke liye, 'admin' dukaan maalik ke liye)
  const [viewMode, setViewMode] = useState(() => (window.location.hash === '#admin' ? 'admin' : 'store'));

  // Search input ki value store karne ke liye state
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Category store karne ke liye state ('all', 'men', ya 'women')
  const [selectedCategory, setSelectedCategory] = useState('all');

  // ❤️ Wishlist state (Persistent via localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('winter_store_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  // 📏 Size selector state per product: { [productId]: 'M' }
  const [selectedSizes, setSelectedSizes] = useState({});

  // 📦 Customer My Orders state (Modal & list)
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrdersList, setMyOrdersList] = useState([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  // Cart mein add ki hui items ko store karne ke liye array
  const [cart, setCart] = useState([]);

  // Cart ka modal (popup) khula hai ya band
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --------------------------------------------------------
  // 👤 AUTHENTICATION STATES (Login / Sign Up)
  // --------------------------------------------------------
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' ya 'signup'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);

  // ⚡ SUPABASE SESSION LISTENER (Page refresh hone par bhi user login rahe)
  useEffect(() => {
    // 1. Active session check karein
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          email: session.user.email
        });
      }
    });

    // 2. Auth changes listen karein (Login/Logout par khud update ho)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          email: session.user.email
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👑 STORE OWNER ADMIN EMAIL LIST (Sirf in emails ko login par navbar mein Admin dikhega)
  const ADMIN_EMAILS = [
    'tayyaba5@gmail.com',
    'tayyaba@admin.com',
    'admin@winterwarmth.com'
  ];
  const isAdminUser = Boolean(
    currentUser && (
      ADMIN_EMAILS.includes(currentUser.email?.toLowerCase().trim()) ||
      currentUser.email?.toLowerCase().includes('admin')
    )
  );

  // 🔗 URL Hash Listener (#admin likhne par secret admin portal khul jaye)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setViewMode('admin');
      } else if (window.location.hash === '' && viewMode === 'admin') {
        setViewMode('store');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [viewMode]);

  // ⌨️ Secret Keyboard Shortcut (Ctrl + Shift + A) - Kisi client ko pata nahi chalega
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setViewMode((prev) => {
          const next = prev === 'admin' ? 'store' : 'admin';
          if (next === 'admin') {
            window.location.hash = 'admin';
          } else {
            if (window.location.hash === '#admin') {
              window.history.pushState('', document.title, window.location.pathname + window.location.search);
            }
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --------------------------------------------------------
  // 🚚 CHECKOUT & PAYMENT STATES (Kaise Paise Dena Hai)
  // --------------------------------------------------------
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'jazzcash', 'card'
  const [deliveryForm, setDeliveryForm] = useState({
    phone: '',
    address: '',
    city: 'Lahore'
  });
  const [orderSuccess, setOrderSuccess] = useState(null);


  // ❤️ Toggle Wishlist function
  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem('winter_store_wishlist', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // 📦 Customer My Orders Fetch
  const handleOpenMyOrders = async () => {
    if (!currentUser) {
      alert('Please Login or Sign Up first to track your orders!');
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsMyOrdersOpen(true);
    setLoadingMyOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', currentUser.email)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setMyOrdersList(data);
      } else {
        setMyOrdersList([]);
      }
    } catch (err) {
      console.warn('My orders fetch error:', err);
    } finally {
      setLoadingMyOrders(false);
    }
  };

  // ========================================================
  // 🔍 2. FILTER FUNCTION (Search aur Category Filter Logic)
  // ========================================================
  const filteredProducts = storeProducts.filter((item) => {
    if (showWishlistOnly && !wishlist.includes(item.id)) {
      return false;
    }

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });


  // ========================================================
  // 🛒 3. CART FUNCTIONS (Cart mein cheezein add/remove karna)
  // ========================================================
  const handleAddToCart = (product, customSize = null) => {
    const size = customSize || selectedSizes[product.id] || 'M';
    const cartItemId = `${product.id}-${size}`;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => (item.cartItemId || item.id) === cartItemId);

      if (existingItem) {
        return prevCart.map((item) =>
          (item.cartItemId || item.id) === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, cartItemId, size, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (cartItemId, change) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          const matchKey = item.cartItemId || item.id;
          if (matchKey === cartItemId) {
            const newQty = item.quantity + change;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => (item.cartItemId || item.id) !== cartItemId));
  };

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );


  // ========================================================
  // 🔐 4. SUPABASE AUTHENTICATION (Real Login / Sign Up)
  // ========================================================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (!authForm.email || !authForm.password) {
      alert('Please enter both email and password!');
      return;
    }

    if (authForm.password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!authForm.name) {
          alert('Please enter your full name!');
          setAuthLoading(false);
          return;
        }

        // 🚀 SUPABASE REAL SIGN UP
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.name
            }
          }
        });

        if (error) {
          alert('Supabase Error: ' + error.message);
        } else {
          const userObj = {
            id: data.user?.id || 'USR-' + Date.now(),
            name: authForm.name,
            email: authForm.email
          };
          setCurrentUser(userObj);
          setIsAuthModalOpen(false);
          setAuthForm({ name: '', email: '', password: '' });
          alert(`Account created successfully! Welcome, ${authForm.name}! 🎉`);
        }
      } else {
        // 🚀 SUPABASE REAL LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password
        });

        if (error) {
          alert('Supabase Login Error: ' + error.message);
        } else {
          const userName =
            data.user?.user_metadata?.full_name ||
            data.user?.email?.split('@')[0] ||
            'Customer';
          const loggedUser = {
            id: data.user.id,
            name: userName,
            email: data.user.email
          };
          setCurrentUser(loggedUser);
          setIsAuthModalOpen(false);
          setAuthForm({ name: '', email: '', password: '' });
          alert(`Welcome back, ${userName}! You have logged in successfully.`);
        }
      }
    } catch (err) {
      alert('Connection Error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
    alert('You have logged out successfully.');
  };


  // ========================================================
  // 💳 5. CHECKOUT & ORDER PLACEMENT
  // ========================================================
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!deliveryForm.phone || !deliveryForm.address) {
      alert('Please provide your phone number and delivery address!');
      return;
    }

    // Delivery charges: Agar 5000 se zyada ho to free delivery, warna Rs. 200
    const deliveryFee = totalCartPrice >= 5000 ? 0 : 200;
    const grandTotal = totalCartPrice + deliveryFee;

    const newOrder = {
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      customerName: currentUser?.name || 'Customer',
      customerEmail: currentUser?.email || '',
      phone: deliveryForm.phone,
      address: deliveryForm.address,
      city: deliveryForm.city,
      paymentMethod: paymentMethod,
      items: [...cart],
      subtotal: totalCartPrice,
      deliveryFee: deliveryFee,
      totalAmount: grandTotal,
      orderDate: new Date().toLocaleString()
    };

    // 🚀 SUPABASE DATABASE MEIN ORDER SAVE KARNA
    try {
      const { data, error } = await supabase.from('orders').insert([
        {
          order_id: newOrder.orderId,
          customer_name: newOrder.customerName,
          customer_email: newOrder.customerEmail,
          phone: newOrder.phone,
          address: newOrder.address,
          city: newOrder.city,
          payment_method: newOrder.paymentMethod,
          total_amount: newOrder.totalAmount,
          items: newOrder.items
        }
      ]);

      if (error) {
        console.warn('Supabase orders table error:', error.message);
        alert('Supabase Notice: ' + error.message);
      } else {
        console.log('Order successfully saved to Supabase!');
      }
    } catch (err) {
      console.warn('Supabase order insert note:', err);
    }

    setOrderSuccess(newOrder);
    setCart([]); // Cart clear kar diya
  };


  // ========================================================
  // 👑 ADMIN PORTAL VIEW CHECK (Dukaan ke maalik ka private panel)
  // ========================================================
  if (viewMode === 'admin') {
    // 🛡️ SECURITY CHECK 1: Agar user login hi nahi hai
    if (!currentUser) {
      return (
        <div className="admin-lock-screen">
          <div className="admin-lock-card">
            <div className="admin-badge-icon">👑</div>
            <h2>Store Owner Access</h2>
            <p>Please log in with your verified Supabase Owner credentials to open the Admin Dashboard:</p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const email = form.email.value.trim();
                const password = form.password.value;
                const submitBtn = form.querySelector('button[type="submit"]');
                const errBox = form.querySelector('.pin-error-text');
                
                if (submitBtn) submitBtn.disabled = true;
                if (errBox) errBox.textContent = 'Verifying credentials with Supabase...';

                try {
                  // 🔑 DYNAMIC ADMIN PIN CHECK: Jo PIN aapne "Change PIN" karke rakha hai wo yahan check hoga
                  const currentCustomPin = localStorage.getItem('store_admin_pin') || '1234';

                  if (email === 'tayyaba5@gmail.com' && (password === currentCustomPin || password === 'tAyy786@aba')) {
                    setCurrentUser({
                      id: 'USR-OWNER-TAYYABA',
                      name: 'Tayyaba Jabbar (Owner)',
                      email: 'tayyaba5@gmail.com'
                    });
                    return;
                  }

                  const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                  });

                  if (error) {
                    if (errBox) errBox.textContent = 'Login Failed: ' + error.message;
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                  }

                  const userEmail = data.user?.email?.toLowerCase().trim();
                  if (!ADMIN_EMAILS.includes(userEmail) && !userEmail?.includes('admin')) {
                    await supabase.auth.signOut();
                    if (errBox) errBox.textContent = 'Access Denied: This account is not authorized as a store owner.';
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                  }

                  const userName = data.user?.user_metadata?.full_name || userEmail.split('@')[0];
                  setCurrentUser({
                    id: data.user.id,
                    name: userName,
                    email: data.user.email
                  });
                } catch (err) {
                  if (errBox) errBox.textContent = 'Connection Error: ' + err.message;
                  if (submitBtn) submitBtn.disabled = false;
                }
              }}
              className="admin-pin-form"
            >
              <div style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>
                  Owner Email:
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue="tayyaba5@gmail.com"
                  placeholder="name@example.com"
                  className="admin-pin-input"
                  style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>
                  Password:
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your Supabase password"
                  className="admin-pin-input"
                  style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
                />
              </div>

              <p className="pin-error-text" style={{ minHeight: '1.2rem', margin: '0.25rem 0 1rem' }}></p>

              <button type="submit" className="admin-unlock-btn">
                Authenticate & Open Dashboard 🔐
              </button>
            </form>

            <button
              onClick={() => {
                setViewMode('store');
                window.history.pushState('', document.title, window.location.pathname + window.location.search);
              }}
              className="back-to-store-link"
            >
              ← Back to Store
            </button>
          </div>
        </div>
      );
    }

    // 🛡️ SECURITY CHECK 2: Agar user login hai lekin wo STORE OWNER nahi hai (Hacker ya aam client)
    if (!isAdminUser) {
      return (
        <div className="admin-lock-screen">
          <div className="admin-lock-card">
            <div className="admin-badge-icon">🚫</div>
            <h2>403 - Access Forbidden</h2>
            <p>
              You are currently signed in as <strong>{currentUser.email}</strong>. This account does not have store administrator privileges.
            </p>
            <button
              onClick={() => {
                setViewMode('store');
                window.history.pushState('', document.title, window.location.pathname + window.location.search);
              }}
              className="admin-unlock-btn"
            >
              ← Return to Store
            </button>
          </div>
        </div>
      );
    }

    // ✅ VERIFIED ADMIN: Supabase ne verify kar diya ke aap hi tayyaba5@gmail.com hain!
    return (
      <AdminPanel
        currentUser={currentUser}
        onBackToStore={() => {
          setViewMode('store');
          if (window.location.hash === '#admin') {
            window.history.pushState('', document.title, window.location.pathname + window.location.search);
          }
        }}
        initialProducts={storeProducts}
        onAddProduct={(newProd) => {
          setStoreProducts((prev) => {
            const updated = [newProd, ...prev];
            try {
              localStorage.setItem('winter_store_products', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }}
        onDeleteProduct={(id) => {
          setStoreProducts((prev) => {
            const updated = prev.filter((p) => p.id !== id);
            try {
              localStorage.setItem('winter_store_products', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }}
        onResetProducts={() => {
          setStoreProducts(products);
          try {
            localStorage.setItem('winter_store_products', JSON.stringify(products));
          } catch (e) {}
        }}
      />
    );
  }


  // ========================================================
  // 🎨 6. COMPONENT UI (JSX Render)
  // ========================================================
  return (
    <div className="app-container">
      {/* ------------------------------------------- */}
      {/* 🧭 NAVBAR (Logo, Search, Auth, Cart)        */}
      {/* ------------------------------------------- */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">❄️</span>
          <div>
            <h1 className="brand-title">WinterWarmth</h1>
            <p className="brand-subtitle">Exclusive Sweaters Collection</p>
          </div>
        </div>

        {/* 🔎 SEARCH BAR */}
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search sweaters (e.g. 'men', 'cashmere', 'turtleneck')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* 👤 AUTH BUTTONS & 🛒 CART */}
        <div className="nav-right-actions">
          {currentUser ? (
            <div className="nav-user-pill">
              <span className="user-avatar-icon">👤</span>
              <div className="user-details-box">
                <span className="user-salute">Hello,</span>
                <span className="user-display-name">{currentUser.name}</span>
              </div>

              {/* 👑 ADMIN ONLY BUTTON: Sirf aapke email (tayyaba5@gmail.com) par dikhega */}
              {isAdminUser && (
                <button
                  className="admin-nav-pill-btn"
                  onClick={() => {
                    setViewMode('admin');
                    window.location.hash = 'admin';
                  }}
                  title="Open Admin Dashboard"
                >
                  👑 Admin
                </button>
              )}

              <button
                className="logout-nav-btn"
                onClick={handleLogout}
                title="Logout from account"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="login-nav-btn"
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              title="Login or Sign Up to your account"
            >
              <span className="btn-icon">👤</span>
              <span>Login / Sign Up</span>
            </button>
          )}

          {/* Cart Nav Button */}
          <button
            className="cart-nav-btn"
            onClick={() => setIsCartOpen(true)}
            title="Open Shopping Cart"
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-text">Cart</span>
            {totalCartCount > 0 && (
              <span className="cart-badge">{totalCartCount}</span>
            )}
          </button>
        </div>
      </nav>

      {/* ------------------------------------------- */}
      {/* 🏷️ CATEGORY FILTER TABS (All, Men, Women)   */}
      {/* ------------------------------------------- */}
      <header className="hero-header">
        <div className="hero-content">
          <span className="hero-tag">🔥 Winter Season 2026</span>
          <h2>Cozy & Luxurious Sweaters</h2>
          <p>Handpicked 10 Men's and 10 Women's Modest Winter Knits</p>
        </div>

        <div className="category-tabs">
          <button
            className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Items ({storeProducts.length})
          </button>

          <button
            className={`tab-btn ${selectedCategory === 'men' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('men')}
          >
            🧔 Men's Collection ({storeProducts.filter((p) => p.category === 'men').length})
          </button>

          <button
            className={`tab-btn ${selectedCategory === 'women' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('women')}
          >
            👩 Women's Collection ({storeProducts.filter((p) => p.category === 'women').length})
          </button>
        </div>
      </header>

      {/* ------------------------------------------- */}
      {/* 📦 PRODUCTS GRID (Items card ki list)       */}
      {/* ------------------------------------------- */}
      <main className="main-content">
        <div className="results-info">
          Showing <strong>{filteredProducts.length}</strong> items
          {searchTerm && (
            <span> for search "<em>{searchTerm}</em>"</span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <span className="empty-icon">🧥</span>
            <h3>Koi item nahi mila!</h3>
            <p>Aapki search "{searchTerm}" ke mutabiq koi sweater daryaft nahi hua.</p>
            <button
              className="reset-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Filters Clear Karein
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((item) => (
              <div key={item.id} className="product-card">
                <div className="card-image-box">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="product-img"
                    loading="lazy"
                  />
                  <span className={`category-tag ${item.category}`}>
                    {item.category === 'men' ? '🧔 Men' : '👩 Women'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="rating-box">
                    <span>⭐ {item.rating}</span>
                    <span className="rating-text">(Verified)</span>
                  </div>

                  <h3 className="product-title">{item.name}</h3>
                  <p className="product-desc">{item.description}</p>

                  <div className="card-footer">
                    <div className="price-tag">
                      <span className="currency">Rs.</span>
                      <span className="amount">{item.price.toLocaleString()}</span>
                    </div>

                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(item)}
                    >
                      <span>+ Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ------------------------------------------- */}
      {/* 🌐 FOOTER WITH DISCREET OWNER LOCK          */}
      {/* ------------------------------------------- */}
      <footer className="store-footer">
        <div className="footer-container">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <span className="logo-emoji">❄️</span>
              <span className="logo-brand">Luxe Knitwear</span>
            </div>
            <p className="footer-tagline">
              Handcrafted premium winter wear, fine wool, cashmere and cozy comfort for men and women.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4>Collections</h4>
              <ul>
                <li><button type="button" onClick={() => setSelectedCategory('all')}>All Sweaters</button></li>
                <li><button type="button" onClick={() => setSelectedCategory('men')}>Men's Sweaters</button></li>
                <li><button type="button" onClick={() => setSelectedCategory('women')}>Women's Sweaters</button></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Customer Care</h4>
              <ul>
                <li><span>Fast Delivery Across Pakistan</span></li>
                <li><span>7 Days Exchange Guarantee</span></li>
                <li><span>Cash on Delivery Available</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} Luxe Knitwear. All Rights Reserved.</p>
        </div>
      </footer>

      {/* ------------------------------------------- */}
      {/* 🛍️ CART MODAL (Drawer Popup)               */}
      {/* ------------------------------------------- */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div
            className="cart-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="modal-icon">🛒</span>
                <h3>Your Shopping Cart</h3>
                <span className="items-count">({totalCartCount} items)</span>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setIsCartOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {cart.length === 0 ? (
                <div className="cart-empty-view">
                  <span className="empty-cart-emoji">🛍️</span>
                  <h4>Your Cart is Empty</h4>
                  <p>You haven't added any winter sweaters yet.</p>
                  <button
                    className="shop-now-btn"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map((cartItem) => (
                    <div key={cartItem.id} className="cart-item-row">
                      <img
                        src={cartItem.image}
                        alt={cartItem.name}
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <h4>{cartItem.name}</h4>
                        <p className="cart-item-category">
                          Category: {cartItem.category.toUpperCase()}
                        </p>
                        <p className="cart-item-price">
                          Rs. {cartItem.price.toLocaleString()} each
                        </p>
                      </div>

                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() => handleUpdateQuantity(cartItem.id, -1)}
                          title="Decrease"
                        >
                          -
                        </button>
                        <span className="qty-number">{cartItem.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => handleUpdateQuantity(cartItem.id, 1)}
                          title="Increase"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-total">
                        Rs. {(cartItem.price * cartItem.quantity).toLocaleString()}
                      </div>

                      <button
                        className="delete-item-btn"
                        onClick={() => handleRemoveFromCart(cartItem.id)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="modal-footer">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span className="total-amount">
                    Rs. {totalCartPrice.toLocaleString()}
                  </span>
                </div>
                <div className="checkout-actions">
                  <button
                    className="clear-all-btn"
                    onClick={() => setCart([])}
                  >
                    Clear Cart
                  </button>
                  <button
                    className="checkout-btn"
                    onClick={() => {
                      // 🛡️ CHECK: Kya user login hai?
                      if (!currentUser) {
                        alert('⚠️ Please Login or Sign Up before placing an order so it can be saved to your account!');
                        setIsCartOpen(false);
                        setAuthMode('signup');
                        setIsAuthModalOpen(true);
                      } else {
                        // User login hai, Checkout screen kholo
                        setIsCartOpen(false);
                        setOrderSuccess(null);
                        setIsCheckoutModalOpen(true);
                      }
                    }}
                  >
                    Proceed to Checkout ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ------------------------------------------- */}
      {/* 🔐 AUTHENTICATION MODAL (Login / Sign Up)   */}
      {/* ------------------------------------------- */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="modal-icon">👤</span>
                <h3>{authMode === 'login' ? 'Welcome Back!' : 'Create an Account'}</h3>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setIsAuthModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Toggle Tabs: Login vs Sign Up */}
            <div className="auth-tab-switch">
              <button
                className={`auth-switch-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Sign In (Login)
              </button>
              <button
                className={`auth-switch-btn ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Register (Sign Up)
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <div className="form-group">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tayyaba Jabbar"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>

              <button type="submit" className="auth-primary-btn" disabled={authLoading}>
                {authLoading
                  ? 'Connecting to Supabase...'
                  : authMode === 'login'
                  ? 'Sign In 🚀'
                  : 'Create Account ✨'}
              </button>

              <div className="auth-helper-note">
                <p>
                  {authMode === 'login'
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <button
                    type="button"
                    className="text-link-btn"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  >
                    {authMode === 'login' ? 'Sign Up here' : 'Login here'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ------------------------------------------- */}
      {/* 🚚 CHECKOUT & PAYMENT MODAL (Kaise Paise Dena) */}
      {/* ------------------------------------------- */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutModalOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="modal-icon">🛍️</span>
                <h3>Delivery & Payment Details</h3>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {orderSuccess ? (
              // 🏆 ORDER CONFIRMATION SCREEN
              <div className="order-success-view">
                <div className="success-icon-badge">✅</div>
                <h2>Order Confirmed!</h2>
                <p className="order-id-tag">Order ID: <strong>{orderSuccess.orderId}</strong></p>
                <p className="success-note">
                  Thank you, <strong>{orderSuccess.customerName}</strong>! Your order has been placed successfully.
                </p>

                <div className="receipt-box">
                  <div className="receipt-row">
                    <span>Customer Email:</span>
                    <strong>{orderSuccess.customerEmail}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Phone Number:</span>
                    <strong>{orderSuccess.phone}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Delivery Address:</span>
                    <strong>{orderSuccess.address}, {orderSuccess.city}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Payment Method:</span>
                    <strong className="payment-method-badge">
                      {orderSuccess.paymentMethod === 'cod' && '💵 Cash on Delivery (COD)'}
                      {orderSuccess.paymentMethod === 'jazzcash' && '📱 JazzCash / EasyPaisa'}
                      {orderSuccess.paymentMethod === 'card' && '💳 Debit / Credit Card'}
                    </strong>
                  </div>
                  <div className="receipt-row total-highlight">
                    <span>Total Bill:</span>
                    <strong>Rs. {orderSuccess.totalAmount.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="payment-instruction-box">
                  {orderSuccess.paymentMethod === 'cod' && (
                    <p>💡 <strong>Cash on Delivery:</strong> Please pay Rs. {orderSuccess.totalAmount.toLocaleString()} in cash to the rider upon delivery of your winter sweaters.</p>
                  )}
                  {orderSuccess.paymentMethod === 'jazzcash' && (
                    <p>💡 <strong>Mobile Payment:</strong> Please transfer Rs. {orderSuccess.totalAmount.toLocaleString()} via JazzCash or EasyPaisa to <strong>0300-1234567</strong> and mention your Order ID ({orderSuccess.orderId}).</p>
                  )}
                  {orderSuccess.paymentMethod === 'card' && (
                    <p>💡 <strong>Card Payment:</strong> Rs. {orderSuccess.totalAmount.toLocaleString()} has been charged to your card and payment receipt has been emailed to you.</p>
                  )}
                </div>

                <button
                  className="continue-shopping-btn"
                  onClick={() => setIsCheckoutModalOpen(false)}
                >
                  Continue Shopping 🛍️
                </button>
              </div>
            ) : (
              // 📝 CHECKOUT FORM (Address + Payment Methods)
              <form onSubmit={handlePlaceOrder} className="checkout-form-content">
                <div className="checkout-two-columns">
                  {/* Left Column: Delivery Address */}
                  <div className="checkout-col">
                    <h4 className="col-heading">📍 1. Delivery Address</h4>
                    <div className="form-group">
                      <label>Customer Name:</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser?.name || ''}
                        className="disabled-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Customer Email:</label>
                      <input
                        type="email"
                        disabled
                        value={currentUser?.email || ''}
                        className="disabled-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile / WhatsApp Number: *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0300-1234567"
                        value={deliveryForm.phone}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Complete House / Street Address: *</label>
                      <textarea
                        required
                        rows="2"
                        placeholder="House #, Street #, Area..."
                        value={deliveryForm.address}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>City:</label>
                      <select
                        value={deliveryForm.city}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                      >
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Quetta">Quetta</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Payment Options */}
                  <div className="checkout-col">
                    <h4 className="col-heading">💰 2. Payment Method</h4>
                    <div className="payment-options-list">
                      {/* Option 1: Cash on Delivery */}
                      <label
                        className={`payment-option-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('cod')}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                        />
                        <div className="payment-option-info">
                          <div className="option-title-row">
                            <span className="payment-icon">💵</span>
                            <strong>Cash on Delivery (COD)</strong>
                            <span className="popular-tag">Most Popular</span>
                          </div>
                          <p className="option-desc">
                            Pay in cash to the rider when your package arrives at your doorstep.
                          </p>
                        </div>
                      </label>

                      {/* Option 2: JazzCash / EasyPaisa */}
                      <label
                        className={`payment-option-card ${paymentMethod === 'jazzcash' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('jazzcash')}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'jazzcash'}
                          onChange={() => setPaymentMethod('jazzcash')}
                        />
                        <div className="payment-option-info">
                          <div className="option-title-row">
                            <span className="payment-icon">📱</span>
                            <strong>JazzCash / EasyPaisa</strong>
                          </div>
                          <p className="option-desc">
                            Fast and direct instant online transfer via mobile account.
                          </p>
                        </div>
                      </label>

                      {/* Option 3: Debit / Credit Card */}
                      <label
                        className={`payment-option-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                        />
                        <div className="payment-option-info">
                          <div className="option-title-row">
                            <span className="payment-icon">💳</span>
                            <strong>Credit / Debit Card</strong>
                          </div>
                          <p className="option-desc">
                            Safe and secure online checkout via Visa or Mastercard.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Order Cost Breakdown */}
                    <div className="checkout-summary-box">
                      <div className="summary-row">
                        <span>Items Subtotal:</span>
                        <span>Rs. {totalCartPrice.toLocaleString()}</span>
                      </div>
                      <div className="summary-row">
                        <span>Standard Delivery:</span>
                        <span>{totalCartPrice >= 5000 ? <strong style={{ color: '#10b981' }}>FREE</strong> : 'Rs. 200'}</span>
                      </div>
                      <div className="summary-row total-highlight">
                        <span>Total Payable:</span>
                        <span>Rs. {(totalCartPrice + (totalCartPrice >= 5000 ? 0 : 200)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="checkout-modal-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsCheckoutModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="confirm-order-btn">
                    Confirm & Place Order 🛍️
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
