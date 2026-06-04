require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const GTICKET_BASE = process.env.GTICKET_BASE_URL;
const KEY = process.env.GTICKET_KEY;
const PDV = process.env.GTICKET_PDV_ID || '1';

// ── Helpers ──────────────────────────────────────────────────────────────────
function gtUrl(path, params = {}) {
  const base = `${GTICKET_BASE}${path}`;
  const qs = new URLSearchParams({ key: KEY, ...params }).toString();
  return `${base}?${qs}`;
}

// Decodifica o corpo da resposta lidando com o encoding inconsistente do G-ticket.
// O conteúdo dos eventos é ISO-8859-1 (Latin-1); mensagens de sistema às vezes UTF-8.
// Estratégia: tenta UTF-8 estrito; se falhar (byte Latin-1 inválido), usa Latin-1.
function decodeBody(buffer) {
  const buf = Buffer.from(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return buf.toString('latin1');
  }
}

async function gt(path, params = {}) {
  const url = gtUrl(path, params);
  const res = await axios.get(url, { timeout: 10000, responseType: 'arraybuffer' });
  const text = decodeBody(res.data);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── Eventos ───────────────────────────────────────────────────────────────────

// Lista todos os eventos do produtor
app.get('/api/events', async (req, res) => {
  try {
    const { destaque, produtor } = req.query;
    const data = await gt('/ws/geral/evento.asp', {
      gmet: '1',
      par1: produtor || '',
      par2: PDV,
      par3: destaque || '0',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalhe de um evento
app.get('/api/events/:id', async (req, res) => {
  try {
    const data = await gt('/ws/geral/evento.asp', {
      gmet: '2',
      par1: req.params.id,
      par2: PDV,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Setores do evento
app.get('/api/events/:id/sectors', async (req, res) => {
  try {
    const data = await gt('/ws/geral/setorlote.asp', {
      gmet: '2',
      par1: req.params.id,
      par2: PDV,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingressos/lotes de um setor
app.get('/api/events/:id/tickets', async (req, res) => {
  try {
    const { setor } = req.query;
    const data = await gt('/ws/geral/setorlote.asp', {
      gmet: '4',
      par1: req.params.id,
      par2: setor || '0',
      par3: PDV,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Busca de eventos
app.get('/api/search', async (req, res) => {
  try {
    const { q, genero, estado, cidade } = req.query;
    const data = await gt('/ws/geral/lista_busca.asp', {
      gmet: '2',
      pdv_id: PDV,
      txt_busca: q || '',
      txt_genero: genero || '',
      estado: estado || '',
      cidade: cidade || '',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cidades disponíveis
app.get('/api/cities', async (req, res) => {
  try {
    const data = await gt('/ws/site/listacidadesgeneros.asp', { gc: 's' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Checkout ──────────────────────────────────────────────────────────────────

// Chaves de pagamento do evento
app.get('/api/payment-config/:eventId', async (req, res) => {
  try {
    const data = await gt('/ws/geral/config_mobile.asp', {
      gmet: '2',
      par1: req.params.eventId,
      par2: 'S',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validar limite de ingressos por CPF
app.get('/api/validate-limit', async (req, res) => {
  try {
    const { eventId, userId, quantities, itemCodes } = req.query;
    const data = await gt('/ws/geral/evento.asp', {
      gmet: '4',
      par1: eventId,
      par2: userId || '0',
      par3: quantities,
      par4: itemCodes || '',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dispatcher de pagamento ───────────────────────────────────────────────────
// Roteia para o gateway correto conforme a config do evento.
// gateway: PSG_T (PagSeguro) | MPTP (Mercado Pago) | PAGAR (Pagar-me) | AARIN
// method:  CAR (cartão) | PIX | BOL (boleto)
function resolveGatewayUrl(gateway, method) {
  const g = String(gateway || 'PSG_T').toUpperCase();
  const m = String(method || 'CAR').toUpperCase();
  switch (g) {
    case 'MPTP':
    case 'MPMKT':
      return `${GTICKET_BASE}/mp_api/index.php`;        // MP: cartão, pix e boleto no mesmo endpoint
    case 'PAGAR':
      return `${GTICKET_BASE}/pagar_api/index.php`;     // Pagar-me: cartão e pix
    case 'AARIN':
      return `${GTICKET_BASE}/aarin_api/index.php`;     // Aarin: pix
    case 'PSG_T':
    case 'PSG_S':
    default:
      // PagSeguro: PIX tem endpoint próprio; cartão/boleto no index.php
      return m === 'PIX'
        ? `${GTICKET_BASE}/pseg_api/index_pix.php`
        : `${GTICKET_BASE}/pseg_api/index.php`;
  }
}

async function dispatchPayment(payload, gateway, method, res) {
  const url = resolveGatewayUrl(gateway, method);
  console.log(`[PAY] gateway=${gateway} method=${method} → ${url}`);
  console.log('[PAY] Payload:', JSON.stringify(payload, null, 2));
  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    console.log('[PAY] Resposta:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (err) {
    console.error('[PAY] Erro:', err.message, err.response?.data);
    res.status(500).json({ error: err.message, detail: err.response?.data });
  }
}

// Endpoint unificado — usa gateway/method do corpo (ou do payload.gateway)
app.post('/api/checkout', async (req, res) => {
  const { gateway, method, payload } = req.body;
  const body = payload || req.body;
  const gw = gateway || body?.gateway || 'PSG_T';
  const mt = method || body?.venda?.forma_pagto || 'CAR';
  await dispatchPayment(body, gw, mt, res);
});

// ── Rotas legadas (compatibilidade) ───────────────────────────────────────────
app.post('/api/checkout/pagseguro', (req, res) =>
  dispatchPayment(req.body, req.body?.gateway || 'PSG_T', 'CAR', res));

app.post('/api/checkout/pix', (req, res) =>
  dispatchPayment(req.body, req.body?.gateway || 'PSG_T', 'PIX', res));

app.post('/api/checkout/mercadopago', (req, res) =>
  dispatchPayment(req.body, 'MPTP', req.body?.venda?.forma_pagto || 'CAR', res));

// ── Parcelamento ─────────────────────────────────────────────────────────────

function detectBrand(bin) {
  const b = String(bin).replace(/\D/g, '');
  if (/^4/.test(b)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(b)) return 'mastercard';
  if (/^3[47]/.test(b)) return 'amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|650|6516|6550)/.test(b)) return 'elo';
  if (/^(606282|3841)/.test(b)) return 'hipercard';
  if (/^3(0[0-5]|[68])/.test(b)) return 'diners';
  return 'unknown';
}

app.get('/api/installments', async (req, res) => {
  try {
    const { eventId, amount, bin } = req.query;
    const amountNum = parseFloat(amount) || 0;

    // Tenta buscar parcelamento do PagSeguro via session do evento
    if (eventId && bin && bin.length >= 6) {
      try {
        const config = await gt('/ws/geral/config_mobile.asp', {
          gmet: '2', par1: eventId, par2: 'S',
        });
        const session = config?.psg_session || config?.session || config?.pseg_session;
        if (session) {
          const brand = detectBrand(bin);
          const psUrl = `https://ws.pagseguro.uol.com.br/v2/installments?sessionId=${session}&amount=${amountNum.toFixed(2)}&creditCardBrand=${brand}&maxInstallmentNoInterest=1`;
          const psRes = await axios.get(psUrl, { timeout: 6000 });
          const brandKey = brand !== 'unknown' ? brand : Object.keys(psRes.data?.installments || {})[0];
          const opts = psRes.data?.installments?.[brandKey];
          if (opts?.length) {
            return res.json({
              installments: opts.map((o) => ({
                quantity: o.quantity,
                amount: parseFloat(o.installmentAmount),
                totalAmount: parseFloat(o.totalAmount),
                interestFree: o.interestFree,
              })),
            });
          }
        }
      } catch { /* fallthrough */ }
    }

    // Fallback: calcular com taxa de 2,99% a.m. (padrão mercado)
    const RATE = 0.0299;
    const MAX = 12;
    const installments = [];
    for (let n = 1; n <= MAX; n++) {
      if (n === 1) {
        installments.push({ quantity: 1, amount: amountNum, totalAmount: amountNum, interestFree: true });
      } else {
        const parcel = amountNum * (RATE * Math.pow(1 + RATE, n)) / (Math.pow(1 + RATE, n) - 1);
        installments.push({
          quantity: n,
          amount: parseFloat(parcel.toFixed(2)),
          totalAmount: parseFloat((parcel * n).toFixed(2)),
          interestFree: false,
        });
      }
    }
    res.json({ installments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Pagamento ─────────────────────────────────────────────────────────────────

// Consultar status do pagamento
app.get('/api/payment/:paymentId', async (req, res) => {
  try {
    const data = await gt('/ws/geral/pagamento.asp', {
      gmet: '1',
      par1: req.params.paymentId,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico de pedidos do usuário (Lista Pagamento) — usuario.asp gmet=2
app.get('/api/orders/:usuId', async (req, res) => {
  try {
    const data = await gt('/ws/geral/usuario.asp', {
      gmet: '2',
      par1: req.params.usuId,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Recursos avançados de evento ──────────────────────────────────────────────

// Lista de gêneros (codigo → descricao) — ListaGeneros.asp gmet=3
app.get('/api/genres', async (req, res) => {
  try {
    const data = await gt('/ws/geral/ListaGeneros.asp', { gmet: '3' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mesas / lugares disponíveis num lote — setorlote.asp gmet=6
app.get('/api/events/:id/seats', async (req, res) => {
  try {
    const { lot, partial } = req.query;
    const data = await gt('/ws/geral/setorlote.asp', {
      gmet: '6',
      par1: req.params.id,
      par2: lot,
      par3: partial || 'N',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingresso adicional/combo (categoria P) — setorlote.asp gmet=13
app.get('/api/lote-adicional', async (req, res) => {
  try {
    const { lot, pdv } = req.query;
    const data = await gt('/ws/geral/setorlote.asp', {
      gmet: '13',
      par1: lot,
      par2: pdv || PDV,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disponibilidade para venda — item (gmet=8) ou setor (gmet=12)
app.get('/api/availability', async (req, res) => {
  try {
    const { eventId, item, sector, qty, mesa, assento } = req.query;
    const isSector = !!sector;
    const data = await gt('/ws/geral/setorlote.asp', {
      gmet: isSector ? '12' : '8',
      par1: eventId,
      par2: isSector ? sector : item,
      par3: qty || '1',
      par4: mesa || '',
      par5: assento || '',
      par6: PDV,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restrição de CPF e meia — evento.asp gmet=4
app.get('/api/cpf-meia', async (req, res) => {
  try {
    const { eventId, userId, quantities, itemCodes } = req.query;
    const data = await gt('/ws/geral/evento.asp', {
      gmet: '4',
      par1: eventId,
      par2: userId || '0',
      par3: quantities || '',
      par4: itemCodes || '',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forma de entrega — evento.asp gmet=5
app.get('/api/delivery/:id', async (req, res) => {
  try {
    const data = await gt('/ws/geral/evento.asp', { gmet: '5', par1: req.params.id });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validar vale desconto (cupom) — vale_desconto.asp
app.get('/api/voucher', async (req, res) => {
  try {
    const { eventId, code, total, qty, item, delivery } = req.query;
    const data = await gt('/ws/geral/vale_desconto.asp', {
      gmet: '1',
      par1: eventId,
      par2: code,
      par3: total,
      par4: qty,
      par5: item,
      par6: delivery || '',
      par7: PDV,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Ingresso nominal ──────────────────────────────────────────────────────────

// Lista ingressos de um pagamento que precisam ser nominados — usuario.asp gmet=3
app.get('/api/nominal/:pagId', async (req, res) => {
  try {
    const data = await gt('/ws/geral/usuario.asp', { gmet: '3', par1: req.params.pagId });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campos adicionais da nominação — evento.asp gmet=13
app.get('/api/nominal-fields/:eventId', async (req, res) => {
  try {
    const data = await gt('/ws/geral/evento.asp', { gmet: '13', par1: req.params.eventId });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finalizar nominação — ingresso.asp gmet=6
app.post('/api/nominate', async (req, res) => {
  try {
    const { pagId, lista, tipo, extras } = req.body;
    const data = await gt('/ws/geral/ingresso.asp', {
      gmet: '6',
      par1: pagId,
      par2: lista,            // formato: ite_cod¢nome+sobrenome¢cpf¢ing_id¢eve_cod|...
      par3: tipo || 'S',
      par4: extras || '',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cortesias do usuário — usuario.asp gmet=14
app.get('/api/courtesy/:usuId', async (req, res) => {
  try {
    const data = await gt('/ws/geral/usuario.asp', { gmet: '14', par1: req.params.usuId });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Auth G-ticket ─────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha, ip } = req.body;
    const data = await gt('/ws/geral/usuario.asp', {
      gmet: '1',
      par1: email,
      par2: senha,
      par3: ip || '127.0.0.1',
      par4: 'S',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/user/:id', async (req, res) => {
  try {
    const data = await gt('/ws/geral/usuario.asp', {
      gmet: '2',
      par1: req.params.id,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dados completos do usuário por CPF (gmet=4) — retorna telefone, endereço, data nasc, etc.
app.get('/api/auth/user-by-cpf/:cpf', async (req, res) => {
  try {
    const { passaporte } = req.query;
    const data = await gt('/ws/geral/usuario.asp', {
      gmet: '4',
      par1: req.params.cpf,
      par2: passaporte || '',
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email, senha, nome, cpf, sexo, nascimento,
      cep, endereco, numero, complemento, bairro, cidade, uf,
      ddd, tel, newsletter, lgpd,
    } = req.body;
    const url = `${GTICKET_BASE}/ws/geral/usuario.asp`;
    // gmet=5: registro de usuário — 24 parâmetros obrigatórios pela API G-ticket
    const params = new URLSearchParams({
      key: KEY,
      gmet: '5',
      par1: email || '',
      par2: senha || '',
      par3: nome || '',
      par4: cpf || '',
      par5: sexo || 'O',
      par6: nascimento || '',   // yyyy-mm-dd
      par7: '',                  // RG (opcional)
      par8: 'BRA',               // nacionalidade
      par9: cep || '',
      par10: endereco || '',
      par11: numero || '',
      par12: complemento || '',
      par13: bairro || '',
      par14: cidade || '',
      par15: uf || '',
      par16: ddd || '',
      par17: tel || '',
      par18: ddd || '',          // DDD2 obrigatório — replica o DDD1
      par19: tel || '',          // tel2 obrigatório — replica o tel1
      par20: '',                 // passaporte
      par21: '21',               // gênero musical obrigatório (ID padrão: Pop)
      par22: 'S',
      par23: newsletter || 'N',
      par24: lgpd || 'S',
    });
    const response = await axios.get(`${url}?${params.toString()}`, { timeout: 10000, responseType: 'arraybuffer' });
    let data;
    try { data = JSON.parse(decodeBody(response.data)); } catch { data = {}; }

    const sucesso = data?.statusId === '00' || data?.usu_id || data?.id;
    if (!sucesso) {
      return res.status(400).json({ error: data?.statusMsg || data?.mensagem || 'Erro ao criar conta' });
    }
    res.json({ ok: true, usu_id: data?.usu_id || data?.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/recover', async (req, res) => {
  try {
    const { identificador } = req.body;
    const data = await gt('/ws/geral/usuario.asp', {
      gmet: '5',
      par1: identificador || '',
      par2: PDV,
    });
    const sucesso = data?.statusId === '00' || data?.ok;
    if (!sucesso) {
      return res.status(400).json({ error: data?.statusMsg || 'Não foi possível processar a solicitação' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Frontend estático (build de produção) ────────────────────────────────────
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — todas as rotas não-API devolvem o index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3012;
app.listen(PORT, () => console.log(`Tickfy backend rodando em http://localhost:${PORT}`));
