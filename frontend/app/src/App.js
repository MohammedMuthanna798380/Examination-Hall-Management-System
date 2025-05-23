import React, { useState, useEffect } from 'react';
import LoginPage from './Components/auth/LoginPage';
import Dashboard from './Components/dashboard/Dashboard';
import UsersManagement from './Components/dashboard/UsersManagement';
import RoomsManagement from './Components/dashboard/RoomsManagement';
import ExamSchedule from './Components/dashboard/ExamSchedule';
import DailyAssignment from './Components/dashboard/DailyAssignment';
import DailyAssignmentSystem from './Components/dashboard/DailyAssignmentSystem';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in by looking for token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Function to handle successful login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <LoginPage onLoginSuccess={handleLogin} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ?
              <Dashboard onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
        <Route
          path="/users"
          element={
            isAuthenticated ?
              <UsersManagement onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
        <Route
          path="/halls"
          element={
            isAuthenticated ?
              <RoomsManagement onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="/exams"
          element={
            isAuthenticated ?
              <ExamSchedule onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
        <Route
          path="/assignments"
          element={
            isAuthenticated ?
              <DailyAssignment onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />

        <Route
          path="/absences"
          element={
            isAuthenticated ?
              <DailyAssignmentSystem onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;