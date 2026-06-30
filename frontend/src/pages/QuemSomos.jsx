import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import { IconShield, IconBolt, IconTicket, IconCheck } from '../components/Icons.jsx';

const valores = [
  {
    icon: IconShield,
    title: 'Compra segura',
    text: 'Pagamento processado por gateways homologados e dados protegidos conforme a LGPD. Sem intermediários, sem surpresa.',
  },
  {
    icon: IconBolt,
    title: 'Aprovação rápida',
    text: 'PIX com confirmação imediata e cartão de crédito. Seu ingresso chega direto no e-mail assim que o pagamento é aprovado.',
  },
  {
    icon: IconTicket,
    title: 'Acesso oficial',
    text: 'Somos a vitrine oficial dos eventos que vendemos. O que você vê aqui é o que o produtor cadastrou — preço, lote e setor reais.',
  },
];

const numeros = [
  { n: 'PIX', label: 'e cartão de crédito' },
  { n: '100%', label: 'Ingresso no e-mail' },
  { n: '0', label: 'Intermediários' },
];

export default function QuemSomos() {
  return (
    <div className="pb-24">
      <PageHero
        stamp="Quem somos"
        title="O Portal do Ingresso"
        subtitle="Somos a plataforma oficial de ingressos para os eventos que movem a cidade — shows, festas, rodeios, festivais e teatro. Conectamos quem produz a quem quer estar lá, com tecnologia confiável e compra descomplicada."
      />

      <div className="max-w-5xl mx-auto px-5 sm:px-6">

        {/* Manifesto */}
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <p className="mono-label md:col-span-1" style={{ color: 'var(--neon)' }}>// Nossa missão</p>
          <div className="md:col-span-2 space-y-5" style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '1.05rem', lineHeight: 1.7 }}>
            <p>
              O Portal do Ingresso nasceu para tirar o atrito da compra de ingresso. Nada de fila,
              cambista ou link duvidoso: você encontra o evento, escolhe o setor, paga no PIX e
              recebe o ingresso na hora.
            </p>
            <p>
              Trabalhamos lado a lado com os produtores. Cada evento é gerido por quem o realiza —
              nós cuidamos da vitrine, do checkout e da experiência de quem compra. Simples assim.
            </p>
          </div>
        </section>

        {/* Valores */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="stamp">No que acreditamos</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {valores.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-7" style={{ borderRadius: 14 }}>
                <div
                  className="flex items-center justify-center mb-5"
                  style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--neon-dim)', border: '1px solid var(--bd-n)', color: 'var(--neon)' }}
                >
                  <Icon size={22} />
                </div>
                <h3 style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 600, fontSize: '1.25rem', color: 'var(--t1)', marginBottom: 10 }}>
                  {title}
                </h3>
                <p style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Números */}
        <section className="mb-20">
          <div className="grid grid-cols-3 gap-4">
            {numeros.map(({ n, label }) => (
              <div key={label} className="text-center py-8 px-3" style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14 }}>
                <div style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 700, fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', color: 'var(--neon)', lineHeight: 1 }}>
                  {n}
                </div>
                <div className="mt-2" style={{ color: 'var(--t2)', fontFamily: '"Space Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          className="relative overflow-hidden text-center px-6 py-14"
          style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 22 }}
        >
          <div aria-hidden="true" className="absolute -top-px left-1/2 -translate-x-1/2" style={{ width: '55%', height: 1, background: 'linear-gradient(90deg, transparent, var(--neon-mid), transparent)' }} />
          <h2 style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 700, fontSize: 'clamp(1.6rem, 4.5vw, 2.6rem)', letterSpacing: '-0.02em', color: 'var(--t1)' }}>
            Pronto pra próxima noite?
          </h2>
          <p className="mt-3 mb-8 max-w-md mx-auto" style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}>
            Os melhores eventos estão a um PIX de distância.
          </p>
          <Link to="/" className="btn-primary">
            Ver eventos
          </Link>
        </section>
      </div>
    </div>
  );
}
