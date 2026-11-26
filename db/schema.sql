-- Ejecutar en Neon (SQL Editor o psql). Reemplaza el esquema anterior:
-- ahora los productos pertenecen a un usuario (multi-tenant).

create extension if not exists pgcrypto;

drop table if exists products;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  "emailVerified" timestamptz,
  image text,
  password text,
  business_name text,
  slug text unique,
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  type varchar(255) not null,
  provider varchar(255) not null,
  "providerAccountId" varchar(255) not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  id_token text,
  scope text,
  session_state text,
  token_type text
);
create unique index if not exists accounts_provider_account_unique
  on accounts (provider, "providerAccountId");

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null,
  "sessionToken" varchar(255) not null unique
);

create table if not exists verification_token (
  identifier text not null,
  expires timestamptz not null,
  token text not null,
  primary key (identifier, token)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  image bytea not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);
create index if not exists products_user_id_idx on products (user_id);

-- === Migración incremental (ejecutar SOLO estos ALTER en Neon, no el archivo entero) ===
-- El bloque de arriba borra la tabla products si existe; estos ALTER son
-- aditivos y no tocan datos existentes.
alter table products add column if not exists price numeric(10, 2);
alter table products add column if not exists category text;
alter table users add column if not exists business_type text;
alter table users add column if not exists categories text[];
alter table products add column if not exists description text;

-- Recuperar contraseña: se guarda solo el hash del token, nunca el token en sí.
create table if not exists password_reset_tokens (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_id_idx on password_reset_tokens (user_id);

-- Slugs viejos: si el negocio cambia su slug, los QR ya impresos siguen andando.
create table if not exists slug_redirects (
  old_slug text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Pedidos por WhatsApp: número del negocio en formato internacional, solo dígitos
-- (ej. 5491123456789). Si es null, el menú no muestra el carrito.
alter table users add column if not exists whatsapp text;

-- Personalización del menú. Todos opcionales: null = no se muestra.
-- brand_color: '#rrggbb'. hours: { "0".."6" (0 = domingo): [["12:00","15:00"], ...] },
-- un cierre <= apertura significa que pasa la medianoche. timezone: IANA (ej.
-- America/Argentina/Buenos_Aires), para calcular "Abierto ahora".
alter table users add column if not exists brand_color text;
alter table users add column if not exists address text;
alter table users add column if not exists instagram text;
alter table users add column if not exists hours jsonb;
alter table users add column if not exists timezone text;
-- Cuándo cambió el logo (null = sin logo); se usa para invalidar la caché de la imagen.
alter table users add column if not exists logo_updated_at timestamptz;

-- El logo va aparte para que los `select * from users` no traigan los bytes.
create table if not exists business_logos (
  user_id uuid primary key references users(id) on delete cascade,
  image bytea not null,
  mime_type text not null
);

-- Disponible / agotado (interruptor del dashboard). Los agotados se ven en gris en el menú.
alter table products add column if not exists available boolean not null default true;
