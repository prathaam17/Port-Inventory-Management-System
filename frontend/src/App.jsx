import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Guards
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CargoInventory from './pages/CargoInventory';
import CustomsClearance from './pages/CustomsClearance';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import ShippingAgentPortal from './pages/ShippingAgentPortal';
import OperationsPortal from './pages/OperationsPortal';
import ShippingAgentRegistration from './pages/ShippingAgentRegistration';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
              
              {/* Authenticated portal entry */}
              <Route path="/login" element={<Login />} />
              <Route path="/register-agent" element={<ShippingAgentRegistration />} />

              {/* Secure Admin Dashboard Layout Wrapper */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Central Dashboard */}
                <Route index element={<Dashboard />} />

                {/* Cargo Manifest management */}
                <Route 
                  path="cargo" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Port Operations Officer', 'Warehouse Manager']}>
                      <CargoInventory />
                    </ProtectedRoute>
                  } 
                />

                {/* Warehousing space control */}
                <Route 
                  path="warehouse" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Warehouse Manager', 'Port Operations Officer']}>
                      <OperationsPortal />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="operations-portal" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Warehouse Manager', 'Port Operations Officer']}>
                      <OperationsPortal />
                    </ProtectedRoute>
                  } 
                />

                {/* Customs document review clearance */}
                <Route 
                  path="customs" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Customs Officer']}>
                      <CustomsClearance />
                    </ProtectedRoute>
                  } 
                />


                {/* Invoicing, storage fee demurrage */}
                <Route 
                  path="billing" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Finance', 'Finance Officer']}>
                      <Billing />
                    </ProtectedRoute>
                  } 
                />

                {/* Analytical charts & audit checks */}
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Warehouse Manager', 'Customs Officer', 'Finance', 'Finance Officer', 'Port Operations Officer', 'Management']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin users directory control */}
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Shipping Agent Portal */}
                <Route 
                  path="shipping-portal" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Shipping Agent']}>
                      <ShippingAgentPortal />
                    </ProtectedRoute>
                  } 
                />

                {/* Redirects for underscore URLs */}
                <Route path="operations_portal" element={<Navigate to="/operations-portal" replace />} />
                <Route path="shipping_portal" element={<Navigate to="/shipping-portal" replace />} />

                {/* Settings Configurations */}
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />

              </Route>

              {/* Wildcard Fallbacks */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
