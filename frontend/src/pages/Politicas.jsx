import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';

const secoes = [
  {
    id: 'compra',
    title: '1. Política de compra',
    paras: [
      'Ao finalizar uma compra no Portal do Ingresso, você concorda com os termos do evento e com estas políticas. Os preços, lotes, setores e taxas exibidos são os cadastrados pelo produtor responsável pelo evento.',
      'A compra só é confirmada após a aprovação do pagamento. Enquanto o pagamento estiver em análise, o ingresso ainda não é válido para acesso.',
    ],
  },
  {
    id: 'pagamento',
    title: '2. Pagamento e entrega',
    paras: [
      'Aceitamos PIX e cartão de crédito, conforme as opções liberadas para cada evento. O PIX costuma ter aprovação imediata.',
      'Após a aprovação, o ingresso é enviado automaticamente para o e-mail informado na compra e fica disponível na área "Minha Conta".',
    ],
  },
  {
    id: 'cancelamento',
    title: '3. Cancelamento e reembolso',
    paras: [
      'Para compras feitas pela internet, você tem direito de arrependimento dentro do prazo previsto no Código de Defesa do Consumidor, desde que dentro do período permitido em relação à data do evento.',
      'Cancelamentos por parte do produtor (adiamento ou cancelamento do evento) seguem as regras comunicadas pelo organizador, com reembolso conforme a legislação aplicável. Para solicitar, utilize o "Fale conosco".',
    ],
  },
  {
    id: 'meia',
    title: '4. Meia-entrada e benefícios',
    paras: [
      'A meia-entrada e demais benefícios seguem as regras de cada evento e a legislação vigente. É obrigatório apresentar, no acesso ao evento, o documento que comprova o direito ao benefício.',
      'A não comprovação pode impedir o acesso ou exigir a complementação do valor, a critério do produtor.',
    ],
  },
  {
    id: 'privacidade',
    title: '5. Privacidade e proteção de dados (LGPD)',
    paras: [
      'Tratamos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD). Coletamos apenas as informações necessárias para processar a compra, emitir o ingresso e dar suporte.',
      'Seus dados não são vendidos. Eles podem ser compartilhados com o produtor do evento e com os meios de pagamento estritamente para viabilizar a sua compra. Você pode solicitar acesso ou exclusão dos seus dados pelo "Fale conosco".',
    ],
  },
  {
    id: 'uso',
    title: '6. Uso do ingresso',
    paras: [
      'Cada ingresso é válido para um único acesso e pode conter QR Code individual. A reprodução ou revenda não autorizada invalida o ingresso. Em eventos com ingresso nominal, o acesso é vinculado ao nome informado na nominação.',
    ],
  },
];

export default function Politicas() {
  return (
    <div className="pb-24">
      <PageHero
        stamp="Transparência"
        title="Nossas políticas"
        subtitle="As regras que tornam a sua compra segura e justa. Leia com atenção antes de finalizar um pedido."
      />

      <div className="max-w-4xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10">

          {/* Índice lateral */}
          <nav className="hidden lg:block sticky top-24 self-start">
            <p className="mono-label mb-4" style={{ color: 'var(--neon)' }}>// Seções</p>
            <ul className="space-y-2.5">
              {secoes.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="footer-link transition-colors" style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                    {s.title.replace(/^\d+\.\s/, '')}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Conteúdo */}
          <div className="space-y-12">
            {secoes.map((s) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: 96 }}>
                <h2 style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 600, fontSize: '1.45rem', color: 'var(--t1)', marginBottom: 14, letterSpacing: '-0.01em' }}>
                  {s.title}
                </h2>
                <div className="space-y-4">
                  {s.paras.map((p, i) => (
                    <p key={i} style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.98rem', lineHeight: 1.7 }}>
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <p className="pt-2" style={{ color: 'var(--t3)', fontFamily: '"Space Mono", monospace', fontSize: '0.72rem' }}>
              Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
            </p>

            <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 24 }}>
              <p style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem' }}>
                Ficou com alguma dúvida sobre as políticas?{' '}
                <Link to="/fale-conosco" style={{ color: 'var(--neon)' }}>Fale com a gente</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
