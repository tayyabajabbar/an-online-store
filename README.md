# ❄️ WinterWarmth - React Winter Sweaters Collection

Yeh project React aur modern CSS par banaya gaya hai. Isme:
- **10 Men's Winter Sweaters** 🧔
- **10 Women's Winter Sweaters** 👩
- **Live Search Bar** (Agar user 'men', 'cashmere', ya koi bhi naam likhay ga to live filter hoga)
- **Category Filter Tabs** (All, Men, Women)
- **Add to Cart System** (Navbar mein cart count badge, drawer modal, quantity barhana/kam karna, aur total price)

---

## 🚀 Project Ko Kaise Chalana Hai (How to Run)

1. Terminal mein is project folder ke andar:
   ```bash
   cd "c:\Users\Tayyaba\Downloads\first anti pro"
   ```

2. Pehli dafa chalane ke liye dependencies install karein:
   ```bash
   npm install
   ```

3. Dev server start karein:
   ```bash
   npm run dev
   ```

4. Browser mein `http://localhost:5173/` open karein.

---

## 💡 Code Samjhne Ke Points (Easy Explanation)

### 1. Filter Logic Kaise Kaam Kar Rahi Hai? (`src/App.jsx`)
```javascript
const filteredProducts = products.filter((item) => {
  // Pehle check karta hai ke category match ho rahi hai ya nahi
  const matchesCategory =
    selectedCategory === 'all' || item.category === selectedCategory;

  // Phir check karta hai ke search bar mein likha gaya lafz item ke naam ya category se match karta hai
  const searchLower = searchTerm.toLowerCase().trim();
  const matchesSearch =
    item.name.toLowerCase().includes(searchLower) ||
    item.category.toLowerCase().includes(searchLower) ||
    item.description.toLowerCase().includes(searchLower);

  return matchesCategory && matchesSearch;
});
```

### 2. Add to Cart Kaise Kaam Kar Raha Hai?
- Jab aap "+ Add to Cart" button par click karte hain:
  - Agar wo item pehle se cart mein hai to uski `quantity` +1 ho jati hai.
  - Agar pehli baar add ho raha hai to wo `cart` array mein add ho jata hai.
- Navbar mein cart ka icon aur counter badge khud ba khud update hota hai.
- Cart par click karne par pura drawer khulta hai jahan se aap item nikaal sakte hain ya quantity kam/zyada kar sakte hain.
