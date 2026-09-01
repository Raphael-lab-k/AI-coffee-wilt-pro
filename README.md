# ☕ Coffee Wilt PRO 

**Precision Agriculture for the Modern Coffee Farmer.**  
*Powered by Multimodal AI, Hyper-local Weather, and Geospatial Intelligence.*

---

## 🌟 Overview

**Coffee Wilt PRO** is a professional-grade diagnostic and scouting platform designed specifically for the coffee industry. Unlike general plant apps, Coffee Wilt PRO acts as a **World-Class Coffee Agronomist in your pocket**, combining high-resolution visual analysis with environmental sensor data and real-time weather intelligence to protect high-value Arabica and Robusta yields.

### 🚀 Key Commercial Features

- **🤖 Multimodal AI Brain:** Leveraging Google Gemini 1.5 Flash to analyze plant photos alongside soil moisture, elevation, and weather patterns.
- **📡 Store-and-Forward Offline Mode:** Designed for remote mountain plantations. Capture data in "Dead Zones" and auto-sync when back at the station.
- **🌦️ Weather-Aware Diagnostics:** Automatically factors in local humidity and rainfall trends to distinguish between simple wilt and fungal outbreaks.
- **📍 Geospatial Scouting:** Every scan is GPS-tagged. Open integrated maps to return to the exact tree where stress was detected.
- **💬 Interactive Agronomist Chat:** Ask follow-up questions about specific organic fungicides, pruning techniques, or fertilizer brands.
- **📊 Plantation Health Dashboard:** Visualize moisture trends and historical health scores across different farm sections.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React Native (Expo) + Material 3 (Paper) |
| **Backend** | Node.js (Express) |
| **AI Engine** | Google Gemini 1.5 Flash (Vision & LLM) |
| **Database** | Google Firebase Firestore (Real-time Cloud Sync) |
| **Storage** | Google Firebase Storage (High-res Photo History) |
| **Auth** | Firebase Authentication (Secure Farmer Accounts) |
| **Weather** | OpenWeatherMap API |

---

## 📦 Setup & Installation

### 1. Backend Configuration
1. Navigate to `backend/`
2. Create a `.env` file and add your keys:
   ```env
   GEMINI_API_KEY=AIzaSy... (Your Google AI Key)
   OPENWEATHER_API_KEY=... (Your Weather Key)
   PORT=4000
   ```
3. Run:
   ```bash
   npm install
   npm run dev
   ```

### 2. Frontend Configuration
1. Navigate to `frontend/`
2. Run:
   ```bash
   npm install
   npx expo start
   ```
3. Open the **Expo Go** app on your phone and scan the QR code.

---

## 🛡️ Commercial Readiness

- **Monetization Ready:** Built-in daily scan limits for free users with a path to "Pro" subscriptions.
- **Push Notification System:** Automatic high-severity alerts for immediate crop threats.
- **Secure Cloud Sync:** User-specific data isolation ensuring every farmer's plantation data remains private.

---

## 🗺️ Roadmap
- [ ] **Satellite NDVI Integration:** Spot drought stress from orbit before it's visible to the eye.
- [ ] **Community Heatmaps:** Anonymized outbreak tracking to alert neighbors of migrating pests.
- [ ] **TFLite Integration:** Instant, zero-latency on-device detection for basic symptoms.

---

## ⚖️ License & Privacy
*This software captures GPS data and imagery for diagnostic purposes. Ensure you comply with local agricultural data privacy regulations.*

**© 2026 Coffee Wilt PRO — Revolutionizing Coffee Farming.**
