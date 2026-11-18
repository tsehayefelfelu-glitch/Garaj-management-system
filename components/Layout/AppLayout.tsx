import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // If on login page or print pages, don't wrap with sidebar/navbar
  const isPlainPage = router.pathname === '/login' || router.pathname.includes('/print');

  useEffect(() => {
    if (!loading && !user && !isPlainPage) {
      router.push('/login');
    }
  }, [loading, user, isPlainPage, router]);

  if (isPlainPage) {
    return <main>{children}</main>;
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted fw-semibold">Loading Wise Digital Garage System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-wrapper flex-grow-1">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="content-body">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
