-- ═══════════════════════════════════════════════════════════════════════════════
-- SISTEMA DE GESTIÓN DE RIFAS
-- Ejecuta este script en Supabase > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. CAMPAÑAS — agrupa varios sorteos bajo un mismo paraguas
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campanas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  descripcion text,
  activa      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. RIFAS — sorteo específico dentro de una campaña
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rifas (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  campana_id       uuid          NOT NULL REFERENCES campanas(id) ON DELETE CASCADE,
  nombre_premio    text          NOT NULL,
  descripcion      text,
  precio_boleto    numeric(10,2) NOT NULL DEFAULT 0,
  cantidad_boletos int           NOT NULL DEFAULT 100,
  fecha_sorteo     date,
  estatus          text          NOT NULL DEFAULT 'Activa'
                                 CHECK (estatus IN ('Activa','Finalizada','Cancelada')),
  horas_expiracion int           NOT NULL DEFAULT 24,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- 3. PARTICIPANTES — perfil del comprador (uno por número de teléfono)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participantes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo   text        NOT NULL,
  telefono_whatsapp text,
  email             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 4. BOLETOS — entradas individuales, pre-generadas al crear la rifa
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boletos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id          uuid        NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  participante_id  uuid        REFERENCES participantes(id) ON DELETE SET NULL,
  numero_asignado  int         NOT NULL,
  estatus          text        NOT NULL DEFAULT 'Disponible'
                               CHECK (estatus IN ('Disponible','Apartado','Liquidado','Vencido')),
  fecha_apartado   timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rifa_id, numero_asignado)
);

-- 5. HISTORIAL DE PAGOS POR BOLETO
-- ─────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_pagos_rifa (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id       uuid          NOT NULL REFERENCES boletos(id) ON DELETE CASCADE,
  monto           numeric(10,2) NOT NULL,
  fecha           date          NOT NULL DEFAULT current_date,
  metodo_pago     text          NOT NULL DEFAULT 'Efectivo',
  comprobante_url text,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- ── ÍNDICES DE RENDIMIENTO ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_boletos_rifa     ON boletos(rifa_id);
CREATE INDEX IF NOT EXISTS idx_boletos_part     ON boletos(participante_id);
CREATE INDEX IF NOT EXISTS idx_boletos_estatus  ON boletos(estatus);
CREATE INDEX IF NOT EXISTS idx_rifas_campana    ON rifas(campana_id);
CREATE INDEX IF NOT EXISTS idx_pagos_boleto     ON historial_pagos_rifa(boleto_id);

-- ── VISTA: saldo calculado por boleto ───────────────────────────────────────
CREATE OR REPLACE VIEW vista_saldo_boletos AS
SELECT
  b.id,
  b.rifa_id,
  b.participante_id,
  b.numero_asignado,
  b.estatus,
  b.fecha_apartado,
  p.nombre_completo,
  p.telefono_whatsapp,
  p.email,
  r.precio_boleto,
  r.nombre_premio,
  r.campana_id,
  r.fecha_sorteo,
  r.cantidad_boletos,
  COALESCE(SUM(hp.monto), 0)                    AS total_pagado,
  r.precio_boleto - COALESCE(SUM(hp.monto), 0)  AS saldo_pendiente
FROM      boletos               b
JOIN      rifas                 r  ON r.id  = b.rifa_id
LEFT JOIN participantes         p  ON p.id  = b.participante_id
LEFT JOIN historial_pagos_rifa  hp ON hp.boleto_id = b.id
GROUP BY
  b.id, b.rifa_id, b.participante_id, b.numero_asignado,
  b.estatus, b.fecha_apartado,
  p.nombre_completo, p.telefono_whatsapp, p.email,
  r.precio_boleto, r.nombre_premio, r.campana_id, r.fecha_sorteo, r.cantidad_boletos;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE campanas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE rifas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_pagos_rifa ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados: acceso total
CREATE POLICY "rifas_auth_all" ON campanas             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rifas_auth_all" ON rifas                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rifas_auth_all" ON participantes        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rifas_auth_all" ON boletos              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rifas_auth_all" ON historial_pagos_rifa FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Usuarios anónimos: solo lectura (para la página pública /mis-boletos)
CREATE POLICY "rifas_anon_read" ON participantes        FOR SELECT TO anon USING (true);
CREATE POLICY "rifas_anon_read" ON boletos              FOR SELECT TO anon USING (true);
CREATE POLICY "rifas_anon_read" ON rifas                FOR SELECT TO anon USING (true);
CREATE POLICY "rifas_anon_read" ON historial_pagos_rifa FOR SELECT TO anon USING (true);
