import React, { useState } from 'react';
import { User, UserRole, ViewType } from './types';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing');
  
  // Dashboard internal navigation state
  const [currentDashView, setCurrentDashView] = useState<ViewType>('dashboard');

  // --- Handlers ---
  
  const handleGetStarted = () => {
    setView('auth');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('app');
    // Set default view based on role
    if (loggedInUser.role === UserRole.FACULTY) setCurrentDashView('dashboard');
    if (loggedInUser.role === UserRole.ADMIN) setCurrentDashView('review_queue');
    if (loggedInUser.role === UserRole.SUPER_ADMIN) setCurrentDashView('reports');
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
  };

  const handleNavigate = (newView: ViewType) => {
      setCurrentDashView(newView);
  };

  // --- Routing Logic ---

  if (view === 'landing') {
    return <Landing onGetStarted={handleGetStarted} />;
  }

  if (view === 'auth') {
    return <Auth onLogin={handleLogin} />;
  }

  // Authenticated View
  return (
    <Layout user={user} currentView={currentDashView} onNavigate={handleNavigate} onLogout={handleLogout}>
      {user?.role === UserRole.FACULTY && (
        <FacultyDashboard userId={user.uid} userName={`${user.firstName} ${user.lastName}`} currentView={currentDashView} />
      )}
      {user?.role === UserRole.ADMIN && (
        <AdminDashboard />
      )}
      {user?.role === UserRole.SUPER_ADMIN && (
        <SuperAdminDashboard currentView={currentDashView} />
      )}
    </Layout>
  );
}

export default App;