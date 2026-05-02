import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <div className={`layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="sidebar-brand" style={{ border: 'none', marginBottom: 0, padding: 0 }}>
          <span>🧺</span> LaundryPro
        </div>
        <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        {children}
      </main>

      <style jsx>{`
        .mobile-header {
          display: none;
          height: 64px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          padding: 0 1.5rem;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .mobile-toggle {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 90;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }
          .sidebar-overlay {
            display: block;
          }
          .layout {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
