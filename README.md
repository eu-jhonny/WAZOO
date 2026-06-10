# 🐾 Wazoo Pet Express

Loja pet online **sob encomenda** para cães e gatos. O cliente escolhe o produto,
envia o pedido pelo WhatsApp (ou finaliza a solicitação) e a loja confirma a
disponibilidade com fornecedores antes de concluir.

Site moderno, responsivo (mobile-first), com catálogo, kits, carrinho, área do
cliente (login, pets, pedidos com timeline) e **painel administrativo separado**.

## ✨ Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build e dev server)
- **Tailwind CSS** (identidade visual: laranja, azul escuro e creme)
- **React Router** (rotas e proteção de áreas)
- **lucide-react** (ícones)
- Dados simulados em TypeScript + persistência via **localStorage**
  (carrinho, login e dados da loja sobrevivem ao recarregar a página)

## 🚀 Como rodar

```bash
npm install      # instala as dependências
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção (pasta dist/)
npm run preview  # pré-visualiza o build de produção
npm run typecheck# checagem de tipos
```

## 🔑 Acessos de teste

| Perfil  | E-mail              | Senha     |
| ------- | ------------------- | --------- |
| Cliente | `cliente@wazoo.com` | `123456`  |
| Gestor  | `admin@wazoo.com`   | `admin123`|

> O painel do gestor fica em **/admin** (login separado em `/admin/login`).
> Clientes comuns **não** acessam a área administrativa.

## ⚙️ Configuração

Tudo que muda com frequência está em **`src/config/site.ts`**:

- **Número do WhatsApp** (`whatsappNumber`) — formato internacional, só dígitos
- Instagram, horário de atendimento, texto institucional, etc.

O número também pode ser alterado pelo painel em **Admin → Configurações**.

## 🖼️ Imagens da marca

As imagens originais (logo, mascotes, fotos de produtos e publicidade) ficam em
`assets-src/` e são otimizadas para `public/images/` (de ~45 MB para ~1,5 MB):

```bash
npm run optimize:images
```

Produtos sem foto exibem um **placeholder ilustrado** com gradiente e ícone da
categoria — o layout nunca quebra.

## 📁 Estrutura

```
src/
  config/      Configuração da loja (WhatsApp, imagens, chaves de storage)
  data/        Dados simulados (products, kits, reviews, orders, users, categories)
  types/       Tipos do domínio
  lib/         Helpers (moeda, datas, mensagens de WhatsApp, status)
  context/     Estado global (Auth, Cart, Store, Toast) com localStorage
  hooks/       usePersistentState
  components/  UI, layout, produto, formulários, admin
  pages/       Páginas do cliente e do admin (pasta admin/)
  routes/      Proteção de rotas (cliente e gestor)
```

## 🗺️ Rotas

**Cliente:** `/` · `/produtos` · `/produtos/:id` · `/kits` · `/como-funciona` ·
`/carrinho` · `/login` · `/cadastro` · `/perfil` · `/pedidos` · `/sobre` ·
`/avaliacoes` · `/politica-sob-encomenda` · `/politica-troca`

**Admin:** `/admin/login` · `/admin` · `/admin/produtos` · `/admin/pedidos` ·
`/admin/avaliacoes` · `/admin/configuracoes`

## 📦 Modelo de negócio

A loja **não tem estoque próprio**. Todos os produtos aparecem com o selo
**“Sob encomenda”** e o preço é tratado como **estimado**. O carrinho deixa claro
que a confirmação final (disponibilidade, prazo e valor) acontece depois, com o
fornecedor parceiro.

---

Feito com carinho para cães e gatos. 🐾
