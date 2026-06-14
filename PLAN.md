# PLAN DE TRABAJO — Ruleta de Sorteos

> **Propósito de este archivo:** estado persistente del proyecto. Si el chat se cierra,
> un nuevo chat debe leer este archivo y continuar desde la sección "ESTADO ACTUAL".

## 1. Visión del producto

Página web (futura app móvil) para hacer sorteos con una ruleta giratoria.
**No guarda NINGÚN dato** — todo vive en memoria del navegador y se pierde al salir
(es una característica, se anuncia como "privacidad total"). Interfaz muy moderna,
con efectos y transiciones que sorprendan al usuario.

## 2. Decisiones confirmadas con el usuario (2026-06-12)

| Tema | Decisión |
|---|---|
| Marca | Genérica: **"Ruleta de Sorteos"** |
| Idioma | Solo español |
| Stack | **Vite + React** (TypeScript), canvas para la ruleta |
| Eliminación de ganadores | **Configurable** (switch: eliminar o no al salir) |
| Hosting | **Cloudflare Pages** (sitio estático, soporta 10k+ concurrentes sin problema) |
| Persistencia | NINGUNA. Sin backend, sin localStorage de datos del sorteo |

## 3. Funcionalidades (alcance v1)

- [x] Ruleta canvas con hasta **100 entradas** (personas, premios o cualquier texto)
- [x] **Título personalizable** del sorteo
- [x] **Logo de marca** subible (solo en memoria, se pierde al cerrar)
- [x] **Colores**: paletas predefinidas + color personalizado total o por segmento
- [x] **Varios diseños/temas de ruleta** (mínimo 5: Neón, Clásico Casino, Minimal,
      Galaxia/Aurora, Dorado Lujo)
- [x] **Múltiples ganadores** (1 a 10): el ÚLTIMO en salir es el ganador principal;
      los anteriores son suplentes en orden inverso (penúltimo = 2º lugar, etc.)
- [x] Switch: eliminar o no de la ruleta al participante que ya salió
- [x] Entrada de participantes: textarea (uno por línea) + lista editable
- [x] Botón mezclar/ordenar entradas
- [x] Animación de giro realista (aceleración + desaceleración con easing, física creíble)
- [x] **Confetti** + modal de ganador espectacular
- [x] **Sonidos** (tick al girar, fanfarria al ganar) con botón de silenciar
- [x] Podio final con todos los ganadores en orden (1º, 2º, 3º…)
- [x] Modo pantalla completa para proyectar el sorteo
- [x] Responsive (móvil/tablet/desktop) + PWA-ready (manifest, sin almacenar datos)
- [x] Botón "Nuevo sorteo" que borra todo explícitamente
- [x] Aviso visible: "Tus datos no se guardan, todo se borra al salir"

### Ideas extra añadidas (propias)
- [x] Atajo: barra espaciadora para girar
- [x] Duración del giro configurable (rápido/normal/dramático)
- [x] Cuenta regresiva 3-2-1 opcional antes de revelar al ganador (suspenso)
- [x] Modo oscuro/claro
- [x] Compartir resultado como imagen (canvas → descarga PNG, no se sube a ningún lado)

## 4. Arquitectura

```
RULETA/
├── PLAN.md                  ← este archivo
├── index.html
├── package.json             (vite, react, react-dom, typescript)
├── public/
│   ├── manifest.webmanifest
│   └── icons/
└── src/
    ├── main.tsx
    ├── App.tsx              (layout: panel config + escenario de ruleta)
    ├── types.ts             (Entry, Theme, Settings, Winner)
    ├── state/useRaffle.ts   (estado central en memoria con useReducer)
    ├── components/
    │   ├── Wheel.tsx        (canvas: dibujo + animación de giro)
    │   ├── EntryPanel.tsx   (textarea + lista de participantes)
    │   ├── SettingsPanel.tsx(tema, colores, nº ganadores, eliminación, sonido…)
    │   ├── LogoUpload.tsx   (FileReader → dataURL en memoria)
    │   ├── WinnerModal.tsx  (revelación + confetti)
    │   ├── Podium.tsx       (resultado final ordenado)
    │   └── Confetti.tsx     (canvas overlay)
    ├── themes.ts            (definición de los 5+ temas)
    └── audio.ts             (Web Audio API, sin archivos externos)
```

- **Sin dependencias pesadas**: confetti y sonido hechos a mano (Web Audio +
  canvas) para mantener el bundle mínimo y carga instantánea.
- **Deploy**: `npm run build` → carpeta `dist/` → Cloudflare Pages
  (conectar repo Git o `npx wrangler pages deploy dist`).

## 5. Lógica de ganadores (acordada)

Con N ganadores configurados (ej. 3): se gira 3 veces. El orden de salida se
invierte para el resultado: el **último en salir = GANADOR (1º)**, el penúltimo
= 2º (primer suplente), el primero en salir = 3º (segundo suplente). Así, si no
se contacta al ganador, ya se sabe quién sigue.

## 6. Fases de ejecución

- [x] Fase 0: Plan + decisiones (este archivo)
- [x] Fase 1: Scaffold Vite + React + TS, estructura base
- [x] Fase 2: Ruleta canvas funcional (dibujo, giro con física, selección justa)
- [x] Fase 3: Paneles de configuración (entradas, título, logo, colores, temas)
- [x] Fase 4: Lógica multi-ganador + eliminación configurable + podio
- [x] Fase 5: Efectos WOW (confetti, sonidos, transiciones, modal, countdown)
- [x] Fase 6: Responsive + PWA manifest + pulido final
- [ ] Fase 7: Build de producción + instrucciones de deploy a Cloudflare Pages

## 6.bis Rediseño visual (2026-06-13)

El usuario pidió cambiar el estilo: el primero resultaba "infantil / circo".
Nuevo lenguaje: **editorial, sereno, minimalista** (referencia tipo ruleta de
marketing premium). Cambios aplicados:

- Fondo claro cálido (bone), superficies blancas, tinta suave. Modo oscuro
  elegante opcional (charcoal + oro apagado).
- Tipografía: **Fraunces** (serif editorial) para títulos/ganador + **Albert
  Sans** para UI/etiquetas. (Antes: Unbounded neón.)
- Temas nuevos, todos con paletas **apagadas/sofisticadas**: Sereno (default),
  Arena, Bruma, Jardín, Rosa, Noche. (Se eliminaron Neón/Casino/etc.)
- Ruleta: segmentos planos con líneas finas, puntero **gota** oscuro, centro
  blanco con **"GIRAR"** + flecha (clic en la ruleta = girar), puntitos en el aro.
- Confeti más sobrio (150 part., tonos del tema). Modal de ganador limpio.

## 6.ter Iteración 3 (2026-06-13) — referencia "app de ruleta"

El usuario pasó 2 nuevas referencias (desktop + móvil): **UI oscura premium**,
rueda de **colores vivos** pero limpia, **botón dorado prominente** de girar.
Indicó tomar de ahí la forma/diseño de la ruleta y el layout. Cambios:

- **Se eliminó la función de subnombre** (a pedido). `Entry` vuelve a tener solo
  `label`. EntryPanel = un nombre por línea, sin sintaxis de barra.
- **UI oscura por defecto** (`darkMode: true`, `data-theme="dark"` en el HTML
  para evitar parpadeo). Tema por defecto **"Vivo"** (paleta vibrante refinada
  con aro dorado). Se conservan los temas elegantes (Sereno, Arena, Bruma,
  Jardín, Rosa, Noche) como opciones.
- **Botón "Girar" dorado** prominente (usa `theme.accent`, color de texto
  automático con `textColorFor`). Centro de la rueda = ícono de giro (sin texto).
- **Datos de ejemplo por defecto**: Anyi, Mileth, Mariela, Ruben, Miguel,
  Gabriel, Marisa (en una ruleta de ejemplo lista al entrar).
- **"Girar de nuevo" a la mano** sin borrar datos: en el modal del ganador y en
  el botón principal cuando la ronda terminó. `resetDraw` conserva participantes;
  solo "Vaciar lista" (`clearAll`) borra. `removeWinners` default = false.
- Layout: en **desktop** panel a la izquierda + rueda a la derecha; en **móvil**
  rueda arriba (protagonista) → botón dorado ancho → ajustes debajo. Sin drawer.
- Refactor anti-cierres-obsoletos en App (refs de phase/pool/finished/countdown)
  para que "girar de nuevo" funcione tras reiniciar la ronda.

## 7. ESTADO ACTUAL

**Iteración 3 completada y verificada** con capturas reales: desktop (UI oscura,
panel izq, rueda vibrante con aro dorado), móvil (rueda arriba + botón dorado +
ajustes) y giro (confeti + modal "Girar de nuevo"/"Cerrar"). Build OK (~55 KB
JS gzip). Dev server en :5173.

**Deploy:** guía completa en `DEPLOY.md`. `dist/` lista para subir. Wrangler
4.100.0 disponible vía `npx`. El usuario YA publicó con dashboard drag-and-drop
(proyecto `ruleta-sorteos` → https://ruleta-sorteos.pages.dev).
Recordatorio: solo se sube la carpeta `dist`, NUNCA el proyecto completo
(node_modules tiene 2463 archivos y supera el límite de 1000 del dashboard).

## 8. PWA mejorada (2026-06-13)

- **Service worker** (`public/sw.js`): la app abre **sin conexión** tras la 1.ª
  visita. En install lee `index.html` y precachea los assets con hash; navegación
  = network-first con fallback a caché; assets = cache-first. Registrado en
  `main.tsx` solo en producción (`import.meta.env.PROD`). Verificado offline por
  CDP (carga completa sin red). `_headers`: `/sw.js` con `Cache-Control: no-cache`.
- **Íconos PNG** generados desde el SVG (180 apple-touch-icon, 192, 512 maskable)
  con el diseño "Vivo" (rueda vibrante + aro/puntero dorado, fondo #161a21).
  Etiquetas Apple añadidas en `index.html` (apple-touch-icon, apple-mobile-web-app-*).
  Manifest con los 3 íconos.
- Añadido `src/vite-env.d.ts` (tipos de `import.meta.env`).
- **PENDIENTE:** el usuario debe RE-SUBIR la carpeta `dist` a Cloudflare para que
  estos cambios (SW + íconos) estén en el sitio en vivo.

**Para deploy:** `npm run build` y luego `npx wrangler pages deploy dist
--project-name ruleta-de-sorteos` (pide login de Cloudflare), o conectar repo
Git en el dashboard de Cloudflare Pages con build command `npm run build` y
output `dist`.

## 9. Iteración 4 (2026-06-14) — plantillas, paleta y módulos ocultos

A partir de una imagen de referencia con 4 diseños (A/B/C/D). Modelo de datos
nuevo: **plantilla** (skin) separada de **paleta** (colores de segmento).

- **`src/templates.ts`** — 4 plantillas A/B/C/D: cada una define estilo de aro
  (`pearls`/`pearlsBold`/`ticks`/`wood`), puntero (`pin`/`drop`/`triangle`/`arrow`)
  y centro (`arrow`/`spiral`/`refresh`/`star`) + acento. El chrome de página
  (fondo, botón, título, decoración) se aplica por CSS con `data-template` en `.app`.
- **`src/palettes.ts`** — paletas editables (nuevas **Pastel** y **Fiesta** +
  las 7 previas). Helpers `textColorFor`/`shade` migraron aquí. **`themes.ts`
  eliminado.**
- **`Wheel.tsx`** — `drawRing/drawPointer/drawHub` ahora son dispatchers por
  estilo. Recibe `template` + `colors` (= `customColors ?? palette.colors`).
- **`SettingsPanel.tsx`** — selector de plantilla (4) + selector de paleta +
  "Personalizar colores" (editor de `customColors`).
- **`Decorations.tsx`** — nubes/arbustos (B), confeti (D), esquinas/puntos (A/C).
- **Settings**: `templateId`/`paletteId`/`customColors` reemplazan a `themeId`.
  Default: plantilla **A**, paleta **pastel**, modo claro. `index.html` pasa a
  `data-theme="light"` y theme-color claro; se añadió la fuente **Baloo 2**.

**Funciones OCULTAS (flag en `src/config/features.ts`, ambas `false`):**
- `sponsorBanner` → `components/SponsorBanner.tsx` + `config/sponsor.ts`
  (Instagram, placeholder). Lleva al IG de bisutería del usuario.
- `socialRaffle` → módulo de sorteo por comentarios (IG/TikTok/FB). UI/flujo
  completos con **mock** (`lib/comments.ts` → `mockProvider` activo; adapter
  `scrapeCreatorsProvider` listo). `lib/filters.ts` (dedupe, palabras, @, #).
  `components/social/*` + `ModeSwitcher`. Tope 500 comentarios.
  Backend **preparado e inactivo**: `functions/api/comments.ts` (Cloudflare Pages
  Function) con rate-limit 10/IP/día, cooldown 30s, validación de URL y key en
  `SCRAPECREATORS_API_KEY` (env, nunca en el front).
- Activar permanente: poner el flag en `true` y `npm run build`. Previsualizar
  sin recompilar: `?preview=social,banner`.

**Pendientes del usuario:** (1) URL real de Instagram en `config/sponsor.ts`.
(2) Para activar el sorteo real: API key de ScrapeCreators + cambiar
`commentsProvider` a `scrapeCreatorsProvider` + desplegar `functions/`.

**Build OK** (tsc + vite): JS ~61 KB gzip, CSS ~5.9 KB gzip. Dev server :5173
levanta y transforma todos los módulos sin errores. **Falta verificación visual
en navegador por el usuario.**
