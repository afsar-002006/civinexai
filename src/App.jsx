import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import ReportProblem from './pages/ReportProblem';
import MyReports from './pages/MyReports';
import ReportDetails from './pages/ReportDetails';
import Analytics from './pages/Analytics';
import MapPage from './pages/MapPage';

import CivicVoiceAiChatbot from './components/CivicVoiceAiChatbot';

export default function App() {
  return (
    <AuthProvider>
      <ReportProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Citizen Protected Routes */}
            <Route 
              path="/citizen-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Authority']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/report-problem" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Authority']}>
                  <ReportProblem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-reports" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Authority']}>
                  <MyReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/report/:id" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Authority']}>
                  <ReportDetails />
                </ProtectedRoute>
              } 
            />

            {/* Authority Protected Routes */}
            <Route 
              path="/authority-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Authority']}>
                  <AuthorityDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute allowedRoles={['Authority']}>
                  <Analytics />
                </ProtectedRoute>
              } 
            />

            {/* Shared Map Route */}
            <Route 
              path="/map" 
              element={
                <ProtectedRoute allowedRoles={['Citizen', 'Authority']}>
                  <MapPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback wildcard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Floating Voice AI Assistant */}
          <CivicVoiceAiChatbot />
        </Router>
      </ReportProvider>
    </AuthProvider>
  );
}

