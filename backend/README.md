# ⚙️ Winter Store Backend (Node.js + Express)

Yeh aapke project ka **Backend Server** hai jo Node.js aur Express par bana hai.

---

## 📌 Is Backend Mein Kya Hai?

1. **Express Server** (`server.js`):
   - Port `5000` par run hota hai (`http://localhost:5000`).
2. **CORS Support**:
   - Taake aapka React frontend (port 5173) bina kisi security block ke is backend se baat kar sake.
3. **API Endpoints (Routes)**:
   - `GET /` — Server status check ("Backend chal raha hai").
   - `GET /api/products` — 20 sweaters ka data frontend ko supply karta hai.
   - `POST /api/orders` — Customer ka checkout order receive aur save karta hai.
   - `GET /api/orders` — Ab tak aane wale tamam orders ka record dikhata hai.

---

## 🚀 Server Chalane Ka Tareeqa (How to Run)

1. VS Code ke terminal mein `backend` folder ke andar jayein:
   ```bash
   cd backend
   ```

2. Pehli dafa dependencies (express aur cors) install karein:
   ```bash
   npm install
   ```

3. Server start karein:
   ```bash
   npm start
   ```

4. Browser mein yeh link open karein:
   ```
   http://localhost:5000/
   ```
   Aapko screen par message aayega:
   `❄️ Winter Store Backend Server bilkul sahi chal raha hai! 🚀`

5. Sweaters ka data dekhne ke liye:
   ```
   http://localhost:5000/api/products
   ```
