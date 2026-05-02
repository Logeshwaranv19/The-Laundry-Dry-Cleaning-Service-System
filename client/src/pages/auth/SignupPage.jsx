import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'customer', address:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await signup(form);
      toast.success(`Account created! Welcome, ${user.name}! 🎉`);
      if (user.role === 'owner') navigate('/owner/dashboard');
      else if (user.role === 'delivery') navigate('/delivery/orders');
      else navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Floating Theme Toggle */}
      <button 
        onClick={toggleTheme} 
        style={{ 
          position: 'absolute', top: '2rem', right: '2.5rem', 
          width: '42px', height: '42px', padding: 0, 
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          border: '1.5px solid var(--text-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          zIndex: 10
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--bg-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        title="Toggle Theme"
      >
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      </button>

      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Laundry — fresh clothes delivered!</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="signup-name" className="form-input" placeholder="John Doe" required value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="signup-email" className="form-input" type="email" placeholder="you@example.com" required value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input id="signup-phone" className="form-input" type="tel" placeholder="+91 98765 43210" required value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="signup-password" className="form-input" type="password" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          {form.role === 'customer' && (
            <div className="form-group">
              <label className="form-label">Default Address</label>
              <input id="signup-address" className="form-input" placeholder="123 Main St, City" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          )}
          <button id="signup-btn" className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
