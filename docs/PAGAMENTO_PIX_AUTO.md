# Confirmação automática de PIX (Mercado Pago)

Por padrão, o PIX é **estático**: o cliente paga e clica em "Já fiz o pagamento"
para registrar o pedido.

Ativando o Mercado Pago, o PIX passa a ter **confirmação automática**: o QR é
gerado pelo provedor (sem sair do nosso site, sem a tela do Mercado Pago) e,
assim que o pagamento cai, **o pedido é registrado sozinho** — o cliente nem
precisa clicar em nada.

> Enquanto você não configurar, o checkout continua funcionando no modo PIX
> estático (manual). Nada quebra.

---

## Como funciona (técnico)

- `api/pix/create.js` (função serverless na Vercel) cria a cobrança PIX na API
  do Mercado Pago e devolve o QR + "copia e cola". A chave secreta
  (`MP_ACCESS_TOKEN`) fica **só no servidor**.
- O checkout mostra o QR e faz *polling* em `api/pix/status.js` a cada poucos
  segundos. Quando o status vira `approved`, o pedido é criado automaticamente.

## Passo a passo

### 1. Criar a aplicação no Mercado Pago
1. Acesse <https://www.mercadopago.com.br/developers/panel/app> e crie uma
   aplicação (tipo: Pagamentos online / Checkout API).
2. Cadastre uma **chave PIX** na sua conta Mercado Pago (necessária para receber).

### 2. Pegar o Access Token
Em **Suas integrações → sua app → Credenciais**:
- Para testar: use as credenciais de **teste** (`TEST-...`).
- Para receber de verdade: use as credenciais de **produção** (`APP_USR-...`).

Copie o **Access Token**.

### 3. Configurar as variáveis na Vercel
Em **Project → Settings → Environment Variables**, adicione:

| Nome                  | Valor                         | Observação                              |
|-----------------------|-------------------------------|-----------------------------------------|
| `VITE_PAYMENTS_AUTO`  | `true`                        | Liga o fluxo automático no site         |
| `MP_ACCESS_TOKEN`     | `APP_USR-...` (ou `TEST-...`) | **Secreto** — sem o prefixo `VITE_`     |

Depois clique em **Redeploy**.

### 4. Testar
- Abra o site, finalize um pedido escolhendo **PIX**.
- O QR é gerado e a tela fica "Aguardando o pagamento…".
- Pague (em teste, use o app/sandbox do Mercado Pago).
- Em poucos segundos a tela vira "Pagamento confirmado!" e o pedido aparece em
  **Admin → Pedidos** e em **Meus pedidos**.

---

## Limitações / melhorias futuras
- A confirmação automática funciona enquanto a **tela do checkout está aberta**
  (o site fica consultando o status). Se o cliente fechar a aba antes de pagar,
  ele ainda pode pagar pelo "copia e cola" e enviar o comprovante pelo WhatsApp.
- Para registrar o pedido mesmo com a aba fechada, o próximo passo seria um
  **webhook** do Mercado Pago + pedidos salvos no Supabase (hoje os pedidos
  ficam no aparelho). Posso implementar isso depois, se quiser.
- O **valor** enviado ao Mercado Pago já considera o desconto do PIX configurado
  no Admin → Pagamento.
