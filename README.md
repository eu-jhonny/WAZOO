# 🐾 Wazoo

E-commerce pet para cães e gatos, com catálogo, carrinho, checkout, conta do cliente, rastreio de pedidos, cupons, avaliações e painel administrativo.

## 🚀 Branch de produção

A branch usada para o novo e-commerce é:

`codex/ecommerce-real`

No Vercel, configure **Project Settings → Git → Production Branch** com exatamente esse nome. Depois é necessário existir pelo menos um deployment dessa branch; mudar a configuração não publica commits históricos automaticamente.

## ✨ Tecnologias

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- lucide-react

### Backend
- Node.js + Express
- PostgreSQL
- Prisma
- JWT + bcrypt
- Mercado Pago
- Cloudinary
- SMTP

## 🛒 Estrutura de e-commerce

- Catálogo e categorias
- Variações de produto
- Controle de estoque
- Carrinho
- Cupons
- Frete e frete grátis
- Checkout
- PIX via Mercado Pago
- Pedidos e rastreio
- Clientes, endereços e pets
- Avaliações
- Banners e campanhas
- Painel administrativo
- Reserva temporária de estoque durante pagamento

## ⚙️ Frontend

Crie as variáveis com base em `.env.example`.

A principal variável de produção é:

```env
VITE_API_URL=https://sua-api-wazoo.com
```

Comandos:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
```

## ⚙️ Backend

O backend fica em `server/`.

Crie as variáveis com base em `server/.env.example` e configure banco, JWT, Mercado Pago, Cloudinary, SMTP e CORS.

```bash
cd server
npm install
npx prisma generate
npm run build
npm start
```

## 🧪 Validação automática

A branch possui CI com:

- build do frontend;
- build da API;
- teste de runtime em navegador real.

O smoke test abre a homepage depois do build e falha se o React não renderizar ou se houver erro de JavaScript.

---

Feito para a nova fase da Wazoo como e-commerce real. 🐾
