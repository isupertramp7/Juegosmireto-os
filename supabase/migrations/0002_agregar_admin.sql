-- ===========================================================================
--  Convierte un usuario de Auth en administrador del panel.
--
--  Crear el usuario en Authentication → Users NO basta: además tiene que estar
--  en la tabla public.admins. Esa separación es a propósito — así una cuenta
--  por sí sola nunca ve datos de clientes.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- PASO 1 · Mira qué usuarios existen (ejecuta solo esta consulta primero)
-- ---------------------------------------------------------------------------
select
  u.email,
  u.created_at,
  u.email_confirmed_at,            -- si sale NULL, el usuario no está confirmado
  (a.user_id is not null) as es_admin
from auth.users u
left join public.admins a on a.user_id = u.id
order by u.created_at;


-- ---------------------------------------------------------------------------
-- PASO 2 · Hazte administrador
--
-- Si en la lista de arriba sale UN SOLO usuario (el tuyo), ejecuta este
-- bloque tal cual, sin editar nada.
--
-- Si salen varios, no uses este bloque: usa el del PASO 2-B más abajo.
-- ---------------------------------------------------------------------------
insert into public.admins (user_id, email)
select u.id, u.email
from auth.users u
on conflict (user_id) do nothing;


-- ---------------------------------------------------------------------------
-- PASO 2-B · Alternativa: solo un correo específico
-- (cambia el correo y ejecuta este bloque en vez del anterior)
-- ---------------------------------------------------------------------------
-- insert into public.admins (user_id, email)
-- select u.id, u.email
-- from auth.users u
-- where lower(u.email) = lower('CAMBIA-ESTO@ejemplo.com')
-- on conflict (user_id) do nothing;


-- ---------------------------------------------------------------------------
-- PASO 3 · Verifica. Tu correo debe aparecer aquí.
-- ---------------------------------------------------------------------------
select a.email, a.created_at from public.admins a order by a.created_at;
