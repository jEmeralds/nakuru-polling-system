// =====================================================
// FILE: frontend/src/App.js
// UPDATED - Added Profile and UserManagement routes
// =====================================================

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
// Layout Components
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Polls from './pages/Polls'
import { PollDetail } from './pages/Polls'
import Issues from './pages/Issues'
import IssueDetail from './pages/IssueDetail'
import SubmitIssue from './pages/SubmitIssue'
import Profile from './pages/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminIssues from './pages/admin/AdminIssues'
import AdminPolls from './pages/admin/AdminPolls'
import UserManagement from './pages/UserManagement'

// CSS
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/polls" 
                element={
                  <ProtectedRoute>
                    <Polls />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/polls/:id" 
                element={
                  <ProtectedRoute>
                    <PollDetail />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/issues" 
                element={
                  <ProtectedRoute>
                    <Issues />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/issues/:id" 
                element={
                  <ProtectedRoute>
                    <IssueDetail />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/submit-issue" 
                element={
                  <ProtectedRoute>
                    <SubmitIssue />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/issues" 
                element={
                  <ProtectedRoute>
                    <AdminIssues />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/polls" 
                element={
                  <ProtectedRoute>
                    <AdminPolls />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />

              {/* 404 Catch All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App