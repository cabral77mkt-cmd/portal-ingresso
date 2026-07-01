import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { gticket } from '../services/gticket.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/minha-conta';

  const [form, setForm] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await gticket.auth.login(form.email, form.senha);

      // G-ticket retorna statusId '00' ou usu_id em caso de sucesso
      const sucesso = data?.statusId === '00' || data?.usu_id || data?.id;
      if (!sucesso) {
        setError(data?.statusMsg || data?.mensagem || 'E-mail ou senha inválidos');
        return;
      }

      const user = {
        usu_id: data?.usu_id || data?.id,
        nome: data?.usu_nome || data?.nome || form.email,
        email: data?.usu_email || data?.email || form.email,
        cpf: data?.usu_cpf || data?.cpf || '',
        fone: data?.usu_fone || data?.fone || '',
      };

      localStorage.setItem('tickfy_user', JSON.stringify(user));
      window.dispatchEvent(new Event('tickfy_auth_changed'));
      navigate(from, { replace: true });
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="Portal do Ingresso" width="117" height="32" decoding="async" style={{ height: 32, width: 'auto', aspectRatio: '11 / 3' }} />
          </Link>
          <p className="text-muted mt-3">Acesse sua conta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">E-mail ou CPF</label>
              <input
                type="text"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input w-full"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.senha}
                onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                className="input w-full"
                autoComplete="current-password"
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
              disabled={loading || !form.email || !form.senha}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/recupera-senha" className="text-primary text-sm hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="text-primary hover:underline">
            Cadastrar
          </Link>
        </p>
      </div>
    </div>
  );
}
