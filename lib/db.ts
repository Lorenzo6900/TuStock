import { Pool } from "@neondatabase/serverless";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type Product = {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
  description: string | null;
  mime_type: string;
  created_at: string;
};

export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  password: string | null;
  business_name: string | null;
  business_type: string | null;
  categories: string[] | null;
  slug: string | null;
};

export async function listProducts(userId: string): Promise<Product[]> {
  const { rows } = await pool.query(
    "select id, name, price, category, description, mime_type, created_at from products where user_id = $1 order by created_at desc",
    [userId]
  );
  return rows;
}

export async function insertProduct(
  userId: string,
  name: string,
  image: Buffer,
  mimeType: string,
  price: number | null,
  category: string | null,
  description: string | null
): Promise<Product> {
  const { rows } = await pool.query(
    `insert into products (user_id, name, image, mime_type, price, category, description)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, name, price, category, description, mime_type, created_at`,
    [userId, name, image, mimeType, price, category, description]
  );
  return rows[0];
}

export async function updateProduct(
  id: string,
  userId: string,
  name: string,
  price: number | null,
  category: string | null,
  description: string | null
): Promise<Product | null> {
  const { rows } = await pool.query(
    `update products
     set name = $3, price = $4, category = $5, description = $6
     where id = $1 and user_id = $2
     returning id, name, price, category, description, mime_type, created_at`,
    [id, userId, name, price, category, description]
  );
  return rows[0] ?? null;
}

// Ajusta todos los precios (o los de una categoría) por un porcentaje y los redondea
// al múltiplo de `step` más cercano (0.01 = sin redondeo, 10, 50, 100...).
export async function bulkUpdatePrices(
  userId: string,
  percent: number,
  step: number,
  category: string | null
): Promise<number> {
  const { rowCount } = await pool.query(
    `update products
     set price = round(price * (1 + $2::numeric / 100) / $3::numeric) * $3::numeric
     where user_id = $1 and price is not null
       and ($4::text is null or category = $4)`,
    [userId, percent, step, category]
  );
  return rowCount ?? 0;
}

export async function deleteProduct(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "delete from products where id = $1 and user_id = $2",
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}

export async function getProductImage(
  id: string
): Promise<{ image: Buffer; mimeType: string } | null> {
  const { rows } = await pool.query(
    "select image, mime_type from products where id = $1",
    [id]
  );
  if (rows.length === 0) return null;
  return { image: rows[0].image, mimeType: rows[0].mime_type };
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  const { rows } = await pool.query(
    "select * from users where slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query(
    "select * from users where email = $1",
    [email]
  );
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query("select * from users where id = $1", [id]);
  return rows[0] ?? null;
}

// Un slug está ocupado si otro negocio lo usa hoy o lo usó antes (sus QR viejos
// siguen apuntando ahí). Si se pasa `userId`, los slugs propios no cuentan.
export async function isSlugTaken(slug: string, userId?: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from users where slug = $1 and ($2::uuid is null or id <> $2)
     union all
     select 1 from slug_redirects where old_slug = $1 and ($2::uuid is null or user_id <> $2)`,
    [slug, userId ?? null]
  );
  return rows.length > 0;
}

export async function getSlugRedirect(oldSlug: string): Promise<string | null> {
  const { rows } = await pool.query(
    `select u.slug from slug_redirects r join users u on u.id = r.user_id
     where r.old_slug = $1`,
    [oldSlug]
  );
  return rows[0]?.slug ?? null;
}

// Cambia nombre y slug del negocio; el slug anterior queda como redirección.
export async function updateBusinessProfile(
  userId: string,
  businessName: string,
  newSlug: string
): Promise<{ user: User; oldSlug: string | null }> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows: current } = await client.query(
      "select slug from users where id = $1 for update",
      [userId]
    );
    const oldSlug: string | null = current[0]?.slug ?? null;

    if (oldSlug && oldSlug !== newSlug) {
      await client.query(
        `insert into slug_redirects (old_slug, user_id) values ($1, $2)
         on conflict (old_slug) do nothing`,
        [oldSlug, userId]
      );
    }
    // Si vuelve a un slug que ya había usado, deja de ser redirección.
    await client.query(
      "delete from slug_redirects where old_slug = $1 and user_id = $2",
      [newSlug, userId]
    );

    const { rows } = await client.query(
      "update users set business_name = $2, slug = $3 where id = $1 returning *",
      [userId, businessName, newSlug]
    );
    await client.query("commit");
    return { user: rows[0], oldSlug };
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserSlug(userId: string): Promise<string | null> {
  const { rows } = await pool.query("select slug from users where id = $1", [userId]);
  return rows[0]?.slug ?? null;
}

export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expires: Date
): Promise<void> {
  // Un solo link válido por usuario: pedir uno nuevo invalida el anterior.
  await pool.query("delete from password_reset_tokens where user_id = $1", [userId]);
  await pool.query(
    "insert into password_reset_tokens (token_hash, user_id, expires) values ($1, $2, $3)",
    [tokenHash, userId, expires]
  );
}

export async function getLastPasswordResetRequest(userId: string): Promise<Date | null> {
  const { rows } = await pool.query(
    "select max(created_at) as last from password_reset_tokens where user_id = $1",
    [userId]
  );
  return rows[0]?.last ?? null;
}

// Consume el token (se borra al usarlo) y devuelve el usuario si era válido.
export async function consumePasswordResetToken(tokenHash: string): Promise<string | null> {
  const { rows } = await pool.query(
    "delete from password_reset_tokens where token_hash = $1 returning user_id, expires",
    [tokenHash]
  );
  const row = rows[0];
  if (!row || new Date(row.expires) < new Date()) return null;
  return row.user_id;
}

export async function setUserPassword(userId: string, passwordHash: string): Promise<void> {
  await pool.query("update users set password = $2 where id = $1", [userId, passwordHash]);
}

export async function createUserWithPassword(
  name: string,
  email: string,
  passwordHash: string,
  businessName: string,
  slug: string,
  businessType: string | null,
  categories: string[]
): Promise<User> {
  const { rows } = await pool.query(
    `insert into users (name, email, password, business_name, slug, business_type, categories)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [name, email, passwordHash, businessName, slug, businessType, categories]
  );
  return rows[0];
}

export async function setUserBusinessInfo(
  userId: string,
  businessName: string,
  slug: string,
  businessType: string | null,
  categories: string[]
): Promise<User> {
  const { rows } = await pool.query(
    `update users
     set business_name = $2, slug = $3, business_type = $4, categories = $5
     where id = $1
     returning *`,
    [userId, businessName, slug, businessType, categories]
  );
  return rows[0];
}
