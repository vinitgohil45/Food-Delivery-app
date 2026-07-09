import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts & Guards
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

// Core Pages (Eagerly Loaded)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Lazy Loaded Pages (Code Splitting)
const SearchPage = lazy(() => import('./pages/SearchPage'));
const OffersPlaceholder = lazy(() => import('./pages/OffersPlaceholder'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RestaurantDetails = lazy(() => import('./pages/RestaurantDetails'));
const RestaurantRegister = lazy(() => import('./pages/RestaurantRegister'));
const RestaurantEdit = lazy(() => import('./pages/RestaurantEdit'));
const MenuDashboard = lazy(() => import('./pages/MenuDashboard'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));

const Loader = () => (
  <div className="h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Core Layout Wrappers */}
        <Route path="/" element={<RootLayout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOTP />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="offers" element={<OffersPlaceholder />} />
          <Route path="restaurants/:id" element={<RestaurantDetails />} />

          {/* Secure Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['customer']} />}>
              <Route path="profile" element={<CustomerDashboard />} />
              <Route path="profile/orders" element={<Orders />} />
              <Route path="orders/:id/track" element={<TrackOrder />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="payment/success" element={<PaymentSuccess />} />
              <Route path="payment/failed" element={<PaymentFailed />} />
            </Route>
          </Route>

          {/* Secure Vendor Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['restaurant_owner']} />}>
              <Route path="restaurant_owner/dashboard" element={<OwnerDashboard />} />
              <Route path="restaurant/register" element={<RestaurantRegister />} />
              <Route path="restaurant/:id/edit" element={<RestaurantEdit />} />
              <Route path="restaurant/menu" element={<MenuDashboard />} />
            </Route>
          </Route>

          {/* Secure Delivery Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['delivery_partner']} />}>
              <Route path="delivery_partner/dashboard" element={<DeliveryDashboard />} />
            </Route>
          </Route>

          {/* Secure Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
