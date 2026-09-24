/*
# Update RLS Policies to Allow Anon Access for Demo Mode

## Overview
The app includes a demo role switcher that works WITHOUT real Supabase Auth login.
When in demo mode, the Supabase client uses the anon key, which means requests run
as the `anon` role. The original policies only allowed `authenticated`, which caused
all data queries to return empty results (blank screen) in demo mode.

## Changes
For all 8 tables, add anon-read-and-write policies alongside the existing authenticated policies.
This allows the demo mode to function while still supporting authenticated sessions.

## Tables Updated
- profiles, pacientes, medicos, horarios_medicos, citas, pagos, historias_clinicas, recetas

## Security Notes
1. The anon role gets full CRUD on all tables. This is intentional for the demo mode
   to work without requiring authentication. When real users sign in via Supabase Auth,
   they use the authenticated role which also has full CRUD.
2. In production, you would restrict anon access and require authentication.
*/

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;
CREATE POLICY "profiles_select_anon" ON profiles FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "profiles_insert_anon" ON profiles;
CREATE POLICY "profiles_insert_anon" ON profiles FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update_anon" ON profiles;
CREATE POLICY "profiles_update_anon" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_delete_anon" ON profiles;
CREATE POLICY "profiles_delete_anon" ON profiles FOR DELETE TO anon USING (true);

-- PACIENTES
DROP POLICY IF EXISTS "pacientes_select_anon" ON pacientes;
CREATE POLICY "pacientes_select_anon" ON pacientes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "pacientes_insert_anon" ON pacientes;
CREATE POLICY "pacientes_insert_anon" ON pacientes FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "pacientes_update_anon" ON pacientes;
CREATE POLICY "pacientes_update_anon" ON pacientes FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "pacientes_delete_anon" ON pacientes;
CREATE POLICY "pacientes_delete_anon" ON pacientes FOR DELETE TO anon USING (true);

-- MEDICOS
DROP POLICY IF EXISTS "medicos_select_anon" ON medicos;
CREATE POLICY "medicos_select_anon" ON medicos FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "medicos_insert_anon" ON medicos;
CREATE POLICY "medicos_insert_anon" ON medicos FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "medicos_update_anon" ON medicos;
CREATE POLICY "medicos_update_anon" ON medicos FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "medicos_delete_anon" ON medicos;
CREATE POLICY "medicos_delete_anon" ON medicos FOR DELETE TO anon USING (true);

-- HORARIOS_MEDICOS
DROP POLICY IF EXISTS "horarios_select_anon" ON horarios_medicos;
CREATE POLICY "horarios_select_anon" ON horarios_medicos FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "horarios_insert_anon" ON horarios_medicos;
CREATE POLICY "horarios_insert_anon" ON horarios_medicos FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "horarios_update_anon" ON horarios_medicos;
CREATE POLICY "horarios_update_anon" ON horarios_medicos FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "horarios_delete_anon" ON horarios_medicos;
CREATE POLICY "horarios_delete_anon" ON horarios_medicos FOR DELETE TO anon USING (true);

-- CITAS
DROP POLICY IF EXISTS "citas_select_anon" ON citas;
CREATE POLICY "citas_select_anon" ON citas FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "citas_insert_anon" ON citas;
CREATE POLICY "citas_insert_anon" ON citas FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "citas_update_anon" ON citas;
CREATE POLICY "citas_update_anon" ON citas FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "citas_delete_anon" ON citas;
CREATE POLICY "citas_delete_anon" ON citas FOR DELETE TO anon USING (true);

-- PAGOS
DROP POLICY IF EXISTS "pagos_select_anon" ON pagos;
CREATE POLICY "pagos_select_anon" ON pagos FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "pagos_insert_anon" ON pagos;
CREATE POLICY "pagos_insert_anon" ON pagos FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "pagos_update_anon" ON pagos;
CREATE POLICY "pagos_update_anon" ON pagos FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "pagos_delete_anon" ON pagos;
CREATE POLICY "pagos_delete_anon" ON pagos FOR DELETE TO anon USING (true);

-- HISTORIAS_CLINICAS
DROP POLICY IF EXISTS "historias_select_anon" ON historias_clinicas;
CREATE POLICY "historias_select_anon" ON historias_clinicas FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "historias_insert_anon" ON historias_clinicas;
CREATE POLICY "historias_insert_anon" ON historias_clinicas FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "historias_update_anon" ON historias_clinicas;
CREATE POLICY "historias_update_anon" ON historias_clinicas FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "historias_delete_anon" ON historias_clinicas;
CREATE POLICY "historias_delete_anon" ON historias_clinicas FOR DELETE TO anon USING (true);

-- RECETAS
DROP POLICY IF EXISTS "recetas_select_anon" ON recetas;
CREATE POLICY "recetas_select_anon" ON recetas FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "recetas_insert_anon" ON recetas;
CREATE POLICY "recetas_insert_anon" ON recetas FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "recetas_update_anon" ON recetas;
CREATE POLICY "recetas_update_anon" ON recetas FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "recetas_delete_anon" ON recetas;
CREATE POLICY "recetas_delete_anon" ON recetas FOR DELETE TO anon USING (true);
