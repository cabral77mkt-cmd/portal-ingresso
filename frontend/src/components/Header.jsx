import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user,       setUser]       = useState(null);
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  // A11y: quando fechado, o drawer não deve conter elementos focáveis (inert)
  useEffect(() => {
    if (drawerRef.current) drawerRef.current.inert = !mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    function syncAuth() {
      try { setUser(JSON.parse(localStorage.getItem('tickfy_user'))); } catch { setUser(null); }
    }
    syncAuth();
    window.addEventListener('tickfy_auth_changed', syncAuth);
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('tickfy_auth_changed', syncAuth);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      const y = window.scrollY;
      document.body.style.cssText = `overflow:hidden;position:fixed;top:-${y}px;width:100%`;
    } else {
      const y = document.body.style.top;
      document.body.style.cssText = '';
      if (y) window.scrollTo(0, parseInt(y) * -1);
    }
    return () => { document.body.style.cssText = ''; };
  }, [mobileOpen]);

  function handleLogout() {
    localStorage.removeItem('tickfy_user');
    setUser(null);
    window.dispatchEvent(new Event('tickfy_auth_changed'));
    navigate('/');
  }

  const isActive = (to) => location.pathname === to;

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          background: scrolled ? 'rgba(10,10,10,0.97)' : 'rgba(10,10,10,0.92)',
          borderBottom: `1px solid ${scrolled ? 'var(--bd-md)' : 'var(--bd)'}`,
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Linha neon no topo (só ao scrollar) */}
        {scrolled && (
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'var(--neon)', opacity: 0.55 }}
          />
        )}

        <div className={`max-w-7xl mx-auto px-5 sm:px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}>

          {/* ── Logo brutalista ──────────────────────── */}
          <Link to="/" className="flex items-center shrink-0 group" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="Portal do Ingresso" width="110" height="30" decoding="async" fetchpriority="high" style={{ height: 30, width: 'auto' }} />
          </Link>

          {/* ── Desktop nav ─────────────────────────── */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
            <Link
              to="/"
              className="relative transition-colors duration-150"
              style={{
                fontFamily: '"Clash Display", sans-serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive('/') ? 'var(--neon)' : 'var(--t2)',
              }}
            >
              Eventos
              {isActive('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px" style={{ background: 'var(--neon)' }} />
              )}
            </Link>

            {user ? (
              <>
                <Link
                  to="/minha-conta"
                  style={{
                    fontFamily: '"Clash Display", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: isActive('/minha-conta') ? 'var(--neon)' : 'var(--t2)',
                  }}
                >
                  {user.nome?.split(' ')[0] || 'Conta'}
                </Link>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '7px 18px', fontSize: '0.78rem' }}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    fontFamily: '"Clash Display", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: isActive('/login') ? 'var(--t1)' : 'var(--t2)',
                  }}
                >
                  Entrar
                </Link>
                <Link to="/cadastro" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.78rem' }}>
                  Cadastrar
                </Link>
              </>
            )}
          </nav>

          {/* ── Hamburger ───────────────────────────── */}
          <button
            className="md:hidden flex flex-col justify-center gap-[5px] w-10 h-10"
            style={{ background: 'transparent', border: 'none' }}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden="true" className="block h-px bg-white origin-center transition-all duration-200"
                style={{
                  width: i === 1 ? (mobileOpen ? '0px' : '18px') : '18px',
                  marginLeft: 'auto', marginRight: 'auto',
                  opacity: i === 1 ? (mobileOpen ? 0 : 1) : 1,
                  background: i === 0 && mobileOpen ? 'var(--neon)' : i === 2 && mobileOpen ? 'var(--neon)' : 'var(--t1)',
                  transform:
                    i === 0 ? (mobileOpen ? 'rotate(45deg) translate(4.5px, 4.5px)' : 'none')
                  : i === 2 ? (mobileOpen ? 'rotate(-45deg) translate(4.5px, -4.5px)' : 'none')
                  : 'none',
                }}
              />
            ))}
          </button>
        </div>
      </header>

      {/* ── Mobile backdrop ─────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-30 md:hidden transition-opacity duration-300"
        style={{
          background: 'rgba(10,10,10,0.88)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile drawer (brutalista) ───────────────── */}
      <div
        ref={drawerRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        aria-hidden={!mobileOpen}
        className="fixed top-0 right-0 h-full w-72 z-40 md:hidden flex flex-col pt-[72px]"
        style={{
          background: 'rgba(10,10,13,0.99)',
          borderLeft: '1px solid var(--bd-md)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Linha neon no topo do drawer */}
        <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-px" style={{ background: 'var(--neon)', opacity: 0.7 }} />

        <nav className="flex flex-col px-6 py-6 gap-1" aria-label="Menu mobile">
          {[
            { to: '/', label: 'Eventos' },
            ...(user
              ? [{ to: '/minha-conta', label: user.nome?.split(' ')[0] || 'Minha Conta' }]
              : [{ to: '/login', label: 'Entrar' }]),
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              className="flex items-center py-4 transition-colors duration-150"
              style={{
                fontFamily: '"Clash Display", sans-serif',
                fontWeight: 900,
                fontSize: '1.5rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive(to) ? 'var(--neon)' : 'var(--t2)',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              {isActive(to) && <span className="mr-3 text-neon" style={{ color: 'var(--neon)', fontFamily: '"Space Mono", monospace', fontSize: '0.7rem' }}>→</span>}
              {label}
            </Link>
          ))}

          <div className="mt-6">
            {user ? (
              <button onClick={handleLogout} className="btn-secondary w-full" style={{ padding: '12px', fontSize: '0.88rem' }}>
                Sair
              </button>
            ) : (
              <Link to="/cadastro" className="btn-primary w-full text-center block" style={{ padding: '12px', fontSize: '0.88rem' }}>
                Cadastrar grátis
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
