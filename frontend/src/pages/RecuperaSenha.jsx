import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCheck } from '../components/Icons.jsx';

export default function RecuperaSenha() {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Não foi possível processar a solicitação.');
        return;
      }
      setSent(true);
    } catch {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="Portal do Ingresso" width="117" height="32" decoding="async" style={{ height: 32, width: 'auto' }} />
          </Link>
          <p className="text-muted mt-3">Recuperar senha</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <IconCheck size={28} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">E-mail enviado!</h3>
              <p className="text-gray-400 text-sm">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-block w-full text-center">
                Voltar ao Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm">
                Informe seu e-mail ou CPF cadastrado e enviaremos instruções para redefinir sua senha.
              </p>
              <div>
                <label className="text-gray-400 text-sm block mb-1">E-mail ou CPF</label>
                <input
                  type="text"
                  placeholder="seu@email.com ou 000.000.000-00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !value.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Lembrou a senha?{' '}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          {' · '}
          <Link to="/cadastro" className="text-primary hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
