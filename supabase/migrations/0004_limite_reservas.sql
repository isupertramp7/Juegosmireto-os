-- ===========================================================================
--  Mis Retoños · freno al spam de reservas
--  Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.
--  Es idempotente: puedes reejecutarlo sin romper nada.
-- ===========================================================================
--
--  El problema que resuelve
--  ------------------------
--  create_booking() es pública a propósito: cualquiera que entre al sitio
--  tiene que poder reservar sin crearse una cuenta. Pero la publishable key
--  viaja en el JavaScript del sitio, así que cualquiera puede leerla y llamar
--  la función directo por HTTP, sin pasar por el formulario. Un script podría
--  llenar la agenda de reservas falsas en segundos.
--
--  Por eso el freno va DENTRO de la base de datos. Todo lo que se valide en
--  el navegador se lo salta quien llame la API directo.
--
--  Qué hace
--  --------
--  1. Lleva un registro de reservas creadas (IP + teléfono + hora).
--  2. create_booking() rechaza si se pasan los topes de ese registro.
--  3. Rechaza reservas duplicadas exactas (mismo teléfono, juego, fecha y
--     bloque), que además evita el doble clic accidental.
--  4. Campo trampa ("honeypot"): un input escondido que una persona nunca
--     llena y un bot de formularios sí.
--
--  Importante: solo se registran las reservas que SE CREAN. Si la función
--  lanza un error, Postgres revierte la transacción completa y el registro se
--  iría con ella. No es una limitación grave: lo que ensucia la agenda son las
--  reservas que entran, y esas son exactamente las que se cuentan.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. De dónde sale la IP de quien llama
--
--    PostgREST deja las cabeceras HTTP de la petición en una variable de
--    sesión. Supabase está detrás de un proxy, así que la IP real viene en una
--    cabecera reenviada, no en la conexión. Probamos las tres habituales.
--
--    Devuelve NULL cuando no hay cabeceras (por ejemplo al llamar la función
--    desde el SQL Editor). En ese caso los topes por IP no aplican, pero los
--    de teléfono y el global sí.
-- ---------------------------------------------------------------------------
create or replace function public.client_ip()
returns text
language plpgsql
stable
as $$
declare
  v_raw  text;
  v_hdrs json;
begin
  v_raw := nullif(current_setting('request.headers', true), '');
  if v_raw is null then
    return null;
  end if;

  begin
    v_hdrs := v_raw::json;
  exception when others then
    return null;
  end;

  -- x-forwarded-for puede traer una lista "cliente, proxy1, proxy2":
  -- el primero es el cliente.
  return nullif(btrim(split_part(coalesce(
    v_hdrs ->> 'cf-connecting-ip',
    v_hdrs ->> 'x-real-ip',
    v_hdrs ->> 'x-forwarded-for',
    ''
  ), ',', 1)), '');
end;
$$;

revoke all on function public.client_ip() from public;


-- ---------------------------------------------------------------------------
-- 2. Teléfonos comparables
--
--    "+56 9 8765 4321", "956874321" y "9 8765 4321" son el mismo número. Nos
--    quedamos con los últimos 9 dígitos, que en Chile identifican la línea sin
--    el código de país.
-- ---------------------------------------------------------------------------
create or replace function public.normalize_phone(p_phone text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
$$;


-- ---------------------------------------------------------------------------
-- 3. Registro de reservas creadas
--
--    Tabla aparte de bookings a propósito, por dos razones:
--
--    - Guarda la IP, que es un dato personal. Aquí vive siete días y se borra
--      sola; en bookings quedaría para siempre.
--    - Si borras las reservas falsas desde el panel, el registro NO se borra,
--      así que el atacante no recupera su cupo limpiando la agenda.
-- ---------------------------------------------------------------------------
create table if not exists public.booking_attempts (
  id         bigserial   primary key,
  ip         text,
  phone      text        not null default '',
  created_at timestamptz not null default now()
);

create index if not exists booking_attempts_ip_idx
  on public.booking_attempts (ip, created_at desc);
create index if not exists booking_attempts_phone_idx
  on public.booking_attempts (phone, created_at desc);
create index if not exists booking_attempts_created_idx
  on public.booking_attempts (created_at desc);

alter table public.booking_attempts enable row level security;

-- Nadie la toca desde el navegador. Escribe create_booking(), que es
-- SECURITY DEFINER y por eso pasa por encima de RLS. El admin puede leerla
-- para ver de dónde vino una avalancha.
drop policy if exists booking_attempts_admin_read on public.booking_attempts;
create policy booking_attempts_admin_read on public.booking_attempts
  for select using (public.is_admin());

-- Buscar duplicados por teléfono sin recorrer la tabla entera.
create index if not exists bookings_phone_idx
  on public.bookings (public.normalize_phone(customer_phone), date)
  where status <> 'cancelada';


-- ---------------------------------------------------------------------------
-- 4. create_booking() con los frenos
--
--    Reemplaza la versión de 0001_init.sql. Se agrega un parámetro al final,
--    p_website, con valor por defecto: el frontend viejo (que manda 8
--    parámetros con nombre) sigue funcionando sin cambios mientras se despliega
--    el nuevo.
--
--    Para ajustar los topes, edita las constantes del bloque declare y vuelve
--    a ejecutar este archivo.
-- ---------------------------------------------------------------------------
drop function if exists public.create_booking(
  text, date, public.slot_id, text, text, text, text, text
);

create or replace function public.create_booking(
  p_inflatable_id text,
  p_date          date,
  p_slot          public.slot_id,
  p_name          text,
  p_phone         text,
  p_address       text,
  p_email         text default '',
  p_notes         text default '',
  -- Campo trampa. El formulario lo pinta escondido, así que una persona lo
  -- deja vacío siempre. Los bots que rellenan todos los inputs lo llenan.
  p_website       text default ''
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  -- --- Topes. Súbelos o bájalos según cómo se comporte el negocio. ---------
  c_max_por_ip_hora    constant int := 3;
  c_max_por_ip_dia     constant int := 8;
  c_max_por_fono_dia   constant int := 5;
  -- Freno de emergencia para una avalancha desde muchas IP distintas. Muy por
  -- encima de un día bueno de verdad: si se alcanza, es un ataque.
  c_max_global_hora    constant int := 60;
  -- -------------------------------------------------------------------------

  v_ip      text := public.client_ip();
  v_fono    text := public.normalize_phone(p_phone);
  v_item    public.inflatables;
  v_used    int;
  v_price   int;
  v_booking public.bookings;
  v_n       int;
begin
  -- 4.1 Campo trampa. Mensaje genérico a propósito: no le explicamos al bot
  --     qué lo delató.
  if btrim(coalesce(p_website, '')) <> '' then
    raise exception 'No pudimos registrar la reserva';
  end if;

  -- 4.2 Validaciones de fecha. Van primero porque no tocan ninguna tabla.
  if p_date < current_date then
    raise exception 'La fecha ya pasó';
  end if;

  if p_date > current_date + interval '18 months' then
    raise exception 'Solo aceptamos reservas con hasta 18 meses de anticipación';
  end if;

  -- El formulario ya exige 8 dígitos, pero quien llama la API directo se salta
  -- esa validación. Sin esto podría mandar un teléfono de puras letras, que
  -- normalize_phone deja en vacío, y esquivar el tope por número.
  if length(v_fono) < 8 then
    raise exception 'Necesitamos un teléfono de contacto válido.';
  end if;

  -- 4.3 Topes por IP. Se saltan cuando no hay cabeceras (SQL Editor).
  if v_ip is not null then
    select count(*) into v_n
    from public.booking_attempts a
    where a.ip = v_ip and a.created_at > now() - interval '1 hour';

    if v_n >= c_max_por_ip_hora then
      raise exception 'Ya registramos varias reservas desde aquí hace poco. Espera un rato o escríbenos por WhatsApp.';
    end if;

    select count(*) into v_n
    from public.booking_attempts a
    where a.ip = v_ip and a.created_at > now() - interval '24 hours';

    if v_n >= c_max_por_ip_dia then
      raise exception 'Llegaste al máximo de reservas por día. Escríbenos por WhatsApp y lo coordinamos.';
    end if;
  end if;

  -- 4.4 Tope por teléfono, para quien cambia de IP pero no de número.
  select count(*) into v_n
  from public.booking_attempts a
  where a.phone = v_fono and a.created_at > now() - interval '24 hours';

  if v_n >= c_max_por_fono_dia then
    raise exception 'Llegaste al máximo de reservas por día. Escríbenos por WhatsApp y lo coordinamos.';
  end if;

  -- 4.5 Freno global.
  select count(*) into v_n
  from public.booking_attempts a
  where a.created_at > now() - interval '1 hour';

  if v_n >= c_max_global_hora then
    raise exception 'Estamos recibiendo muchas solicitudes en este momento. Escríbenos por WhatsApp y lo coordinamos.';
  end if;

  -- 4.6 Duplicado exacto. Atrapa tanto al bot repetitivo como al doble clic.
  if exists (
    select 1
    from public.bookings b
    where public.normalize_phone(b.customer_phone) = v_fono
      and b.inflatable_id = p_inflatable_id
      and b.date = p_date
      and b.slot = p_slot
      and b.status <> 'cancelada'
  ) then
    raise exception 'Ya tienes una reserva para ese juego en esa fecha y bloque.';
  end if;

  -- 4.7 De aquí para abajo, igual que en 0001_init.sql.
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

  -- 4.8 Deja constancia para los topes de la próxima reserva.
  insert into public.booking_attempts (ip, phone) values (v_ip, v_fono);

  -- 4.9 Limpieza del registro viejo. Una de cada cincuenta reservas se hace
  --     cargo, así no hace falta programar una tarea aparte.
  if random() < 0.02 then
    delete from public.booking_attempts
    where created_at < now() - interval '7 days';
  end if;

  return v_booking;
end;
$$;

-- Permisos: el público solo puede crear reservas, nunca escribir en las tablas.
revoke all on function public.create_booking(
  text, date, public.slot_id, text, text, text, text, text, text
) from public;

grant execute on function public.create_booking(
  text, date, public.slot_id, text, text, text, text, text, text
) to anon, authenticated;
