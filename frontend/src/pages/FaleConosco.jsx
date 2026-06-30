import { useState } from 'react';
import PageHero from '../components/PageHero.jsx';
import { IconBolt, IconShield, IconCheck } from '../components/Icons.jsx';

const CONTATO_EMAIL = 'contato@portaldoingresso.com.br';

const canais = [
  { icon: IconBolt, label: 'E-mail', value: CONTATO_EMAIL, href: `mailto:${CONTATO_EMAIL}` },
  { icon: IconShield, label: 'Atendimento', value: 'Seg a sex · 9h às 18h', href: null },
];

export default function FaleConosco() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    // Abre o cliente de e-mail do usuário com a mensagem pré-preenchida
    const corpo = `Nome: ${form.nome}\nE-mail: ${form.email}\n\n${form.mensagem}`;
    const url = `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent(form.assunto || 'Contato pelo site')}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
    setSent(true);
  }

  return (
    <div className="pb-24">
      <PageHero
        stamp="Fale conosco"
        title="A gente te responde"
        subtitle="Dúvida sobre um pedido, problema com o ingresso ou só quer falar com a gente? É só mandar."
      />

      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">

          {/* Formulário */}
          <div className="card p-7 sm:p-9" style={{ borderRadius: 18 }}>
            {sent ? (
              <div className="text-center py-10">
                <div className="flex items-center justify-center mx-auto mb-5" style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--neon-dim)', border: '1px solid var(--bd-n)', color: 'var(--neon)' }}>
                  <IconCheck size={26} />
                </div>
                <h2 style={{ fontFamily: '"Clash Display", sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--t1)' }}>
                  Mensagem pronta!
                </h2>
                <p className="mt-3 max-w-sm mx-auto" style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif' }}>
                  Abrimos seu aplicativo de e-mail com a mensagem preenchida. Se não abriu, escreva
                  direto para <a href={`mailto:${CONTATO_EMAIL}`} style={{ color: 'var(--neon)' }}>{CONTATO_EMAIL}</a>.
                </p>
                <button onClick={() => setSent(false)} className="btn-secondary mt-7">Enviar outra</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-muted text-sm block mb-1.5">Seu nome</label>
                    <input className="input" value={form.nome} onChange={set('nome')} placeholder="Como te chamamos?" required />
                  </div>
                  <div>
                    <label className="text-muted text-sm block mb-1.5">Seu e-mail</label>
                    <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="seu@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="text-muted text-sm block mb-1.5">Assunto</label>
                  <input className="input" value={form.assunto} onChange={set('assunto')} placeholder="Sobre o que é?" required />
                </div>
                <div>
                  <label className="text-muted text-sm block mb-1.5">Mensagem</label>
                  <textarea className="input" rows={5} value={form.mensagem} onChange={set('mensagem')} placeholder="Conte pra gente o que aconteceu..." required style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" className="btn-primary w-full">Enviar mensagem</button>
              </form>
            )}
          </div>

          {/* Canais */}
          <aside className="space-y-4">
            {canais.map(({ icon: Icon, label, value, href }) => {
              const inner = (
                <div className="card p-5 flex items-start gap-4" style={{ borderRadius: 14 }}>
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--neon-dim)', border: '1px solid var(--bd-n)', color: 'var(--neon)' }}>
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="mono-label" style={{ color: 'var(--t3)' }}>{label}</p>
                    <p className="mt-1 break-words" style={{ color: 'var(--t1)', fontFamily: 'Inter, sans-serif', fontSize: '0.92rem', fontWeight: 500 }}>
                      {value}
                    </p>
                  </div>
                </div>
              );
              return href ? (
                <a key={label} href={href} className="block group" style={{ textDecoration: 'none' }}>{inner}</a>
              ) : (
                <div key={label}>{inner}</div>
              );
            })}

            <div className="px-5 py-4" style={{ background: 'var(--neon-dim)', border: '1px solid var(--bd-n)', borderRadius: 14 }}>
              <p style={{ color: 'var(--t2)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', lineHeight: 1.55 }}>
                Dúvida rápida? Talvez já esteja respondida nas{' '}
                <a href="/duvidas" style={{ color: 'var(--neon)' }}>Dúvidas frequentes</a>.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
