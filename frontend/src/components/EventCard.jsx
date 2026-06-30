import { memo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPin, IconTicket } from './Icons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [datePart] = dateStr.split('T');
  const [year, month, day] = (datePart || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .toUpperCase().replace(/\./g, '');
}

function formatWeekday(dateStr) {
  if (!dateStr) return '';
  const [datePart] = dateStr.split('T');
  const [year, month, day] = (datePart || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day)
    .toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const t = dateStr.split('T')[1];
  return t ? t.slice(0, 5) : '';
}

// Barcode visual — decorativo
const Barcode = ({ scale = 1 }) => {
  const bars = [3,5,2,4,1,3,2,5,1,4,2,3,4,1,5,2,3,1,4,2,3,2,5];
  return (
    <div
      className="flex items-end"
      aria-hidden="true"
      style={{ gap: 1.5, height: 14 * scale }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: i % 5 === 0 ? 3 : 2,
            height: h * 1.8 * scale,
            background: 'rgba(255,255,255,0.16)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
};

// Linha perforada — dashes SVG
const PerfoLine = ({ vertical = true, style }) => (
  <svg
    aria-hidden="true"
    style={{
      display: 'block',
      flexShrink: 0,
      ...(vertical
        ? { width: 1, alignSelf: 'stretch' }
        : { width: '100%', height: 1 }),
      ...style,
    }}
    preserveAspectRatio="none"
  >
    {vertical ? (
      <line
        x1="0.5" y1="0" x2="0.5" y2="100%"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
    ) : (
      <line
        x1="0" y1="0.5" x2="100%" y2="0.5"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeDasharray="4 8"
      />
    )}
  </svg>
);

// variant: 'default' | 'hero'
const EventCard = memo(function EventCard({ event, index = 0, variant = 'default' }) {
  const navigate   = useNavigate();
  const cardRef    = useRef(null);
  const id         = event.gticket_id || event.id;
  const date       = formatDate(event.date);
  const weekday    = formatWeekday(event.date);
  const time       = formatTime(event.date);
  const local      = [event.city, event.state].filter(Boolean).join(' / ');
  const isHero     = variant === 'hero';
  const indexLabel = String(index + 1).padStart(2, '0');

  // Código do ingresso — últimos 5 chars do ID + índice
  const rawId = String(id || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const ticketCode = `TKT·${rawId}${String(index).padStart(2, '0')}`;

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.setProperty('--shineX', `${(x + 0.5) * 100}%`);
    card.style.setProperty('--shineY', `${(y + 0.5) * 100}%`);
  }, []);

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      aria-label={`Ingresso: ${event.title}${local ? ` em ${local}` : ''}`}
      className="group card card-3d"
      style={{ borderRadius: 6, display: 'flex', flexDirection: 'column' }}
      onClick={() => navigate(`/eventos/${id}`)}
      onMouseMove={handleMouseMove}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/eventos/${id}`); }}
    >
      <div className="card-shine" aria-hidden="true" />

      <div
        className="flex flex-col sm:flex-row"
        style={{ flex: 1, minHeight: isHero ? 220 : 160 }}
      >
        {/* ════════════════════════════════════════════
            FACE DO INGRESSO — imagem / arte (esquerda)
            ════════════════════════════════════════════ */}
        <div
          className={isHero ? 'card-h-img-hero' : 'card-h-img'}
          style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}
        >
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              width="680"
              height="480"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--s2), var(--s3))' }}
            >
              <IconTicket size={isHero ? 44 : 32} style={{ color: 'rgba(255,255,255,0.05)' }} />
            </div>
          )}

          {/* Gradiente overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(10,10,10,0.25) 0%, transparent 40%), linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 55%)',
            }}
          />

          {/* Data — canto inferior esquerdo */}
          {(date || weekday) && (
            <div className="absolute bottom-0 left-0 p-3" style={{ lineHeight: 1 }}>
              {weekday && (
                <div style={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.55)',
                  marginBottom: 3,
                }}>
                  {weekday}{time ? ` · ${time}` : ''}
                </div>
              )}
              {date && (
                <div style={{
                  fontFamily: '"Clash Display", sans-serif',
                  fontWeight: 900,
                  fontSize: isHero ? '1.35rem' : '1.1rem',
                  letterSpacing: '0.02em',
                  color: 'var(--neon)',
                  lineHeight: 1,
                }}>
                  {date}
                </div>
              )}
            </div>
          )}

          {/* Badge DESTAQUE */}
          {event.featured && (
            <div className="absolute top-0 right-0">
              <span style={{
                display: 'block',
                background: 'var(--neon)',
                color: '#000',
                fontFamily: '"Clash Display", sans-serif',
                fontWeight: 900,
                fontSize: '0.58rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '4px 10px 4px 14px',
                clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)',
              }}>
                Destaque
              </span>
            </div>
          )}

          {/* Linha neon esquerda no hover */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block"
            style={{ background: 'var(--neon)', boxShadow: '0 0 12px 2px rgba(164,232,11,0.5)' }}
          />

          {/* Esgotado */}
          {event.status === 'sold_out' && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(10,10,10,0.78)' }}
            >
              <span style={{
                fontFamily: '"Clash Display", sans-serif',
                fontWeight: 900, fontSize: '1.8rem', letterSpacing: '5px',
                color: 'rgba(255,255,255,0.7)',
                borderTop: '1.5px solid rgba(255,255,255,0.15)',
                borderBottom: '1.5px solid rgba(255,255,255,0.15)',
                padding: '4px 0',
              }}>
                ESGOTADO
              </span>
            </div>
          )}
        </div>

        {/* ════════════════════════════
            LINHA DE PERFORAÇÃO
            desktop: vertical | mobile: horizontal
            ════════════════════════════ */}

        {/* Mobile: linha horizontal entre face e canhoto */}
        <div
          aria-hidden="true"
          className="sm:hidden flex items-center px-4"
          style={{ height: 18 }}
        >
          <PerfoLine vertical={false} />
        </div>

        {/* Desktop: coluna com perforação vertical + semicírculos */}
        <div
          aria-hidden="true"
          className="hidden sm:flex flex-col items-center justify-between flex-shrink-0 relative"
          style={{ width: 22 }}
        >
          {/* Semicírculo superior */}
          <div style={{
            width: 14,
            height: 8,
            borderRadius: '0 0 8px 8px',
            background: 'var(--bg)',
            flexShrink: 0,
            marginTop: -1,
            zIndex: 2,
          }} />

          {/* Linha pontilhada vertical */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', width: '100%', justifyContent: 'center', padding: '2px 0' }}>
            <PerfoLine vertical />
          </div>

          {/* Semicírculo inferior */}
          <div style={{
            width: 14,
            height: 8,
            borderRadius: '8px 8px 0 0',
            background: 'var(--bg)',
            flexShrink: 0,
            marginBottom: -1,
            zIndex: 2,
          }} />
        </div>

        {/* ════════════════════════════════════════════
            CANHOTO — stub de informações (direita)
            ════════════════════════════════════════════ */}
        <div
          className="flex flex-col flex-1 relative overflow-hidden"
          style={{
            minHeight: isHero ? 0 : 130,
            background: 'linear-gradient(135deg, rgba(14,12,8,0.4) 0%, transparent 100%)',
          }}
        >
          {/* Watermark "INGRESSO" rotacionado 90° */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 2,
              top: '50%',
              transform: 'translateY(-50%) rotate(90deg)',
              fontFamily: '"Clash Display", sans-serif',
              fontWeight: 900,
              fontSize: '0.55rem',
              letterSpacing: '0.38em',
              color: 'rgba(164,232,11,0.065)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            INGRESSO ◆ PORTAL ◆ INGRESSO
          </div>

          {/* Número de índice — watermark grande */}
          <div
            aria-hidden="true"
            className="group-hover:!text-[rgba(164,232,11,0.055)]"
            style={{
              position: 'absolute',
              right: isHero ? 20 : 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: '"Clash Display", sans-serif',
              fontWeight: 900,
              fontSize: isHero ? 'clamp(5rem, 10vw, 8rem)' : 'clamp(3.5rem, 6vw, 5rem)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'rgba(255,255,255,0.04)',
              userSelect: 'none',
              pointerEvents: 'none',
              transition: 'color 0.3s',
            }}
          >
            {indexLabel}
          </div>

          {/* ── Conteúdo do canhoto ── */}
          <div className="flex flex-col justify-between flex-1 p-4 sm:p-5">

            {/* TOPO: stamp + título */}
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span style={{
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '0.52rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--neon)',
                  opacity: 0.7,
                }}>
                  // {indexLabel}
                </span>
                {event.city && (
                  <>
                    <span aria-hidden="true" style={{ color: 'var(--bd-md)', fontSize: '0.5rem' }}>—</span>
                    <span style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: '0.52rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--t3)',
                    }}>
                      {event.city}
                    </span>
                  </>
                )}
              </div>

              <h3
                className="line-clamp-2 sm:line-clamp-3 group-hover:text-neon"
                style={{
                  fontFamily: '"Clash Display", sans-serif',
                  fontWeight: 900,
                  fontSize: isHero
                    ? 'clamp(1.5rem, 4vw, 2.4rem)'
                    : 'clamp(1.05rem, 2.5vw, 1.5rem)',
                  lineHeight: 0.96,
                  letterSpacing: '0.01em',
                  textTransform: 'uppercase',
                  color: 'var(--t1)',
                  transition: 'color 0.25s',
                }}
              >
                {event.title}
              </h3>
            </div>

            {/* RODAPÉ: local + barcode + código + "Ver →" */}
            <div>
              {/* Separador pontilhado horizontal — divide conteúdo do rodapé */}
              <PerfoLine vertical={false} style={{ marginBottom: 8 }} />

              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {/* Local */}
                  {local && (
                    <div className="flex items-center gap-1.5 truncate">
                      <IconPin size={9} style={{ color: 'var(--t3)', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: '0.54rem',
                        letterSpacing: '0.04em',
                        color: 'var(--t3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {event.location ? `${event.location} / ` : ''}{local}
                      </span>
                    </div>
                  )}

                  {/* Código + barcode */}
                  <div className="flex items-center gap-2.5">
                    <span style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: '0.42rem',
                      letterSpacing: '0.15em',
                      color: 'rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}>
                      {ticketCode}
                    </span>
                    <Barcode scale={isHero ? 1.15 : 1} />
                  </div>
                </div>

                {/* "Ver →" aparece no hover */}
                <div
                  className="shrink-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-250"
                  style={{
                    fontFamily: '"Clash Display", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--neon)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Ver
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

export default EventCard;
