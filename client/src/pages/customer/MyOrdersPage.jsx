import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

const statusColor = {
  'Placed': 'badge-blue', 'Picked Up': 'badge-purple', 'Processing': 'badge-yellow',
  'Ready': 'badge-teal', 'Out for Delivery': 'badge-yellow', 'Delivered': 'badge-green', 'Cancelled': 'badge-red'
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get('/customer/orders').then(r => { setOrders(r.data); setLoading(false); });
  }, []);

  const filtered = orders.filter(o =>
    o.status.toLowerCase().includes(search.toLowerCase()) ||
    o._id.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayClick = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    setPaying(true);
    try {
      await api.patch(`/customer/orders/${selectedOrder._id}/pay`);
      toast.success('🎉 Payment marked as successful!');
      setShowPaymentModal(false);
      
      // Refresh orders
      const r = await api.get('/customer/orders');
      setOrders(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setPaying(false);
    }
  };
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? Any points used will be refunded.')) return;
    try {
      await api.patch(`/customer/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: 'Cancelled' } : o));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel order';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this order from your history?')) return;
    try {
      await api.delete(`/customer/orders/${id}`);
      toast.success('Order removed from history');
      setOrders(prev => prev.filter(o => o._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">View and track all your laundry orders</p>
        </div>
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <input className="form-input" placeholder="Search by status or order ID…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>No orders found</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th><th>Items</th><th>Pickup Date</th><th>Time</th>
                    <th>Total</th><th>Payment</th><th>Status</th><th>Delivery Agent</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o._id.slice(-8).toUpperCase()}</td>
                      <td>{o.items.length} item(s)</td>
                      <td>{o.pickupDate}</td>
                      <td>{o.pickupTime}</td>
                      <td><strong>₹{o.totalAmount}</strong></td>
                      <td>
                        <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td><span className={`badge ${statusColor[o.status] || 'badge-blue'}`}>{o.status}</span></td>
                      <td>{o.deliveryBoyId ? o.deliveryBoyId.name : <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/customer/orders/${o._id}`} className="btn btn-outline btn-sm">Track</Link>
                          {o.paymentStatus === 'Pending' && o.status === 'Placed' && (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => handlePayClick(o)}
                            >
                              Pay Now
                            </button>
                          )}
                          {o.status === 'Placed' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(o._id)}>Cancel</button>
                          )}
                          {['Delivered', 'Cancelled'].includes(o.status) && (
                            <button className="btn btn-icon" style={{ color:'var(--danger)' }} onClick={() => handleDelete(o._id)}>
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Complete Payment</h2>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><FiX size={20} /></button>
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 0 0 1px #eee' }}>
                <QRCodeSVG 
                  value={`upi://pay?pa=logeshwaranv19@oksbi&pn=LOGESHWARAN%20V&am=${selectedOrder.totalAmount.toFixed(2)}&cu=INR&tn=Order%20Payment%20%23${selectedOrder._id.slice(-6)}`}
                  size={220}
                  level="H"
                  includeMargin={true}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '0.5rem', width: '100%', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>UPI ID</p>
                <p style={{ fontWeight: 600, color: 'var(--accent)' }}>logeshwaranv19@oksbi</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Amount to Pay</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedOrder.totalAmount}</h3>
            </div>

            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setShowPaymentModal(false)} disabled={paying}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmPayment} disabled={paying}>
                <FiCheckCircle style={{ marginRight: '0.5rem' }} /> {paying ? 'Updating…' : "I've Paid"}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.)
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
