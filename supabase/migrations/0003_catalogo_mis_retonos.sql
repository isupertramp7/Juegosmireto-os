-- ===========================================================================
--  Reemplaza el catálogo de ejemplo por los productos reales de Mis Retoños,
--  tomados del perfil @juegosmisretonos.
--
--  ⚠️ LOS PRECIOS SON MARCADORES DE POSICIÓN (todos en 0).
--     Ajústalos desde el panel → pestaña "Juegos", o edítalos aquí antes de
--     ejecutar. Un juego con precio 0 se reserva igual, así que conviene
--     ponerlos antes de publicar el sitio.
--
--  No borra nada: los juegos antiguos quedan ocultos (active = false) para no
--  romper las reservas que ya los referencian.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Catálogo real
-- ---------------------------------------------------------------------------
insert into public.inflatables
  (id, name, tagline, description, size, capacity, age_range,
   price_manana, price_tarde, price_completo, emoji, gradient, features,
   stock, sort_order, active)
values
  ('castillo-blanco', 'Castillo Blanco', 'El clásico de Mis Retoños',
   'Castillo inflable blanco con tobogán y piscina de pelotas incluida. Elegante para cualquier decoración y el favorito para sesiones de fotos.',
   '4 x 4 x 3 m', 8, '1 a 8 años',
   0, 0, 0, '🏰', 'from-crema via-arena to-arena-oscura',
   array['Tobogán incluido', 'Piscina de pelotas', 'Combina con toda decoración'],
   1, 1, true),

  ('plaza-blanda-pastel', 'Plaza Blanda Pastel', 'Rosa palo, salvia y crema',
   'Plaza blanda completa en tonos pastel: módulos de espuma, resbalín, figuras de conejito y cerco blanco. Nuestro arriendo más pedido para cumpleaños de 1 y 2 años.',
   '4 x 4 m', 10, '6 meses a 4 años',
   0, 0, 0, '🧸', 'from-rosa-pastel via-rosa-claro to-rosa',
   array['Cerco blanco incluido', 'Piso acolchado', 'Figuras de conejito'],
   2, 2, true),

  ('soft-play', 'Soft Play Completo', 'Set grande de espuma',
   'Set extendido de soft play con escalera, rampa, cubos, balancín y piscina de pelotas. Pensado para jardines infantiles y celebraciones con varios niños.',
   '5 x 5 m', 14, '1 a 6 años',
   0, 0, 0, '🫧', 'from-salvia-pastel via-salvia-claro to-salvia',
   array['Escalera y rampa', 'Cubos de espuma', 'Apto interior'],
   1, 3, true),

  ('piscina-pelotas', 'Piscina de Pelotas', 'Pura diversión blanda',
   'Piscina de pelotas con cerco blanco y piso acolchado. Se puede arrendar sola o sumar a cualquier plaza blanda.',
   '2 x 2 m', 6, '6 meses a 5 años',
   0, 0, 0, '🎱', 'from-cielo-claro via-cielo to-salvia-claro',
   array['Pelotas sanitizadas', 'Cerco blanco', 'Ideal para espacios chicos'],
   2, 4, true),

  ('plaza-natural', 'Plaza Natural Pikler',
   'Madera y tonos tierra',
   'Rincón de juego en madera natural: triángulo Pikler, rampa, arcoíris de equilibrio y tapete. Estimula la motricidad y se ve precioso en fotos.',
   '3 x 3 m', 6, '1 a 6 años',
   0, 0, 0, '🪵', 'from-arena via-mostaza-claro to-mostaza',
   array['Triángulo Pikler', 'Rampa de equilibrio', 'Madera natural'],
   1, 5, true),

  ('burbuja-inflable', 'Burbuja Inflable', 'El rincón que todos fotografían',
   'Domo inflable transparente que funciona como zona de juego protegida o fondo para la mesa de dulces. Se instala dentro o fuera.',
   '3 m de diámetro', 6, 'Todas las edades',
   0, 0, 0, '🫧', 'from-cielo-claro via-cielo to-cielo',
   array['Transparente', 'Apto interior y exterior', 'Excelente para fotos'],
   1, 6, true),

  ('plaza-arcoiris', 'Plaza Colores Arcoíris', 'Para los más intrépidos',
   'Plaza blanda en colores vivos con resbalín, auto, carpa y piscina de pelotas. La versión alegre y llena de color de nuestra plaza clásica.',
   '4 x 4 m', 10, '1 a 6 años',
   0, 0, 0, '🌈', 'from-terracota-pastel via-terracota-claro to-terracota',
   array['Colores vivos', 'Carpa incluida', 'Resbalín y auto'],
   1, 7, true),

  ('set-heladeria', 'Set Heladería', 'Juego simbólico temático',
   'Rincón de heladería con mostrador, accesorios y decoración a juego. Se suma a cualquier plaza para alargar el panorama.',
   '2 x 2 m', 6, '2 a 8 años',
   0, 0, 0, '🍦', 'from-rosa-pastel via-mostaza-claro to-rosa-claro',
   array['Mostrador y accesorios', 'Juego simbólico', 'Complemento ideal'],
   1, 8, true)

on conflict (id) do update set
  name           = excluded.name,
  tagline        = excluded.tagline,
  description    = excluded.description,
  size           = excluded.size,
  capacity       = excluded.capacity,
  age_range      = excluded.age_range,
  emoji          = excluded.emoji,
  gradient       = excluded.gradient,
  features       = excluded.features,
  stock          = excluded.stock,
  sort_order     = excluded.sort_order,
  active         = excluded.active;
  -- Ojo: los precios NO se pisan al reejecutar, para no borrar los que ya
  -- hayas cargado desde el panel.

-- ---------------------------------------------------------------------------
-- 2. Oculta el catálogo de ejemplo que vino en 0001_init.sql
-- ---------------------------------------------------------------------------
update public.inflatables
set active = false
where id in (
  'castillo-clasico', 'tobogan-gigante', 'acuatico-splash',
  'plaza-blanda', 'cancha-futbol', 'pista-obstaculos'
);

-- ---------------------------------------------------------------------------
-- 3. Opcional: borrar del todo los juegos de ejemplo.
--    Solo funciona si ninguna reserva los referencia, así que primero borra
--    las reservas de prueba desde el panel. Descomenta para ejecutarlo.
-- ---------------------------------------------------------------------------
-- delete from public.inflatables
-- where id in (
--   'castillo-clasico', 'tobogan-gigante', 'acuatico-splash',
--   'plaza-blanda', 'cancha-futbol', 'pista-obstaculos'
-- );

-- Revisa cómo quedó el catálogo:
select sort_order, id, name, stock, active,
       price_manana, price_tarde, price_completo
from public.inflatables
order by active desc, sort_order;
