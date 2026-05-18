import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Drop01Section from './components/Drop01Section'
import PromoSection from './components/PromoSection'
import AboutSection from './components/AboutSection'
import ContactSection from './components/ContactSection'
import ProductPage from './pages/ProductPage'
import CartDrawer from './components/CartDrawer'
import CheckoutPage from './pages/CheckoutPage'
import AdminPage from './pages/AdminPage'
import ShopPage from './pages/ShopPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import { ViewProvider } from './context/ViewContext'

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    // Prosty nasłuch na zmiany w URL dla Vanilla React bez react-router
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname)
    };
    
    // Nadpisanie pushState dla gładkiej nawigacji
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      onLocationChange();
    };

    window.addEventListener('popstate', onLocationChange);
    
    // Intercept a clicks
    const handleClick = (e) => {
      const a = e.target.closest('a');
      if (a && a.href && a.href.startsWith(window.location.origin) && !a.href.includes('#')) {
        e.preventDefault();
        const path = new URL(a.href).pathname;
        window.history.pushState({}, '', path);
        window.scrollTo(0,0);
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      document.removeEventListener('click', handleClick);
    };
  }, [])

  // Prosty router
  let content;
  if (currentPath.startsWith('/product/')) {
    const id = currentPath.split('/')[2];
    content = <ProductPage id={id} />
  } else if (currentPath === '/shop' || currentPath === '/shop/') {
    content = <ShopPage />
  } else if (currentPath.startsWith('/shop/')) {
    const slug = currentPath.split('/')[2];
    content = <ShopPage slug={slug} />
  } else if (currentPath === '/booking-success') {
    content = <BookingSuccessPage />
  } else if (currentPath === '/admin/dashboard') {
    content = <AdminDashboardPage />
  } else if (currentPath === '/admin') {
    content = <AdminPage />
  } else if (currentPath === '/checkout') {
    content = <CheckoutPage />;
  } else {
    // Home
    content = (
      <>
        <Hero />
        <Drop01Section />
        <PromoSection />
        <AboutSection />
        <ContactSection />
      </>
    );
  }

  return (
    <ViewProvider>
      <div className="min-h-screen font-sans antialiased bg-ink text-white">
        <Header />
        <CartDrawer />
        <main>
          {content}
        </main>
        <Footer />
      </div>
    </ViewProvider>
  )
}
