-- =============================================================================
-- FotoGestión — Script de creación de tablas y datos iniciales
-- Compatible con Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================

-- ─── Extensión UUID (ya activa en Supabase, pero por si acaso) ───────────────
-- create extension if not exists "uuid-ossp";


-- =============================================================================
-- 1. TABLAS
-- =============================================================================

-- ── Paquetes ──────────────────────────────────────────────────────────────────
create table if not exists paquetes (
  id            serial primary key,
  titulo        text        not null,
  descripcion   text,
  que_incluye   text[]      not null default '{}',
  precio        numeric(10,2) not null check (precio >= 0),
  created_at    timestamptz not null default now()
);

-- ── Instituciones ─────────────────────────────────────────────────────────────
create table if not exists instituciones (
  id            serial primary key,
  nombre        text        not null,
  direccion     text,
  ciudad        text,
  contacto      text,
  created_at    timestamptz not null default now()
);

-- ── Proyectos (Generaciones) ──────────────────────────────────────────────────
create table if not exists proyectos (
  id              serial primary key,
  institucion_id  int         not null references instituciones(id) on delete cascade,
  año_ciclo       text        not null,          -- ej: "2024-2027"
  estatus         text        not null default 'Activo'
                              check (estatus in ('Activo', 'Finalizado')),
  created_at      timestamptz not null default now()
);

-- ── Grupos ────────────────────────────────────────────────────────────────────
create table if not exists grupos (
  id            serial primary key,
  proyecto_id   int         not null references proyectos(id) on delete cascade,
  nombre_grupo  text        not null,            -- ej: "6to A"
  turno         text        check (turno in ('Matutino', 'Vespertino', 'Nocturno')),
  created_at    timestamptz not null default now()
);

-- ── Alumnos ───────────────────────────────────────────────────────────────────
create table if not exists alumnos (
  id                  serial primary key,
  grupo_id            int         not null references grupos(id) on delete cascade,
  paquete_id          int         not null references paquetes(id),
  nombre_alumno       text        not null,
  nombre_tutor        text,
  telefono_contacto   text,
  estatus_entrega     text        not null default 'Pendiente'
                                  check (estatus_entrega in ('Pendiente', 'Entregado')),
  comentarios         text,
  created_at          timestamptz not null default now()
);

-- ── Pagos ─────────────────────────────────────────────────────────────────────
create table if not exists pagos (
  id            serial primary key,
  alumno_id     int         not null references alumnos(id) on delete cascade,
  monto         numeric(10,2) not null check (monto > 0),
  fecha         date        not null,
  metodo_pago   text        not null
                            check (metodo_pago in ('Efectivo', 'Transferencia', 'Tarjeta')),
  created_at    timestamptz not null default now()
);


-- =============================================================================
-- 2. ÍNDICES (mejoran velocidad de las queries más comunes)
-- =============================================================================
create index if not exists idx_proyectos_institucion on proyectos(institucion_id);
create index if not exists idx_grupos_proyecto        on grupos(proyecto_id);
create index if not exists idx_alumnos_grupo          on alumnos(grupo_id);
create index if not exists idx_alumnos_paquete        on alumnos(paquete_id);
create index if not exists idx_pagos_alumno           on pagos(alumno_id);
create index if not exists idx_alumnos_nombre         on alumnos using gin(to_tsvector('spanish', nombre_alumno));
create index if not exists idx_alumnos_tutor          on alumnos using gin(to_tsvector('spanish', coalesce(nombre_tutor,'')));


-- =============================================================================
-- 3. VISTA — Saldo por alumno (equivale a los helpers del frontend)
-- =============================================================================
create or replace view vista_saldo_alumnos as
select
  a.id,
  a.nombre_alumno,
  a.nombre_tutor,
  a.telefono_contacto,
  a.estatus_entrega,
  a.comentarios,
  a.grupo_id,
  a.paquete_id,
  p.titulo         as paquete_titulo,
  p.precio         as precio_paquete,
  coalesce(sum(pg.monto), 0)                        as total_pagado,
  p.precio - coalesce(sum(pg.monto), 0)             as saldo_pendiente,
  case
    when p.precio - coalesce(sum(pg.monto), 0) <= 0 then 'liquidado'
    when coalesce(sum(pg.monto), 0) > 0              then 'abonado'
    else 'deuda'
  end                                               as estatus_pago
from alumnos a
join paquetes p  on p.id  = a.paquete_id
left join pagos pg on pg.alumno_id = a.id
group by a.id, p.id;


-- =============================================================================
-- 4. DATOS DE PRUEBA
-- =============================================================================

-- ── Paquetes ──────────────────────────────────────────────────────────────────
insert into paquetes (id, titulo, descripcion, que_incluye, precio) values
  (1, 'Básico',    'Paquete de entrada para grupos pequeños.',
   array['10 fotografías digitales','1 foto impresa 20×25 cm','Galería online por 6 meses'],
   350),
  (2, 'Estándar',  'La opción más popular para primaria y secundaria.',
   array['25 fotografías digitales','3 fotos impresas 20×25 cm','Álbum digital','Galería online 1 año'],
   550),
  (3, 'Premium',   'Experiencia completa con sesión extra y álbum físico.',
   array['50 fotografías digitales','5 fotos impresas 20×25 cm','Álbum impreso 20 páginas','Video montaje','Galería online ilimitada'],
   800)
on conflict (id) do nothing;

-- Reinicia la secuencia después de insertar con IDs explícitos
select setval('paquetes_id_seq', (select max(id) from paquetes));


-- ── Instituciones ─────────────────────────────────────────────────────────────
insert into instituciones (id, nombre, direccion, ciudad, contacto) values
  (1, 'Primaria Benito Juárez',  'Calle Morelos 45, Col. Centro',    'Culiacán',  'Directora M. García'),
  (2, 'Colegio Occidente',       'Av. Las Palmas 200, Col. Norte',   'Culiacán',  'Director R. López'),
  (3, 'Escuela Lázaro Cárdenas', 'Blvd. Insurgentes 88, Col. Sur',   'Mazatlán',  'Directora P. Ruiz')
on conflict (id) do nothing;

select setval('instituciones_id_seq', (select max(id) from instituciones));


-- ── Proyectos ─────────────────────────────────────────────────────────────────
insert into proyectos (id, institucion_id, año_ciclo, estatus) values
  (1, 1, '2023-2026', 'Finalizado'),
  (2, 1, '2024-2027', 'Activo'),
  (3, 2, '2023-2026', 'Finalizado'),
  (4, 2, '2024-2027', 'Activo'),
  (5, 3, '2024-2027', 'Activo')
on conflict (id) do nothing;

select setval('proyectos_id_seq', (select max(id) from proyectos));


-- ── Grupos ────────────────────────────────────────────────────────────────────
insert into grupos (id, proyecto_id, nombre_grupo, turno) values
  (1, 2, '6to A', 'Matutino'),
  (2, 2, '6to B', 'Vespertino'),
  (3, 4, '3ro B', 'Matutino'),
  (4, 4, '3ro C', 'Vespertino'),
  (5, 5, '6to A', 'Matutino')
on conflict (id) do nothing;

select setval('grupos_id_seq', (select max(id) from grupos));


-- ── Alumnos ───────────────────────────────────────────────────────────────────
insert into alumnos (id, grupo_id, paquete_id, nombre_alumno, nombre_tutor, telefono_contacto, estatus_entrega, comentarios) values
  (1,  1, 2, 'Luis Bravo',         'Roberto Bravo',    '6671618370', 'Pendiente', 'Pendiente confirmar talla de toga'),
  (2,  1, 3, 'Ana Martínez',       'Karla Martínez',   '6671234502', 'Entregado', ''),
  (3,  1, 1, 'Carlos Reyes',       'José Reyes',       '6671234503', 'Pendiente', 'Le gusta la foto natural sin pose'),
  (4,  1, 2, 'Sofía Torres',       'Luz Torres',       '6671234504', 'Entregado', ''),
  (5,  1, 3, 'Diego Ramírez',      'Mario Ramírez',    '6671234505', 'Pendiente', ''),
  (6,  1, 1, 'Valeria Gómez',      'Patricia Gómez',   '6671234506', 'Pendiente', 'Quiere sesión extra al aire libre'),
  (7,  2, 2, 'Marcos Hernández',   'Alicia Hernández', '6671234507', 'Pendiente', ''),
  (8,  2, 3, 'Fernanda Castro',    'Ignacio Castro',   '6671234508', 'Entregado', ''),
  (9,  2, 1, 'Ricardo Vega',       'Carmen Vega',      '6671234509', 'Pendiente', ''),
  (10, 2, 2, 'Patricia Leal',      'Enrique Leal',     '6671234510', 'Pendiente', 'Prefiere fotos en interiores'),
  (11, 3, 2, 'Juan Morales',       'Sandra Morales',   '6672234511', 'Entregado', ''),
  (12, 3, 1, 'Elena Sánchez',      'David Sánchez',    '6672234512', 'Pendiente', ''),
  (13, 3, 3, 'Roberto Díaz',       'Norma Díaz',       '6672234513', 'Pendiente', 'Necesita factura'),
  (14, 4, 2, 'Claudia Flores',     'Ramón Flores',     '6672234514', 'Pendiente', ''),
  (15, 4, 1, 'Sergio Peña',        'Verónica Peña',    '6672234515', 'Entregado', ''),
  (16, 5, 3, 'Andrea López',       'Felipe López',     '6693234516', 'Pendiente', ''),
  (17, 5, 2, 'Miguel Ángel Cruz',  'Beatriz Cruz',     '6693234517', 'Entregado', ''),
  (18, 5, 1, 'Laura Jiménez',      'Arturo Jiménez',   '6693234518', 'Pendiente', 'Avisarle con 1 semana de anticipación')
on conflict (id) do nothing;

select setval('alumnos_id_seq', (select max(id) from alumnos));


-- ── Pagos ─────────────────────────────────────────────────────────────────────
insert into pagos (id, alumno_id, monto, fecha, metodo_pago) values
  (1,  1,  200, '2026-01-10', 'Efectivo'),
  (2,  2,  550, '2026-01-15', 'Transferencia'),
  (3,  3,  175, '2026-01-12', 'Efectivo'),
  (4,  4,  550, '2026-02-01', 'Efectivo'),
  (5,  5,  400, '2026-02-05', 'Transferencia'),
  (6,  7,  300, '2026-02-10', 'Efectivo'),
  (7,  8,  800, '2026-02-12', 'Transferencia'),
  (8,  9,  350, '2026-02-20', 'Efectivo'),
  (9,  11, 550, '2026-03-01', 'Transferencia'),
  (10, 13, 200, '2026-03-05', 'Efectivo'),
  (11, 15, 350, '2026-03-10', 'Efectivo'),
  (12, 16, 500, '2026-03-15', 'Transferencia'),
  (13, 17, 550, '2026-03-18', 'Transferencia'),
  (14, 1,  150, '2026-03-20', 'Efectivo'),
  (15, 5,  200, '2026-03-22', 'Efectivo')
on conflict (id) do nothing;

select setval('pagos_id_seq', (select max(id) from pagos));


-- =============================================================================
-- 5. ROW LEVEL SECURITY (opcional pero recomendado para Supabase)
--    Descomenta y ajusta si quieres proteger las tablas por usuario.
-- =============================================================================

-- alter table paquetes      enable row level security;
-- alter table instituciones enable row level security;
-- alter table proyectos     enable row level security;
-- alter table grupos        enable row level security;
-- alter table alumnos       enable row level security;
-- alter table pagos         enable row level security;

-- -- Política básica: solo el usuario autenticado puede leer/escribir
-- create policy "acceso_autenticado" on paquetes
--   for all using (auth.role() = 'authenticated');
-- (repetir para cada tabla)


-- =============================================================================
-- 6. VERIFICACIÓN RÁPIDA
-- =============================================================================
select 'paquetes'      as tabla, count(*) as filas from paquetes
union all
select 'instituciones',          count(*)          from instituciones
union all
select 'proyectos',              count(*)          from proyectos
union all
select 'grupos',                 count(*)          from grupos
union all
select 'alumnos',                count(*)          from alumnos
union all
select 'pagos',                  count(*)          from pagos;

-- Vista de prueba: saldos de todos los alumnos
select nombre_alumno, paquete_titulo, precio_paquete,
       total_pagado, saldo_pendiente, estatus_pago
from vista_saldo_alumnos
order by estatus_pago, nombre_alumno;
