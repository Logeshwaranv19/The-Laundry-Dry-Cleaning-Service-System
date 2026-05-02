import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { API_BASE_URL } from '../../api/axios';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const statusColor = { 'Open':'badge-yellow', 'In Review':'badge-blue', 'Resolved':'badge-green', 'Rejected':'badge-red' };

export default function ComplaintPage() {
  const navigate = useNavigate();
  const [orders, setOrders]    = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [form, setForm]        = useState({ orderId: '', description: '' });
  const [photo, setPhoto]      = useState(null);
  const [preview, setPreview]  = useState('');
  const [loading, setLoading]  = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/customer/orders').then(r => setOrders(r.data.filter(o => o.status === 'Delivered')));
    api.get('/customer/complaints').then(r => setComplaints(r.data));
  }, []);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.description) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('orderId', form.orderId);
      fd.append('description', form.description);
      if (photo) fd.append('photo', photo);
      const { data } = await api.post('/customer/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint filed successfully!');
      setComplaints(prev => [data.complaint, ...prev]);
      setForm({ orderId: '', description: '' });
      setPhoto(null); setPreview('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file complaint');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this complaint?')) return;
    try {
      await api.delete(`/customer/complaints/${id}`);
      toast.success('Complaint removed');
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-icon" onClick={() => navigate(-1)} style={{ fontSize: '1.25rem' }}><FiArrowLeft /></button>
          <div>
            <h1 className="page-title">Quality Complaints</h1>
            <p className="page-subtitle">Report a quality issue with your laundry service</p>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          {/* File Complaint Form */}
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>File a Complaint</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Order</label>
                <select id="complaint-order" className="form-select" required value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })}>
                  <option value="">-- Select a delivered order --</option>
                  {orders.map(o => (
                    <option key={o._id} value={o._id}>Order #{o._id.slice(-8).toUpperCase()} — {o.pickupDate}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="complaint-desc" className="form-textarea" rows={4} required
                  placeholder="Describe the quality issue in detail…"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Photo Evidence</label>
                <div className="photo-upload" onClick={() => fileRef.current.click()}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                  <p style={{ fontSize: '0.88rem' }}>Click to upload photo (JPG, PNG, WebP — max 5MB)</p>
                  {preview && <img src={preview} alt="Preview" className="photo-preview" />}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </div>

              <button id="complaint-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Submitting…' : '📨 Submit Complaint'}
              </button>
            </form>
          </div>

          {/* Complaint History */}
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>My Complaints</h2>
            {complaints.length === 0 ? (
              <div className="empty-state"><div className="icon">✅</div><p>No complaints filed yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {complaints.map(c => (
                  <div key={c._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Order #{c.orderId?._id?.slice(-8).toUpperCase() || 'N/A'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <span className={`badge ${statusColor[c.status] || 'badge-blue'}`}>{c.status}</span>
                        <button className="btn btn-icon" style={{ color:'var(--danger)', padding:'2px' }} onClick={() => handleDelete(c._id)}><FiTrash2 size={16} /></button>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{c.description}</p>
                    {c.photoUrl && <img src={`${API_BASE_URL}${c.photoUrl}`} alt="Evidence" className="complaint-photo" onClick={() => window.open(`${API_BASE_URL}${c.photoUrl}`, '_blank')} />}
                    {c.ownerNote && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(79,156,249,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--accent)' }}>
                        💬 Owner: {c.ownerNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }
