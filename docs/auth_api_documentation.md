# CraveGo - Authentication API Documentation & Postman Collection

This document describes the API schemas, requests, and verification steps for **Module 4: Authentication System**.

---

## 🔒 Security Best Practices Implemented

- **Password Hashing:** Passwords encrypted using `bcrypt` (12 rounds) inside Mongoose pre-save hooks.
- **Rate Limiting:** IP rate limiting constraints applied to Express routes (100 requests per 15 minutes window).
- **HTTP-Only Cookies:** Access token dispatched as JSON payload; long-term Refresh Token sent inside secure `httpOnly` cookie.
- **Refresh Token Rotation:** On every refresh request, the old token is invalidated and a rotated one is generated. If a token reuse is detected, all active tokens for that user are immediately deleted (revoked).
- **TTL Index OTPs:** Verification codes expire and auto-delete in MongoDB after 10 minutes.

---

## 📌 Postman Collection & curl Test Cases

### 1. Register User (Public)
Creates a user and emits a verification code to the simulated log.
* **Endpoint:** `POST /api/v1/auth/register`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "name": "Customer User",
  "email": "customer@cravego.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "customer"
}
```
* **curl Command:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Customer User", "email": "customer@cravego.com", "phone": "9876543210", "password": "password123", "role": "customer"}'
```
* **Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email with the OTP sent.",
  "data": {
    "email": "customer@cravego.com",
    "role": "customer"
  },
  "errors": null
}
```

---

### 2. Verify OTP (Public)
Validates the OTP sent to email and returns the JWT session access token.
* **Endpoint:** `POST /api/v1/auth/verify-otp`
* **Request Body:**
```json
{
  "email": "customer@cravego.com",
  "otp": "123456",
  "purpose": "email_verification"
}
```
* **curl Command:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@cravego.com", "otp": "123456", "purpose": "email_verification"}'
```
* **Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Account verified and logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "651f8...",
      "name": "Customer User",
      "email": "customer@cravego.com",
      "phone": "9876543210",
      "role": "customer",
      "isEmailVerified": true,
      "isPhoneVerified": false
    }
  },
  "errors": null
}
```

---

### 3. Login User (Public)
Authenticates credentials and establishes session cookies.
* **Endpoint:** `POST /api/v1/auth/login`
* **Request Body:**
```json
{
  "email": "customer@cravego.com",
  "password": "password123"
}
```
* **curl Command:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@cravego.com", "password": "password123"}'
```

---

### 4. Refresh Token (Public / Cookie-based)
Rotates the Refresh Token and issues a new access token.
* **Endpoint:** `POST /api/v1/auth/refresh`
* **curl Command:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh -b cookies.txt
```

---

### 5. Get Current User (Private)
Queries active profile state.
* **Endpoint:** `GET /api/v1/auth/me`
* **Headers:** `Authorization: Bearer <accessToken>`
* **curl Command:**
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```
