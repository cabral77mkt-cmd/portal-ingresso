import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { validarCPF } from '../services/gticket.js';
import { IconCheck } from '../components/Icons.jsx';

const GENEROS = [
  { value: '', label: 'Selecione o gênero' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
];

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/minha-conta';
  const [form, setForm] = useState({
    nome: '', email: '', email2: '', senha: '', senha2: '',
    cpf: '', fone: '', nascimento: '', sexo: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
    newsletter: 'N', lgpd: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

  function validate() {
    if (!form.nome.trim()) return 'Informe o nome completo';
    if (!form.email.includes('@')) return 'E-mail inválido';
    if (form.email !== form.email2) return 'Os e-mails não coincidem';
    if (form.senha.length < 6 || form.senha.length > 10) return 'A senha deve ter entre 6 e 10 caracteres';
    if (!/[A-Z]/.test(form.senha)) return 'A senha deve ter pelo menos uma letra maiúscula';
    if (!/[a-z]/.test(form.senha)) return 'A senha deve ter pelo menos uma letra minúscula';
    if (!/[0-9]/.test(form.senha)) return 'A senha deve ter pelo menos um número';
    if (!/[$*@]/.test(form.senha)) return 'A senha deve ter pelo menos um caractere especial ($, * ou @)';
    if (form.senha !== form.senha2) return 'As senhas não coincidem';
    if (!validarCPF(form.cpf)) return 'CPF inválido';
    const phoneDigits = form.fone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return 'Telefone inválido (DDD + número)';
    if (!form.nascimento) return 'Informe a data de nascimento';
    if (!form.cep.replace(/\D/g, '') || form.cep.replace(/\D/g, '').length < 8) return 'CEP inválido';
    if (!form.endereco.trim()) return 'Informe o endereço';
    if (!form.numero.trim()) return 'Informe o número do endereço';
    if (!form.bairro.trim()) return 'Informe o bairro';
    if (!form.cidade.trim()) return 'Informe a cidade';
    if (!form.uf.trim() || form.uf.length !== 2) return 'Informe o estado (UF)';
    if (!form.lgpd) return 'Você precisa aceitar os termos de uso e política de privacidade';
    return null;
  }

  async function buscarCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((p) => ({
          ...p,
          endereco: data.logradouro || p.endereco,
          bairro: data.bairro || p.bairro,
          cidade: data.localidade || p.cidade,
          uf: data.uf || p.uf,
        }));
      }
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError('');
    setLoading(true);
    try {
      const phoneDigits = form.fone.replace(/\D/g, '');
      const ddd = phoneDigits.slice(0, 2);
      const tel = phoneDigits.slice(2);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          cpf: form.cpf.replace(/\D/g, ''),
          sexo: form.sexo || 'O',
          nascimento: form.nascimento,
          cep: form.cep.replace(/\D/g, ''),
          endereco: form.endereco,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          uf: form.uf.toUpperCase(),
          ddd,
          tel,
          newsletter: form.newsletter,
          lgpd: 'S',
        }),
      });
      const data = await res.json();

      if (!res.ok || data?.error) {
        setError(data?.error || data?.statusMsg || 'Erro ao criar conta. Verifique os dados.');
        return;
      }

      const user = {
        usu_id: data?.usu_id || data?.id,
        nome: form.nome,
        email: form.email,
        cpf: form.cpf.replace(/\D/g, ''),
        fone: form.fone.replace(/\D/g, ''),
      };
      localStorage.setItem('tickfy_user', JSON.stringify(user));
      window.dispatchEvent(new Event('tickfy_auth_changed'));
      setSuccess(true);
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <IconCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-3" style={{ textDecoration: 'none' }}>
            <img src="/logo.png" alt="Portal do Ingresso" width="117" height="32" decoding="async" style={{ height: 32, width: 'auto', aspectRatio: '11 / 3' }} />
          </Link>
          <p className="text-muted mt-2">Crie sua conta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Dados de acesso */}
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: 'rgba(164,232,11,0.8)' }}>Dados de acesso</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-sm block mb-1">Nome completo *</label>
                  <input placeholder="Seu nome completo" value={form.nome} onChange={set('nome')} className="input w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">E-mail *</label>
                  <input type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} className="input w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Confirmar e-mail *</label>
                  <input type="email" placeholder="seu@email.com" value={form.email2} onChange={set('email2')} className="input w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Senha *</label>
                  <input type="password" placeholder="Ex: Teste@1" value={form.senha} onChange={set('senha')} className="input w-full" required />
                  <p className="text-gray-600 text-xs mt-1">Maiúscula, minúscula, número e um de: $ * @  (6–10 caracteres)</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Confirmar senha *</label>
                  <input type="password" placeholder="Confirme a senha" value={form.senha2} onChange={set('senha2')} className="input w-full" required />
                </div>
              </div>
            </div>

            {/* Dados pessoais */}
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: 'rgba(164,232,11,0.8)' }}>Dados pessoais</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">CPF *</label>
                  <input
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                      setForm((p) => ({ ...p, cpf: v }));
                    }}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Telefone (com DDD) *</label>
                  <input
                    placeholder="(00) 90000-0000"
                    value={form.fone}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      v = v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
                      setForm((p) => ({ ...p, fone: v }));
                    }}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Data de nascimento *</label>
                  <input type="date" value={form.nascimento} onChange={set('nascimento')} className="input w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Gênero</label>
                  <select value={form.sexo} onChange={set('sexo')} className="input w-full">
                    {GENEROS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: 'rgba(164,232,11,0.8)' }}>Endereço</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">CEP *</label>
                  <input
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
                      v = v.replace(/(\d{5})(\d)/, '$1-$2');
                      setForm((p) => ({ ...p, cep: v }));
                      if (v.replace(/\D/g, '').length === 8) buscarCep(v);
                    }}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Endereço *</label>
                  <input placeholder="Rua, Avenida..." value={form.endereco} onChange={set('endereco')} className="input w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Número *</label>
                  <input placeholder="Nº" value={form.numero} onChange={set('numero')} className="input w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Complemento</label>
                  <input placeholder="Apto, Bloco... (opcional)" value={form.complemento} onChange={set('complemento')} className="input w-full" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Bairro *</label>
                  <input placeholder="Bairro" value={form.bairro} onChange={set('bairro')} className="input w-full" required />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm block mb-1">Cidade *</label>
                    <input placeholder="Cidade" value={form.cidade} onChange={set('cidade')} className="input w-full" required />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">UF *</label>
                    <input placeholder="SP" value={form.uf} onChange={(e) => setForm((p) => ({ ...p, uf: e.target.value.toUpperCase() }))} className="input w-full" maxLength={2} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferências e termos */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.newsletter === 'S'}
                  onChange={(e) => setForm((p) => ({ ...p, newsletter: e.target.checked ? 'S' : 'N' }))}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-gray-400 text-sm">Quero receber novidades e promoções por e-mail</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.lgpd}
                  onChange={(e) => setForm((p) => ({ ...p, lgpd: e.target.checked }))}
                  className="mt-0.5 accent-primary"
                  required
                />
                <span className="text-gray-400 text-sm">
                  Li e aceito os{' '}
                  <span className="text-primary">Termos de Uso</span>{' '}
                  e a{' '}
                  <span className="text-primary">Política de Privacidade</span>{' '}
                  *
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50" style={{ padding: '14px' }}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
