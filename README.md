# CraveGo - Premium Full-Stack Food Delivery Platform

CraveGo is a state-of-the-art, production-ready full-stack food delivery application built using React (Vite), Express.js, MongoDB, and Tailwind CSS. The system features a responsive role-based dashboard layout, live order tracking via Socket.io, payment gateway integration (Stripe & Razorpay), and an elegant glassmorphism-based UI.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, React Hook Form, TanStack Query, Framer Motion, React Icons
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, Refresh Tokens, Role-Based Access Control (RBAC), OTP Verification
- **Payments:** Stripe, Razorpay
- **Maps:** Google Maps API
- **Media Storage:** Cloudinary

---

## 📂 Project Structure

```
FoodHub/
├── backend/            # Express.js REST API & WebSocket Server
├── frontend/           # Vite-powered React Client
├── docs/               # System architecture and API definitions
├── docker-compose.yml  # Local MongoDB database provider
├── package.json        # Root package scripts
└── README.md           # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ or newer)
- [Docker](https://www.docker.com/) (Optional, for local DB container)

### 2. Installation
Install root dependencies and trigger nested folder installations:
```bash
npm install
npm run install:all
```

### 3. Environment Configuration
Create a `.env` file in the `backend/` directory referencing `.env.example` configurations.

### 4. Running the App
Start local development (runs database container, backend, and frontend concurrently):
```bash
# Start MongoDB via Docker
docker-compose up -d

# Start backend & frontend dev servers
npm run dev
```

---

## 👥 Roles
1. **Customer:** Browse menus, place orders, make payments, track orders live, rate/review.
2. **Restaurant Owner:** Control menus, manage inventory, view business analytics, handle orders.
3. **Delivery Partner:** Accept/reject delivery runs, navigate map routes, manage earnings.
4. **Admin:** System settings, vendor approvals, platform-wide order oversight, user management.
