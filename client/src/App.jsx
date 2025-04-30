import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import EmailVerifyPage from './pages/EmailVerifyPage';
import HomePage from './pages/HomePage';
import TutorsPage from './pages/TutorsPage';
import TutorProfilePage from './pages/TutorProfilePage';
import ChatPage from './pages/ChatPage';
import ChatConversationPage from './pages/ChatConversationPage';
import { io } from 'socket.io-client';

export const socket = io('http://localhost:5000');

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?.id) {
      socket.emit('join', { userId: user.id });
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/tutors" element={<TutorsPage />} />
      <Route path="/tutor/:tutorId" element={<TutorProfilePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/verify/:token"
        element={
          <ProtectedRoute>
            <EmailVerifyPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:userId"
        element={
          <ProtectedRoute>
            <ChatConversationPage socket={socket} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<h1>Сторінку не знайдено</h1>} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;