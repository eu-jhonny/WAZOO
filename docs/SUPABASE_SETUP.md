# Sincronização de perfil entre aparelhos (Supabase)

Por padrão o site guarda o perfil do cliente **só no navegador** (localStorage).
Isso significa que, em outro celular/computador, o perfil não aparece.

Para o perfil **seguir o cliente em qualquer aparelho** (foto, nome, endereço,
pets), ative o Supabase seguindo os 4 passos abaixo. É **grátis** e leva ~5 min.

> Enquanto você não fizer isso, o site continua funcionando normalmente em modo
> offline — nada quebra.

---

## 1. Criar o projeto

1. Acesse <https://supabase.com> e crie uma conta (pode ser com o Google).
2. **New project** → dê um nome (ex.: `wazoo`), defina uma senha de banco e a região (escolha *South America (São Paulo)*).
3. Aguarde ~2 min até o projeto ficar pronto.

## 2. Rodar o SQL

No painel do projeto, abra **SQL Editor → New query**, cole TODO o bloco abaixo
e clique em **Run**:

```sql
-- Hashing seguro de senha
create extension if not exists pgcrypto;

-- Tabela de perfis (acessada SOMENTE pelas funções abaixo)
create table if not exists public.wazoo_profiles (
  email       text primary key,
  secret_hash text not null,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.wazoo_profiles enable row level security;
-- Sem políticas de acesso direto: ninguém lê/escreve a tabela com a anon key.

-- Cadastrar (falha se o e-mail já existir)
create or replace function public.wazoo_register(p_email text, p_secret text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if exists (select 1 from wazoo_profiles where email = v_email) then
    raise exception 'EMAIL_EXISTS';
  end if;
  insert into wazoo_profiles(email, secret_hash, data)
  values (v_email, crypt(p_secret, gen_salt('bf')), coalesce(p_data, '{}'::jsonb));
  return p_data;
end; $$;

-- Login (retorna o perfil só se o segredo conferir)
create or replace function public.wazoo_login(p_email text, p_secret text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email)); v_row wazoo_profiles;
begin
  select * into v_row from wazoo_profiles where email = v_email;
  if not found then return null; end if;
  if v_row.secret_hash = crypt(p_secret, v_row.secret_hash) then
    return v_row.data;
  end if;
  return null;
end; $$;

-- Salvar (cria se não existe; atualiza se o segredo conferir)
create or replace function public.wazoo_save(p_email text, p_secret text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email)); v_row wazoo_profiles;
begin
  select * into v_row from wazoo_profiles where email = v_email;
  if not found then
    insert into wazoo_profiles(email, secret_hash, data)
    values (v_email, crypt(p_secret, gen_salt('bf')), coalesce(p_data, '{}'::jsonb));
    return p_data;
  end if;
  if v_row.secret_hash = crypt(p_secret, v_row.secret_hash) then
    update wazoo_profiles set data = coalesce(p_data, '{}'::jsonb), updated_at = now()
    where email = v_email;
    return p_data;
  end if;
  raise exception 'INVALID_SECRET';
end; $$;

-- Permite que o app (papel anon) chame só estas 3 funções
grant execute on function public.wazoo_register(text, text, jsonb) to anon;
grant execute on function public.wazoo_login(text, text)          to anon;
grant execute on function public.wazoo_save(text, text, jsonb)    to anon;
```

## 3. Pegar as chaves

No painel: **Project Settings → API**. Copie:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 4. Configurar as variáveis

- **Local:** crie um arquivo `.env` na raiz com:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
  ```
- **Vercel:** Project → **Settings → Environment Variables** → adicione as duas
  e faça um novo deploy (Redeploy).

Pronto! A partir daí, ao entrar com o mesmo e-mail/senha (ou com o Google) em
qualquer aparelho, o perfil é restaurado automaticamente.

---

## Como funciona (resumo técnico)

- O app nunca acessa a tabela direto — só chama as funções `wazoo_register`,
  `wazoo_login` e `wazoo_save`, que são `SECURITY DEFINER` e verificam o
  "segredo" no servidor (senha do cliente, ou o `googleId` no login Google).
- A senha é guardada com **hash bcrypt** (`crypt`/`pgcrypto`), nunca em texto puro.
- Se as variáveis não estiverem configuradas, `isCloudEnabled` é `false` e tudo
  roda no `localStorage`, exatamente como antes.

### Limitações conhecidas
- **Pedidos** ainda são por aparelho (só o perfil sincroniza). Dá para estender
  a mesma ideia para pedidos depois, se quiser.
- **Trocar a senha** ("Esqueci minha senha") atualiza a nuvem apenas no aparelho
  onde foi feita; para reset por e-mail seria preciso um fluxo de verificação.
