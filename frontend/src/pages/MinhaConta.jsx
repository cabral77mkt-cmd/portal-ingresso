import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gticket } from '../services/gticket.js';
import { IconTicket } from '../components/Icons.jsx';

// Status do G-ticket
const STATUS_LABEL = {
  PG: { label: 'Aprovado', cls: 'text-green-400 bg-green-900/30' },
  EA: { label: 'Pendente', cls: 'text-yellow-400 bg-yellow-900/30' },
  NP: { label: 'Pendente', cls: 'text-yellow-400 bg-yellow-900/30' },
  CA: { label: 'Cancelado', cls: 'text-gray-400 bg-gray-800' },
  DV: { label: 'Devolvido', cls: 'text-gray-400 bg-gray-800' },
};

export default function MinhaConta() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [courtesy, setCourtesy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('tickfy_user'));
      if (!stored?.usu_id) { navigate('/login', { state: { from: '/minha-conta' } }); return; }
      setUser(stored);
      loadOrders(stored.usu_id);
      gticket.courtesy(stored.usu_id)
        .then((d) => setCourtesy(d?.CORTESIA || []))
        .catch(() => {});
    } catch {
      navigate('/login', { state: { from: '/minha-conta' } });
    }
  }, []);

  async function loadOrders(usuId) {
    try {
      const data = await gticket.orders.history(usuId);
      const list = data?.PAGAMENTOS || data?.pagamentos || [];
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('tickfy_user');
    window.dispatchEvent(new Event('tickfy_auth_changed'));
    navigate('/');
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
          <p className="text-gray-400 mt-1">{user.nome}</p>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary text-sm">Sair</button>
      </div>

      {/* Cortesias disponíveis */}
      {courtesy.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            Cortesias disponíveis
            <span className="text-gray-500 font-normal text-sm ml-2">({courtesy.length})</span>
          </h2>
          <div className="space-y-3">
            {courtesy.map((c) => (
              <div key={c.id} className="card p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{c.eve_nome}</p>
                  <p className="text-gray-500 text-xs">{c.lot_nome} — {c.nome_setor} · {c.cor_qtde}x</p>
                </div>
                <span className="text-green-400 text-xs font-semibold px-2 py-1 rounded-full bg-green-900/30 whitespace-nowrap">Cortesia</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Meus Ingressos */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">
          Meus Ingressos
          <span className="text-gray-500 font-normal text-sm ml-2">({orders.length})</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.06] text-faint flex items-center justify-center">
              <IconTicket size={26} />
            </div>
            <p className="text-muted">Você ainda não comprou nenhum ingresso.</p>
            <Link to="/" className="btn-primary mt-4 inline-block">
              Ver Eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_LABEL[o.status] || STATUS_LABEL.EA;
              return (
                <Link
                  key={o.id}
                  to={`/pedido/${o.id}`}
                  className="card p-4 flex items-center gap-4 hover:border-primary/30 border border-transparent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {o.evento || 'Evento'}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{o.referente}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{o.data_compra}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${st.cls}`}>
                    {st.label}
                  </span>
                  <span className="text-primary font-bold whitespace-nowrap">
                    R$ {o.valor || 0}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
