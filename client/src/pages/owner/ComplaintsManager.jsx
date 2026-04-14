import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const statusColor = { 'Open':'badge-yellow','In Review':'badge-blue','Resolved':'badge-green','Rejected':'badge-red' };

export default function ComplaintsManager() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState({ status:'In Review', ownerNote:'' });
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    api.get('/owner/complaints').then(r => { setComplaints(r.data); setLoading(false); });
  }, []);

  const openModal = (c) => { setModal(c); setForm({ status: c.status, ownerNote: c.ownerNote || '' }); };

  const handleResolve = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/owner/complaints/${modal._id}`, form);
      setComplaints(prev => prev.map(c => c._id === modal._id ? { ...c, ...data.complaint } : c));
      toast.success('Complaint updated!');
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Complaints Manager</h1>
          <p className="page-subtitle">Review and resolve customer quality complaints</p>
        </div>

        <div className="card">
          {loading ? <p style={{ color:'var(--text-secondary)' }}>Loading…</p> : complaints.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><p>No complaints to review!</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Customer</th><th>Order</th><th>Description</th><th>Photo</th><th>Status</th><th>Filed</th><th>Action</th></tr></thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{c.customerId?.name}</div>
                        <div style={{ color:'var(--text-secondary)', fontSize:'0.78rem' }}>{c.customerId?.email}</div>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{c.orderId?._id?.slice(-8).toUpperCase()}</td>
                      <td style={{ maxWidth:'180px', fontSize:'0.85rem', color:'var(--text-secondary)' }}>
                        {c.description.length > 60 ? c.description.slice(0,60) + '…' : c.description}
                      </td>
                      <td>
                        {c.photoUrl
                          ? <img src={`http://localhost:5000${c.photoUrl}`} alt="Evidence" className="complaint-photo"
                              onClick={() => window.open(`http://localhost:5000${c.photoUrl}`, '_blank')} />
                          : <span style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>No photo</span>}
                      </td>
                      <td><span className={`badge ${statusColor[c.status]}`}>{c.status}</span></td>
                      <td style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn btn-outline btn-sm" onClick={() => openModal(c)}>Respond</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Resolve Complaint</h2>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', marginBottom:'1rem' }}>{modal.description}</p>
              {modal.photoUrl && <img src={`http://localhost:5000${modal.photoUrl}`} alt="Evidence" style={{ width:'100%', borderRadius:'var(--radius-sm)', marginBottom:'1rem', maxHeight:'200px', objectFit:'cover' }} />}
              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['Open','In Review','Resolved','Rejected'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Your Response</label>
                <textarea className="form-textarea" rows={3} placeholder="Write a note to the customer…"
                  value={form.ownerNote} onChange={e => setForm({ ...form, ownerNote: e.target.value })} />
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn btn-primary" disabled={saving} onClick={handleResolve}>{saving ? 'Saving…' : 'Update'}</button>
                <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
