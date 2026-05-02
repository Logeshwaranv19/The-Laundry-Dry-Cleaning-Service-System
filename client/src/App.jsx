import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import PlaceOrderPage  from './pages/customer/PlaceOrderPage';
import MyOrdersPage    from './pages/customer/MyOrdersPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import LoyaltyPage     from './pages/customer/LoyaltyPage';
import SubscriptionPage from './pages/customer/SubscriptionPage';
import ComplaintPage   from './pages/customer/ComplaintPage';

// Owner pages
import OwnerDashboard      from './pages/owner/OwnerDashboard';
import ManageOrdersPage    from './pages/owner/ManageOrdersPage';
import PricingManagerPage  from './pages/owner/PricingManagerPage';
import ComplaintsManager   from './pages/owner/ComplaintsManager';
import SubscriptionManager from './pages/owner/SubscriptionManager';
import DeliveryStaffPage  from './pages/owner/DeliveryStaffPage';

// Delivery pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import MyDeliveries     from './pages/delivery/MyDeliveries';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, token } = useAuth();

  const getHome = () => {
    if (!token || !user) return '/login';
    if (user.role === 'owner') return '/owner/dashboard';
    if (user.role === 'delivery') return '/delivery/dashboard';
    return '/customer/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getHome()} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Customer */}
      <Route path="/customer/dashboard"   element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/place-order" element={<ProtectedRoute allowedRoles={['customer']}><PlaceOrderPage /></ProtectedRoute>} />
      <Route path="/customer/orders"      element={<ProtectedRoute allowedRoles={['customer']}><MyOrdersPage /></ProtectedRoute>} />
      <Route path="/customer/orders/:id"  element={<ProtectedRoute allowedRoles={['customer']}><OrderTrackingPage /></ProtectedRoute>} />
      <Route path="/customer/loyalty"     element={<ProtectedRoute allowedRoles={['customer']}><LoyaltyPage /></ProtectedRoute>} />
      <Route path="/customer/subscription" element={<ProtectedRoute allowedRoles={['customer']}><SubscriptionPage /></ProtectedRoute>} />
      <Route path="/customer/complaint"   element={<ProtectedRoute allowedRoles={['customer']}><ComplaintPage /></ProtectedRoute>} />

      {/* Owner */}
      <Route path="/owner/dashboard"      element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/orders"         element={<ProtectedRoute allowedRoles={['owner']}><ManageOrdersPage /></ProtectedRoute>} />
      <Route path="/owner/pricing"        element={<ProtectedRoute allowedRoles={['owner']}><PricingManagerPage /></ProtectedRoute>} />
      <Route path="/owner/complaints"     element={<ProtectedRoute allowedRoles={['owner']}><ComplaintsManager /></ProtectedRoute>} />
      <Route path="/owner/subscriptions"  element={<ProtectedRoute allowedRoles={['owner']}><SubscriptionManager /></ProtectedRoute>} />
      <Route path="/owner/delivery"       element={<ProtectedRoute allowedRoles={['owner']}><DeliveryStaffPage /></ProtectedRoute>} />

      {/* Delivery */}
      <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
      <Route path="/delivery/orders" element={<ProtectedRoute allowedRoles={['delivery']}><MyDeliveries /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={getHome()} replace />} />
    </Routes>
  );
};

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{
            style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-card)' } },
            error:   { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
          }} />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
