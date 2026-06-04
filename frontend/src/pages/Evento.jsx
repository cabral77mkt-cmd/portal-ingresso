import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gticket } from '../services/gticket.js';

export default function Evento() {
  const { gticketId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Mesa / lugar marcado: opções por lote (lista MESAS) e unidades escolhidas
  const [seatOptions, setSeatOptions] = useState({});      // { ite_cod: [{mes_id, mes_numero}] }
  const [seatSelections, setSeatSelections] = useState({}); // { ite_cod: [mes_id, ...] }

  useEffect(() => {
    loadEvent();
  }, [gticketId]);

  useEffect(() => {
    if (selectedSector) loadTickets(selectedSector);
  }, [selectedSector]);

  async function loadEvent() {
    try {
      setLoading(true);
      // Fonte única: G-ticket. evento.asp gmet=2 retorna o detalhe completo
      const d = await gticket.events.get(gticketId);
      if (d && (d.statusId === '00' || d.nome)) {
        const [dd, mm, yy] = String(d.Data || d.data || '').split('/');
        const iso = (yy && mm && dd)
          ? `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${(d.horaInicio || '00:00')}:00`
          : '';
        setEvent({
          id: gticketId,
          gticket_id: gticketId,
          title: d.nome,
          description: d.descricao || d.release || d.infogeral || '',
          image_url: d.logo,
          category: d.genero || '',
          date: iso,
          location: d.local,
          city: d.cidade,
          state: d.estado,
          status: d.eve_venda_online === 'N' ? 'closed' : 'active',
          price_from: d.valores?.[0]?.min,
          classificacao: d.classificacao || d.classificacao_etaria || '',
        });
        loadSectors(gticketId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSectors(eventId) {
    try {
      const data = await gticket.events.sectors(eventId);
      // G-ticket retorna campo "SETOR" com id "gru_id"
      const list = data?.SETOR || data?.lista || data?.setores || [];
      setSectors(list);
      if (list.length > 0) {
        const firstId = list[0].gru_id || list[0].set_cod || list[0].id;
        setSelectedSector(firstId);
      } else {
        // Sem setores, tenta buscar lotes direto
        loadTicketsDirect(eventId);
      }
    } catch (err) {
      console.error('Setores:', err);
      loadTicketsDirect(eventId);
    }
  }

  async function loadTickets(sectorId) {
    try {
      setLoadingTickets(true);
      const eventId = event?.gticket_id || gticketId;
      const data = await gticket.events.tickets(eventId, sectorId);
      // G-ticket retorna campo "LOTES"
      const list = data?.LOTES || data?.lista || data?.ingressos || [];
      setTickets(list);
    } catch (err) {
      console.error('Ingressos:', err);
    } finally {
      setLoadingTickets(false);
    }
  }

  async function loadTicketsDirect(eventId) {
    try {
      const data = await gticket.events.tickets(eventId, '0');
      const list = data?.LOTES || data?.lista || data?.ingressos || [];
      setTickets(list);
    } catch (err) {
      console.error(err);
    }
  }

  function needsSeat(lote) {
    return lote?.mesa === 'S' || Number(lote?.mapa_id) > 0;
  }

  async function loadSeats(lote) {
    const id = lote.ite_cod || lote.id;
    if (seatOptions[id]) return; // já carregado
    try {
      const data = await gticket.events.seats(
        event?.gticket_id || gticketId,
        lote.lot_cod,
        lote.assento_parcial || 'N'
      );
      const list = data?.MESAS || data?.LUGARES || data?.lista || [];
      setSeatOptions((prev) => ({ ...prev, [id]: list }));
    } catch (err) {
      console.error('Mesas:', err);
      setSeatOptions((prev) => ({ ...prev, [id]: [] }));
    }
  }

  function setQty(ticketId, value, lote) {
    const v = Math.max(0, value);
    setQuantities((prev) => ({ ...prev, [ticketId]: v }));
    if (lote && needsSeat(lote)) {
      if (v > 0) loadSeats(lote);
      // ajusta o array de seleções ao tamanho da quantidade
      setSeatSelections((prev) => {
        const cur = prev[ticketId] || [];
        return { ...prev, [ticketId]: cur.slice(0, v) };
      });
    }
  }

  function setSeatAt(ticketId, index, mesId) {
    setSeatSelections((prev) => {
      const cur = [...(prev[ticketId] || [])];
      cur[index] = mesId;
      return { ...prev, [ticketId]: cur };
    });
  }

  function totalSelected() {
    return Object.values(quantities).reduce((a, b) => a + b, 0);
  }

  function totalPrice() {
    return tickets.reduce((acc, t) => {
      const id = t.ite_cod || t.id;
      const qty = quantities[id] || 0;
      const price = parseFloat(t.ite_valor || t.valor || 0);
      return acc + qty * price;
    }, 0);
  }

  // Para lotes mesa/lugar, exige que todas as unidades estejam escolhidas
  function seatsComplete() {
    return tickets.every((t) => {
      const id = t.ite_cod || t.id;
      const qty = quantities[id] || 0;
      if (qty > 0 && needsSeat(t)) {
        const sel = (seatSelections[id] || []).filter(Boolean);
        return sel.length === qty;
      }
      return true;
    });
  }

  function handleCheckout() {
    const selected = tickets
      .filter((t) => quantities[t.ite_cod || t.id] > 0)
      .map((t) => {
        const id = t.ite_cod || t.id;
        return {
          ite_cod: id,
          lot_cod: t.lot_cod || '',
          id_setor: t.lot_grupo_estoque || selectedSector || '0',
          quantity: quantities[id],
          price: parseFloat(t.ite_valor || t.valor || 0),
          name: t.ite_nome || t.nome || 'Ingresso',
          mesa: t.mesa || 'N',
          mapa_id: t.mapa_id || '0',
          units: needsSeat(t) ? (seatSelections[id] || []).filter(Boolean) : [],
        };
      });

    sessionStorage.setItem('checkout_tickets', JSON.stringify(selected));
    sessionStorage.setItem('checkout_event', JSON.stringify(event));
    navigate(`/checkout/${event?.gticket_id || gticketId}`);
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [datePart, timePart] = dateStr.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    if (!y || !m || !d) return '';
    const ds = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    return timePart ? `${ds} às ${timePart.slice(0, 5)}` : ds;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-72 bg-gray-800 rounded-2xl" />
          <div className="h-8 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-5xl mb-4">😕</p>
        <p>Evento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Banner */}
      {event.image_url && (
        <div className="w-full h-72 rounded-2xl overflow-hidden mb-8">
          <img src={event.image_url} alt={event.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="text-primary text-sm font-semibold uppercase">{event.category}</span>
            <h1 className="text-3xl font-bold text-white mt-1">{event.title}</h1>
          </div>

          <div className="space-y-2 text-gray-400">
            <p className="flex items-center gap-2">📅 {formatDate(event.date)}</p>
            <p className="flex items-center gap-2">📍 {event.location} — {event.city}/{event.state}</p>
            {event.classificacao !== '' && event.classificacao != null && (
              <p className="flex items-center gap-2">
                🔞 Classificação:{' '}
                <span className="font-semibold text-white">
                  {Number(event.classificacao) === 0 ? 'Livre' : `${event.classificacao} anos`}
                </span>
              </p>
            )}
          </div>

          {event.description && (
            <div>
              <h2 className="text-white font-semibold mb-2">Sobre o Evento</h2>
              <div
                className="text-gray-400 leading-relaxed [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Sectors */}
          {sectors.length > 1 && (
            <div>
              <h2 className="text-white font-semibold mb-3">Setor</h2>
              <div className="flex gap-2 flex-wrap">
                {sectors.map((s) => {
                  const id = s.gru_id || s.set_cod || s.id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedSector(id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedSector === id
                          ? 'bg-primary text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {s.set_nome || s.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tickets */}
          <div>
            <h2 className="text-white font-semibold mb-3">Ingressos</h2>
            {loadingTickets ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-gray-500">Nenhum ingresso disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const id = t.ite_cod || t.id;
                  const price = parseFloat(t.ite_valor || t.valor || 0);
                  const available = t.esgotado === 'S' ? 0 : parseInt(t.campo_qtde_pos || t.ite_qtd_disp || 99);
                  const qty = quantities[id] || 0;
                  const isMeia = (t.ite_nome || t.nome || '').toLowerCase().includes('meia');
                  const qtdMax = parseInt(t.lot_qtde_max || 0) || 0; // 0 = sem limite
                  const qtdMin = parseInt(t.lot_qtde_min || 0) || 0;
                  const maxReached = qtdMax > 0 && qty >= qtdMax;
                  const seatLote = needsSeat(t);
                  const opts = seatOptions[id] || [];
                  const sel = seatSelections[id] || [];

                  return (
                    <div key={id} className="card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{t.ite_nome || t.nome || 'Ingresso'}</p>
                          <p className="text-primary font-bold text-lg">
                            {price === 0 ? 'Gratuito' : `R$ ${price.toFixed(2)}`}
                          </p>
                          {isMeia && (
                            <p className="text-yellow-500 text-xs mt-1">⚠️ Necessário documento comprobatório</p>
                          )}
                          {t.mesa === 'S' && <p className="text-blue-400 text-xs mt-1">🪑 Escolha de mesa</p>}
                          {Number(t.mapa_id) > 0 && <p className="text-blue-400 text-xs mt-1">📍 Lugar marcado</p>}
                          {qtdMin > 1 && <p className="text-gray-500 text-xs">Mínimo {qtdMin} por compra</p>}
                          {available <= 10 && available > 0 && (
                            <p className="text-orange-400 text-xs">Restam {available}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQty(id, qty - 1, t)}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-30 flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-white">{qty}</span>
                          <button
                            onClick={() => setQty(id, Math.max(qty + 1, qty === 0 && qtdMin > 1 ? qtdMin : qty + 1), t)}
                            disabled={available === 0 || maxReached}
                            className="w-8 h-8 rounded-full bg-primary hover:bg-violet-700 disabled:opacity-30 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Seletor de mesa / lugar */}
                      {seatLote && qty > 0 && (
                        <div className="mt-4 space-y-2 border-t border-gray-700 pt-3">
                          <p className="text-gray-400 text-xs">Escolha {qty > 1 ? `as ${qty} unidades` : 'a unidade'}:</p>
                          {Array.from({ length: qty }).map((_, i) => (
                            <select
                              key={i}
                              value={sel[i] || ''}
                              onChange={(e) => setSeatAt(id, i, e.target.value)}
                              className="input w-full text-sm"
                            >
                              <option value="">— selecionar —</option>
                              {opts.map((o) => (
                                <option
                                  key={o.mes_id}
                                  value={o.mes_id}
                                  disabled={sel.includes(o.mes_id) && sel[i] !== o.mes_id}
                                >
                                  {o.mes_numero || o.mes_id}
                                </option>
                              ))}
                            </select>
                          ))}
                          {opts.length === 0 && <p className="text-gray-500 text-xs">Carregando disponibilidade...</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — resumo */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-white font-bold text-lg mb-4">Resumo</h3>

            {totalSelected() === 0 ? (
              <p className="text-gray-500 text-sm">Selecione os ingressos ao lado</p>
            ) : (
              <div className="space-y-2 mb-4">
                {tickets
                  .filter((t) => quantities[t.ite_cod || t.id] > 0)
                  .map((t) => {
                    const id = t.ite_cod || t.id;
                    const qty = quantities[id];
                    const price = parseFloat(t.ite_valor || t.valor || 0);
                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <span className="text-gray-400">{t.ite_nome || t.nome} x{qty}</span>
                        <span className="text-white">R$ {(price * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-primary">R$ {totalPrice().toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={totalSelected() === 0 || !seatsComplete()}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Comprar Ingresso
            </button>

            {totalSelected() > 0 && !seatsComplete() && (
              <p className="text-yellow-500 text-center text-xs mt-2">Escolha a mesa/lugar de todos os ingressos</p>
            )}

            {event.status === 'sold_out' && (
              <p className="text-red-400 text-center text-sm mt-3">Evento esgotado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
