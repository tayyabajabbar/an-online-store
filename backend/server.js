// ====================================================================
// 🚀 WINTER STORE BACKEND SERVER (Node.js + Express)
// ====================================================================
// Yeh file aapka backend server hai jo Node.js aur Express par bana hai.
// Iska kaam hai:
// 1. Frontend (React) se requests receive karna.
// 2. Sweaters ka data frontend ko supply karna.
// 3. Customer ke orders ko receive kar ke save karna.

// --------------------------------------------------------------------
// 📦 1. PACKAGES IMPORT KARNA
// --------------------------------------------------------------------
// 'express' aik fast aur simple web framework hai
import express from 'express';

// 'cors' (Cross-Origin Resource Sharing):
// Yeh zaroori hai taake aapka React app (port 5173) aapke
// Express backend (port 5000) se aasaani se baat kar sake.
import cors from 'cors';


// --------------------------------------------------------------------
// ⚙️ 2. SERVER INITIALIZATION
// --------------------------------------------------------------------
const app = express();
const PORT = 5000; // Server is port par chalega: http://localhost:5000

// Middleware:
// cors(): Frontend se aane wali requests ko allow karta hai
app.use(cors());

// express.json(): Frontend jo data (JSON format) bhejta hai, yeh usay samajhta hai
app.use(express.json());


// --------------------------------------------------------------------
// 🗄️ 3. TEMPORARY DATABASE (In-Memory Data)
// --------------------------------------------------------------------
// Filhaal hum aik array ke andar sweaters ka data aur orders store kar rahe hain.
// (Aage chal kar yahan MongoDB ya SQL database lagta hai).

// Sweaters ka data:
const products = [
  // 🧔 MEN'S COLLECTION (10 Items)
  { id: 1, name: "Men's Cable Knit Crewneck Sweater", category: "men", price: 3499, rating: 4.8, description: "Pure wool cable-knit sweater.", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80" },
  { id: 2, name: "Men's Charcoal Cashmere Turtleneck", category: "men", price: 4200, rating: 4.9, description: "Premium cashmere high-neck sweater.", image: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=600&q=80" },
  { id: 3, name: "Men's Ribbed Wool Pullover", category: "men", price: 2999, rating: 4.6, description: "Classic ribbed design with thermal insulation.", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80" },
  { id: 4, name: "Men's Vintage Button Cardigan", category: "men", price: 3799, rating: 4.7, description: "Retro button-up cardigan with side pockets.", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80" },
  { id: 5, name: "Men's Nordic Pattern Wool Jumper", category: "men", price: 3899, rating: 4.5, description: "Traditional Nordic geometric pattern sweater.", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80" },
  { id: 6, name: "Men's Heavyweight Fleece Hoodie", category: "men", price: 2850, rating: 4.8, description: "Sherpa fleece lined warm hoodie.", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80" },
  { id: 7, name: "Men's Quarter-Zip Merino Pullover", category: "men", price: 3999, rating: 4.7, description: "Ultra-fine merino wool with brass zip.", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80" },
  { id: 8, name: "Men's Thermal Waffle Knit Sweater", category: "men", price: 2599, rating: 4.4, description: "Textured waffle weave sweater.", image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=600&q=80" },
  { id: 9, name: "Men's Classic V-Neck Wool Sweater", category: "men", price: 3199, rating: 4.6, description: "Sharp formal V-neck knitwear.", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80" },
  { id: 10, name: "Men's Fisherman Chunky Knit Sweater", category: "men", price: 4499, rating: 4.9, description: "Heavy chunky rib-knit sweater.", image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=600&q=80" },

  // 👩 WOMEN'S COLLECTION (10 Items - Modest & Clean Product Shots)
  { id: 11, name: "Women's Oversized Chunky Knit Sweater", category: "women", price: 1599, rating: 4.9, description: "Super soft oversized loose sweater on hanger.", image: "https://images.unsplash.com/photo-1611312449297-a69dc9c3987b?auto=format&fit=crop&w=600&q=80" },
  { id: 12, name: "Women's Cream Cable Turtleneck", category: "women", price: 2950, rating: 4.8, description: "Elegant cream turtleneck with intricate cable stitching.", image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80" },
  { id: 13, name: "Women's Pastel Mohair Cardigan", category: "women", price: 1100, rating: 4.7, description: "Dreamy fluffy mohair cardigan hanging on wooden hook.", image: "https://images.unsplash.com/photo-1631541909061-71e349d1f203?auto=format&fit=crop&w=600&q=80" },
  { id: 14, name: "Women's Soft Cashmere Wool Stack", category: "women", price: 2500, rating: 4.9, description: "Feather-light 100% pure cashmere folded knitwear.", image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80" },
  { id: 15, name: "Women's Elegant Modest Winter Coat Dress", category: "women", price: 4899, rating: 4.9, description: "Full length graceful modest winter coat with complete coverage.", image: "https://images.unsplash.com/photo-1591950613361-7b388b86ed55?auto=format&fit=crop&w=600&q=80" },
  { id: 16, name: "Women's Pastel Knitted Collection", category: "women", price: 2450, rating: 4.7, description: "Curated winter knit sweaters on boutique hangers.", image: "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=600&q=80" },
  { id: 17, name: "Women's Winter Wool Knit & Scarf", category: "women", price: 1899, rating: 4.5, description: "Pure wool cable knit sweater with matching winter muffler.", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80" },
  { id: 18, name: "Women's Nordic Weave Cozy Pullover", category: "women", price: 3199, rating: 4.6, description: "Cozy wool texture sweater flat lay for everyday winter comfort.", image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80" },
  { id: 19, name: "Women's Fluffy Alpaca Crewneck Sweater", category: "women", price: 4350, rating: 4.8, description: "Luxurious brushed alpaca wool sweater product shot.", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80" },
  { id: 20, name: "Women's Longline Duster Cardigan", category: "women", price: 3699, rating: 4.9, description: "Long knit duster cardigan with complete modest coverage.", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80" }
];

// Customer ke orders store karne ke liye array:
const orders = [];


// --------------------------------------------------------------------
// 🌐 4. API ROUTES (Yeh wo raste hain jin par React request bhejega)
// --------------------------------------------------------------------

// ROUTE 1: Home Test Route
// Browser mein http://localhost:5000 kholne par yeh message aayega
app.get('/', (req, res) => {
  res.send('❄️ Winter Store Backend Server bilkul sahi chal raha hai! 🚀');
});

// ROUTE 2: Sweaters ki List Dena (GET /api/products)
// React frontend yahan request bhej kar 20 sweaters ka data hasil karega
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    total: products.length,
    data: products
  });
});

// ROUTE 3: Customer ka Order Receive & Save Karna (POST /api/orders)
// Jab customer checkout karega, to React frontend order yahan bhejay ga
app.post('/api/orders', (req, res) => {
  const newOrder = req.body;

  // Aik unique order id aur time add karte hain
  const orderRecord = {
    orderId: 'ORD-' + Date.now(),
    customerName: newOrder.customerName || 'Guest Customer',
    items: newOrder.items || [],
    totalBill: newOrder.totalBill || 0,
    orderDate: new Date().toLocaleString()
  };

  // Order ko apne array mein save kar lete hain
  orders.push(orderRecord);

  console.log('📦 Naya Order Aaya Hai:', orderRecord);

  // Frontend ko response bhejte hain ke order save ho gaya
  res.status(201).json({
    success: true,
    message: 'Order kamyabi se backend mein save ho gaya hai!',
    order: orderRecord
  });
});

// ROUTE 4: Tamam Orders Dekhna (GET /api/orders)
// Dukaan ka maalik (Admin) yeh dekh sakta hai ke ab tak kitne orders aaye hain
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    totalOrders: orders.length,
    orders: orders
  });
});


// --------------------------------------------------------------------
// 🎧 5. SERVER KO START KARNA (Listening)
// --------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Express Backend Server active ho gaya hai!`);
  console.log(`📍 Link: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
