/*
# Create Clínica Pediátrica Integral Schema

## Overview
This migration creates the complete database schema for a pediatric clinic management dashboard.
The app uses Supabase Auth (email/password) with role-based access stored in the profiles table.

## New Tables (8 total)

1. **profiles** — Links to auth.users with role assignment (ADMIN, RECEPCIONISTA, MEDICO), full name, and avatar URL.
2. **pacientes** — Pediatric patients with tutor info, birth date, and contact details.
3. **medicos** — Doctors/pediatricians with specialty, license, and contact info.
4. **horarios_medicos** — Weekly availability schedule for each doctor (day of week, start/end times).
5. **citas** — Appointments linking patients, doctors, date/time, status, and tariff type.
6. **pagos** — Payments with QR reference codes, receipt URLs, status, amount, and payment method.
7. **historias_clinicas** — Clinical records with vitals, diagnosis, consultation reason, and observations.
8. **recetas** — Digital prescriptions with treatment instructions, linked to clinical history.

## Security
- All tables have RLS enabled.
- Policies scoped to `authenticated` since the app requires sign-in.
- All authenticated users can read clinic data; writes are allowed to authenticated users (role enforcement is at application level via the demo role switcher).

## Important Notes
1. profiles.id references auth.users(id) so each profile maps to an auth account.
2. citas links to both pacientes and medicos with cascading deletes.
3. pagos links to citas for payment reconciliation.
4. historias_clinicas links to both citas and pacientes.
5. recetas links to historias_clinicas.
6. All timestamps use timestamptz with defaults.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  rol text NOT NULL DEFAULT 'RECEPCIONISTA' CHECK (rol IN ('ADMIN', 'RECEPCIONISTA', 'MEDICO')),
  email text,
  telefono text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON profiles;
CREATE POLICY "profiles_insert_authenticated" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update_authenticated" ON profiles;
CREATE POLICY "profiles_update_authenticated" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_delete_authenticated" ON profiles;
CREATE POLICY "profiles_delete_authenticated" ON profiles FOR DELETE TO authenticated USING (true);

-- ============ PACIENTES ============
CREATE TABLE IF NOT EXISTS pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  fecha_nacimiento date NOT NULL,
  sexo text CHECK (sexo IN ('M', 'F')),
  nombre_tutor text,
  telefono_tutor text,
  email_tutor text,
  direccion text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pacientes_select_authenticated" ON pacientes;
CREATE POLICY "pacientes_select_authenticated" ON pacientes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pacientes_insert_authenticated" ON pacientes;
CREATE POLICY "pacientes_insert_authenticated" ON pacientes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "pacientes_update_authenticated" ON pacientes;
CREATE POLICY "pacientes_update_authenticated" ON pacientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "pacientes_delete_authenticated" ON pacientes;
CREATE POLICY "pacientes_delete_authenticated" ON pacientes FOR DELETE TO authenticated USING (true);

-- ============ MEDICOS ============
CREATE TABLE IF NOT EXISTS medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  especialidad text NOT NULL DEFAULT 'Pediatría',
  licencia_medica text,
  telefono text,
  email text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medicos_select_authenticated" ON medicos;
CREATE POLICY "medicos_select_authenticated" ON medicos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "medicos_insert_authenticated" ON medicos;
CREATE POLICY "medicos_insert_authenticated" ON medicos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "medicos_update_authenticated" ON medicos;
CREATE POLICY "medicos_update_authenticated" ON medicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "medicos_delete_authenticated" ON medicos;
CREATE POLICY "medicos_delete_authenticated" ON medicos FOR DELETE TO authenticated USING (true);

-- ============ HORARIOS_MEDICOS ============
CREATE TABLE IF NOT EXISTS horarios_medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  dia_semana text NOT NULL CHECK (dia_semana IN ('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO')),
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE horarios_medicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "horarios_select_authenticated" ON horarios_medicos;
CREATE POLICY "horarios_select_authenticated" ON horarios_medicos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "horarios_insert_authenticated" ON horarios_medicos;
CREATE POLICY "horarios_insert_authenticated" ON horarios_medicos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "horarios_update_authenticated" ON horarios_medicos;
CREATE POLICY "horarios_update_authenticated" ON horarios_medicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "horarios_delete_authenticated" ON horarios_medicos;
CREATE POLICY "horarios_delete_authenticated" ON horarios_medicos FOR DELETE TO authenticated USING (true);

-- ============ CITAS ============
CREATE TABLE IF NOT EXISTS citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id uuid NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora time NOT NULL,
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','CONFIRMADA','COMPLETADA','CANCELADA')),
  tipo_tarifa text NOT NULL DEFAULT 'REGULAR' CHECK (tipo_tarifa IN ('REGULAR','BENEFICA_SOLIDARIA')),
  motivo_consulta text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citas_select_authenticated" ON citas;
CREATE POLICY "citas_select_authenticated" ON citas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "citas_insert_authenticated" ON citas;
CREATE POLICY "citas_insert_authenticated" ON citas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "citas_update_authenticated" ON citas;
CREATE POLICY "citas_update_authenticated" ON citas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "citas_delete_authenticated" ON citas;
CREATE POLICY "citas_delete_authenticated" ON citas FOR DELETE TO authenticated USING (true);

-- ============ PAGOS ============
CREATE TABLE IF NOT EXISTS pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id uuid REFERENCES citas(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  monto numeric(10,2) NOT NULL DEFAULT 0,
  metodo_pago text NOT NULL DEFAULT 'QR' CHECK (metodo_pago IN ('QR','EFECTIVO','TARJETA')),
  codigo_referencia_qr text,
  comprobante_url text,
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','VERIFICADO','RECHAZADO')),
  tipo_tarifa text NOT NULL DEFAULT 'REGULAR' CHECK (tipo_tarifa IN ('REGULAR','BENEFICA_SOLIDARIA')),
  verificado_por text,
  fecha_pago timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagos_select_authenticated" ON pagos;
CREATE POLICY "pagos_select_authenticated" ON pagos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pagos_insert_authenticated" ON pagos;
CREATE POLICY "pagos_insert_authenticated" ON pagos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "pagos_update_authenticated" ON pagos;
CREATE POLICY "pagos_update_authenticated" ON pagos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "pagos_delete_authenticated" ON pagos;
CREATE POLICY "pagos_delete_authenticated" ON pagos FOR DELETE TO authenticated USING (true);

-- ============ HISTORIAS_CLINICAS ============
CREATE TABLE IF NOT EXISTS historias_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id uuid REFERENCES citas(id) ON DELETE SET NULL,
  paciente_id uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id uuid REFERENCES medicos(id) ON DELETE SET NULL,
  motivo_consulta text,
  diagnostico text,
  peso_kg numeric(5,2),
  talla_cm numeric(5,1),
  temperatura_c numeric(4,1),
  frecuencia_cardiaca integer,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE historias_clinicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historias_select_authenticated" ON historias_clinicas;
CREATE POLICY "historias_select_authenticated" ON historias_clinicas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "historias_insert_authenticated" ON historias_clinicas;
CREATE POLICY "historias_insert_authenticated" ON historias_clinicas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "historias_update_authenticated" ON historias_clinicas;
CREATE POLICY "historias_update_authenticated" ON historias_clinicas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "historias_delete_authenticated" ON historias_clinicas;
CREATE POLICY "historias_delete_authenticated" ON historias_clinicas FOR DELETE TO authenticated USING (true);

-- ============ RECETAS ============
CREATE TABLE IF NOT EXISTS recetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_clinica_id uuid NOT NULL REFERENCES historias_clinicas(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE SET NULL,
  medico_id uuid REFERENCES medicos(id) ON DELETE SET NULL,
  indicaciones_tratamiento text NOT NULL,
  medicamentos text,
  enviada_whatsapp boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recetas_select_authenticated" ON recetas;
CREATE POLICY "recetas_select_authenticated" ON recetas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "recetas_insert_authenticated" ON recetas;
CREATE POLICY "recetas_insert_authenticated" ON recetas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "recetas_update_authenticated" ON recetas;
CREATE POLICY "recetas_update_authenticated" ON recetas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "recetas_delete_authenticated" ON recetas;
CREATE POLICY "recetas_delete_authenticated" ON recetas FOR DELETE TO authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_medico ON citas(medico_id);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_cita ON pagos(cita_id);
CREATE INDEX IF NOT EXISTS idx_historias_paciente ON historias_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recetas_historia ON recetas(historia_clinica_id);
CREATE INDEX IF NOT EXISTS idx_horarios_medico ON horarios_medicos(medico_id);
