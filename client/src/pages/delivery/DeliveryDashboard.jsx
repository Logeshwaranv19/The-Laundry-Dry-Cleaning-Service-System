import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { FiPackage, FiCheckCircle, FiClock, FiActivity } from 'react-icons/fi';

export default function DeliveryDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/dashboard').then(r => {
      setStats(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Layout><p>Loading Dashboard...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Delivery <span className="gradient-text">Dashboard</span></h1>
        <p className="page-subtitle">Welcome back! Here is your delivery performance summary.</p>
      </div>

      <div className="grid grid-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}><FiPackage style={{ color: '#2563eb' }} /></div>
          <div>
            <div className="card-title">Active Tasks</div>
            <div className="card-value">{stats.activeTasks}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5' }}><FiCheckCircle style={{ color: '#059669' }} /></div>
          <div>
            <div className="card-title">Total Completed</div>
            <div className="card-value">{stats.totalDeliveries}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#fff7ed' }}><FiActivity style={{ color: '#ea580c' }} /></div>
          <div>
            <div className="card-title">Completed Today</div>
            <div className="card-value">{stats.todayCompleted}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff' }}><FiClock style={{ color: '#7c3aed' }} /></div>
          <div>
            <div className="card-title">Recent Tasks</div>
            <div className="card-value">{stats.recentTasks?.length || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/delivery/orders" className="btn btn-primary btn-full" style={{ justifyContent: 'center', height: '60px', fontSize: '1.1rem' }}>
              📦 View Assigned Orders
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Activity</h2>
          {stats.recentTasks?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.recentTasks.map(t => (
                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Order #{t._id.slice(-6).toUpperCase()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: {t.status}</div>
                  </div>
                  <Link to="/delivery/orders" className="btn btn-outline btn-sm">View</Link>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No recent activity</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
