import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';

const faq = [
  {
    q: 'Como recebo meu ingresso depois de comprar?',
    a: 'Assim que o pagamento é aprovado, o ingresso é enviado automaticamente para o e-mail cadastrado na compra. Você também encontra todos os seus ingressos em "Minha Conta".',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Aceitamos PIX (com aprovação imediata) e cartão de crédito (com parcelamento quando disponível). As opções exibidas variam conforme o evento.',
  },
  {
    q: 'O PIX é aprovado na hora?',
    a: 'Sim. Pagamentos via PIX costumam ser confirmados em segundos. Após a confirmação, o ingresso vai direto para o seu e-mail.',
  },
  {
    q: 'Preciso ter conta para comprar?',
    a: 'Sim. O cadastro é rápido e gratuito, e é necessário para garantir a segurança da compra e o envio correto do ingresso. É também por ele que você acompanha seus pedidos.',
  },
  {
    q: 'Comprei meia-entrada. Preciso comprovar?',
    a: 'Sim. A meia-entrada segue as regras de cada evento e a legislação vigente. Leve o documento que comprova o direito ao benefício (estudante, idoso, etc.) no acesso ao evento.',
  },
  {
    q: 'Posso cancelar ou pedir reembolso?',
    a: 'Cancelamentos e reembolsos seguem a política do produtor do evento e o Código de Defesa do Consumidor. Para compras à distância, o direito de arrependimento vale dentro do prazo legal. Fale com a gente pelo "Fale conosco" para abrir a solicitação.',
  },
  {
    q: 'Não recebi o e-mail com o ingresso. E agora?',
    a: 'Confira a caixa de spam e a aba de promoções. O ingresso também fica disponível em "Minha Conta". Se ainda assim não encontrar, entre em contato pelo "Fale conosco".',
  },
  {
    q: 'O ingresso é nominal?',
    a: 'Alguns eventos exigem ingresso nominal (com nome de quem vai usar). Quando for o caso, você verá a etapa de nominação após a compra, para informar os dados de cada participante.',
  },
];

function Item({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--bd)' }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left py-5 transition-colors"
        style={{ background: 'transparent', border: 'none' }}
      >
        <span style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 500, fontSize: '1.08rem', color: open ? 'var(--neon)' : 'var(--t1)', transition: 'color 0.2s' }}>
          {q}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 flex items-center justify-center transition-transform duration-300"
          style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid var(--bd-md)', color: 'var(--neon)', transform: open ? 'rotate(45deg)' : 'none' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <p className="pb-6 pr-12" style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.96rem', lineHeight: 1.65 }}>
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Duvidas() {
  const [open, setOpen] = useState(0);

  return (
    <div className="pb-24">
      <PageHero
        stamp="Central de ajuda"
        title="Dúvidas frequentes"
        subtitle="Tudo o que você precisa saber sobre comprar, receber e usar seu ingresso no Portal do Ingresso."
      />

      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <div>
          {faq.map((item, i) => (
            <Item key={i} q={item.q} a={item.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>

        <div
          className="mt-12 text-center px-6 py-10"
          style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 18 }}
        >
          <h2 style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 600, fontSize: '1.4rem', color: 'var(--t1)' }}>
            Não achou sua resposta?
          </h2>
          <p className="mt-2 mb-6" style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif' }}>
            Nossa equipe responde rapidinho.
          </p>
          <Link to="/fale-conosco" className="btn-primary">Fale conosco</Link>
        </div>
      </div>
    </div>
  );
}
