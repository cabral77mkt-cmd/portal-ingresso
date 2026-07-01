import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gticket } from '../services/gticket.js';
import EventCard from '../components/EventCard.jsx';
import { IconTicket } from '../components/Icons.jsx';

gsap.registerPlugin(ScrollTrigger);

function mapEvent(e) {
  const [d, m, y] = String(e.data || '').split('/');
  const iso = (y && m && d)
    ? `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${(e.horario || '00:00')}:00`
    : '';
  return {
    id: e.codigo, gticket_id: e.codigo,
    title: e.nome, image_url: e.logo,
    date: iso, rawDate: e.data,
    location: e.local, city: e.cidade, state: e.estado,
    featured: e.destaque === 'S', status: 'active',
  };
}

export default function Home() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [city,    setCity]    = useState('');
  const [genres,  setGenres]  = useState([]);
  const [genre,   setGenre]   = useState('');
  const heroRef  = useRef(null);
  const gsapCtx  = useRef(null);

  useEffect(() => {
    loadEvents();
    gticket.genres().then((d) => setGenres(d?.Lista || [])).catch(() => {});
  }, []);

  // Hero entrance GSAP (sem aurora, sem genérico)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.hero-stamp',   { y: -20, opacity: 0, duration: 0.5 })
        .from('.hero-line1',   { y: 80, skewX: -3, opacity: 0, duration: 0.9 }, '-=0.15')
        .from('.hero-line2',   { y: 80, skewX: -3, opacity: 0, duration: 0.9 }, '-=0.65')
        .from('.hero-line3',   { y: 80, skewX: -3, opacity: 0, duration: 0.9 }, '-=0.65')
        .from('.hero-sub',     { y: 20, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.hero-search',  { y: 18, opacity: 0, duration: 0.45 }, '-=0.3')
        .from('.hero-numbers', { y: 14, opacity: 0, duration: 0.4 }, '-=0.25');
    }, heroRef);
    return () => ctx.revert();
  }, []);

  // ScrollTrigger nos cards
  useEffect(() => {
    if (loading) return;
    if (gsapCtx.current) gsapCtx.current.revert();

    gsapCtx.current = gsap.context(() => {
      gsap.utils.toArray('.card-scroll-wrap').forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
          y: 40, opacity: 0,
          duration: 0.7,
          delay: (i % 3) * 0.06,
          ease: 'power3.out',
        });
      });

      // Seção headers entram da esquerda
      gsap.utils.toArray('.section-hd').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 88%' },
          x: -40, opacity: 0, duration: 0.6, ease: 'power3.out',
        });
      });

      // CTA final
      gsap.from('.cta-inner', {
        scrollTrigger: { trigger: '.cta-inner', start: 'top 88%' },
        y: 50, opacity: 0, scale: 0.97, duration: 0.85, ease: 'power4.out',
      });
    });

    return () => { if (gsapCtx.current) gsapCtx.current.revert(); };
  }, [loading, events.length]);

  async function loadEvents() {
    try {
      setLoading(true);
      const data  = await gticket.events.list();
      const lista = data?.Lista || data?.lista || [];
      const now   = Date.now();
      const all   = lista.map(mapEvent).filter((e) => {
        if (e.rawDate) {
          const [d, m, y] = e.rawDate.split('/').map(Number);
          if (d && m && y) {
            if (new Date(y, m - 1, d + 1, 23, 59, 59, 999).getTime() < now) return false;
          }
        }
        return true;
      });
      setEvents(all);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function applyGenre(desc) {
    if (genre === desc) { setGenre(''); loadEvents(); return; }
    setGenre(desc);
    try {
      setLoading(true);
      const data  = await gticket.events.search({ genero: desc });
      const lista = data?.Lista || [];
      setEvents(lista.map((e) => ({
        id: e.lista_eventos || e.codigo, gticket_id: e.lista_eventos || e.codigo,
        title: e.nome, image_url: e.logo,
        date: (() => {
          const [d, m, y] = String(e.data || '').split('/');
          return (y && m && d)
            ? `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${e.horario || '00:00'}:00`
            : '';
        })(),
        location: e.local, city: e.cidade, state: e.estado,
        featured: false, status: 'active',
      })));
    } catch { /* mantém lista */ }
    finally { setLoading(false); }
  }

  const featured    = useMemo(() => events.filter((e) => e.featured), [events]);
  const isFiltering = !!(search || city || genre);
  const filtered    = useMemo(() => events.filter((e) => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchCity   = !city   || e.city?.toLowerCase().includes(city.toLowerCase());
    return matchSearch && matchCity;
  }), [events, search, city]);


  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* ══════════════════════════════════════════════
          HERO — Editorial tipo cartaz de show
          ══════════════════════════════════════════════ */}
      <div
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ minHeight: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Fundo suave — glow CSS (sem imagem, zero download / LCP rápido) */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            zIndex: 0,
            background:
              'radial-gradient(80% 55% at 50% 0%, rgba(164,232,11,0.06) 0%, transparent 60%), ' +
              'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.96) 80%, var(--bg) 100%)',
          }}
        />

        {/* Linhas de grade diagonais — substitui aurora */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 0, opacity: 0.04 }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#FFFFFF" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* ── Conteúdo do hero ───────────────────────── */}
        <div
          className="relative flex-1 flex flex-col justify-start max-w-7xl mx-auto w-full px-6 pb-12 pt-8"
          style={{ zIndex: 2 }}
        >
          {/* Stamp — pílula com borda, igual às artes */}
          <div className="hero-stamp stamp mb-6">
            Plataforma Oficial de Ingressos
            <span style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.58rem',
              color: 'var(--t3)',
              marginLeft: 16,
            }}>
              {!loading && events.length > 0 ? `${events.length} eventos` : '—'}
            </span>
          </div>

          {/* Título — bold geométrico, identidade das artes */}
          <div className="overflow-hidden" style={{ marginBottom: 28 }}>
            <h1 style={{ margin: 0 }}>
              <span
                className="hero-line1"
                style={{
                  display: 'block',
                  fontFamily: '"Clash Display", sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.02em',
                  color: 'var(--t1)',
                }}
              >
                Seus ingressos,
              </span>
              <span
                className="hero-line2"
                style={{
                  display: 'block',
                  fontFamily: '"Clash Display", sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.02em',
                  color: 'var(--neon)',
                }}
              >
                do jeito certo.
              </span>
            </h1>
            <p
              className="hero-line3"
              style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
                lineHeight: 1.4,
                letterSpacing: 0,
                color: 'var(--t2)',
                textTransform: 'none',
                margin: '14px 0 0',
              }}
            >
              Shows · Festas · Rodeios · Festivais · Teatro
            </p>
          </div>

          {/* Linha horizontal */}
          <div style={{ height: '1px', background: 'var(--bd-md)', marginBottom: 24 }} aria-hidden="true" />

          {/* Busca + números na mesma linha */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">

            {/* Search bar brutalista */}
            <div
              className="hero-search flex items-center gap-0 flex-1 w-full max-w-2xl"
              style={{
                background: 'var(--s1)',
                border: '1px solid var(--bd-md)',
                borderRadius: 4,
              }}
            >
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" style={{ color: 'var(--t3)' }} aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="m16.5 16.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  type="search"
                  placeholder="Buscar evento, artista ou local..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 text-sm"
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--t1)',
                    fontFamily: '"Inter", sans-serif',
                  }}
                />
              </div>
              <div style={{ width: '1px', height: '32px', background: 'var(--bd)', flexShrink: 0 }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-32 px-4 py-3.5 text-sm"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--t1)',
                  fontFamily: '"Inter", sans-serif',
                }}
              />
            </div>

            {/* Números estilo poster */}
          </div>
        </div>

        {/* Marquee de eventos — container sempre reserva altura (evita CLS) */}
        {(loading || events.length > 3) && (
          <div className="marquee relative" style={{
            zIndex: 2,
            borderTop: '1px solid var(--bd)',
            background: 'rgba(10,10,13,0.85)',
            padding: '10px 0',
            minHeight: 41,
          }}>
            {!loading && events.length > 3 && (
            <div className="marquee-track">
              {[...events, ...events].map((e, i) => (
                <span key={i} className="inline-flex items-center gap-3 px-6">
                  <span style={{
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '0.55rem',
                    color: 'var(--neon)',
                    letterSpacing: '0.1em',
                  }} aria-hidden="true">
                    ◆
                  </span>
                  <span style={{
                    fontFamily: '"Clash Display", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--t1)',
                    whiteSpace: 'nowrap',
                  }}>
                    {e.title}
                  </span>
                  {e.city && (
                    <span style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: '0.6rem',
                      color: 'var(--t3)',
                      whiteSpace: 'nowrap',
                    }}>
                      {e.city}
                    </span>
                  )}
                </span>
              ))}
            </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          CONTEÚDO PRINCIPAL
          ══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">


        {/* ── Destaques (skeleton durante loading — reserva a altura, evita CLS) ── */}
        {loading && (
          <section className="mb-16" aria-hidden="true">
            <div className="section-hd flex items-center gap-4 mb-7">
              <span className="stamp">Em Destaque</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 8 }} />
              ))}
            </div>
          </section>
        )}

        {/* ── Destaques ─────────────────────────────── */}
        {featured.length > 0 && !isFiltering && (
          <section className="mb-16" aria-label="Eventos em destaque">
            <div className="section-hd flex items-center gap-4 mb-7">
              <span className="stamp">Em Destaque</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} aria-hidden="true" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featured.slice(0, 5).map((e, i) => (
                <div key={e.id} className="card-scroll-wrap">
                  <EventCard event={e} index={i} priority={i === 0} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Todos os eventos ──────────────────────── */}
        <section aria-label={isFiltering ? 'Resultados' : 'Todos os Eventos'}>
          <div className="section-hd flex items-center gap-4 mb-7">
            <span className="stamp">{isFiltering ? 'Resultados' : 'Todos os Eventos'}</span>
            {!loading && (
              <span style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '0.62rem',
                color: 'var(--t3)',
              }}>
                {filtered.length}
              </span>
            )}
            <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} aria-hidden="true" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24" style={{
              border: '1px solid var(--bd)',
              borderRadius: 8,
              background: 'var(--s1)',
            }}>
              <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center"
                style={{ border: '1px solid var(--bd-md)', borderRadius: 8 }}>
                <IconTicket size={26} style={{ color: 'var(--t3)' }} />
              </div>
              <p style={{
                fontFamily: '"Clash Display", sans-serif',
                fontWeight: 700,
                fontSize: '1.2rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--t2)',
              }}>
                Nenhum evento encontrado
              </p>
              <p style={{ color: 'var(--t3)', fontSize: '0.85rem', marginTop: 6, fontFamily: '"Space Mono", monospace' }}>
                Tente outros termos ou limpe os filtros
              </p>
              {isFiltering && (
                <button
                  onClick={() => { setSearch(''); setCity(''); setGenre(''); loadEvents(); }}
                  className="btn-secondary mt-6"
                  style={{ padding: '10px 28px', fontSize: '0.82rem' }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((e, i) => (
                  <div key={e.id} className="card-scroll-wrap">
                    <EventCard event={e} index={i} priority={i === 0 && !(featured.length > 0 && !isFiltering)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── CTA Final — estilo ingresso picotado ──── */}
        {!loading && events.length > 0 && (
          <div className="mt-24 ticket-edge" style={{ overflow: 'visible' }}>
            <div
              className="cta-inner"
              style={{
                border: '1px solid var(--bd-md)',
                borderRadius: 8,
                padding: '48px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--s1)',
              }}
            >
              {/* Linha neon no topo do CTA */}
              <div aria-hidden="true" style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--neon), var(--ember), transparent)',
              }} />

              {/* Grade de fundo */}
              <div aria-hidden="true" className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <div className="relative">
                <div className="stamp mb-4" style={{ justifyContent: 'center' }}>
                  Acesso total
                </div>
                <h2 style={{
                  fontFamily: '"Clash Display", sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(1.7rem, 3.6vw, 2.6rem)',
                  letterSpacing: '-0.02em',
                  textTransform: 'none',
                  color: 'var(--t1)',
                  lineHeight: 1.08,
                  marginBottom: 12,
                }}>
                  Crie sua conta e compre<br />
                  <span style={{ color: 'var(--neon)' }}>com mais facilidade</span>
                </h2>
                <p style={{
                  color: 'var(--t2)',
                  fontSize: '0.9rem',
                  marginBottom: 28,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  PIX, cartão e parcelamento. Ingresso no e-mail em minutos.
                </p>
                <a href="/cadastro" className="btn-primary" style={{ padding: '13px 40px', fontSize: '0.9rem' }}>
                  Criar conta grátis
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
