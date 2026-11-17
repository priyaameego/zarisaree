import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1C1917]">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <StorefrontLayout>
                <HomePage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/shop"
            element={
              <StorefrontLayout>
                <ShopPage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/product/:slug"
            element={
              <StorefrontLayout>
                <ProductDetailPage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <StorefrontLayout>
                <CartPage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <StorefrontLayout>
                <CheckoutPage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/order-confirmation/:orderNumber"
            element={
              <StorefrontLayout>
                <OrderConfirmationPage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/wishlist"
            element={
              <StorefrontLayout>
                <WishlistPage />
              </StorefrontLayout>
            }
          />
          <Route
            path="/account"
            element={
              <StorefrontLayout>
                <AccountPage />
              </StorefrontLayout>
            }
          />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
