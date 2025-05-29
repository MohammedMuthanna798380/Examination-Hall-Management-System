import React, { useState, useEffect } from 'react';
import LoginPage from './Components/auth/LoginPage';
import Dashboard from './Components/dashboard/Dashboard';
import UsersManagement from './Components/dashboard/UsersManagement';
import RoomsManagement from './Components/dashboard/RoomsManagement';
import ExamSchedule from './Components/dashboard/ExamSchedule';
import DailyAssignment from './Components/dashboard/DailyAssignment';
import AbsenceReplacementManagement from './Components/dashboard/AbsenceReplacementManagement';
import Reports from './Components/dashboard/Reports';
import Settings from './Components/dashboard/Settings';
import TestAPI from './Components/debug/TestAPI';
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
              <AbsenceReplacementManagement onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />

        <Route
          path="/reports"
          element={
            isAuthenticated ?
              <Reports onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ?
              <Settings onLogout={handleLogout} /> :
              <Navigate to="/login" replace />
          }
        />
        {/* مسار الاختبار - يظهر فقط في بيئة التطوير */}
        {process.env.NODE_ENV === 'development' && (
          <Route
            path="/test-api"
            element={<TestAPI />}
          />
        )}
      </Routes>

    </Router>
  );
}

export default App;