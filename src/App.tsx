/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import socket from '@/lib/socket';
import Auth from '@/components/Auth';
import Dashboard from '@/components/Dashboard';
import Layout from '@/components/Layout';
import Settings from '@/components/Settings';
import Team from '@/components/Team';
import SplashScreen from '@/components/SplashScreen';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 6000);

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    toast.success('Welcome back, ' + userData.name);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const handleUpdateUser = (updatedUser: any) => {
    const newUser = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
      case 'tasks':
        return <Dashboard user={user} />;
      case 'team':
        return <Team user={user} />;
      case 'settings':
        return <Settings user={user} onUpdateUser={handleUpdateUser} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!showSplash && (
        <>
          {!user ? (
            <Auth onLogin={handleLogin} />
          ) : (
            <Layout 
              user={user} 
              onLogout={handleLogout} 
              currentView={currentView} 
              onViewChange={setCurrentView}
            >
              {renderView()}
            </Layout>
          )}
        </>
      )}
      <Toaster position="top-right" />
    </div>
  );
}

