# AgriCycle – Agricultural Waste Marketplace 🌾♻️

> **"Turn Agricultural Waste into Opportunity."**  
> A complete, modern, responsive, AI-powered two-sided web marketplace connecting Indian farmers who have crop residues (straw, husks, bagasse, stalks) with industries and buyers that reuse them.

---

## 📌 1. Official Problem Statement

> *"Build a platform where farmers can list agricultural waste such as straw, husks, and crop residues so industries can purchase and reuse them."*

Every harvest season, over **100 million tons** of crop residue are burned in open fields across India, triggering severe winter air pollution, particulate smog (PM 2.5), and microbial soil degradation. Concurrently, biomass energy power stations, paper mills, packaging plants, and biochar manufacturers struggle with decentralized, unpredictable feedstock supply.

---

## 💡 2. The Solution: AgriCycle

**AgriCycle** is a complete, production-grade agricultural waste marketplace that enables:
1. **Farmers** to turn leftover crop waste into additional income, receive AI price estimates, and connect with nearby industrial buyers who arrange pickup directly at the farm gate.
2. **Industries & Buyers** to procure raw biomass locally within specified kilometer radiuses, cutting freight expenses and meeting ESG sustainability targets.
3. **Ecosystem & Environment** to divert metric tons of biomass away from open-field burning, reducing greenhouse emissions and fostering India's circular rural economy.

---

## 🚀 3. Quick Start (Run with 1 Command)

No complex installations, cloud tokens, or database setup needed. The project runs out-of-the-box with **zero external dependencies**.

### Windows (1-Click Launch)
Double-click:
```bat
run.bat
```
*(Or in PowerShell: `.\run.ps1`)*

This starts the AgriCycle server and automatically opens your browser to:
👉 **`http://localhost:3000`**

---

## 🔑 4. Demo Login Credentials

Pre-loaded with verified, realistic accounts for instant hackathon evaluation:

| Role | Email | Password | Name / Entity | Location |
| :--- | :--- | :--- | :--- | :--- |
| **🌾 Farmer** | `farmer@agricycle.demo` | `demo123` | Ramesh Patel | Anantapur, AP (16 Acres) |
| **🏭 Industry** | `industry@agricycle.demo` | `demo123` | Green BioEnergy Pvt Ltd | Tirupati, AP (Biofuel Mill) |
| **🛡️ Admin** | `admin@agricycle.demo` | `admin123` | AgriCycle Operations | Bangalore, KA |

*Tip: A 1-Click quick login bar is also available directly on the login screen for rapid switching during presentations.*

---

## 🏆 5. Hackathon Judge Mode (8-Stage End-to-End Walkthrough)

A dedicated **Judge Walkthrough Bar** is pinned to the bottom of the screen. Reviewers can click **"Advance Demo Step"** to experience the entire lifecycle in under 60 seconds:

1. **Step 1: Farmer Login** — Logged in as Ramesh Patel; view active listings, pending offers, and lifetime earnings.
2. **Step 2: AI Waste Scanner & Price Predictor** — Select or upload a residue photo; watch the neural vision scanner identify *Rice Husk (95% confidence)* and calculate a fair market range (₹2,600 – ₹3,800/ton).
3. **Step 3: Published to Live Marketplace** — Listing is instantly live with radius tags, confidence badges, and quantity specs.
4. **Step 4: Industry Login** — Switch to Green BioEnergy Pvt Ltd; view sourcing dashboard and procurement needs.
5. **Step 5: Search & Make Offer** — Search marketplace, filter by waste type, and submit an offer (10 tons at ₹3,100/ton).
6. **Step 6: Farmer Notification & Acceptance** — Farmer receives a real-time notification alert and accepts the offer.
7. **Step 7: Order Stepper & Pickup Logistics** — Track the 5-stage order progression (*Pending → Confirmed → Pickup Scheduled → Picked Up → Completed*) with driver assignment and vehicle registration.
8. **Step 8: Financial Ledger & Climate Impact** — Farmer receives payout; environmental score reflects **27 metric tons of CO₂ emissions prevented**.

---

## 🛠️ 6. Technology Stack

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+ modular SPA architecture), Lucide Icons, Google Fonts (`Outfit`, `DM Sans`).
- **Styling**: Tailwind CSS + Custom Design Tokens (`styles.css`), Glassmorphism, agricultural earthy color palette, micro-animations, and responsive layouts (mobile, tablet, desktop).
- **Backend & API**: Node.js & Deno compatible HTTP server (`server.js`) with REST endpoints and persistent JSON store (`data/agricycle_db.json`).
- **AI Engine**: Computer vision classification simulator with domain heuristic fallback (`AI_MODE = 'demo'`) ensuring 100% offline uptime and zero API crashes.

---

## 🗄️ 7. Database Structure & Seed Data

The application comes pre-populated with realistic Indian agricultural belt data:
- **12 Farmers** across Anantapur, Kurnool, Chittoor, Kadapa, Bellary, and Bangalore Rural.
- **6 Industrial Buyers** (Green BioEnergy, EcoPaper Mills, Deccan Biochar, Andhra Biomass Power, etc.).
- **24 Diverse Listings** across Rice Husk, Rice Straw, Wheat Straw, Sugarcane Bagasse, Corn Stover, Groundnut Shells, Cotton Stalks, and Coconut Husk.
- **Active Offers, Orders, Pickups, Notifications, and Verified 5-Star Reviews**.

---

## 📡 8. REST API Endpoints

- `GET /api/health` — Service health & AI status
- `POST /api/auth/login` — Email/password authentication
- `POST /api/auth/register` — Role-based user creation
- `GET /api/listings` — Query marketplace with filters (`wasteType`, `search`, `farmerId`)
- `POST /api/listings` — Publish new residue listing
- `PUT /api/listings/:id` — Update listing status
- `DELETE /api/listings/:id` — Delete listing
- `GET /api/offers` — Retrieve buyer offers
- `POST /api/offers` — Submit offer on a listing
- `GET /api/orders` — List platform purchase orders
- `PUT /api/orders/:id` — Advance order stepper & pickup logistics
- `POST /api/ai/classify-waste` — AI computer vision identification
- `POST /api/ai/price-estimate` — AI regional price calculation
- `GET /api/admin/statistics` — Platform-wide gross volume & climate metrics

---

## 🔮 9. Future Scope

- **IoT Weighbridge Integration**: Automatic Bluetooth receipt syncing from roadside truck scales.
- **Multilingual Voice Search**: Regional audio prompts in Telugu, Kannada, Hindi, and Tamil for rural farmers.
- **Satellite Stubble Heatmap**: Real-time integration with NASA FIRMS satellite data to detect harvesting clusters and alert nearby bioenergy trucks.
