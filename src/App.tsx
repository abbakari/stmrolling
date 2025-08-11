import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { StockProvider } from './contexts/StockContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesBudget from './pages/SalesBudget';
import RollingForecast from './pages/RollingForecast';
import DataSources from './pages/DataSources';
import BiDashboard from './pages/BiDashboard';
import DistributionManagement from './pages/DistributionManagement';
import ApprovalCenter from './pages/ApprovalCenter';
import AdminPanel from './pages/AdminPanel';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main app component
const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <BudgetProvider>
                <Dashboard />
              </BudgetProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-budget"
          element={
            <ProtectedRoute>
              <BudgetProvider>
                <SalesBudget />
              </BudgetProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rolling-forecast"
          element={
            <ProtectedRoute>
              <BudgetProvider>
                <RollingForecast />
              </BudgetProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-sources"
          element={
            <ProtectedRoute>
              <DataSources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bi-dashboard"
          element={
            <ProtectedRoute>
              <BudgetProvider>
                <BiDashboard />
              </BudgetProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/distribution"
          element={
            <ProtectedRoute>
              <BudgetProvider>
                <DistributionManagement />
              </BudgetProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <ApprovalCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

// Root App component with providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
