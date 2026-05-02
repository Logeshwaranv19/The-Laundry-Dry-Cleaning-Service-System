import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiTruck, FiMapPin, FiPhone } from 'react-icons/fi';

const statusColor = {
  'Placed':'badge-blue','Picked Up':'badge-purple','Processing':'badge-yellow',
  'Ready':'badge-teal','Out for Delivery':'badge-yellow','Delivered':'badge-green','Cancelled':'badge-red'
};

export default function MyDeliveries() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/delivery/assigned').then(r => { setOrders(r.data); setLoading(false); });
  }, []);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const { data } = await api.put(`/delivery/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: data.order.status } : o));
      toast.success(`Status updated to "${status}"!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(null); }
  };

  const active  = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const done    = orders.filter(o => o.status === 'Delivered');

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">My <span className="gradient-text">Deliveries</span></h1>
          <p className="page-subtitle">Orders assigned to you for pickup and delivery</p>
        </div>

        <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background:'#eff6ff' }}><FiTruck style={{ color:'#2563eb' }} /></div>
            <div><div className="card-title">Active Deliveries</div><div className="card-value">{loading ? '–' : active.length}</div></div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background:'#ecfdf5' }}><FiTruck style={{ color:'#059669' }} /></div>
            <div><div className="card-title">Completed Today</div><div className="card-value">{loading ? '–' : done.length}</div></div>
          </div>
        </div>

        {loading ? <p style={{ color:'var(--text-secondary)' }}>Loading…</p> : orders.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="icon">🚴</div><p>No orders assigned to you yet</p></div></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {orders.map(o => (
              <div key={o._id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
                      <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:'1rem' }}>#{o._id.slice(-8).toUpperCase()}</span>
                      <span className={`badge ${statusColor[o.status]}`}>{o.status}</span>
                    </div>

                    <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', fontSize:'0.88rem', color:'var(--text-secondary)' }}>
                      <span><strong style={{ color:'var(--text-primary)' }}>Customer:</strong> {o.customerId?.name}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><FiPhone size={13} />{o.customerId?.phone}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'0.3rem', marginTop:'0.4rem', fontSize:'0.88rem', color:'var(--text-secondary)' }}>
                      <FiMapPin size={14} style={{ flexShrink:0, marginTop:'2px' }} />
                      {o.address}
                    </div>
                    <div style={{ marginTop:'0.4rem', fontSize:'0.85rem' }}>
                      Pickup: <strong>{o.pickupDate}</strong> at <strong>{o.pickupTime}</strong> &nbsp;|&nbsp; <strong style={{ color:'var(--accent)' }}>₹{o.totalAmount}</strong>
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    {o.status === 'Placed' && (
                      <button className="btn btn-outline" disabled={updating === o._id}
                        onClick={() => updateStatus(o._id, 'Picked Up')}>
                        {updating === o._id ? '…' : '📦 Mark Picked Up (From Customer)'}
                      </button>
                    )}
                    {o.status === 'Picked Up' && (
                      <span style={{ color:'var(--accent)', fontSize:'0.85rem', fontWeight:600 }}>🚚 Dropped at Shop - Waiting for Wash</span>
                    )}
                    {o.status === 'Processing' && (
                      <span style={{ color:'var(--badge-yellow-text)', fontSize:'0.85rem', fontWeight:600 }}>🫧 Washing in Progress...</span>
                    )}
                    {o.status === 'Ready' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                        <span style={{ color:'var(--success)', fontSize:'0.85rem', fontWeight:600 }}>✨ Wash Completed!</span>
                        <button className="btn btn-primary" disabled={updating === o._id}
                          onClick={() => updateStatus(o._id, 'Out for Delivery')}>
                          {updating === o._id ? '…' : '🚴 Start Final Delivery'}
                        </button>
                      </div>
                    )}
                    {o.status === 'Out for Delivery' && (
                      <button className="btn btn-success" disabled={updating === o._id}
                        onClick={() => updateStatus(o._id, 'Delivered')}>
                        {updating === o._id ? '…' : '✅ Mark Delivered (To Customer)'}
                      </button>
                    )}
                    {o.status === 'Delivered' && (
                      <span style={{ color:'var(--success)', fontSize:'0.88rem', fontWeight:600 }}>✅ Task Completed</span>
                    )}
                  </div>
                </div>

                {/* Items summary */}
                <div style={{ marginTop:'0.75rem', padding:'0.75rem', background:'var(--bg-secondary)', borderRadius:'var(--radius-sm)' }}>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'0.4rem' }}>Items:</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                    {o.items.map((item, i) => (
                      <span key={i} className="badge badge-blue">{item.quantity}× {item.fabricType} ({item.serviceType})</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Layout>
    );
  }
