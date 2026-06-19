import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AssignmentTest } from './pages/AssignmentTest';
import { Result } from './pages/Result';
import { Results } from './pages/Results';
import { Leaderboard } from './pages/Leaderboard';
import { ChatBot } from './pages/ChatBot';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Assignments } from './pages/Assignments';
import { ParentReport } from './pages/ParentReport';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean }> = ({
  children,
  isAuthenticated
}) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppContent() {
  const { user, isAuthenticated, login, register, logout } = useAuthContext();

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      
      <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Assignments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignment/:assignmentId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AssignmentTest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result/:assignmentId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Result />
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Results />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chatbot"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ChatBot />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Progress />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Settings user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent-report"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ParentReport />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      <Toaster position="bottom-right" />
    </>
  );
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </div>
    </Router>
  );
}

export default App;
