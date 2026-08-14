# QR Stock — Plan del producto

## Idea central
Web para que tiendas/negocios/restaurantes suban stock sacando una foto en el momento.
La IA identifica el objeto y le pone un nombre, y se guarda en el catálogo del negocio.
Cada negocio tiene su propia cuenta y su propio catálogo público (para compartir por QR).

## Alcance actual
- **Multi-tenant real**: cada usuario tiene su cuenta y su propio catálogo (aislado por `user_id`).
- Login con Google o con email/contraseña.
- Cada negocio elige un nombre → se genera un slug único para su URL pública (`/menu/<slug>`).
- El catálogo guarda: **imagen + nombre**. Precio, stock, categoría → etapas futuras.

## Flujo de usuario

1. **Landing (`/`)**: si no hay sesión, invita a crear cuenta o iniciar sesión. Si ya hay sesión, redirige directo a `/dashboard`.
2. **Signup (`/signup`)**: con Google, o con nombre + nombre del negocio + email + contraseña.
   - Con Google: como Google no da el nombre del negocio, se pide en un paso extra (`/onboarding`) la primera vez.
   - Con email: se pide todo junto y se genera el slug ahí mismo.
3. **Dashboard (`/dashboard`, protegido)**: catálogo del dueño — grilla de productos, botón "Generar QR" y "+ Agregar producto".
4. **Agregar producto (`/add`, protegido)**: sacar/subir foto → la IA (Gemini, gratis) le pone nombre → pantalla de revisión (editable) → guardar. *(Por ahora no se quita el fondo — ver "Pendiente")*.
5. **Compartir**: "Generar QR" muestra un QR apuntando a `/menu/<slug>` — la vista pública de solo lectura, sin ningún botón de edición.
6. **Menú público (`/menu/<slug>`)**: cualquiera que escanee el QR ve el catálogo de ese negocio (nombre del negocio + productos), sin poder tocar nada.

## Decisiones técnicas

| Pieza | Elección | Por qué |
|---|---|---|
| Auth | Auth.js (`next-auth` v5) — Google OAuth + Credentials (email/contraseña con bcrypt) | Estándar para Next.js, soporta ambos métodos con el mismo adapter. |
| Multi-tenant | `user_id` en `products`, `slug` único en `users` | Cada negocio aislado; URL pública prolija por slug en vez de un ID random. |
| IA (nombre) | Gemini 2.5 Flash (texto + visión) vía API directa de Google AI Studio | Capa gratuita real (probado). Solo identifica y nombra el producto; no genera/edita imágenes. |
| Frontend | Next.js (React) | Un solo proyecto sirve frontend y backend, fácil de desplegar gratis (Vercel). |
| Base de datos + imágenes | Neon (Postgres serverless, capa gratuita) | Usuarios, sesiones y productos (imagen en `bytea`) todo en la misma base. |
| QR | Librería `qrcode` (server-side, sin servicios externos) | Gratis, sin depender de un tercero. |

## APIs / cuentas que se usan
- **Google AI Studio** (Gemini API key) — gratis, para identificar y nombrar el producto.
- **Neon** — gratis, para la base de datos (usuarios + productos).
- **Google Cloud OAuth** (Client ID/Secret) — gratis, para "Iniciar sesión con Google".

## Estado actual — estructura del código
- `app/page.tsx` — landing pública (invita a crear cuenta / iniciar sesión).
- `app/login/page.tsx`, `app/signup/page.tsx` — pantallas de login/registro (Google + email).
- `app/onboarding/page.tsx` — paso extra post-Google para definir nombre del negocio/slug.
- `app/dashboard/page.tsx` — catálogo del dueño (protegido).
- `app/add/page.tsx` — sacar/subir foto, revisar, guardar (protegido).
- `app/menu/[slug]/page.tsx` — catálogo público de solo lectura por negocio.
- `auth.ts` — configuración de Auth.js (providers, callbacks, adapter).
- `proxy.ts` — protección de rutas (`/dashboard`, `/add`, `/onboarding` requieren sesión; Next.js 16 renombró `middleware.ts` a `proxy.ts`).
- `app/api/auth/[...nextauth]/route.ts` — endpoints de Auth.js.
- `app/api/signup/route.ts` — registro con email/contraseña (hashea con bcrypt, genera slug).
- `app/api/onboarding/route.ts` — completa nombre del negocio/slug tras login con Google.
- `app/api/process-image/route.ts` — llama a Gemini (gratis) para el nombre; requiere sesión.
- `app/api/products/route.ts` — guarda/lista productos, siempre scopeado a `session.user.id`.
- `app/api/products/[id]/image/route.ts` — sirve la imagen (pública, ID no adivinable).
- `app/api/qr/route.ts` — genera el PNG del QR.
- `lib/db.ts` — todas las queries a Neon (usuarios y productos).
- `lib/slug.ts` — genera el slug a partir del nombre del negocio.
- `db/schema.sql` — esquema completo (usuarios, cuentas OAuth, sesiones, productos).

## Para vos: cómo dejarlo corriendo
1. API key gratis de Google AI Studio en https://aistudio.google.com/apikey.
2. Proyecto gratis en https://neon.tech, correr `db/schema.sql`, copiar el connection string.
3. Credenciales OAuth en Google Cloud Console (Client ID/Secret) con `http://localhost:3000/api/auth/callback/google` como redirect URI autorizado.
4. Copiar `.env.local.example` a `.env.local` y completar `GEMINI_API_KEY`, `DATABASE_URL`, `AUTH_SECRET` (generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
5. `npm run dev` y abrir `http://localhost:3000`.

**Pendiente de tu lado:** en Google Cloud Console, la pantalla de consentimiento OAuth muestra el nombre "n8n2" (project reusado) — conviene renombrarlo a algo como "QR Stock" en el "OAuth consent screen" para que no confunda a tus usuarios al loguearse.

## Pendiente (próxima etapa)
- **Quitar el fondo de la imagen.** Ningún proveedor grande (Google, OpenRouter) lo da gratis. Opciones: (a) pagar centavos por imagen vía Gemini/OpenRouter, o (b) un modelo open-source (RMBG) alojado gratis en Hugging Face.
- Precio, stock/cantidad, categorías, búsqueda/filtros.
- Edición/borrado de productos ya cargados.
- Recuperar contraseña (hoy no existe flujo de "olvidé mi contraseña").
- Permitir editar el nombre del negocio/slug después de creado (hoy se define una sola vez).
