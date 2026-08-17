# QR Stock — Plan del producto

## Estado: en producción ✅
Desplegado en Vercel: **https://tu-stock-tau.vercel.app**
Repo: **https://github.com/Lorenzo6900/TuStock**
Cuenta Vercel: team `lorenzo-s-team`, proyecto `tu-stock`.
Login con Google y con email/contraseña, probados de punta a punta en producción.

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
4. **Agregar producto (`/add`, protegido)**: sacar/subir foto → en paralelo Gemini (a) le pone nombre y (b) le quita el fondo y lo deja blanco → pantalla de revisión (editable) → guardar. Si falla lo del fondo, se guarda la foto original tal cual para no bloquear el flujo. Solo se guarda la imagen final (no el original), para no gastar espacio de más.
5. **Compartir**: "Generar QR" muestra un QR apuntando a `/menu/<slug>` — la vista pública de solo lectura, sin ningún botón de edición.
6. **Menú público (`/menu/<slug>`)**: cualquiera que escanee el QR ve el catálogo de ese negocio (nombre del negocio + productos), sin poder tocar nada.

## Decisiones técnicas

| Pieza | Elección | Por qué |
|---|---|---|
| Auth | Auth.js (`next-auth` v5) — Google OAuth + Credentials (email/contraseña con bcrypt) | Estándar para Next.js, soporta ambos métodos con el mismo adapter. |
| Multi-tenant | `user_id` en `products`, `slug` único en `users` | Cada negocio aislado; URL pública prolija por slug en vez de un ID random. |
| IA (nombre) | Gemini 3.6 Flash (texto + visión) vía API directa de Google AI Studio | Identifica y nombra el producto. Antes era `gemini-2.5-flash`, pero dejó de estar disponible para cuentas/API keys nuevas (ver "Notas"). |
| IA (quitar fondo) | Gemini 2.5 Flash Image (edición de imagen) vía la misma API | Reemplaza el fondo por blanco liso, sin tocar el producto. No hay proveedor grande que lo dé gratis (se evaluó Hugging Face RMBG, descartado por cold starts/rate limits) — sale centavos por imagen, corre en el servidor (`app/api/process-image/route.ts`), en paralelo con la llamada que pone el nombre. |
| Frontend | Next.js (React) | Un solo proyecto sirve frontend y backend, fácil de desplegar gratis (Vercel). |
| Base de datos + imágenes | Neon (Postgres serverless, capa gratuita) | Usuarios, sesiones y productos (imagen en `bytea`) todo en la misma base. |
| QR | Librería `qrcode` (server-side, sin servicios externos) | Gratis, sin depender de un tercero. |

## APIs / cuentas que se usan
- **Google AI Studio** (Gemini API key) — para nombrar el producto (gratis) y quitar el fondo (pago, centavos por imagen).
  - La key de Gemini vive en una **cuenta de Google separada de la personal** (creada solo para esto, con facturación activada). El login de la app (Google OAuth) sigue usando el Google Cloud project de siempre — son cosas independientes, no mezclar.
  - "Tener Google One AI Premium / Gemini Advanced" (la suscripción de la app de Gemini) **no** da crédito para esta API — son productos distintos. Lo que hace falta es activar facturación (Cloud Billing) en el proyecto de la API key, desde `aistudio.google.com/apikey` → botón "Set up billing" → cargar tarjeta → Prepay (mínimo $10) o Postpay. Cuentas de Cloud nuevas suelen recibir $300 de crédito de bienvenida.
- **Neon** — gratis, para la base de datos (usuarios + productos).
- **Google Cloud OAuth** (Client ID/Secret) — gratis, para "Iniciar sesión con Google". Proyecto/cuenta distinto del de Gemini (ver arriba).

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
- `app/api/process-image/route.ts` — llama a Gemini en paralelo: nombre (`gemini-3.6-flash`) + quitar fondo (`gemini-2.5-flash-image`); requiere sesión. Si falla quitar el fondo, devuelve la imagen original.
- `app/api/products/route.ts` — guarda/lista productos, siempre scopeado a `session.user.id`.
- `app/api/products/[id]/image/route.ts` — sirve la imagen (pública, ID no adivinable).
- `app/api/qr/route.ts` — genera el PNG del QR.
- `lib/db.ts` — todas las queries a Neon (usuarios y productos).
- `lib/slug.ts` — genera el slug a partir del nombre del negocio.
- `db/schema.sql` — esquema completo (usuarios, cuentas OAuth, sesiones, productos).

## Para vos: cómo correrlo en local
1. API key gratis de Google AI Studio en https://aistudio.google.com/apikey.
2. Proyecto gratis en https://neon.tech, correr `db/schema.sql`, copiar el connection string.
3. Credenciales OAuth en Google Cloud Console (Client ID/Secret) con `http://localhost:3000/api/auth/callback/google` como redirect URI autorizado (en producción hace falta agregar TAMBIÉN `https://tu-stock-tau.vercel.app/api/auth/callback/google`, ya está agregado).
4. Copiar `.env.local.example` a `.env.local` y completar `GEMINI_API_KEY`, `DATABASE_URL`, `AUTH_SECRET` (generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
5. `npm run dev` y abrir `http://localhost:3000`.

**Nota de entorno:** en PowerShell, `npm`/`npx` fallan por política de ejecución de scripts — usar `npm.cmd`/`npx.cmd` en su lugar (o correr en `cmd` en vez de PowerShell).

**Pendiente de tu lado:** en Google Cloud Console, la pantalla de consentimiento OAuth muestra el nombre "n8n2" (project reusado) — conviene renombrarlo a algo como "QR Stock" en el "OAuth consent screen" para que no confunda a tus usuarios al loguearse.

## Cómo desplegar cambios nuevos
1. Local: `git add`, `git commit`.
2. `git push origin main` **desde la terminal de VS Code** (no desde Claude Code — ahí falla por falta de credenciales de git configuradas).
3. Vercel redespliega solo al detectar el push (Deployments > se ve el nuevo build).
4. Si cambiás variables de entorno en Vercel, hace falta un **Redeploy** manual o un push nuevo para que se apliquen — y al crearlas, verificar que el campo "Value" realmente tenga contenido pegado (ver incidente en "Notas" abajo).

## Notas / incidentes ya resueltos (para no repetir el diagnóstico)
- **Build fallaba en Vercel** por `useSearchParams()` sin `<Suspense>` en `/login` — Next.js lo exige para prerenderizar, pero no falla en `next dev` local, solo en `next build`.
- **Login roto en producción con "server configuration error"**: las variables de entorno se habían guardado en Vercel con el campo *Value* vacío (probablemente un paste que no se aplicó). El diagnóstico definitivo fue crear una ruta temporal que hacía `Object.keys(process.env)` — mostró que las claves SÍ existían pero con string vacío. Lección: si `vercel env ls` dice que existen pero la app no las ve, no asumir que el nombre está mal — puede ser el valor vacío.
- **`OAuthAccountNotLinked`**: pasa si ya existe un `user` en la DB con ese email (creado con contraseña) y después intentás loguearte con Google usando el mismo email — Auth.js no linkea automático por seguridad. Se resuelve borrando la cuenta vieja (si no tiene datos) o logueándose con la contraseña original.
- **`redirect_uri_mismatch` al loguearse con Google en producción**: pasa si entrás por una **URL de deployment específico** de Vercel (tipo `tu-stock-ekwict4ya-lorenzo-s-team.vercel.app`, que cambia en cada deploy) en vez de la URL estable (`https://tu-stock-tau.vercel.app`). Solo la estable está autorizada en Google Cloud Console — no hay que agregar la de cada deploy, se rompería de nuevo en el próximo. Para probar login en producción, siempre entrar por la URL estable.
- **`models/gemini-2.5-flash is no longer available to new users`**: al crear una API key en una cuenta de Google que nunca usó Gemini API, algunos modelos (como `gemini-2.5-flash`) no están habilitados para "usuarios nuevos" — hay que usar el modelo que sugiere el propio error (en este caso `gemini-3.6-flash`). El modelo de imagen (`gemini-2.5-flash-image`) sí funcionó igual con la cuenta nueva.

## Pendiente (próxima etapa)
- Precio, stock/cantidad, categorías, búsqueda/filtros.
- Edición/borrado de productos ya cargados.
- Recuperar contraseña (hoy no existe flujo de "olvidé mi contraseña").
- Permitir editar el nombre del negocio/slug después de creado (hoy se define una sola vez).
