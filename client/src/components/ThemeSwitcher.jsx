import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ padding: '1rem 1.25rem' }}>
      <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Theme Preference
      </label>
      <div style={{ position: 'relative' }}>
        <select 
          className="form-select" 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          style={{ 
            padding: '0.6rem 1rem', 
            paddingLeft: '2.5rem',
            background: 'var(--bg-secondary)', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value="light">Fresh Light</option>
          <option value="dark">Cyber Dark</option>
        </select>
        <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
          {theme === 'light' ? <FiSun /> : <FiMoon />}
        </div>
      </div>
    </div>
  );
}
