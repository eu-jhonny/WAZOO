# 🚀 Wazoo Pet Express — Guia de Deploy Completo

Stack gratuita: **Vercel** (frontend) + **Render** (API) + **Supabase** (PostgreSQL) + **Cloudinary** (imagens)

---

## 1. Supabase — Banco de dados (GRÁTIS — 500 MB)

1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New Project**
3. Anote as informações:
   - **Connection String** → `Settings → Database → Connection string (URI)`
   - Formato: `postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres`

---

## 2. Cloudinary — Imagens (GRÁTIS — 10 GB)

1. Acesse https://cloudinary.com e crie conta gratuita
2. No Dashboard, copie:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## 3. MercadoPago — Pagamentos (sem custo fixo)

1. Crie conta em https://www.mercadopago.com.br
2. Acesse https://www.mercadopago.com.br/developers/panel
3. Crie um **Aplicativo**
4. Copie:
   - **Public Key** (começa com `APP_USR-`) → vai no frontend
   - **Access Token** (começa com `APP_USR-`) → vai no backend
5. Configure o webhook: `https://SUA-API.onrender.com/api/payments/webhook`

---

## 4. Render — API Backend (GRÁTIS — 750h/mês)

1. Acesse https://render.com → **New → Web Service**
2. Conecte seu repositório GitHub
3. Configure:
   ```
   Root Directory: server
   Build Command: npm ci && npx prisma generate && npm run build
   Start Command: npx prisma migrate deploy && node dist/index.js
   ```
4. Adicione as variáveis de ambiente:
   ```
   NODE_ENV = production
   DATABASE_URL = [string do Supabase]
   JWT_SECRET = [string aleatória longa]
   REFRESH_SECRET = [outra string aleatória]
   ADMIN_EMAIL = admin@seusite.com.br
   ADMIN_PASSWORD = SenhaForte2024!
   MP_ACCESS_TOKEN = [seu access token do MP]
   CLOUDINARY_CLOUD_NAME = [seu cloud name]
   CLOUDINARY_API_KEY = [sua api key]
   CLOUDINARY_API_SECRET = [seu api secret]
   ALLOWED_ORIGINS = https://seusite.vercel.app
   FRONTEND_URL = https://seusite.vercel.app
   API_URL = https://wazoo-api.onrender.com
   ```
5. Após deploy, execute o seed:
   - Render Shell: `npx tsx src/lib/seed.ts`
   - Isso cria o admin e dados iniciais

---

## 5. Vercel — Frontend (GRÁTIS — ilimitado)

1. Acesse https://vercel.com → **New Project**
2. Importe seu repositório GitHub
3. Configure:
   ```
   Framework Preset: Vite
   Root Directory: . (raiz)
   Build Command: npm run build
   Output Directory: dist
   ```
4. Adicione as variáveis de ambiente:
   ```
   VITE_API_URL = https://wazoo-api.onrender.com
   VITE_MP_PUBLIC_KEY = APP_USR-xxxx (sua public key do MP)
   ```
5. Clique em **Deploy**

---

## 6. Desenvolvimento local

```bash
# 1. Clone e instale dependências
git clone <seu-repo>
cd WAZOO

# Frontend
npm install
cp .env.example .env.local
# Edite .env.local com seus valores
npm run dev

# Backend (em outro terminal)
cd server
npm install
cp .env.example .env
# Edite .env com seus valores
npx prisma generate
npx prisma db push        # cria as tabelas
npm run db:seed           # seed inicial
npm run dev               # inicia API em http://localhost:3001
```

---

## 7. Painel Admin

Após o seed, acesse:
```
https://seusite.vercel.app/admin
E-mail: admin@wazoo.com.br (ou o que você definiu em ADMIN_EMAIL)
Senha: WazooAdmin2024! (ou o que você definiu em ADMIN_PASSWORD)
```

No painel você pode:
- ✅ Gerenciar produtos e kits
- ✅ Visualizar e atualizar pedidos
- ✅ Aprovar avaliações
- ✅ Criar cupons de desconto
- ✅ Gerenciar banners
- ✅ Alterar configurações da loja

---

## 8. Resumo de custos mensais (todos gratuitos!)

| Serviço    | Plano   | Limite              |
|------------|---------|---------------------|
| Vercel     | Free    | 100 GB bandwidth    |
| Render     | Free    | 750h/mês (suficiente)|
| Supabase   | Free    | 500 MB PostgreSQL   |
| Cloudinary | Free    | 10 GB storage       |
| MercadoPago| Pós-pago| 5,49% + R$0,39/transação |

**Total fixo: R$ 0,00/mês** 🎉

---

## 9. Como fica o pagamento (Transparent Checkout)

O MercadoPago Bricks é **100% embutido** na sua página:
- 💳 Cartão de crédito/débito: formulário aparece dentro do seu site
- 💚 PIX: QR Code gerado e exibido dentro do seu site
- 📄 Boleto: link gerado e exibido dentro do seu site

O cliente **nunca sai do seu site** para pagar. ✅
