# CLAUDE.md — Regras do Projeto (Portal do Ingresso / Tickfy)

> ⚠️ LEIA ANTES DE QUALQUER ALTERAÇÃO. Estas regras são confirmadas por testes reais na API
> e pela documentação oficial do G-ticket. **NÃO desviar, NÃO inventar, NÃO assumir.**
> Em caso de dúvida sobre a API, conferir a doc oficial: https://dev.gticket.com.br/sites/docs/v2/api/

---

## 0. Escopo de alteração — NUNCA tocar sem pedido explícito

Estes arquivos/pastas são **protegidos**. Só altero se o usuário pedir diretamente e por nome:

| Arquivo / Pasta | Motivo |
|---|---|
| `backend/server.js` | Lógica de API e roteamento — qualquer mudança quebra o site |
| `backend/.env` | Credenciais — nunca tocar |
| `frontend/vite.config.js` | Configuração de build — afeta chunks, proxy, portas |
| `frontend/tailwind.config.js` | Tokens de design — só alterar em tarefa de design system |
| `frontend/src/services/gticket.js` | Contratos de API — só alterar em tarefa de API |
| `frontend/src/pages/` (exceto Home) | Outras páginas — só alterar se a tarefa nomear a página |
| `frontend/package.json` / `package-lock.json` | Dependências — só instalar se pedido |

**Regra de ouro de escopo:** se a tarefa diz "design", mexo apenas em `.css`, `.jsx` visual e componentes de UI. Não otimizo build, não renomeio variáveis, não reorganizo imports, não altero config — a menos que o usuário peça explicitamente.

---

## 0. Regras de ouro (inquebráveis)

1. **Fonte de dados ÚNICA = G-ticket** (`sis.tickfy.com.br`). **Base44 foi REMOVIDO 100%** — nunca reintroduzir `base44`, nem qualquer segundo painel/banco.
2. **Nunca cadastrar eventos pelo site.** Eventos são geridos só no painel do próprio G-ticket. O site é **vitrine + checkout**.
3. **Sempre seguir o formato EXATO de payload/parâmetros da doc.** Não renomear campos, não trocar tipos, não adicionar campos que a doc não tem.
4. **Toda mudança deve ser DEFENSIVA:** recurso novo só liga sob o flag do evento; eventos simples têm que continuar funcionando idênticos. Sempre testar regressão num evento simples (ex.: evento 90).
5. **Não quebrar o que funciona.** Antes de editar checkout/pagamento, reler este arquivo e o `memory/project_gticket_api.md`.

---

## 1. Stack e execução

- **Frontend:** React 18 + Vite 5 + Tailwind + React Router (`frontend/`).
- **Backend:** Node + Express (`backend/server.js`) — serve a API (`/api/*`) **e** o build do frontend (`frontend/dist`).
- **Porta:** `3012` (definida em `backend/.env` → `PORT=3012`).
- **Variáveis (`backend/.env`):** ver `backend/.env.example` (o `.env` real NÃO vai pro git).
  - `GTICKET_BASE_URL=https://sis.tickfy.com.br`
  - `GTICKET_KEY=<defina no .env — não commitar>`
  - `GTICKET_PDV_ID=1`
- **Rodar local + público (teste):**
  1. `cd frontend && npm run build`
  2. `cd backend && node server.js` (porta 3012)
  3. Túnel: `ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3012 serveo.net`
- **Sempre buildar o frontend após mexer em `frontend/`** — o backend serve o `dist`, não o código-fonte.

---

## 2. Encoding (REGRA CRÍTICA — não reverter)

A API do G-ticket retorna o conteúdo em **ISO-8859-1 (Latin-1)**, apesar de às vezes o header mentir.
- O helper `gt()` no backend baixa como `arraybuffer` e usa `decodeBody()`: tenta UTF-8 estrito; se falhar, decodifica como **latin1**. **NÃO remover isso** ou volta o `�` em "Crianças", "Urânia", "Peão".
- Campos de **descrição** (`descricao`/`release`/`infogeral`) vêm com **HTML** (`<br />`, `&aacute;`, `&#128293;`) → renderizar com `dangerouslySetInnerHTML` (já feito em `Evento.jsx`). Nome/cidade/ingresso são texto puro.

---

## 3. Autenticação / Usuário (`usuario.asp`)

- **Senha (regra ESTRITA):** maiúscula + minúscula + número + caractere especial (`$`, `*` ou `@`), 6–10 caracteres.
- **Cadastro (gmet=5) — 24 parâmetros, TODOS posicionais.** Obrigatórios que costumam ser esquecidos:
  - `par16/par17` (DDD1/tel1) e `par18/par19` (DDD2/tel2) → **todos obrigatórios**; se não houver 2º telefone, **repetir par16/par17 em par18/par19**.
  - `par21` (gênero musical) → obrigatório; default `"21"`.
  - `par24` (LGPD) → se `N`, o SIS recusa o cadastro.
- **Login = gmet=1** (par1=email/CPF, par2=senha, par3=IP, par4=`S`). Retorna `usu_id`.
- **Dados completos por CPF = gmet=4.** **Histórico de compras = gmet=2** (retorna `PAGAMENTOS[]`).
- Sucesso sempre `statusId == "00"`.

---

## 4. Checkout / Pagamento (REGRAS QUE JÁ DERAM PROBLEMA)

- **`usu_id` TEM que ser real (logado).** `usu_id:"0"` (convidado) faz o gateway devolver `status:"CA"` (cancelado). **Login é obrigatório antes de pagar.**
- **Gateway é POR EVENTO** — ler `config_mobile.asp gmet=2`:
  - `gateway_cartao`: `PSG_T` (PagSeguro) | `MPTP` (Mercado Pago) | `PAGAR` (Pagar-me) | `AARIN`.
  - **Nunca hardcodar `PSG_T`.** Usar o dispatcher `POST /api/checkout` que roteia:
    - PSG_T → `/pseg_api/index.php` (cartão/boleto) e `/pseg_api/index_pix.php` (PIX)
    - MPTP → `/mp_api/index.php` · PAGAR → `/pagar_api/index.php` · AARIN → `/aarin_api/index.php`
  - PIX: se `eve_aceita_pix_aarin=S` → Aarin; senão PagSeguro.
- **Métodos exibidos** conforme flags: `eve_aceita_pix`, `eve_aceita_pix_aarin`, `eve_ocultar_cartao`, `eve_aceita_boleto`.
- **Payload PIX (PagSeguro) — formato EXATO da doc:**
  - `gateway:"PSG_T"` (sim, PSG_T mesmo no PIX), `valor` e `valor_parcela` como **string** (`"26.75"`), `hash:null`, `bandeira:"pix"`, campos de cartão (`n_car/m_car/a_car/c_car`) **vazios**.
  - `data_nasc` no formato **DD/MM/YYYY**.
  - **NÃO** colocar `nome_comprador` em `dados_do_comprador` (só existe em `dados_do_usuario`).
- **Status de pagamento:** `PG`=Pago, `EA`=Em Análise, `CA`=Cancelado, `NP`=Não Pago, `DV`=Devolvido. Só exibir QR se `pgto_codigo` não vazio.
- ⚠️ **Limitação conhecida do lado G-ticket:** se `pseg_api_public_key` vier preenchido, a doc diz que o `index_pix.php` está "em desenvolvimento". Se o PIX continuar `CA` mesmo com `usu_id` real, **é problema do G-ticket** — abrir chamado com eles, não ficar mudando nosso payload.

---

## 5. Eventos / Ingressos (`evento.asp`, `setorlote.asp`)

- **Listagem:** `evento.asp gmet=1` → `{ Lista: [...] }` (campos: `codigo`, `nome`, `destaque`(=featured), `data`, `horario`, `local`, `cidade`, `estado`, `logo`).
- **Detalhe:** `evento.asp gmet=2` → `nome`, `descricao`/`release`/`infogeral`, `logo`, `genero`(=categoria), `valores[0].min`(=preço a partir de), `classificacao`, flags de pagamento.
- **Setores:** `setorlote.asp gmet=2` → `SETOR[]` (`gru_id`, `nome`).
- **Lotes:** `setorlote.asp gmet=4` → `LOTES[]` (`lot_cod`, `ite_cod`, `nome`, `valor`, `mesa`, `assento_parcial`, `mapa_id`, `categoria`, `lot_qtde_min/max`, `esgotado`).
- **Tipos de ingresso (detectar pelos campos do lote):**
  - `mesa==='S'` → venda de mesa → `setorlote gmet=6` lista `MESAS` (`mes_id`, `mes_numero`) → IDs vão em `venda.mes_id`.
  - `mapa_id>0` → lugar marcado → `mas_id`. **Mapa VISUAL depende de componentes PHP do G-ticket** (`mapa_img_real.php`/`form_mapa.php`) — não dá pra fazer só em Node.
  - `categoria==='P'` → ingresso adicional/combo (`setorlote gmet=13`).
- `mes_id`/`mas_id` são **listas por vírgula** alinhadas posicionalmente a `ite_cod`/`qtd_ing`. Sem mesa/lugar → `"0"`.

---

## 6. Outros recursos (já implementados — manter o padrão)

- **Cupom:** `vale_desconto.asp` → guardar `val_id` em `venda.val_id`.
- **Boleto:** `forma_pagto=BOL` + `data_vencimento` (config `eve_dias_vencto_bol`) + `taxa_boleto` (`eve_val_taxa_bol`).
- **Meia/limite CPF:** `evento.asp gmet=4` (`liberado`, `venda_meia`); respeitar `lot_qtde_min/max`.
- **Nominal:** `ingresso_nominal==='S'` → página `/nominar/:pagId` (`usuario gmet=3` lista, `evento gmet=13` campos extras, `ingresso gmet=6` envia). Formato do `gmet=6`: `ite_cod¢nome+sobrenome¢cpf¢ing_id¢eve_cod`, espaço = `+`, ingressos separados por `|`.
- **Gêneros (filtro):** `ListaGeneros.asp gmet=3` + busca por `txt_genero`.
- **Cortesias:** `usuario.asp gmet=14`.

---

## 7. Antes de finalizar QUALQUER tarefa

1. `cd frontend && npm run build` → sem erros.
2. Garantir **0 ocorrências** de `base44` em `frontend/src`.
3. Testar **regressão** num evento simples (compra fluindo, acentos corretos).
4. Conferir o log do backend (`[PAY]`/`[PIX]`) — `usu_id` real e gateway correto.
5. Se mexeu em regra da API, **atualizar `memory/project_gticket_api.md`**.
