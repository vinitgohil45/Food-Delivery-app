# FoodHub System Design

This document details the high-level architecture, flow systems, and database relationships of FoodHub.

---

## 🏛️ System Architecture

FoodHub is designed as a decoupled multi-tier web application to ensure high scalability, isolation, and service maintainability.

```mermaid
graph TD
    Client[React Frontend / PWA] <-->|HTTPS REST / HTTP-Only Cookies| WebServer[Express.js Server]
    Client <-->|WebSockets| SocketServer[Socket.IO Server]
    WebServer -->|ORM / Queries| DB[(MongoDB Atlas)]
    SocketServer <-->|Event Pub/Sub| Redis[(Redis Adapter)]
    WebServer -->|Media Storage| Cloudinary[(Cloudinary CDN)]
    WebServer -->|Payments| StripeGateway[Stripe API]
    WebServer -->|Payments| RazorpayGateway[Razorpay API]
```

---

## 🔑 Key Workflows

### 1. Verification & Security Flow
- Passwords hashed using `bcrypt` (12 rounds) inside schema hooks.
- JWT Access token issued with 15-minute expiration; stored in React memory or state.
- JWT Refresh token stored in secure, `httpOnly`, `sameSite=strict` cookies; 7-day expiration.
- Cross-Site Scripting (XSS) prevention handled via Helmet security headers and strict input sanitization.

### 2. Live Order Tracking Flow
```mermaid
sequenceDiagram
    participant Customer as Customer Client
    participant Server as Socket.io Server
    participant Restaurant as Restaurant Dashboard
    participant Delivery as Delivery Partner
    
    Customer->>Server: Places Order & Joins Room (orderId)
    Server->>Restaurant: Emit order_created (new order alert)
    Restaurant->>Server: Update status (Accept -> Preparing)
    Server->>Customer: Emit order_status_updated (Preparing)
    Restaurant->>Server: Emit order_ready_for_pickup
    Server->>Delivery: Broadcast delivery_job_available
    Delivery->>Server: Accept Delivery Job
    Server->>Customer: Emit order_status_updated (Driver Assigned)
    Delivery->>Server: Emit driver_location_update (Coords)
    Server->>Customer: Emit location_changed (Track on Map)
    Delivery->>Server: Mark Order Delivered
    Server->>Customer: Emit order_status_updated (Delivered)
```
