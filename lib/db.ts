import { Pool } from "@neondatabase/serverless";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type Product = {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
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
    "select id, name, price, category, mime_type, created_at from products where user_id = $1 order by created_at desc",
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
  category: string | null
): Promise<Product> {
  const { rows } = await pool.query(
    `insert into products (user_id, name, image, mime_type, price, category)
     values ($1, $2, $3, $4, $5, $6)
     returning id, name, price, category, mime_type, created_at`,
    [userId, name, image, mimeType, price, category]
  );
  return rows[0];
}

export async function updateProduct(
  id: string,
  userId: string,
  name: string,
  price: number | null,
  category: string | null
): Promise<Product | null> {
  const { rows } = await pool.query(
    `update products
     set name = $3, price = $4, category = $5
     where id = $1 and user_id = $2
     returning id, name, price, category, mime_type, created_at`,
    [id, userId, name, price, category]
  );
  return rows[0] ?? null;
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

export async function isSlugTaken(slug: string): Promise<boolean> {
  const { rows } = await pool.query("select 1 from users where slug = $1", [slug]);
  return rows.length > 0;
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
