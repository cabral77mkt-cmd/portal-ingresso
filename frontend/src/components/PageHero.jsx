// Cabeçalho padrão das páginas institucionais — stamp + título Clash Display + subtítulo
export default function PageHero({ stamp, title, subtitle }) {
  return (
    <header className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-14 pb-10">
      <span className="stamp mb-6">{stamp}</span>
      <h1
        style={{
          fontFamily: '"Clash Display", sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(2.4rem, 6.5vw, 4.4rem)',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: 'var(--t1)',
          marginTop: 4,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-5 max-w-2xl"
          style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '1.05rem', lineHeight: 1.6 }}
        >
          {subtitle}
        </p>
      )}
      <div className="rule-neon mt-9" />
    </header>
  );
}
