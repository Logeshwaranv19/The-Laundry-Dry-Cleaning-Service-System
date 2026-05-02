import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FiUserPlus, FiTrash2, FiMail, FiPhone, FiLock, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';

export default function DeliveryStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/owner/delivery-boys');
      setStaff(res.data);
    } catch (err) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/owner/delivery-boys', form);
      toast.success('Delivery staff added successfully!');
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/owner/delivery-boys/${id}`);
      toast.success('Staff removed');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to remove staff');
    }
  };

  return (
    <Layout>
      <div className="delivery-manager">
        <div className="page-header">
          <h1 className="page-title">Delivery Staff Management</h1>
          <p className="page-subtitle">Create and manage accounts for your delivery team</p>
        </div>

        <div className="grid grid-2">
          {/* Add Staff Form */}
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700 }}>Add New Staff</h2>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    className="form-input" style={{ paddingLeft: '3rem' }}
                    placeholder="Staff Name" required 
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    className="form-input" style={{ paddingLeft: '3rem' }}
                    type="email" placeholder="email@example.com" required 
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <FiPhone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    className="form-input" style={{ paddingLeft: '3rem' }}
                    type="tel" placeholder="+91 00000 00000" required 
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    className="form-input" style={{ paddingLeft: '3rem' }}
                    type="password" placeholder="••••••••" required minLength={6}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} 
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : <><FiUserPlus /> Add Staff Member</>}
              </button>
            </form>
          </div>

          {/* Staff List */}
          <div className="card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700 }}>Active Staff ({staff.length})</h2>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading staff...</p>
            ) : staff.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="icon">🚴</div>
                <p>No delivery staff found.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {s._id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{s.email}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.phone}</div>
                        </td>
                        <td>
                          <button 
                            className="btn btn-icon" 
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeleteStaff(s._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
