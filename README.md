# 🎯 Ruleta de Sorteos

Ruleta de sorteos **100 % en el navegador**: no usa backend, no guarda datos y
todo se borra al cerrar la pestaña. Pensada para proyectar en vivo y sorprender.

Hecha con **Vite + React + TypeScript**. La ruleta se dibuja en `<canvas>`, el
confeti y los sonidos se generan en tiempo real (sin archivos externos), por lo
que el bundle pesa ~61 KB gzip y carga al instante.

## Funciones

- Hasta **100 participantes** (nombres, premios o cualquier texto)
- **Título** del sorteo personalizable y **logo** subible (solo en memoria)
- **4 plantillas** de diseño que el cliente elige (A · Limpio, B · Divertido 3D,
  C · Editorial, D · Fiesta): cambian fondo, decoración, botón y el estilo de la
  rueda (aro, puntero y centro)
- **Paleta de la ruleta** a gusto: paletas preset + **editor de colores** y color
  por segmento
- **1 a 10 ganadores**: el último en salir es el ganador; los previos quedan como
  suplentes en orden inverso (penúltimo = 2.º, etc.)
- Switch para **eliminar o no** al ganador de la ruleta
- Velocidad de giro (rápido / normal / dramático) y **cuenta regresiva 3·2·1**
- **Confeti**, modal de ganador, **podio** final, sonidos, modo claro/oscuro
- Atajo: **barra espaciadora** para girar · **pantalla completa** para proyectar
- Responsive + PWA (manifest). Aviso visible de privacidad

## Funciones ocultas (preparadas, apagadas por defecto)

Están **implementadas pero ocultas** hasta que las actives en
`src/config/features.ts` (cambia `false` → `true` y reconstruye). Para
previsualizarlas en vivo sin recompilar, abre la app con `?preview=social,banner`.

- **Sorteo por comentarios** de Instagram / TikTok / Facebook (`socialRaffle`):
  pega el link de un post, carga comentarios, filtra (duplicados, palabras, @, #)
  y sortea con foto del ganador. Hoy usa datos **de demostración** (mock); para
  conectarlo de verdad ver `functions/api/comments.ts` y `src/lib/comments.ts`
  (usa **ScrapeCreators**; la API key vive solo en el servidor, nunca en el front).
- **Banner "Patrocinado por"** (`sponsorBanner`): barra superior que lleva a tu
  Instagram. Configura tu marca y URL en `src/config/sponsor.ts`.

> El backend real del sorteo por comentarios corre como **Cloudflare Pages
> Function** (`functions/`), que se despliega junto al sitio. Necesita la variable
> de entorno `SCRAPECREATORS_API_KEY`. Mientras esté apagado, nada de esto se
> muestra ni hace llamadas a ninguna red.

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ localmente
```

## Despliegue en Cloudflare Pages

El sitio es **100 % estático**, así que Cloudflare lo sirve desde su CDN global y
soporta sin problema 10 000+ usuarios simultáneos (cada navegador hace todo el
trabajo; Cloudflare solo entrega archivos).

### Opción A — Wrangler (línea de comandos)

```bash
npm run build
npx wrangler pages deploy dist --project-name ruleta-de-sorteos
```

(La primera vez pedirá iniciar sesión en Cloudflare.)

### Opción B — Dashboard (conectar repositorio Git)

1. Sube este repo a GitHub/GitLab.
2. Cloudflare Pages → *Create project* → conecta el repo.
3. Configura:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. *Deploy*. Cada push redepliega automáticamente.

Las cabeceras de seguridad y de caché están en `public/_headers`.

## Futuro: app móvil

Al ser una SPA, se empaqueta como app nativa con **Capacitor** sin reescribir nada:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init && npx cap add android && npx cap add ios
npm run build && npx cap sync
```
