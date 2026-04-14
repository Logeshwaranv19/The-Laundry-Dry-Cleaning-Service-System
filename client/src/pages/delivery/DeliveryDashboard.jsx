import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { FiTruck, FiPackage, FiCheckCircle, FiClock, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function DeliveryDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/dashboard')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColor = {
    'Placed': 'badge-blue', 'Picked Up': 'badge-purple', 'Processing': 'badge-yellow',
    'Ready': 'badge-teal', 'Out for Delivery': 'badge-yellow', 'Delivered': 'badge-green', 'Cancelled': 'badge-red'
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Delivery <span className="gradient-text">Dashboard</span></h1>
          <p className="page-subtitle">Your overview and recent activity</p>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff' }}><FiTruck style={{ color: '#2563eb' }} /></div>
            <div>
              <div className="card-title">Active Tasks</div>
              <div className="card-value">{loading ? '–' : (stats?.activeTasks || 0)}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5' }}><FiCheckCircle style={{ color: '#059669' }} /></div>
            <div>
              <div className="card-title">Today Done</div>
              <div className="card-value">{loading ? '–' : (stats?.todayCompleted || 0)}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#f5f3ff' }}><FiPackage style={{ color: '#7c3aed' }} /></div>
            <div>
              <div className="card-title">Total Tasks</div>
              <div className="card-value">{loading ? '–' : (stats?.totalDeliveries || 0)}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#fff7ed' }}><FiClock style={{ color: '#ea580c' }} /></div>
            <div>
              <div className="card-title">Value</div>
              <div className="card-value" style={{ fontSize:'1.2rem' }}>₹{loading ? '–' : (stats?.totalValue || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Activity</h2>
              <Link to="/delivery/orders" className="btn btn-outline btn-sm">View All</Link>
            </div>

            {loading ? <p>Loading activity...</p> : !stats || stats.recentTasks?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No recent activity</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.recentTasks?.map(task => (
                  <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <FiPackage style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{task._id.slice(-6).toUpperCase()}</span>
                        <span className={`badge ${statusColor[task.status]}`} style={{ fontSize: '0.7rem' }}>{task.status}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {task.customerId?.name} • {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <FiChevronRight style={{ color: 'var(--border)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'var(--accent)', color: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>Ready to Roll?</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1.5rem', color: 'white' }}>
              This section is your quick-start guide. You have <strong>{stats?.activeTasks || 0}</strong> pending deliveries waiting. Click below to see the details and start your route!
            </p>
            <Link to="/delivery/orders" className="btn" style={{ background: 'white', color: 'var(--accent)', border: 'none', fontWeight: 700 }}>
              Go to My Deliveries
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
