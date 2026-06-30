import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gticket } from '../services/gticket.js';
import { IconCheck, IconClock, IconTicket } from '../components/Icons.jsx';

function IconX({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

// Status do G-ticket: PG=Pago, EA=Em Análise, CA=Cancelado, NP=Não Pago, DV=Devolvido
const STATUS_MAP = {
  PG: { label: 'Pagamento Aprovado!',    color: 'text-primary',    Icon: IconCheck, done: true },
  EA: { label: 'Aguardando Pagamento',   color: 'text-yellow-400', Icon: IconClock, done: false },
  NP: { label: 'Aguardando Pagamento',   color: 'text-yellow-400', Icon: IconClock, done: false },
  CA: { label: 'Pedido Cancelado',       color: 'text-faint',      Icon: IconX,     done: true },
  DV: { label: 'Pagamento Devolvido',    color: 'text-faint',      Icon: IconX,     done: true },
};

export default function Pedido() {
  const { orderCode: pagId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    loadOrder();
    return () => clearInterval(pollRef.current);
  }, [pagId]);

  async function loadOrder() {
    try {
      const data = await gticket.payment.status(pagId);
      setOrder(data);
      const st = data?.status;
      if (st === 'EA' || st === 'NP') startPolling();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function startPolling() {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await gticket.payment.status(pagId);
        setOrder(data);
        const fin = STATUS_MAP[data?.status]?.done;
        if (fin) clearInterval(pollRef.current);
      } catch (err) {
        console.error(err);
      }
    }, 5000);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="animate-spin text-5xl">⏳</div>
        <p className="text-gray-400 mt-4">Carregando pedido...</p>
      </div>
    );
  }

  if (!order || order.statusId !== '00') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.06] text-faint flex items-center justify-center">
          <IconTicket size={26} />
        </div>
        <p className="text-muted">Pedido não encontrado</p>
        <Link to="/" className="btn-primary mt-5 inline-block">Voltar ao início</Link>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || STATUS_MAP.EA;
  const StatusIcon = status.Icon;
  const valorTotal = order.valor_total || order.valor || '0';

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="card p-8 text-center">
        <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-white/[0.06] ${status.color}`}>
          <StatusIcon size={32} />
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${status.color}`}>{status.label}</h1>

        {!status.done && (
          <p className="text-muted text-sm mb-6 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Verificando pagamento automaticamente...
          </p>
        )}

        <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2 mt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pedido nº</span>
            <span className="text-white font-mono font-bold">{pagId}</span>
          </div>
          {order.eve_nome && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Evento</span>
              <span className="text-white text-right">{order.eve_nome}</span>
            </div>
          )}
          {order.referente && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ingressos</span>
              <span className="text-white text-right">{order.referente}</span>
            </div>
          )}
          {order.forma_pagto && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Forma</span>
              <span className="text-white">{order.forma_pagto}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total</span>
            <span className="text-primary font-bold text-lg">R$ {valorTotal}</span>
          </div>
        </div>

        {order.status === 'PG' && order.ingresso_nominal === 'S' && (
          <Link to={`/nominar/${pagId}`} className="btn-primary w-full mt-6 inline-flex gap-2">
            Nominar Ingressos
          </Link>
        )}

        {status.done && order.status === 'PG' && order.link_voucher && (
          <a href={order.link_voucher} target="_blank" rel="noopener noreferrer"
            className="btn-secondary w-full mt-3 inline-flex gap-2">
            <IconTicket /> Ver Ingresso
          </a>
        )}

        <Link to="/minha-conta" className="btn-secondary mt-3 inline-block w-full">
          Meus Ingressos
        </Link>
        <Link to="/" className="text-muted text-sm mt-4 inline-block hover:text-paper">
          Ver mais eventos
        </Link>
      </div>
    </div>
  );
}
