import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS = {
  show: 'Show', teatro: 'Teatro', festa: 'Festa', esporte: 'Esporte',
  corporativo: 'Corporativo', infantil: 'Infantil', online: 'Online', outro: 'Outro',
};

// Fora do componente — não recriam a cada render
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [datePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .toUpperCase().replace(/\./g, '');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const timePart = dateStr.split('T')[1];
  return timePart ? timePart.slice(0, 5) : '';
}

// memo — só re-renderiza se o objeto event mudar
const EventCard = memo(function EventCard({ event }) {
  const navigate = useNavigate();
  const id = event.gticket_id || event.id;

  return (
    <div
      className="card cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
      onClick={() => navigate(`/eventos/${id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
        )}
        {event.featured && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
            Destaque
          </span>
        )}
        {event.status === 'sold_out' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Esgotado</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {event.category && (
          <span className="text-xs text-primary font-semibold uppercase tracking-wide">
            {CATEGORY_LABELS[event.category] || event.category}
          </span>
        )}
        <h3 className="font-bold text-white mt-1 truncate">{event.title}</h3>

        <div className="mt-3 space-y-1 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(event.date)} às {formatTime(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span className="truncate">{event.location} — {event.city}/{event.state}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button className="btn-primary text-sm py-2 px-4">
            Ver mais
          </button>
        </div>
      </div>
    </div>
  );
});

export default EventCard;
