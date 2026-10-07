-- ===========================================================================
--  Saltarines · esquema inicial
--  Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.slot_id as enum ('manana', 'tarde', 'completo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('pendiente', 'confirmada', 'cancelada');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Catálogo de juegos
-- ---------------------------------------------------------------------------
create table if not exists public.inflatables (
  id              text primary key,
  name            text    not null,
  tagline         text    not null default '',
  description     text    not null default '',
  size            text    not null default '',
  capacity        int     not null default 0,
  age_range       text    not null default '',
  price_manana    int     not null default 0 check (price_manana >= 0),
  price_tarde     int     not null default 0 check (price_tarde >= 0),
  price_completo  int     not null default 0 check (price_completo >= 0),
  emoji           text    not null default '🎪',
  gradient        text    not null default 'from-sky-400 via-blue-500 to-indigo-500',
  features        text[]  not null default '{}',
  -- Unidades físicas que tienes de este juego: con 2 puedes aceptar dos
  -- reservas en el mismo bloque horario.
  stock           int     not null default 1 check (stock >= 0),
  active          boolean not null default true,
  sort_order      int     not null default 0,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Reservas
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  -- Código corto que ve el cliente, derivado del id.
  code             text generated always as (upper(substring(id::text from 1 for 8))) stored,
  inflatable_id    text not null references public.inflatables(id) on delete restrict,
  date             date not null,
  slot             public.slot_id not null,
  customer_name    text not null check (length(btrim(customer_name)) between 3 and 120),
  customer_phone   text not null check (length(btrim(customer_phone)) between 7 and 40),
  customer_email   text not null default '' check (length(customer_email) <= 160),
  customer_address text not null check (length(btrim(customer_address)) between 6 and 240),
  customer_notes   text not null default '' check (length(customer_notes) <= 600),
  status           public.booking_status not null default 'pendiente',
  total            int  not null check (total >= 0),
  created_at       timestamptz not null default now()
);

create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_lookup_idx
  on public.bookings (inflatable_id, date, slot) where status <> 'cancelada';

-- ---------------------------------------------------------------------------
-- 4. Días bloqueados (vacaciones, feriados, mantención)
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_days (
  date   date primary key,
  reason text not null default ''
);

-- ---------------------------------------------------------------------------
-- 5. Administradores
--    Solo los usuarios listados aquí entran al panel y ven datos de clientes.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.inflatables  enable row level security;
alter table public.bookings     enable row level security;
alter table public.blocked_days enable row level security;
alter table public.admins       enable row level security;

-- Catálogo: todos ven los juegos activos; el admin ve y edita todo.
drop policy if exists inflatables_read on public.inflatables;
create policy inflatables_read on public.inflatables
  for select using (active or public.is_admin());

drop policy if exists inflatables_write on public.inflatables;
create policy inflatables_write on public.inflatables
  for all using (public.is_admin()) with check (public.is_admin());

-- Reservas: NADIE las lee desde el navegador salvo el admin.
-- El público nunca ve nombres, teléfonos ni direcciones de otros clientes;
-- la disponibilidad se consulta con get_availability(), que solo devuelve
-- cantidades. Las reservas se crean con create_booking(), nunca con INSERT.
drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- Días bloqueados: lectura pública (el calendario los marca), escritura admin.
drop policy if exists blocked_days_read on public.blocked_days;
create policy blocked_days_read on public.blocked_days
  for select using (true);

drop policy if exists blocked_days_write on public.blocked_days;
create policy blocked_days_write on public.blocked_days
  for all using (public.is_admin()) with check (public.is_admin());

-- Admins: cada admin puede verse a sí mismo (lo usa el login para validar).
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. Disponibilidad pública (solo cantidades, cero datos personales)
-- ---------------------------------------------------------------------------
create or replace function public.get_availability(p_from date, p_to date)
returns table (date date, inflatable_id text, slot public.slot_id, used int)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_to < p_from then
    raise exception 'Rango de fechas inválido';
  end if;
  if p_to - p_from > 500 then
    raise exception 'Rango demasiado amplio (máximo 500 días)';
  end if;

  return query
    select b.date, b.inflatable_id, b.slot, count(*)::int
    from public.bookings b
    where b.status <> 'cancelada'
      and b.date between p_from and p_to
    group by b.date, b.inflatable_id, b.slot;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Crear reserva de forma segura
--    Valida fecha, día bloqueado, juego activo y cupo. El FOR UPDATE sobre la
--    fila del juego serializa dos reservas simultáneas, así que el stock nunca
--    se pasa aunque dos personas reserven en el mismo segundo.
-- ---------------------------------------------------------------------------
create or replace function public.create_booking(
  p_inflatable_id text,
  p_date          date,
  p_slot          public.slot_id,
  p_name          text,
  p_phone         text,
  p_address       text,
  p_email         text default '',
  p_notes         text default ''
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_item    public.inflatables;
  v_used    int;
  v_price   int;
  v_booking public.bookings;
begin
  if p_date < current_date then
    raise exception 'La fecha ya pasó';
  end if;

  if p_date > current_date + interval '18 months' then
    raise exception 'Solo aceptamos reservas con hasta 18 meses de anticipación';
  end if;

  if exists (select 1 from public.blocked_days d where d.date = p_date) then
    raise exception 'Ese día no está disponible';
  end if;

  select * into v_item
  from public.inflatables i
  where i.id = p_inflatable_id and i.active
  for update;

  if not found then
    raise exception 'Ese juego no está disponible';
  end if;

  -- "Día completo" choca con mañana y con tarde, y viceversa.
  select count(*) into v_used
  from public.bookings b
  where b.inflatable_id = p_inflatable_id
    and b.date = p_date
    and b.status <> 'cancelada'
    and (b.slot = p_slot or b.slot = 'completo' or p_slot = 'completo');

  if v_used >= v_item.stock then
    raise exception 'Sin cupo para ese juego en ese bloque horario';
  end if;

  v_price := case p_slot
    when 'manana'   then v_item.price_manana
    when 'tarde'    then v_item.price_tarde
    else                 v_item.price_completo
  end;

  insert into public.bookings (
    inflatable_id, date, slot,
    customer_name, customer_phone, customer_email,
    customer_address, customer_notes, total
  ) values (
    p_inflatable_id, p_date, p_slot,
    btrim(p_name), btrim(p_phone), btrim(coalesce(p_email, '')),
    btrim(p_address), btrim(coalesce(p_notes, '')), v_price
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Permisos sobre las funciones: el público solo puede consultar cupos y crear.
revoke all on function public.get_availability(date, date) from public;
grant execute on function public.get_availability(date, date) to anon, authenticated;

revoke all on function public.create_booking(text, date, public.slot_id, text, text, text, text, text) from public;
grant execute on function public.create_booking(text, date, public.slot_id, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Realtime: el panel de administración se entera al instante de una reserva
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.bookings;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 10. Catálogo inicial (edítalo después desde el panel de administración)
-- ---------------------------------------------------------------------------
insert into public.inflatables
  (id, name, tagline, description, size, capacity, age_range,
   price_manana, price_tarde, price_completo, emoji, gradient, features, stock, sort_order)
values
  ('castillo-clasico', 'Castillo Clásico', 'El favorito de siempre',
   'Castillo inflable con torres, muro de rebote y techo para el sol. Ideal para cumpleaños en patio o living amplio.',
   '4 x 4 x 3,2 m', 8, '2 a 10 años', 55000, 60000, 85000, '🏰',
   'from-sky-400 via-blue-500 to-indigo-500',
   array['Techo con sombra', 'Malla de seguridad', 'Motor silencioso'], 2, 1),

  ('tobogan-gigante', 'Tobogán Gigante', 'Adrenalina asegurada',
   'Tobogán de doble pista con rampa de 6 metros y piscina de llegada seca. Perfecto para plazas y canchas.',
   '8 x 4 x 5 m', 10, '5 a 14 años', 95000, 100000, 140000, '🛝',
   'from-amber-400 via-orange-500 to-rose-500',
   array['Doble pista', 'Escalera reforzada', 'Requiere 9 m de frente'], 1, 2),

  ('acuatico-splash', 'Acuático Splash', 'Para días de calor',
   'Tobogán acuático con piscina, cortina de agua y zona de chapoteo. Se conecta a una manguera común.',
   '7 x 4 x 4 m', 8, '4 a 12 años', 90000, 95000, 135000, '💦',
   'from-cyan-400 via-teal-500 to-emerald-500',
   array['Conexión a manguera', 'Piscina de 40 cm', 'Antideslizante'], 1, 3),

  ('plaza-blanda', 'Plaza Blanda', 'Para los más pequeños',
   'Set de espuma con pelotero, figuras blandas, resbalín bajo y piso acolchado. Pensado para salas cuna y jardines.',
   '5 x 5 m', 12, '6 meses a 4 años', 70000, 75000, 105000, '🧸',
   'from-fuchsia-400 via-pink-500 to-rose-400',
   array['Pelotero con 400 pelotas', 'Piso acolchado', 'Apto interior'], 2, 4),

  ('cancha-futbol', 'Cancha Burbuja', 'Fútbol sin reglas',
   'Cancha inflable cerrada con arcos y 6 trajes burbuja. Un éxito en colegios, empresas y celebraciones de adultos.',
   '10 x 6 x 2 m', 12, '10 años y más', 150000, 160000, 220000, '⚽',
   'from-lime-400 via-green-500 to-emerald-600',
   array['6 trajes burbuja', 'Arcos incluidos', 'Monitor incluido'], 1, 5),

  ('pista-obstaculos', 'Pista de Obstáculos', 'Competencia a full',
   'Circuito de 12 metros con túneles, muros para escalar y salida en tobogán. Carrera por equipos garantizada.',
   '12 x 3 x 3,5 m', 10, '6 a 15 años', 120000, 130000, 180000, '🏁',
   'from-violet-400 via-purple-500 to-indigo-600',
   array['12 m de circuito', 'Dos carriles', 'Requiere exterior'], 1, 6)
on conflict (id) do nothing;
