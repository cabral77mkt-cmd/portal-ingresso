// Todos os calls ao G-ticket passam pelo backend (para proteger a API key)
const API = '/api';

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}${path}${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

export const gticket = {
  // Eventos
  events: {
    list: (params = {}) => get('/events', params),
    get: (id) => get(`/events/${id}`),
    sectors: (id) => get(`/events/${id}/sectors`),
    tickets: (id, setor) => get(`/events/${id}/tickets`, { setor }),
    search: (params) => get('/search', params),
    seats: (id, lot, partial) => get(`/events/${id}/seats`, { lot, partial }),
    loteAdicional: (lot, pdv) => get('/lote-adicional', { lot, pdv }),
    availability: (params) => get('/availability', params),
    delivery: (id) => get(`/delivery/${id}`),
    cpfMeia: (params) => get('/cpf-meia', params),
  },

  // Cidades e gêneros
  cities: () => get('/cities'),
  genres: () => get('/genres'),

  // Checkout
  checkout: {
    paymentConfig: (eventId) => get(`/payment-config/${eventId}`),
    validateLimit: (params) => get('/validate-limit', params),
    voucher: (params) => get('/voucher', params),
    // Pagamento unificado: roteia pelo gateway/method
    pay: (gateway, method, payload) => post('/checkout', { gateway, method, payload }),
    // Legados (compat)
    pagseguro: (payload) => post('/checkout/pagseguro', payload),
    pix: (payload) => post('/checkout/pix', payload),
    mercadopago: (payload) => post('/checkout/mercadopago', payload),
  },

  // Pagamento
  payment: {
    status: (paymentId) => get(`/payment/${paymentId}`),
  },

  // Pedidos do usuário (histórico de compras)
  orders: {
    history: (usuId) => get(`/orders/${usuId}`),
  },

  // Ingresso nominal
  nominal: {
    tickets: (pagId) => get(`/nominal/${pagId}`),
    fields: (eventId) => get(`/nominal-fields/${eventId}`),
    submit: (body) => post('/nominate', body),
  },

  // Cortesias
  courtesy: (usuId) => get(`/courtesy/${usuId}`),

  // Auth
  auth: {
    login: (email, senha, ip) => post('/auth/login', { email, senha, ip }),
    user: (id) => get(`/auth/user/${id}`),
  },
};

// Gera order code no padrão Tickfy
export function generateOrderCode() {
  return `T7K${Date.now()}`;
}

// Valida CPF brasileiro
export function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === parseInt(cpf[10]);
}
