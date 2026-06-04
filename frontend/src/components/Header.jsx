import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    function syncAuth() {
      try { setUser(JSON.parse(localStorage.getItem('tickfy_user'))); } catch { setUser(null); }
    }
    syncAuth();
    window.addEventListener('tickfy_auth_changed', syncAuth);
    return () => window.removeEventListener('tickfy_auth_changed', syncAuth);
  }, []);

  function handleLogout() {
    localStorage.removeItem('tickfy_user');
    setUser(null);
    window.dispatchEvent(new Event('tickfy_auth_changed'));
    navigate('/');
  }

  return (
    <header style={{ background: 'rgba(8,8,8,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
      className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="#C5FF00" strokeWidth="2.5"/>
            <rect x="8" y="6" width="16" height="20" rx="3" fill="none" stroke="#C5FF00" strokeWidth="2"/>
            <rect x="13" y="8" width="5" height="16" rx="2" fill="#3B82F6"/>
            <circle cx="21" cy="16" r="1.5" fill="#C5FF00"/>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>Portal</span>
            <span style={{ color: '#C5FF00', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>do Ingresso</span>
          </div>
        </Link>

        <nav className="flex items-center gap-5">
          <Link to="/" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
            Eventos
          </Link>

          {user ? (
            <>
              <Link to="/minha-conta" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {user.nome?.split(' ')[0] || 'Minha Conta'}
              </Link>
              <button onClick={handleLogout} className="btn-secondary text-sm" style={{ padding: '8px 20px' }}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
                Entrar
              </Link>
              <Link to="/cadastro" className="btn-primary" style={{ padding: '9px 22px', fontSize: '0.85rem' }}>
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
