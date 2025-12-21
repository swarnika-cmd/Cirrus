// client/src/App.jsx (Updated with Clean Routing Structure)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SetAvatar from './pages/SetAvatar';
import Chat from './pages/Chat';
import DynamicBackground from './components/DynamicBackground'; // Import DynamicBackground

// -----------------------------------------------------------
// Protected Route Component checks for authentication
// -----------------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

// -----------------------------------------------------------
function App() {
  React.useEffect(() => {
    document.title = "CIRRUS - Where conversations never skip a beat";
  }, []);

  return (
    <BrowserRouter>
      <DynamicBackground />
      {/* Main App Routes (Rendered underneath) */}
      <Routes>
        {/* Public Routes */}
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/chat" replace />} />

        <Route
          path="/set-avatar"
          element={
            <ProtectedRoute>
              <SetAvatar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;