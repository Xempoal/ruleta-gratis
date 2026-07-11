# 🚀 Publicar la Ruleta en Cloudflare Pages

## 🗄️ Base de datos de los "sorteos con link" (hacer UNA vez)

El módulo de sorteos con registro por link necesita una base D1 de Cloudflare
(gratis). Sin esto, el resto del sitio funciona igual; solo ese módulo dirá
"no está configurado todavía".

1. En **dash.cloudflare.com** → menú izquierdo **Almacenamiento y bases de datos**
   (Storage & Databases) → **D1 SQL Database** → **Create database**.
   Nombre: `ruleta-db` → **Create**.
2. Ve a tu proyecto de Pages (**ruleta-gratis**) → **Settings** → **Bindings**
   (o *Functions → D1 database bindings*) → **Add** → **D1 database**:
   - **Variable name:** `DB`  ← exactamente así, en mayúsculas
   - **D1 database:** `ruleta-db`
3. Guarda y vuelve a desplegar (Deployments → Retry deployment, o espera al
   siguiente push). Las tablas se crean solas en el primer uso.


La app es un sitio **estático** (solo archivos), así que Cloudflare lo sirve
gratis desde su CDN global y aguanta miles de personas a la vez.

Lo que se publica es **la carpeta `dist/`** (se genera con `npm run build`).

---

## ✅ OPCIÓN A — Subir la carpeta a mano (la más fácil, sin terminal)

1. Entra a **https://dash.cloudflare.com** e inicia sesión.
2. En el menú izquierdo: **Workers & Pages** → botón **Create** (Crear).
3. Elige la pestaña **Pages** → **Upload assets** (Subir archivos).
4. Nombre del proyecto: **ruleta-de-sorteos** → **Create project**.
5. Arrastra la carpeta **`C:\Users\Jose\RULETA\dist`** (o haz clic en
   *select from computer* y elige esa carpeta completa).
6. Pulsa **Deploy site**.
7. En ~20 segundos te da una URL tipo
   **https://ruleta-de-sorteos.pages.dev** — ¡ya está en internet! 🎉

> Para **actualizar** en el futuro: corre `npm run build` otra vez y vuelve a
> subir la carpeta `dist` en *Create new deployment* dentro del mismo proyecto.

---

## ⚡ OPCIÓN B — Desde la terminal con Wrangler (1 comando para re-publicar)

Útil si vas a actualizar seguido: con un comando reconstruyes y subes.

1. Inicia sesión en Cloudflare (abre el navegador para autorizar):
   ```
   npx wrangler login
   ```
2. Publica la carpeta `dist`:
   ```
   npx wrangler pages deploy dist --project-name ruleta-de-sorteos
   ```
   La primera vez crea el proyecto solo. Te dará la URL `*.pages.dev`.

Para re-publicar después de un cambio:
```
npm run build
npx wrangler pages deploy dist --project-name ruleta-de-sorteos
```

---

## 🔁 OPCIÓN C — Conectar a GitHub (auto-publica con cada cambio)

La mejor a largo plazo: cada vez que subas cambios a GitHub, Cloudflare
reconstruye y publica solo.

1. Sube este proyecto a un repo de GitHub.
2. En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Elige el repo y configura:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy**. Listo: cada `git push` redepliega automáticamente.

---

## 🌐 Dominio propio (opcional)

Dentro del proyecto en Cloudflare → pestaña **Custom domains** → añade tu dominio
(ej. `ruleta.tudominio.com`). Si tu dominio ya está en Cloudflare, se configura
solo con un clic.
