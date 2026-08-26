# Port Inventory Management System (PIMS) 🚢⚓

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2019-sky)
![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express%205-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Sequelize-blue)
![Python](https://img.shields.io/badge/Sidecar-Python%20FastAPI-yellow)

An enterprise-grade, full-stack **Port Inventory & Maritime Logistics Management System** designed for seaport terminal operations, cargo handling, customs clearance, spatial yard management, and automated Scale of Rates (SOR) demurrage billing.

---

## 🌟 Key Features & Functional Modules

### 🚢 1. Shipping Agent Portal & Manifest Management
* **Vessel Arrival Declarations**: Submit Vessel Call Numbers (VCN), voyage numbers, LOA, and draft requirements.
* **Bulk Manifest Uploads**: Upload bulk container manifest data via CSV with automatic coordinate mapping.
* **Electronic Delivery Order (e-DO)**: Issue digital e-DO certificates with SHA-256 verification tokens upon clearance.
* **PDA Prepaid Ledger**: Settle port invoices and wharfage charges using Pre-Deposit Accounts.

### ⚓ 2. Terminal Operations & Berth Allocation
* **Interactive Berth Management**: Allocate quays, jetties, and berths (Container Terminals, POL Jetties, Bulk Coal Berths).
* **Live Vessel Tracking**: Real-time status tracking for berthed, incoming, and departed vessels.
* **Tally Discharge Logging**: Record discharge tally weights per shift with automated inventory updates.

### 🏭 3. Spatial Yard & Warehouse Management
* **Terminal Layout Visualization**: Real-time spatial map of transit sheds, open stackyards, reefer zones, and POL chemical tank farms.
* **Internal Move Tracking**: Issue move tickets to relocate cargo between quays and yard grid blocks using reach stackers.
* **Inventory Ledger Audit**: Immutable ledger tracking cargo weight, storage duration, and hazmat classifications.

### 🛡️ 4. Customs Clearance & Regulatory Control
* **ICEGATE Integration**: Verify Bill of Entry (BOE), Customs Broker licenses, and Out of Charge (OOC) clearances.
* **Statutory Holds & Seizures**: Apply physical examination holds, phytosanitary checks, or emergency customs seizures.

### 💰 5. SOR Tariff Engine & Automated Billing
* **Progressive Demurrage Calculation**: Tiered Scale of Rates (SOR) calculator handling free working days (7-day Import / 21-day Export).
* **Fractional Weight Rounding**: Enforces standard port fractional rounding (0.5 MT step, 1.0 MT floor).
* **Tax Invoice Generation**: Automated GST invoice generation with CGST/SGST itemization and printable PDF receipts.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS, Lucide Icons, Recharts |
| **Backend** | Node.js, Express 5, Socket.io (Real-Time Engine) |
| **Database** | PostgreSQL, Sequelize ORM |
| **Sidecar Engine** | Python, FastAPI, SQLAlchemy |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt Password Hashing |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18+ 
* **PostgreSQL**: v14+

### 1. Repository Setup
```bash
git clone https://github.com/prathaam17/Port-Inventory-Management-System.git
cd Port-Inventory-Management-System
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure PostgreSQL database settings in backend/.env
npm run seed:demo
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔐 Demo User Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Shipping Agent** | `shipping` | `password123` |
| **Port Operations Officer** | `ops` | `password123` |
| **Customs Officer** | `customs` | `password123` |
| **Finance Manager** | `finance` | `password123` |
| **Warehouse Manager** | `warehouse` | `password123` |
| **Super Admin** | `admin` | `password123` |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
