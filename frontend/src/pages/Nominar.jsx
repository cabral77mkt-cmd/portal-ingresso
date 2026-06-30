import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gticket, validarCPF } from '../services/gticket.js';
import { IconCheck } from '../components/Icons.jsx';

export default function Nominar() {
  const { pagId } = useParams();
  const navigate = useNavigate();

  const [ingressos, setIngressos] = useState([]);
  const [extraFields, setExtraFields] = useState([]);
  const [forms, setForms] = useState({});   // { ing_id: { nome, cpf, extras: {label: valor} } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => { load(); }, [pagId]);

  async function load() {
    try {
      const data = await gticket.nominal.tickets(pagId);
      const list = data?.INGRESSOS || [];
      setIngressos(list);
      // Campos extras do evento (todos os ingressos do mesmo pagamento são do mesmo evento)
      const eveCod = list[0]?.eve_cod;
      if (eveCod) {
        try {
          const f = await gticket.nominal.fields(eveCod);
          setExtraFields(f?.Lista || []);
        } catch {}
      }
      // inicializa forms
      const init = {};
      list.forEach((i) => { init[i.ing_id] = { nome: i.nome_usuario || '', cpf: i.identificacao_usuario || '', extras: {} }; });
      setForms(init);
    } catch (err) {
      setError('Não foi possível carregar os ingressos.');
    } finally {
      setLoading(false);
    }
  }

  function setField(ingId, key, value) {
    setForms((prev) => ({ ...prev, [ingId]: { ...prev[ingId], [key]: value } }));
  }
  function setExtra(ingId, label, value) {
    setForms((prev) => ({ ...prev, [ingId]: { ...prev[ingId], extras: { ...prev[ingId].extras, [label]: value } } }));
  }

  function buildLista() {
    // formato: ite_cod¢nome+sobrenome¢cpf¢ing_id¢eve_cod  | separados por |
    return ingressos.map((i) => {
      const f = forms[i.ing_id] || {};
      const nome = (f.nome || '').trim().replace(/\s+/g, '+');
      const cpf = (f.cpf || '').replace(/\D/g, '');
      return [i.ite_cod, nome, cpf, i.ing_id, i.eve_cod].join('¢');
    }).join('|');
  }

  function buildExtras() {
    if (!extraFields.length) return '';
    return ingressos.map((i) => {
      const f = forms[i.ing_id] || {};
      return extraFields.map((ef) => String(f.extras?.[ef.label] || '').replace(/\s+/g, '+')).join('¢');
    }).join('|');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    // valida
    for (const i of ingressos) {
      const f = forms[i.ing_id] || {};
      if (!f.nome?.trim()) { setError('Preencha o nome de todos os ingressos.'); return; }
      if (f.cpf && !validarCPF(f.cpf)) { setError('CPF inválido em um dos ingressos.'); return; }
    }
    setSubmitting(true);
    try {
      const res = await gticket.nominal.submit({
        pagId,
        lista: buildLista(),
        tipo: 'S',
        extras: buildExtras(),
      });
      if (res?.statusId === '00') setDone(true);
      else setError(res?.statusMsg || 'Não foi possível nominar os ingressos.');
    } catch {
      setError('Erro ao enviar a nominação.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="max-w-lg mx-auto px-4 py-20 text-center"><div className="animate-spin text-5xl">⏳</div></div>;
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <IconCheck size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Ingressos nominados!</h1>
        <p className="text-gray-400 mb-6">Os nomes foram associados aos ingressos com sucesso.</p>
        <Link to={`/pedido/${pagId}`} className="btn-primary inline-block">Ver pedido</Link>
      </div>
    );
  }

  if (!ingressos.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Nenhum ingresso para nominar.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Início</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Nominar Ingressos</h1>
      <p className="text-gray-400 mb-6">Informe os dados de quem vai usar cada ingresso.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {ingressos.map((i, idx) => {
          const f = forms[i.ing_id] || {};
          return (
            <div key={i.ing_id} className="card p-5">
              <p className="text-white font-semibold mb-1">{i.nome_lote || 'Ingresso'} #{idx + 1}</p>
              <p className="text-gray-500 text-xs mb-3">{i.setor}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  placeholder="Nome e sobrenome"
                  value={f.nome || ''}
                  onChange={(e) => setField(i.ing_id, 'nome', e.target.value)}
                  className="input"
                  required
                />
                <input
                  placeholder="CPF (opcional)"
                  value={f.cpf || ''}
                  onChange={(e) => setField(i.ing_id, 'cpf', e.target.value)}
                  className="input"
                  maxLength={14}
                />
                {extraFields.map((ef) => (
                  <div key={ef.label}>
                    {ef.tipo === 'select' ? (
                      <select className="input w-full" value={f.extras?.[ef.label] || ''} onChange={(e) => setExtra(i.ing_id, ef.label, e.target.value)}>
                        <option value="">{ef.label}</option>
                        {(ef.droplist || []).map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input
                        placeholder={ef.label}
                        value={f.extras?.[ef.label] || ''}
                        onChange={(e) => setExtra(i.ing_id, ef.label, e.target.value)}
                        className="input"
                        inputMode={ef.tipo === 'num' ? 'numeric' : 'text'}
                        maxLength={parseInt(ef.tamanho) || 200}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-4 disabled:opacity-50">
          {submitting ? 'Enviando...' : 'Confirmar Nominação'}
        </button>
      </form>
    </div>
  );
}
