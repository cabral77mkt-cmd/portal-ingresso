import { useState, useEffect, useMemo } from 'react';
import { gticket } from '../services/gticket.js';
import EventCard from '../components/EventCard.jsx';

// Converte evento do G-ticket (gmet=1) para o shape usado pelo EventCard
function mapEvent(e) {
  const [d, m, y] = String(e.data || '').split('/');
  const iso = (y && m && d) ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${(e.horario || '00:00')}:00` : '';
  return {
    id: e.codigo,
    gticket_id: e.codigo,
    title: e.nome,
    image_url: e.logo,
    date: iso,
    rawDate: e.data,          // DD/MM/YYYY — usado para o corte "some após 1 dia"
    location: e.local,
    city: e.cidade,
    state: e.estado,
    featured: e.destaque === 'S',
    status: 'active',
  };
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState(''); // descrição do gênero selecionado

  useEffect(() => {
    loadEvents();
    // Carrega gêneros reais cadastrados (para os chips de categoria)
    gticket.genres()
      .then((d) => setGenres(d?.Lista || []))
      .catch(() => {});
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      // Fonte única: G-ticket. evento.asp gmet=1 retorna { Lista: [...] }
      const data = await gticket.events.list();
      const lista = data?.Lista || data?.lista || [];

      const now = Date.now();
      const all = lista.map(mapEvent).filter((e) => {
        // Some após 1 dia da data do evento (até a meia-noite do dia seguinte)
        if (e.rawDate) {
          const [d, m, y] = e.rawDate.split('/').map(Number);
          if (d && m && y) {
            const eventDate = new Date(y, m - 1, d + 1, 23, 59, 59, 999);
            if (eventDate.getTime() < now) return false;
          }
        }
        return true;
      });

      setEvents(all);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtro por gênero usa a API de busca (a listagem não traz gênero por evento)
  async function applyGenre(desc) {
    if (genre === desc) { setGenre(''); loadEvents(); return; }
    setGenre(desc);
    try {
      setLoading(true);
      const data = await gticket.events.search({ genero: desc });
      const lista = data?.Lista || [];
      const mapped = lista.map((e) => ({
        id: e.lista_eventos || e.codigo,
        gticket_id: e.lista_eventos || e.codigo,
        title: e.nome,
        image_url: e.logo,
        date: (() => {
          const [d, m, y] = String(e.data || '').split('/');
          return (y && m && d) ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${e.horario || '00:00'}:00` : '';
        })(),
        location: e.local, city: e.cidade, state: e.estado, featured: false, status: 'active',
      }));
      setEvents(mapped);
    } catch {
      // mantém lista atual em caso de erro
    } finally {
      setLoading(false);
    }
  }

  const featured = useMemo(() => events.filter((e) => e.featured), [events]);
  const isFiltering = !!(search || city || genre);
  const filtered = useMemo(() => events.filter((e) => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase());
    const matchCity = !city || e.city?.toLowerCase().includes(city.toLowerCase());
    return matchSearch && matchCity;
  }), [events, search, city]);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: '#080808' }}>
        {/* Glow radial */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(197,255,0,0.08) 0%, transparent 70%)',
        }} />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="eyebrow mb-6 flex items-center justify-center gap-2">
            <span className="live-dot" />
            Plataforma de ingressos
          </div>
          <h1 style={{
            fontFamily: 'Bebas Neue, Syne, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(56px, 9vw, 120px)',
            lineHeight: 0.9,
            letterSpacing: '2px',
            color: '#fff',
            marginBottom: '24px',
          }}>
            Seus ingressos,<br />
            <span style={{ color: '#C5FF00' }}>do jeito certo.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.15rem', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 40px' }}>
            Compre ingressos para os melhores eventos do Brasil com segurança e sem complicação.
          </p>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Buscar evento, artista ou local..."
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              className="input flex-1"
              style={{ fontSize: '0.95rem', padding: '14px 20px' }}
            />
            <input
              type="text"
              placeholder="Cidade"
              value={city}
              onChange={(ev) => setCity(ev.target.value)}
              className="input sm:w-40"
              style={{ fontSize: '0.95rem', padding: '14px 16px' }}
            />
          </div>
        </div>
        {/* Linha separadora com glow */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,255,0,0.3), transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Chips de gênero (categorias reais do G-ticket) */}
        {genres.length > 0 && (
          <section className="mb-10">
            <p className="eyebrow mb-4">Explorar por categoria</p>
            <div className="flex gap-2 flex-wrap">
              {genres.map((g) => (
                <button
                  key={g.codigo}
                  onClick={() => applyGenre(g.descricao)}
                  className="text-sm font-medium transition-all"
                  style={{
                    padding: '7px 16px', borderRadius: '100px',
                    border: '1px solid ' + (genre === g.descricao ? 'rgba(197,255,0,0.5)' : 'rgba(255,255,255,0.1)'),
                    background: genre === g.descricao ? 'rgba(197,255,0,0.12)' : 'rgba(255,255,255,0.04)',
                    color: genre === g.descricao ? '#C5FF00' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  {g.descricao}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && !isFiltering && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <p className="eyebrow">Em Destaque</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 3).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {/* All Events */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <p className="eyebrow">{isFiltering ? 'Resultados' : 'Todos os Eventos'}</p>
            {!loading && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{filtered.length} eventos</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl h-72 animate-pulse" style={{ background: '#131313' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p className="text-5xl mb-4">🎟️</p>
              <p className="text-lg">Nenhum evento encontrado</p>
              {isFiltering && (
                <button onClick={() => { setSearch(''); setCity(''); setGenre(''); loadEvents(); }} className="btn-secondary mt-6">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
