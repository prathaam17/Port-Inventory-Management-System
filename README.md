# Port Inventory Management System

A full-stack, enterprise-grade seaport logistics and inventory management system built with Node.js, Express, PostgreSQL, Sequelize, Socket.io, React, and TailwindCSS.

---

## Features

- **Multi-Role Authentication**: Support for Shipping Agents, Port Operations Officers, Customs Officers, Warehouse Managers, and Finance Officers.
- **Port Operations & Berth Management**: Real-time vessel calls, berth allocation, and discharge tally sheet logging.
- **Cargo Inventory & Yard Staging**: Spatial yard tracking, internal relocation move tickets, and real-time occupancy maps.
- **Customs & Regulatory Clearance**: ICEGATE Bill of Entry verification, Out of Charge (OOC) releases, and statutory seizures.
- **Scale of Rates (SOR) Billing**: Automated demurrage calculation engine, progressive slab rates, and pre-deposit account (PDA) ledger settlements.
- **Electronic Delivery Order (e-DO)**: Generation and verification of digital e-DO certificates.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# Create environment file from example
cp .env.example .env

# Seed demo scenarios & initialize database
npm run seed:demo

# Start backend dev server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=port_inventory
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=mngprt_super_secret_key_2026
```

---

## License

ISC License
