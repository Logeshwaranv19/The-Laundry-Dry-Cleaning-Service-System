import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      if (user.role === 'owner') navigate('/owner/dashboard');
      else if (user.role === 'delivery') navigate('/delivery/orders');
      else navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your LaundryPro account</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="login-email" className="form-input" type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button id="login-btn" className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}
