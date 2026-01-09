import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClientProvider } from './contexts/ClientContext';
import { ResourceProvider } from './contexts/ResourceContext';
import { BillingProvider } from './contexts/BillingContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/common/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientList } from './components/clients/ClientList';
import { Management } from './components/management/Management';
import { Billing } from './components/billing/Billing';
import './App.css';
import './contexts/ToastContext.css';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ClientProvider>
          <ResourceProvider>
            <BillingProvider>
              <Router>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clientes" element={<ClientList />} />
                      <Route path="/cobranca" element={<Billing />} />
                      <Route path="/gestao" element={<Management />} />
                    </Routes>
                  </main>
                </div>
              </Router>
            </BillingProvider>
          </ResourceProvider>
        </ClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
