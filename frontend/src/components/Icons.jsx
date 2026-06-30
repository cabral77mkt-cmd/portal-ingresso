// Conjunto de ícones SVG — traço 1.8, na cor do texto (currentColor).
// Skill ui-ux-pro-max: nunca emoji como ícone estrutural; um só estilo de traço.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function IconCalendar({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

export function IconPin({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

// PIX — raio
export function IconBolt({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
    </svg>
  );
}

// Cartão de crédito
export function IconCard({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6 15h4" />
    </svg>
  );
}

// Boleto — recibo
export function IconReceipt({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M5 2.5h14v19l-2.3-1.5L14.5 21l-2.5-1.5L9.5 21l-2.2-1.5L5 21z" />
      <path d="M9 7.5h6M9 11.5h6M9 15.5h3" />
    </svg>
  );
}

// Ingresso
export function IconTicket({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 00-2 2v0a2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4 2 2 0 002-2z" />
      <path d="M14.5 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

// Mesa / lugar
export function IconSeat({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M6 4v7a2 2 0 002 2h8a2 2 0 002-2V4M5 13h14M7 13v7M17 13v7" />
    </svg>
  );
}

export function IconCheck({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconClock({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconShield({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconQr({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} className={`shrink-0 ${className}`}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v7M14 21h3" />
    </svg>
  );
}
