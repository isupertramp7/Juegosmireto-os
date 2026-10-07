# Saltarines · Arriendo de Juegos Inflables

Sitio web para arriendo de juegos inflables: catálogo, calendario de
disponibilidad real y panel de administración.

Stack: **React 19 + TypeScript + Tailwind CSS v4 + Vite 7 + Supabase**.

---

## Puesta en marcha (4 pasos)

### 1. Crear las tablas

Supabase → **SQL Editor** → **New query** → pega el contenido completo de
`supabase/migrations/0001_init.sql` → **Run**.

Eso crea las tablas `inflatables`, `bookings`, `blocked_days` y `admins`, las
políticas RLS, las funciones `get_availability()` y `create_booking()`, activa
Realtime y carga los 6 juegos de ejemplo.

### 2. Conectar la app

Copia `.env.example` como `.env.local` y pega tus valores:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Los encuentras en Supabase → **Project Settings** → **Data API** (la URL) y
**API Keys** (la clave `anon` / `publishable`). Esa clave es pública por diseño:
viaja al navegador y está protegida por RLS. **Nunca** pongas aquí la
`service_role`.

Vite lee el `.env.local` solo al arrancar, así que reinicia `npm run dev`.

### 3. Crear tu usuario administrador

1. Supabase → **Authentication** → **Users** → **Add user**: pon tu correo y una
   contraseña, y marca *Auto Confirm User*.
2. Supabase → **Authentication** → **Providers** → **Email**: desactiva
   *Enable sign ups*, para que nadie más pueda registrarse por su cuenta.
3. SQL Editor: abre `supabase/migrations/0002_agregar_admin.sql`, cambia el
   correo de ejemplo por el tuyo y ejecútalo.

Tener cuenta no basta: solo quien esté en la tabla `admins` puede ver reservas.

### 4. Levantar el sitio

```bash
npm install
npm run dev     # http://localhost:5173  (panel en /admin)
```

---

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # chequeo de tipos + build de producción en dist/
npm run preview  # servir el build de producción
npm run lint     # solo chequeo de tipos
```

---

## Cómo funciona la disponibilidad

El calendario **no** adivina: lee la base de datos.

- `get_availability(desde, hasta)` devuelve, por fecha / juego / bloque, cuántas
  unidades están tomadas. **Solo cantidades**: el público nunca recibe nombres,
  teléfonos ni direcciones de otros clientes.
- Cada juego tiene un `stock` (unidades físicas que tienes). Con `stock: 2`
  puedes aceptar dos reservas del mismo juego en el mismo bloque.
- "Día completo" choca con "mañana" y con "tarde", y viceversa. Esa regla está
  escrita dos veces, a propósito: en `src/utils/availability.ts` para pintar la
  pantalla, y dentro de `create_booking()` para decidir de verdad.
- Las reservas **no** se insertan desde el navegador. La función
  `create_booking()` valida fecha pasada, día bloqueado, juego activo y cupo, y
  bloquea la fila del juego (`FOR UPDATE`) mientras lo hace. Si dos personas
  reservan el mismo bloque en el mismo segundo, una recibe
  "Alguien acaba de tomar ese bloque" y el stock nunca se pasa.

---

## Panel de administración (`/admin`)

- **Reservas**: filtros (próximas, pendientes, confirmadas, canceladas, todas),
  buscador por código / nombre / teléfono / dirección, estadísticas con ingreso
  confirmado, botones de confirmar / cancelar / reactivar / borrar, enlace
  directo a WhatsApp del cliente y exportación a CSV.
  Con **Realtime** activado, una reserva nueva aparece sola mientras tienes el
  panel abierto.
- **Juegos**: crear, editar precios por bloque, stock, medidas, descripción,
  emoji, color y características; ocultar un juego sin borrarlo.
- **Días bloqueados**: marca vacaciones o feriados. Salen tachados en el
  calendario y la base rechaza reservas para esas fechas.

---

## Seguridad: quién puede ver qué

| Tabla | Público (clave anon) | Administrador |
|---|---|---|
| `inflatables` | lee solo los activos | lee y edita todo |
| `bookings` | **nada** (ni lectura ni escritura directa) | todo |
| `blocked_days` | lee | lee y edita |
| `admins` | nada | se ve solo a sí mismo |

El público interactúa con `bookings` únicamente a través de las dos funciones
`SECURITY DEFINER`: una devuelve conteos, la otra crea una reserva validada.

**Pendiente antes de salir a producción:** cualquiera puede llamar a
`create_booking()`, así que una persona malintencionada podría llenarte la
agenda con reservas falsas. Para un negocio chico el panel basta (las borras y
listo), pero si crece conviene agregar hCaptcha/Turnstile o un límite por IP con
una Edge Function.

---

## Estructura

```
supabase/migrations/
  0001_init.sql            tablas, RLS, funciones, Realtime y catálogo inicial
  0002_agregar_admin.sql   convierte tu usuario en administrador

src/
  App.tsx                     rutas: / (sitio) y /admin (panel, carga diferida)
  lib/supabase.ts             cliente de Supabase
  lib/api.ts                  todas las consultas y conversión fila ⇄ modelo
  types.ts                    modelos de la app y filas de la base
  data/catalog.ts             bloques horarios, datos del negocio, paletas
  utils/date.ts               grilla del calendario, formatos y moneda
  utils/availability.ts       cálculo de cupos (espejo de create_booking)
  hooks/useSiteData.ts        catálogo + cupos + días bloqueados del sitio
  hooks/useAuth.ts            sesión de Supabase + verificación de admin
  pages/Home.tsx              sitio público
  pages/Admin.tsx             panel
  components/                 Header, Hero, Catalog, Calendar, DayPanel,
                              BookingForm, HowItWorks, Footer, SetupNotice
  components/admin/           LoginForm, AdminBookings, AdminInflatables,
                              AdminBlockedDays
```

---

## Personalizar

- **Datos de contacto**: constante `BUSINESS` en `src/data/catalog.ts`
  (nombre, teléfono, WhatsApp en formato internacional sin signos, correo,
  Instagram, cobertura, horario).
- **Juegos y precios**: desde el panel, pestaña *Juegos*. Ya no están en el
  código.
- **Bloques horarios**: constante `SLOTS` en `src/data/catalog.ts`. Si cambias
  los identificadores (`manana`, `tarde`, `completo`) tienes que cambiar también
  el tipo `slot_id` en la base.
- **Fotos en vez de emojis**: pon las imágenes en `public/` y reemplaza el
  `<span>` del emoji por un `<img src="/mi-foto.jpg" />` en `Catalog.tsx`.

---

## Publicar

```bash
npm run build
```

Sube `dist/` a Netlify, Vercel o Cloudflare Pages. Ya están incluidos
`public/_redirects` (Netlify/Cloudflare) y `vercel.json` para que `/admin`
funcione al recargar la página.

En el panel del hosting agrega las mismas dos variables de entorno
(`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) antes de desplegar.
