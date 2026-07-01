import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { gticket, validarCPF } from '../services/gticket.js';
import { IconBolt, IconCard, IconReceipt, IconQr, IconCheck, IconClock, IconCalendar } from '../components/Icons.jsx';

// Detecta bandeira pelo número do cartão
function detectBrand(num) {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|650|6516|6550)/.test(n)) return 'elo';
  if (/^(606282|3841)/.test(n)) return 'hipercard';
  if (/^3(0[0-5]|[68])/.test(n)) return 'diners';
  return '';
}

const BRAND_LABEL = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', elo: 'Elo', hipercard: 'Hipercard', diners: 'Diners' };

export default function Checkout() {
  const { gticketId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [loading, setLoading] = useState(false);
  const [payStatus, setPayStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [pixData, setPixData] = useState(null);

  // Config de pagamento do evento (define gateway e métodos aceitos)
  const [payConfig, setPayConfig] = useState(null);

  // Cupom de desconto
  const [coupon, setCoupon] = useState('');
  const [couponData, setCouponData] = useState(null); // { val_id, valor_desconto, valor_total }
  const [couponError, setCouponError] = useState('');

  // Forma de entrega (default: e-mail = 2)
  const [deliveryId, setDeliveryId] = useState('2');
  const [deliveryOptions, setDeliveryOptions] = useState([]);

  // Login state
  const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggedUser, setLoggedUser] = useState(null);

  // Cartão — campos reais
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '', brand: '' });
  const [installments, setInstallments] = useState([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const binFetchRef = useRef('');

  const [form, setForm] = useState({
    nome: '', email: '', cpf: '', telefone: '', dataNasc: '',
    cep: '', logradouro: '', numero: '', cidade: '', uf: '',
  });

  useEffect(() => {
    const ev = sessionStorage.getItem('checkout_event');
    const tk = sessionStorage.getItem('checkout_tickets');
    if (ev) setEvent(JSON.parse(ev));
    if (tk) setTickets(JSON.parse(tk));

    // Se já existe usuário logado globalmente, usa para o checkout (usu_id real)
    try {
      const stored = JSON.parse(localStorage.getItem('tickfy_user'));
      if (stored?.usu_id) hydrateLoggedUser(stored);
    } catch {}

    // Carrega a config de pagamento do evento (gateway + métodos aceitos)
    gticket.checkout.paymentConfig(gticketId)
      .then((cfg) => {
        setPayConfig(cfg);
        // Define método inicial conforme o que o evento aceita
        const aceitaPix = cfg?.eve_aceita_pix === 'S' || cfg?.eve_aceita_pix_aarin === 'S';
        const aceitaCartao = cfg?.eve_ocultar_cartao !== 'S';
        if (aceitaPix) setPaymentMethod('PIX');
        else if (aceitaCartao) setPaymentMethod('CARTÃO');
      })
      .catch(() => {});
  }, []);

  // Métodos de pagamento disponíveis conforme a config do evento
  const availableMethods = useMemo(() => {
    const cfg = payConfig || {};
    const methods = [];
    if (cfg.eve_aceita_pix === 'S' || cfg.eve_aceita_pix_aarin === 'S' || !payConfig) methods.push('PIX');
    if (cfg.eve_ocultar_cartao !== 'S') methods.push('CARTÃO');
    // Boleto desativado: não vendemos no boleto.
    return methods.length ? methods : ['PIX', 'CARTÃO'];
  }, [payConfig]);

  // Gateway a usar conforme método e config
  function resolveGateway(method) {
    const cfg = payConfig || {};
    if (method === 'PIX') {
      if (cfg.eve_aceita_pix_aarin === 'S') return 'AARIN';
      return cfg.gateway_cartao || 'PSG_T';
    }
    return cfg.gateway_cartao || 'PSG_T';
  }

  // Carrega dados completos do usuário (gmet=4 por CPF) e pré-preenche o formulário
  async function hydrateLoggedUser(stored) {
    let full = stored;
    const cpf = stored.cpf || stored.usu_cpf || '';
    if (cpf) {
      try {
        const r = await fetch(`/api/auth/user-by-cpf/${cpf.replace(/\D/g, '')}`);
        const d = await r.json();
        if (d?.statusId === '00') full = { ...stored, ...d };
      } catch {}
    }
    function parseDt(s) {
      if (!s) return '';
      const p = String(s).split('/');
      if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
      return s;
    }
    setLoggedUser({ ...full, usu_id: stored.usu_id });
    setForm((prev) => ({
      ...prev,
      nome: full.nome || stored.nome || '',
      email: full.email || stored.email || '',
      cpf: full.cpf || cpf || '',
      telefone: (full.dddtel || full.dddcel || '') + (full.telefone || full.celular || prev.telefone || ''),
      dataNasc: parseDt(full.datanascimento || full.data_nasc || ''),
      cep: full.cep || prev.cep || '',
      logradouro: full.endereco || prev.logradouro || '',
      numero: full.numero || prev.numero || '',
      cidade: full.cidade || prev.cidade || '',
      uf: full.uf || prev.uf || '',
    }));
  }

  // Busca parcelamento quando tem 6+ dígitos do cartão
  useEffect(() => {
    if (paymentMethod !== 'CARTÃO') return;
    const bin = card.number.replace(/\D/g, '').slice(0, 6);
    if (bin.length < 6 || bin === binFetchRef.current) return;
    binFetchRef.current = bin;
    setInstallments([]);
    setSelectedInstallment(null);
    setInstallmentsLoading(true);
    fetch(`/api/installments?eventId=${gticketId}&amount=${total}&bin=${bin}`)
      .then((r) => r.json())
      .then((data) => {
        setInstallments(data.installments || []);
        setSelectedInstallment(data.installments?.[0] || null);
      })
      .catch(() => {})
      .finally(() => setInstallmentsLoading(false));
  }, [card.number, paymentMethod]);

  // Quando muda para PIX, limpa seleção de parcelas
  useEffect(() => {
    if (paymentMethod === 'PIX') { setInstallments([]); setSelectedInstallment(null); }
  }, [paymentMethod]);

  function setCardField(field, value) {
    setCard((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'number') next.brand = detectBrand(value);
      return next;
    });
  }

  function formatCardNumber(val) {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await gticket.auth.login(loginForm.email, loginForm.senha, '127.0.0.1');
      if (data?.statusId !== '00') {
        setLoginError(data?.statusMsg || 'Email ou senha incorretos');
        return;
      }

      // Busca dados completos (gmet=4) para preencher telefone, endereço, etc.
      const cpf = data.cpf || data.usu_cpf || '';
      let full = data;
      if (cpf) {
        try {
          const r = await fetch(`/api/auth/user-by-cpf/${cpf}`);
          const d = await r.json();
          if (d?.statusId === '00') full = { ...data, ...d };
        } catch {}
      }

      // Converte data "DD/MM/YYYY" → "YYYY-MM-DD" para o campo date
      function parseDt(s) {
        if (!s) return '';
        const p = s.split('/');
        if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
        return s;
      }

      const usuId = data.usu_id || data.id;
      setLoggedUser({ ...full, usu_id: usuId });

      // Persiste login globalmente (Header + Minha Conta)
      try {
        localStorage.setItem('tickfy_user', JSON.stringify({
          usu_id: usuId,
          nome: full.nome || loginForm.email,
          email: full.email || loginForm.email,
          cpf: full.cpf || cpf || '',
        }));
        window.dispatchEvent(new Event('tickfy_auth_changed'));
      } catch {}

      setForm((prev) => ({
        ...prev,
        nome: full.nome || '',
        email: full.email || loginForm.email,
        cpf: full.cpf || '',
        telefone: (full.dddtel || full.dddcel || '') + (full.telefone || full.celular || ''),
        dataNasc: parseDt(full.datanascimento || full.data_nasc || ''),
        cep: full.cep || '',
        logradouro: full.endereco || '',
        numero: full.numero || '',
        cidade: full.cidade || '',
        uf: full.uf || '',
      }));
    } catch (err) {
      setLoginError('Erro ao conectar. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  }

  const total = tickets.reduce((acc, t) => acc + t.price * t.quantity, 0);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório';
    if (!form.email.trim()) errs.email = 'Email obrigatório';
    if (!validarCPF(form.cpf)) errs.cpf = 'CPF inválido';
    if (!form.telefone.trim()) errs.telefone = 'Telefone obrigatório';
    if (!form.dataNasc.trim()) errs.dataNasc = 'Data de nascimento obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Exige usuário logado (usu_id real) — PIX/cartão do G-ticket não aceitam usu_id "0"
    if (!loggedUser?.usu_id) {
      setSubmitError('Você precisa entrar ou se cadastrar antes de pagar.');
      return;
    }
    if (!validate()) return;

    const ddd = form.telefone.replace(/\D/g, '').slice(0, 2);
    const tel = form.telefone.replace(/\D/g, '').slice(2);

    const qtdList = tickets.map((t) => t.quantity).join(',');
    const iteList = tickets.map((t) => t.ite_cod).join(',');
    const setorList = tickets.map((t) => t.id_setor).join(',');
    const pdvList = tickets.map(() => '1').join(',');

    // Tokenizar cartão via PagSeguro SDK se disponível (silencioso)
    let cardToken = '';
    if (paymentMethod === 'CARTÃO' && window.PagSeguroDirectPayment) {
      try {
        cardToken = await new Promise((resolve) => {
          const [expM, expY] = (card.expiry || '/').split('/');
          window.PagSeguroDirectPayment.createCardToken({
            cardNumber: card.number.replace(/\D/g, ''),
            brand: card.brand,
            cvv: card.cvv,
            expirationMonth: expM,
            expirationYear: expY?.length === 2 ? '20' + expY : expY,
            success: (r) => resolve(r.card?.token || ''),
            error: () => resolve(''),
          });
        });
      } catch { cardToken = ''; }
    }

    const isCard = paymentMethod === 'CARTÃO';
    const isPix  = paymentMethod === 'PIX';
    const isBoleto = paymentMethod === 'BOLETO';
    const formaPagto = isPix ? 'PIX' : isBoleto ? 'BOL' : 'CAR';
    const gateway = resolveGateway(paymentMethod);

    // Total já considerando cupom de desconto, se aplicado
    const baseTotal = couponData ? parseFloat(String(couponData.valor_total).replace(',', '.')) : total;
    const descontoStr = couponData ? String(couponData.valor_desconto).replace(',', '.') : '0';

    const parcQtd = isCard ? (selectedInstallment?.quantity || 1) : 1;
    const parcVal = isCard ? (selectedInstallment?.amount || baseTotal) : baseTotal;
    const totalFinal = isCard ? (selectedInstallment?.totalAmount || baseTotal) : baseTotal;
    const totalFinalStr = totalFinal.toFixed(2);
    const parcValStr   = parcVal.toFixed(2);

    // Boleto: vencimento conforme config do evento (dias) e taxa
    const diasBol = parseInt(payConfig?.eve_dias_vencto_bol || '1') || 1;
    const vencimento = isBoleto
      ? new Date(Date.now() + diasBol * 86400000).toISOString().replace(/\.\d+Z$/, '-03:00')
      : '';
    const taxaBoleto = isBoleto ? (payConfig?.eve_val_taxa_bol || '0') : '0';

    const [expM, expY] = (card.expiry || '/').split('/');
    const cardDigits = card.number.replace(/\D/g, '');

    // data_nasc deve ser DD/MM/YYYY — converter se vier como YYYY-MM-DD (usuário logado)
    const dataNascApi = (() => {
      const d = form.dataNasc;
      if (!d) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [y, m, dy] = d.split('-');
        return `${dy}/${m}/${y}`;
      }
      return d; // já no formato DD/MM/YYYY (convidado digita direto)
    })();

    // mes_id / mas_id: usa as unidades escolhidas (mesa/lugar) quando houver; senão '0'
    const mesList = tickets.map((t) => (t.mesa === 'S' && t.units?.length ? t.units.join(',') : '0')).join(',');
    const masList = tickets.map((t) => (Number(t.mapa_id) > 0 && t.units?.length ? t.units.join(',') : '0')).join(',');

    const venda = {
      usu_id: String(loggedUser.usu_id),
      token: cardToken,
      pdv_id: pdvList,
      eve_cod: tickets.map(() => gticketId).join(','),
      qtd_ing: qtdList,
      mes_id: mesList,
      mas_id: masList,
      ite_cod: iteList,
      id_setor: setorList,
      val_id: couponData?.val_id || '',
      valor_desconto: descontoStr,
      valor_unit: tickets[0]?.price?.toFixed(2) || '0',
      valor: totalFinalStr,
      pro_id: 0,
      forma_de_entrega: deliveryId,
      forma_entrega_valor: '0',
      taxa_boleto: taxaBoleto,
      forma_pagto: formaPagto,
      data_vencimento: vencimento,
      hash: isCard ? cardToken : null,
      // Campos do exemplo oficial da doc (Pag-seguro transparente PIX)
      valor_seguro: '0',
      pagar_antigo: '',
    };

    const dadosComprador = {
      valor_parcela: parcValStr,
      parcelas: parcQtd,
      cep: form.cep.replace(/\D/g, ''),
      logradouro: form.logradouro,
      bandeira: isPix ? 'pix' : isBoleto ? 'boleto' : (card.brand || ''),
      cpf: form.cpf.replace(/\D/g, ''),
      numero_cc: isCard ? cardDigits.slice(0, 6) : '',
      ip: '127.0.0.1',
      ddd, tel,
      numero: form.numero,
      cidade: form.cidade,
      uf: form.uf,
      email: form.email,
      data_nasc: dataNascApi,
      n_car: isCard ? cardDigits : '',
      m_car: isCard ? (expM || '') : '',
      a_car: isCard ? (expY ? (expY.length === 2 ? '20' + expY : expY) : '') : '',
      c_car: isCard ? card.cvv : '',
    };

    const dadosUsuario = {
      cep: form.cep.replace(/\D/g, ''),
      logradouro: form.logradouro,
      cpf: form.cpf.replace(/\D/g, ''),
      nome_comprador: form.nome,
      ddd_tel: ddd, tel,
      numero: form.numero,
      cidade: form.cidade,
      uf: form.uf,
      email: form.email,
    };

    const payload = {
      binary_mode: true,
      gateway,
      acesso_via: 'S',
      tot_evento: 1,
      venda, dados_do_comprador: dadosComprador, dados_do_usuario: dadosUsuario,
      aceita_3ds: payConfig?.eve_aceita_3ds === 'S' ? 'S' : 'N',
    };

    setSubmitError('');
    try {
      setLoading(true);
      setPayStatus(isPix ? 'Gerando seu PIX, aguarde alguns segundos…' : 'Processando seu pagamento…');
      // Dispatcher: roteia para o gateway correto conforme config do evento
      const result = await gticket.checkout.pay(gateway, formaPagto, payload);

      // O G-ticket gera o pedido/ingresso ao processar o pagamento — pag_id é a referência
      const pagId = result?.pag_id || result?.pgto_id || '';

      if (isPix) {
        // 1) Tenta pegar o código já na resposta do checkout
        let code = result?.pgto_codigo || result?.qr_code || result?.pix_codigo || '';
        let qr   = result?.pgto_link || result?.qr_code_link_img || result?.qr_code_base64 || '';

        // 2) Fluxo PagSeguro/PagBank: o pedido nasce "em análise" (EA) e o QR do PIX é
        //    gerado logo em seguida. Ele NÃO vem na resposta do checkout — vem na consulta
        //    de pagamento (pagamento.asp gmet=1). Buscamos com algumas tentativas.
        if (!code && pagId && result?.status !== 'CA') {
          for (let i = 0; i < 5 && !code; i++) {
            if (i >= 1) setPayStatus('Quase lá, finalizando seu PIX…');
            await new Promise((r) => setTimeout(r, i === 0 ? 800 : 2000));
            try {
              const pay = await gticket.payment.status(pagId);
              code = pay?.qr_code || pay?.pgto_codigo || pay?.pix_codigo || '';
              qr   = pay?.qr_code_link_img || pay?.qr_code_base64 || pay?.pgto_link || qr;
              // Só desiste se o gateway cancelou E não há QR pra pagar
              if (!code && pay?.status === 'CA') break;
            } catch { /* tenta de novo */ }
          }
        }

        if (code) {
          setPixData({ code, qr, pagId });
        } else {
          const msg = result?.status === 'CA'
            ? 'Pagamento PIX cancelado pelo gateway. Tente novamente ou use outro método.'
            : result?.statusMsg || result?.msg || 'Não foi possível gerar o PIX. Tente novamente.';
          setSubmitError(msg);
        }
      } else {
        if (result?.status === 'PG' || result?.statusId === '00' || result?.status === 'EA' || pagId) {
          navigate(`/pedido/${pagId}`);
        } else {
          setSubmitError(result?.statusMsg || result?.msg || 'Pagamento não aprovado. Verifique os dados do cartão e tente novamente.');
        }
      }
    } catch (err) {
      setSubmitError('Erro ao processar pagamento: ' + err.message);
    } finally {
      setLoading(false);
      setPayStatus('');
    }
  }

  // Aplicar cupom de desconto
  async function applyCoupon() {
    setCouponError('');
    if (!coupon.trim()) return;
    try {
      const params = {
        eventId: gticketId,
        code: coupon.trim(),
        total: total.toFixed(2),
        qty: tickets.reduce((a, t) => a + t.quantity, 0),
        item: tickets.map((t) => t.ite_cod).join(','),
        delivery: deliveryId,
      };
      const d = await gticket.checkout.voucher(params);
      if (d?.statusId === '00' && d?.val_id) {
        setCouponData({ val_id: d.val_id, valor_desconto: d.valor_desconto, valor_total: d.valor_total, exibir: d.valor_desconto_exibir });
      } else {
        setCouponData(null);
        setCouponError(d?.statusMsg || 'Cupom inválido para este evento.');
      }
    } catch {
      setCouponError('Não foi possível validar o cupom.');
    }
  }

  if (pixData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card p-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <IconQr size={32} />
          </div>
          <h2 className="text-2xl font-bold text-paper mb-2">Pague via PIX</h2>
          <p className="text-muted mb-6">Escaneie o QR Code ou copie o código</p>
          {pixData.qr && (
            <img src={pixData.qr} alt="QR Code PIX" className="mx-auto mb-4 rounded-xl" />
          )}
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-400 break-all">{pixData.code}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(pixData.code)}
            className="btn-primary w-full"
          >
            Copiar Código PIX
          </button>
          {pixData.pagId && (
            <Link to={`/pedido/${pixData.pagId}`} className="btn-secondary w-full mt-3 inline-block">
              Já paguei — acompanhar pedido
            </Link>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Overlay de processamento — evita a sensação de "travou/deu erro" enquanto o PIX é gerado */}
      {loading && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          role="status"
          aria-live="polite"
          style={{ background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(3px)' }}
        >
          <div className="card p-8 text-center w-full max-w-xs" style={{ borderRadius: 18 }}>
            <div
              aria-hidden="true"
              className="w-12 h-12 mx-auto mb-5 rounded-full animate-spin"
              style={{ border: '3px solid var(--bd-md)', borderTopColor: 'var(--neon)' }}
            />
            <p className="text-white font-semibold" style={{ fontFamily: '"Clash Display", sans-serif', fontSize: '1.05rem' }}>
              {payStatus || 'Processando…'}
            </p>
            <p className="text-muted text-sm mt-2">Não feche esta página.</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

          {/* Identificação — login obrigatório antes de pagar */}
          {!loggedUser && (
            <div className="card p-6">
              <h2 className="text-white font-semibold mb-1">Identificação</h2>
              <p className="text-gray-400 text-sm mb-4">Entre com sua conta para finalizar a compra.</p>
              <div className="space-y-3">
                <input
                  type="email" placeholder="Email do cadastro"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  className="input"
                />
                <input
                  type="password" placeholder="Senha"
                  value={loginForm.senha}
                  onChange={(e) => setLoginForm((p) => ({ ...p, senha: e.target.value }))}
                  className="input"
                />
                {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                <button
                  type="button" onClick={handleLogin}
                  disabled={loginLoading || !loginForm.email || !loginForm.senha}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loginLoading ? 'Entrando...' : 'Entrar e preencher dados'}
                </button>
                <Link
                  to="/cadastro"
                  state={{ from: `/checkout/${gticketId}` }}
                  className="block w-full text-center text-gray-500 text-sm hover:text-gray-300 transition-colors pt-1"
                >
                  Não tenho cadastro — Criar conta →
                </Link>
              </div>
            </div>
          )}

          {/* Dados do Comprador — aparece logado (pré-preenchido e editável) */}
          {loggedUser && <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-paper font-semibold">Dados do Comprador</h2>
              <span className="text-primary text-sm font-medium flex items-center gap-1.5"><IconCheck size={14} /> {loggedUser.nome || loggedUser.usu_nome}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="ck-nome" className="block text-faint text-xs mb-1.5">Nome completo *</label>
                <input id="ck-nome" autoComplete="name" placeholder="Seu nome completo" value={form.nome} onChange={(e) => setField('nome', e.target.value)} className="input" />
                {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome}</p>}
              </div>
              <div>
                <label htmlFor="ck-email" className="block text-faint text-xs mb-1.5">E-mail *</label>
                <input id="ck-email" type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" value={form.email} onChange={(e) => setField('email', e.target.value)} className="input" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="ck-cpf" className="block text-faint text-xs mb-1.5">CPF *</label>
                <input id="ck-cpf" inputMode="numeric" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setField('cpf', e.target.value)} className="input" maxLength={14} />
                {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
              </div>
              <div>
                <label htmlFor="ck-tel" className="block text-faint text-xs mb-1.5">Telefone (DDD + número) *</label>
                <input id="ck-tel" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 90000-0000" value={form.telefone} onChange={(e) => setField('telefone', e.target.value)} className="input" />
                {errors.telefone && <p className="text-red-400 text-xs mt-1">{errors.telefone}</p>}
              </div>
              <div>
                <label htmlFor="ck-nasc" className="block text-faint text-xs mb-1.5">Data de nascimento *</label>
                <input id="ck-nasc" inputMode="numeric" placeholder="DD/MM/AAAA" value={form.dataNasc} onChange={(e) => setField('dataNasc', e.target.value)} className="input" />
                {errors.dataNasc && <p className="text-red-400 text-xs mt-1">{errors.dataNasc}</p>}
              </div>
              <div>
                <label htmlFor="ck-cep" className="block text-faint text-xs mb-1.5">CEP</label>
                <input id="ck-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={form.cep} onChange={(e) => setField('cep', e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="ck-end" className="block text-faint text-xs mb-1.5">Endereço</label>
                <input id="ck-end" autoComplete="address-line1" placeholder="Rua, avenida..." value={form.logradouro} onChange={(e) => setField('logradouro', e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="ck-num" className="block text-faint text-xs mb-1.5">Número</label>
                <input id="ck-num" inputMode="numeric" placeholder="Nº" value={form.numero} onChange={(e) => setField('numero', e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="ck-cidade" className="block text-faint text-xs mb-1.5">Cidade</label>
                <input id="ck-cidade" autoComplete="address-level2" placeholder="Cidade" value={form.cidade} onChange={(e) => setField('cidade', e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="ck-uf" className="block text-faint text-xs mb-1.5">UF</label>
                <input id="ck-uf" placeholder="SP" value={form.uf} onChange={(e) => setField('uf', e.target.value.toUpperCase())} className="input" maxLength={2} />
              </div>
            </div>
          </div>}

          {/* Forma de pagamento — só aparece logado */}
          {loggedUser && (
            <div className="card p-6">
              <h2 className="text-white font-semibold mb-4">Forma de Pagamento</h2>
              <div className="flex gap-3 mb-6">
                {availableMethods.map((m) => (
                  <button
                    key={m} type="button"
                    onClick={() => setPaymentMethod(m)}
                    aria-pressed={paymentMethod === m}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                      paymentMethod === m ? 'bg-primary text-black' : 'bg-white/5 text-muted hover:bg-white/10'
                    }`}
                  >
                    {m === 'PIX' ? <IconBolt /> : <IconCard />}
                    {m === 'PIX' ? 'PIX' : 'Cartão'}
                  </button>
                ))}
              </div>

              {/* Cupom de desconto */}
              <div className="mb-6">
                <label className="text-gray-400 text-sm block mb-1">Cupom de desconto</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Digite o código"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    className="input flex-1"
                    disabled={!!couponData}
                  />
                  {couponData ? (
                    <button type="button" onClick={() => { setCouponData(null); setCoupon(''); }} className="btn-secondary px-4">Remover</button>
                  ) : (
                    <button type="button" onClick={applyCoupon} className="btn-secondary px-4">Aplicar</button>
                  )}
                </div>
                {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                {couponData && <p className="text-primary text-xs mt-1 flex items-center gap-1.5"><IconCheck size={13} /> Desconto aplicado: {couponData.exibir || `R$ ${couponData.valor_desconto}`}</p>}
              </div>

              {paymentMethod === 'PIX' && (
                <div className="bg-white/[0.03] border border-ink-line rounded-xl p-4 space-y-2.5 text-sm text-muted">
                  <p className="flex items-center gap-2.5"><IconBolt className="text-primary" /> Aprovação instantânea</p>
                  <p className="flex items-center gap-2.5"><IconCheck className="text-primary" /> Sem taxas adicionais</p>
                  <p className="flex items-center gap-2.5"><IconQr className="text-primary" /> QR Code gerado após a confirmação</p>
                </div>
              )}

              {paymentMethod === 'CARTÃO' && (
                <div className="space-y-4">
                  {/* Número do cartão */}
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Número do cartão</label>
                    <div className="relative">
                      <input
                        placeholder="0000 0000 0000 0000"
                        value={card.number}
                        onChange={(e) => setCardField('number', formatCardNumber(e.target.value))}
                        className="input w-full pr-20"
                        inputMode="numeric"
                        maxLength={19}
                      />
                      {card.brand && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {BRAND_LABEL[card.brand] || card.brand}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nome no cartão */}
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nome no cartão</label>
                    <input
                      placeholder="NOME SOBRENOME"
                      value={card.name}
                      onChange={(e) => setCardField('name', e.target.value.toUpperCase())}
                      className="input w-full"
                      autoComplete="cc-name"
                    />
                  </div>

                  {/* Validade + CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm block mb-1">Validade (MM/AA)</label>
                      <input
                        placeholder="MM/AA"
                        value={card.expiry}
                        onChange={(e) => setCardField('expiry', formatExpiry(e.target.value))}
                        className="input w-full"
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm block mb-1">CVV</label>
                      <input
                        placeholder="000"
                        value={card.cvv}
                        onChange={(e) => setCardField('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="input w-full"
                        inputMode="numeric"
                        maxLength={4}
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>

                  {/* Parcelamento — aparece após digitar BIN */}
                  {installmentsLoading && (
                    <div className="text-gray-500 text-sm py-2">Consultando parcelas...</div>
                  )}

                  {!installmentsLoading && installments.length > 0 && (
                    <div>
                      <label className="text-gray-400 text-sm block mb-2">Parcelas</label>
                      <select
                        value={selectedInstallment?.quantity || 1}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value);
                          setSelectedInstallment(installments.find((i) => i.quantity === qty) || null);
                        }}
                        className="input w-full"
                      >
                        {installments.map((inst) => (
                          <option key={inst.quantity} value={inst.quantity}>
                            {inst.quantity}x de R$ {inst.amount.toFixed(2).replace('.', ',')}
                            {inst.interestFree ? ' (sem juros)' : ` — total R$ ${inst.totalAmount.toFixed(2).replace('.', ',')} (com juros)`}
                          </option>
                        ))}
                      </select>
                      {selectedInstallment && !selectedInstallment.interestFree && (
                        <p className="text-yellow-500 text-xs mt-1">
                          Total com juros: R$ {selectedInstallment.totalAmount.toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {submitError && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          {loggedUser && (
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
              {loading
                ? (paymentMethod === 'PIX' ? 'Gerando PIX…' : 'Processando…')
                : `Pagar R$ ${(paymentMethod === 'PIX' ? total : (selectedInstallment?.totalAmount || total)).toFixed(2).replace('.', ',')}`
              }
            </button>
          )}
        </form>

        {/* Resumo */}
        <div className="card p-6 h-fit sticky top-24">
          <h3 className="text-white font-bold mb-4">Resumo do Pedido</h3>
          {event && <p className="text-gray-400 text-sm mb-3">{event.title}</p>}
          {tickets.map((t, i) => (
            <div key={i} className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">{t.name} x{t.quantity}</span>
              <span className="text-white">R$ {(t.price * t.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-3 mt-3 flex justify-between font-bold">
            <span className="text-white">Total</span>
            <span className="text-primary text-xl">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
