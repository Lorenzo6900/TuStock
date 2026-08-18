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
