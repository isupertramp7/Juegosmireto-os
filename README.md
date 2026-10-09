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

### Freno al spam de reservas

`create_booking()` es pública a propósito: la gente tiene que poder reservar
sin crearse una cuenta. Pero la publishable key viaja en el JavaScript del
sitio, así que cualquiera puede leerla y llamar la función directo por HTTP,
saltándose el formulario. Sin frenos, un script llena la agenda de reservas
falsas en segundos.

Por eso los límites viven **dentro de la base de datos**
(`supabase/migrations/0004_limite_reservas.sql`). Lo que se valide en el
navegador no cuenta: quien llama la API directo se lo salta.

| Límite | Tope | Por qué |
|---|---|---|
| Por IP, última hora | 3 reservas | Frena el script obvio |
| Por IP, último día | 8 reservas | Frena el goteo lento |
| Por teléfono, último día | 5 reservas | Para quien rota de IP |
| Global, última hora | 60 reservas | Avalancha desde muchas IP |
| Duplicado exacto | 0 | Mismo teléfono, juego, fecha y bloque |

Además hay un **campo trampa** en el formulario: un input escondido fuera de la
pantalla que una persona nunca llena y un bot de formularios sí. Es un
complemento, no la defensa principal — un bot que llama la API directo ni
siquiera carga el formulario.

Los topes son constantes al inicio de la función. Para cambiarlos, edita el
bloque `declare` y vuelve a ejecutar el archivo.

La tabla `booking_attempts` guarda IP, teléfono y hora de cada reserva creada,
y se purga sola a los 7 días. Está aparte de `bookings` por dos razones: la IP
es un dato personal y no queremos que viva para siempre, y si borras las
reservas falsas desde el panel el registro **no** se borra, así que el atacante
no recupera su cupo limpiando la agenda.

**Límite conocido:** solo se cuentan las reservas que se crean. Cuando la
función rechaza, Postgres revierte la transacción completa y el registro se
iría con ella. No es grave: lo que ensucia la agenda son las reservas que
entran, y esas son justo las que se cuentan.

Si algún día el spam se vuelve un problema real a pesar de esto, el siguiente
paso es un captcha invisible (Cloudflare Turnstile o hCaptcha) validado en una
Edge Function.

---

## Estructura

```
supabase/migrations/
  0001_init.sql            tablas, RLS, funciones, Realtime y catálogo inicial
  0002_agregar_admin.sql   convierte tu usuario en administrador
  0003_catalogo_mis_retonos.sql  catálogo real (no pisa precios ya puestos)
  0004_limite_reservas.sql       topes antispam en create_booking()

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

En producción: <https://juegosmiretonos.vercel.app>

Vercel está conectado a este repositorio, así que cada `git push` a `main`
dispara un despliegue. No hay que subir `dist/` a mano.

```bash
npm run build    # para probar el build de producción en local
```

Ya están incluidos `public/_redirects` (Netlify/Cloudflare) y `vercel.json`
para que `/admin` funcione al recargar la página.

### Las variables de entorno en producción

Vite **no** lee variables en tiempo de ejecución: las incrusta dentro del
JavaScript cuando corre `npm run build`. Dos consecuencias:

- Las variables tienen que existir en el momento del build, no después.
- Cambiar una variable obliga a un build nuevo. Recargar la página no basta.

Los valores de producción están en **`.env.production`**, versionado a
propósito. Así el build de Vercel los encuentra sin configurar nada en su
panel. Se puede versionar porque esas dos variables son públicas por diseño:
viajan al navegador de cada visitante dentro del bundle, así que ya son
visibles para cualquiera. Lo que protege los datos son las políticas RLS, no
el secreto de la clave.

Si prefieres sacarlas del repositorio, defínelas en Vercel → *Settings* →
*Environment Variables* (los tres entornos) y borra `.env.production`: las
variables del entorno tienen prioridad sobre los archivos `.env`.

Cualquier **secreto real** (`service_role key`, tokens de terceros) va
únicamente en el panel de Vercel y en `.env.local`. Nunca en
`.env.production`.

### Autenticación y el dominio

En Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: `https://juegosmiretonos.vercel.app`
- **Redirect URLs**: `https://juegosmiretonos.vercel.app/**` y
  `http://localhost:5173/**`
