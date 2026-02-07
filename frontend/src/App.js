// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import ChatInterface from './ChatInterface';
import StableDiffusionInterface from './StableDiffusionInterface';
import PremiumProfile from './PremiumProfile';
import { AuthProvider, useAuth } from './AuthContext';
import './App.css';
import './ReactToastify.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="821519445369-caf5h95ulsduvk8fe6e1osoi54bos1pt.apps.googleusercontent.com">
      <AuthProvider>
        <Router>
          <div className="app-container">
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatInterface />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/image-generation"
                element={
                  <ProtectedRoute>
                    <StableDiffusionInterface />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/premium"
                element={
                  <ProtectedRoute>
                    <PremiumProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/signin" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default App;