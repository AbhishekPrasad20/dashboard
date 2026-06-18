import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import SalesEvaluation from './pages/SalesEvaluation';
import PMEvaluation from './pages/PMEvaluation';
import Manage from './pages/Manage';
import Login from './pages/Login';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Redirect logged-in users away from login page
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/overview" replace />;
  return children;
};

// Main layout wrapper
const MainLayout = ({ children }) => (
  <div className="flex h-screen bg-dark-bg overflow-hidden relative">
    {/* Ambient glow */}
    <div className="fixed top-0 left-[260px] w-[600px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
    <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
    <Sidebar />
    <main className="flex-1 overflow-y-auto p-8 relative">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<ProtectedRoute><MainLayout><Overview /></MainLayout></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><MainLayout><SalesEvaluation /></MainLayout></ProtectedRoute>} />
          <Route path="/pm" element={<ProtectedRoute><MainLayout><PMEvaluation /></MainLayout></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute><MainLayout><Manage /></MainLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

