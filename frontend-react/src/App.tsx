import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ClientProvider } from './contexts/ClientContext';
import { ResourceProvider } from './contexts/ResourceContext';
import { BillingProvider } from './contexts/BillingContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/common/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientList } from './components/clients/ClientList';
import { Management } from './components/management/Management';
import { Billing } from './components/billing/Billing';
import { Reports } from './components/reports/Reports';
import { LoginPage } from './components/auth/LoginPage';
import { PrivateRoute } from './components/auth/PrivateRoute';
import './App.css';
import './contexts/ToastContext.css';

// Layout for authenticated pages (includes Sidebar)
const PrivateLayout = () => {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ClientProvider>
            <ResourceProvider>
              <BillingProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    <Route path="/" element={
                      <PrivateRoute>
                        <PrivateLayout />
                      </PrivateRoute>
                    }>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="clientes" element={<ClientList />} />
                      <Route path="cobranca" element={<Billing />} />
                      <Route path="gestao" element={<Management />} />
                      <Route path="relatorios" element={<Reports />} />
                    </Route>
                  </Routes>
                </Router>
              </BillingProvider>
            </ResourceProvider>
          </ClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
