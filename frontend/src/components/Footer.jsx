import { Link } from 'react-router-dom';

const inst = [
  { to: '/quem-somos', label: 'Quem somos' },
  { to: '/duvidas', label: 'Dúvidas frequentes' },
  { to: '/politicas', label: 'Nossas políticas' },
  { to: '/fale-conosco', label: 'Fale conosco' },
];
const conta = [
  { to: '/login', label: 'Entrar' },
  { to: '/cadastro', label: 'Criar conta' },
  { to: '/minha-conta', label: 'Meus ingressos' },
  { to: '/recupera-senha', label: 'Recuperar senha' },
];

export default function Footer() {
  return (
    <footer
      style={{ background: 'var(--s1)', borderTop: '1px solid var(--bd)' }}
      className="mt-24 relative overflow-hidden"
    >
      {/* glow volt sutil no topo */}
      <div
        aria-hidden="true"
        className="absolute -top-px left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, var(--neon-mid), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10">

          {/* Marca */}
          <div className="col-span-2 md:col-span-5">
            <Link to="/" className="inline-flex items-center" style={{ textDecoration: 'none' }}>
              <img src="/logo.png" alt="Portal do Ingresso" width="110" height="30" decoding="async" loading="lazy" style={{ height: 30, width: 'auto', aspectRatio: '11 / 3' }} />
            </Link>
            <p
              className="mt-5 max-w-xs leading-relaxed"
              style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
            >
              O acesso oficial aos eventos que movem a cidade. Compra segura, tecnologia confiável.
            </p>

            {/* selos de confiança */}
            <div className="flex items-center gap-2 mt-6">
              {['PIX', 'Cartão de crédito'].map((m) => (
                <span
                  key={m}
                  style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--t2)',
                    border: '1px solid var(--bd)',
                    borderRadius: 999,
                    padding: '5px 12px',
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden md:block md:col-span-1" />

          {/* Institucional */}
          <div className="md:col-span-3">
            <p className="mono-label mb-4" style={{ color: 'var(--neon)' }}>// Institucional</p>
            <ul className="space-y-3">
              {inst.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="footer-link transition-colors"
                    style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Conta */}
          <div className="md:col-span-3">
            <p className="mono-label mb-4" style={{ color: 'var(--neon)' }}>// Minha Conta</p>
            <ul className="space-y-3">
              {conta.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="footer-link transition-colors"
                    style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* base */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--bd)' }}
        >
          <p style={{ color: 'var(--t3)', fontFamily: '"Space Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
            © {new Date().getFullYear()} Portal do Ingresso · Todos os direitos reservados
          </p>
          <p style={{ color: 'var(--t3)', fontFamily: '"Space Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
            Plataforma oficial de ingressos
          </p>
        </div>
      </div>
    </footer>
  );
}
