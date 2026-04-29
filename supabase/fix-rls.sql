-- =============================================================================
-- fix-rls.sql  — Ejecutar en Supabase → SQL Editor si la app no muestra datos
-- =============================================================================
-- Supabase activa RLS por defecto y bloquea lecturas anónimas.
-- Este script permite que el anon key (publishable) lea todas las tablas.
-- =============================================================================

-- Opción A: Desactivar RLS (más simple, válido para apps internas)
-- -----------------------------------------------------------------------------
alter table paquetes       disable row level security;
alter table instituciones  disable row level security;
alter table proyectos      disable row level security;
alter table grupos         disable row level security;
alter table alumnos        disable row level security;
alter table pagos          disable row level security;

-- Opción B (alternativa): Mantener RLS activo pero permitir lectura pública
-- -----------------------------------------------------------------------------
-- alter table paquetes      enable row level security;
-- alter table instituciones enable row level security;
-- alter table proyectos     enable row level security;
-- alter table grupos        enable row level security;
-- alter table alumnos       enable row level security;
-- alter table pagos         enable row level security;
--
-- create policy "lectura_publica" on paquetes      for select using (true);
-- create policy "lectura_publica" on instituciones for select using (true);
-- create policy "lectura_publica" on proyectos     for select using (true);
-- create policy "lectura_publica" on grupos        for select using (true);
-- create policy "lectura_publica" on alumnos       for select using (true);
-- create policy "lectura_publica" on pagos         for select using (true);
-- create policy "escritura_publica" on paquetes    for update using (true);

-- Verificación rápida
-- -----------------------------------------------------------------------------
select 'paquetes'      as tabla, count(*) from paquetes
union all
select 'instituciones' as tabla, count(*) from instituciones
union all
select 'proyectos'     as tabla, count(*) from proyectos
union all
select 'grupos'        as tabla, count(*) from grupos
union all
select 'alumnos'       as tabla, count(*) from alumnos
union all
select 'pagos'         as tabla, count(*) from pagos;
