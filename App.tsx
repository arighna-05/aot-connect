

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import { storageService } from './services/storageService';
import AuthPage from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import Communities from './pages/Communities';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import DirectMessages from './pages/DirectMessages';
import PublicProfile from './pages/PublicProfile';
import More from './pages/More';
import Notifications from './pages/Notifications';
import Layout from './components/Layout';

import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { logout } from './services/api';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const user = storageService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.department && user.role !== UserRole.ADMIN && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Rely on storageService for the current user session
    const user = storageService.getCurrentUser();
    setCurrentUser(user);
    setIsInitializing(false);
  }, []);

  const refreshUser = () => {
    const user = storageService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await logout();
    refreshUser();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/auth" 
          element={
            currentUser ? <Navigate to="/" replace /> : <AuthPage onAuthSuccess={refreshUser} />
          } 
        />
        
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <ProfileSetup onComplete={refreshUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout user={currentUser} onLogout={handleLogout}>
                <Home user={currentUser!} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/communities"
          element={
            <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <Communities user={currentUser!} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <DirectMessages currentUser={currentUser!} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <Notifications user={currentUser!} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/u/:userId"
          element={
            <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <PublicProfile currentUser={currentUser!} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
             <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <Profile user={currentUser!} onUpdate={refreshUser} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/more"
          element={
             <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <More 
                  user={currentUser!} 
                  onLogout={handleLogout} 
                  onUpdate={refreshUser}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
             <ProtectedRoute>
               <Layout user={currentUser} onLogout={handleLogout}>
                <Admin user={currentUser!} />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}