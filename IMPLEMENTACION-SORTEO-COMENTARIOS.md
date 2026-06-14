# Implementación · Sorteo por Comentarios (Instagram / TikTok / Facebook)

> Documento de seguimiento del **módulo de sorteo por comentarios de redes**.
> Explica **qué se hizo**, **cómo está oculto**, **qué falta** y los **pasos
> exactos para activarlo** en el futuro. Última actualización: **2026-06-14**.

---

## 0. Resumen en una frase

El módulo ya está **construido y funcionando con datos de demostración (mock)**,
pero **oculto** detrás de un interruptor. Nadie lo ve hasta que tú lo enciendas.
Para que funcione **de verdad** (leyendo comentarios reales) faltan 3 pasos: una
**API key**, **cambiar 1 línea de código** y **desplegar el backend**.

---

## 1. Estado actual (✅ hecho)

- ✅ **Interfaz completa** del módulo (móvil y escritorio).
- ✅ **Flujo completo** funcionando con comentarios **de demostración (mock)**:
  elegir red → pegar link → cargar → ver comentarios → filtros → sortear →
  ganador con foto → sacar suplente.
- ✅ **Filtros** del sorteo: un ganador por persona (duplicados), excluir
  palabras, requerir mención `@`, requerir hashtag `#`.
- ✅ **Tope de 500 comentarios** por sorteo (límite gratuito).
- ✅ **Validación del link** en el navegador antes de cualquier llamada.
- ✅ **Backend preparado pero apagado** (Cloudflare Pages Function) con todo el
  **anti-abuso** ya escrito (rate-limit, cooldown, validación, key en servidor).
- ✅ **Mensajes de error claros** ("Post privado…", "Link inválido…",
  "Sin comentarios…", "Demasiadas peticiones…").
- ✅ **Oculto por defecto**: con el interruptor apagado, la app se ve y funciona
  exactamente igual que antes; el módulo **no aparece ni hace llamadas a la red**.

---

## 2. Cómo está OCULTO

El módulo se controla con un **interruptor** en:

```
src/config/features.ts
```

```ts
export const FEATURES = {
  socialRaffle: false,   // ← sorteo por comentarios (APAGADO)
  sponsorBanner: false,  // ← banner patrocinado (APAGADO)
}
```

- Mientras `socialRaffle` sea `false`:
  - **No** se muestra el conmutador "Ruleta / Comentarios".
  - **No** se carga la pantalla del módulo.
  - **No** se hace ninguna llamada a internet relacionada.
- Hay además un modo de **previsualización solo para ti**, sin tocar el código:
  abre la app añadiendo a la URL `?preview=social`
  (o `?preview=social,banner` para ver también el banner).
  Esto **no** cambia lo que ve el público: solo lo ves tú con ese link.

---

## 3. Qué usa AHORA vs. qué falta para producción

| Pieza | Ahora (demo) | Para producción real |
|---|---|---|
| Origen de comentarios | **Mock** (inventados en memoria) | **ScrapeCreators API** vía nuestro backend |
| Backend | Existe pero **inactivo** | Desplegado + con API key |
| API key | No necesaria | **Necesaria** (`SCRAPECREATORS_API_KEY`) |
| Costo | $0 | ~$0.01–$0.07 USD por sorteo |
| Red | No toca ninguna | Llama a ScrapeCreators |

El cambio de "demo" a "real" es **una sola línea** (ver paso 4.3).

---

## 4. Pasos para ACTIVARLO en el futuro (checklist)

### Paso 4.1 — Conseguir la API key (gratis)
1. Entra a **app.scrapecreators.com** y crea cuenta (sin tarjeta).
2. Copia tu **API key**. Te dan **100 créditos gratis** para probar.
3. Recargas: **$10 USD = 5,000 créditos**, y **no expiran**.

### Paso 4.2 — Guardar la key en el servidor (NO en el código)
En **Cloudflare → tu proyecto Pages → Settings → Environment variables**, añade:

```
SCRAPECREATORS_API_KEY = tu_key_aqui
```

> ⚠️ La key **nunca** debe ir en el navegador ni subirse a Git. Solo vive aquí,
> en el servidor. El código ya está hecho para leerla desde esta variable.

### Paso 4.3 — Cambiar el proveedor de "demo" a "real" (1 línea)
En `src/lib/comments.ts`, al final, cambia:

```ts
// de:
export const commentsProvider: CommentsProvider = mockProvider
// a:
export const commentsProvider: CommentsProvider = scrapeCreatorsProvider
```

### Paso 4.4 — Encender el módulo
En `src/config/features.ts`:

```ts
socialRaffle: true,
```

### Paso 4.5 — Reconstruir y desplegar (incluyendo el backend)
```bash
npm run build
```
- El backend vive en la carpeta **`functions/`**. Para que se active, hay que
  desplegar con **el repositorio conectado a Cloudflare Pages** (Git), que sube
  `functions/` automáticamente. (Subir solo la carpeta `dist` a mano **NO**
  incluye el backend.)
- Opción recomendada para esto: conectar el repo en
  **Cloudflare Pages → Connect to Git** (build command `npm run build`, output
  `dist`). Cada push redepliega y mantiene `functions/` activo.

### Paso 4.6 — (Opcional pero recomendado) Rate-limit robusto con KV
Para que el límite por IP se respete entre visitas y entre servidores:
1. Cloudflare → **Workers & Pages → KV** → crea un namespace (ej. `RATE_LIMIT`).
2. En tu proyecto Pages → **Settings → Functions → KV namespace bindings**:
   enlázalo con el nombre **`RATE_LIMIT`**.
3. El código ya lo usa si existe; si no, usa un respaldo en memoria.

✅ Con 4.1 a 4.5 el sorteo por comentarios queda **funcionando de verdad**.

---

## 5. Archivos del módulo (mapa para el desarrollador)

```
src/
  config/
    features.ts                 Interruptores on/off + preview ?preview=
  lib/
    comments.ts                 Proveedores: mockProvider (activo) y
                                scrapeCreatorsProvider (real, listo). Tipos,
                                validación de URL, tope 500.
    filters.ts                  Filtros: duplicados, palabras, @mención, #hashtag
  components/
    ModeSwitcher.tsx            Tabs "Ruleta / Comentarios" (solo si está activo)
    social/
      SocialRaffle.tsx          Pantalla principal y orquestación del flujo
      CommentList.tsx           Lista de comentarios + contador
      SocialWinner.tsx          Modal del ganador (foto + @usuario + comentario)
      Avatar.tsx                Foto con respaldo a inicial si no carga
functions/
  api/comments.ts               BACKEND (Cloudflare Pages Function) — INACTIVO.
                                Llama a ScrapeCreators, normaliza, anti-abuso.
src/App.tsx                     Integra todo: muestra el módulo solo si el flag
                                (o ?preview) está activo.
```

---

## 6. Flujo de la interfaz (UX implementada)

1. El usuario elige **red social**: Instagram / TikTok / Facebook.
2. Pega el **link del post público**.
3. Pulsa **"Cargar comentarios"**.
4. Aparece **cargando** con aviso ("puede tardar hasta 60 s…").
5. Se muestran los **comentarios** cargados con **contador** de participantes.
6. **Opciones del sorteo** (desplegable):
   - Un ganador por persona (quita duplicados)
   - Requerir que mencione una cuenta (`@`) — opcional cuenta exacta
   - Requerir un hashtag (`#`) — opcional hashtag exacto
   - Excluir comentarios con ciertas palabras
7. Pulsa **"Iniciar sorteo"**.
8. **Animación + confeti** y modal del **ganador** (foto + `@usuario` + comentario).
9. Botón **"Sacar suplente"** (otro ganador distinto, sin repetir).

---

## 7. Backend y seguridad (cómo está pensado)

`functions/api/comments.ts` (Cloudflare Pages Function) es quien:
- Recibe `platform` + `url` desde el navegador.
- **Valida** que el link sea de la red indicada.
- Llama a **ScrapeCreators** con la key (que vive **solo** aquí).
- **Normaliza** la respuesta a `{ id, text, username, profilePicUrl }`.
- Aplica **anti-abuso**:
  - **10 sorteos por IP por día**
  - **30 s de espera** entre llamadas del mismo IP
  - **Validación de URL** antes de gastar créditos
- Devuelve **errores claros** según el caso (privado, inválido, sin comentarios,
  demasiadas peticiones).

Endpoints que usa (definidos en el archivo):
- Instagram: `/v1/instagram/post/comments/simple?url=...&amount=500`
- TikTok: `/v1/tiktok/post/comments?url=...`
- Facebook: `/v1/facebook/post/comments?url=...`
- Header en todas: `x-api-key: <SCRAPECREATORS_API_KEY>`

---

## 8. Costos (referencia)

- **Gratis** al inicio: 100 créditos. Luego **$10 = 5,000 créditos** (no expiran).
- Costo aproximado por sorteo de 500 comentarios:
  - Instagram: ~34 créditos (~$0.07 USD)
  - TikTok: ~5 créditos (~$0.01 USD)
  - Facebook: ~5 créditos (~$0.01 USD)
- Por eso el **anti-abuso es obligatorio** antes de abrirlo al público (cada
  llamada cuesta). Ya está implementado.

---

## 9. Riesgos a tener presentes

- **Legal / Términos de servicio:** leer comentarios de IG/TikTok/FB por scraping
  puede ir contra los Términos de esas plataformas. La decisión de activarlo es
  tuya; por eso está apagado.
- **Costo por uso:** sin el anti-abuso, alguien podría hacerte gastar créditos.
  Ya está mitigado (rate-limit + cooldown + validación + tope 500).
- **Posts privados o sin comentarios:** se manejan con mensajes claros, no rompen
  la app.
- **Dependencia de un tercero:** si ScrapeCreators cambia su API, hay que ajustar
  `functions/api/comments.ts` (la normalización está aislada ahí).

---

## 10. Alternativa futura (sin pagar a un tercero)

Competidores como AppSorteos usan una **extensión de Chrome** que lee los
comentarios desde el propio navegador del usuario (costo $0 para ellos, pero solo
en escritorio). **No está implementada** aquí. Si en el futuro se quiere:
- Se crearía una extensión que extrae los comentarios de la pestaña abierta y los
  envía a la app.
- Ventaja: gratis. Desventaja: solo escritorio, más trabajo y mantenimiento, y el
  usuario debe instalarla.
- Encajaría como **complemento** del flujo actual (la app ya tiene la capa de
  proveedores `CommentsProvider`, así que se añadiría un tercer proveedor).

---

## 11. Pendientes (lo que falta)

- [ ] Crear cuenta y **API key** en ScrapeCreators (paso 4.1).
- [ ] Definir `SCRAPECREATORS_API_KEY` en Cloudflare (paso 4.2).
- [ ] Cambiar `commentsProvider` a `scrapeCreatorsProvider` (paso 4.3).
- [ ] Poner `socialRaffle: true` (paso 4.4).
- [ ] Desplegar con el repo conectado a Git para incluir `functions/` (paso 4.5).
- [ ] (Opcional) Crear y enlazar KV `RATE_LIMIT` (paso 4.6).
- [ ] (Opcional) Probar con posts reales y ajustar mensajes/tiempos.
- [ ] (Opcional a futuro) Evaluar la extensión de Chrome gratuita (sección 10).

---

## 12. Para probarlo HOY (con datos de demostración)

Sin activar nada permanente, puedes verlo funcionando con comentarios falsos:

1. `npm run dev`
2. Abre **http://localhost:5173/?preview=social**
3. Elige una red, pega cualquier link válido de esa red (ej.
   `https://www.instagram.com/p/abc/`), pulsa **Cargar comentarios** y sortea.

Los comentarios son inventados (no se llama a ninguna red), pero el flujo, los
filtros, el ganador con foto y el suplente funcionan igual que la versión real.
```
