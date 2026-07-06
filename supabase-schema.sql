-- ============================================================
-- MindSpace · Esquema Supabase (perfiles + citas)
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- Tabla de perfiles: extiende auth.users con los datos del
-- formulario de registro (nombre, rol, especialidad).
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('paciente', 'profesional')),
  especialidad text,
  created_at timestamp with time zone default now()
);

-- Tabla de citas agendadas por los pacientes.
create table citas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references profiles(id) on delete cascade not null,
  psicologo text not null,
  fecha date not null,
  hora time not null,
  modalidad text,
  created_at timestamp with time zone default now()
);

-- Seguridad: cada usuario solo ve y edita lo suyo.
alter table profiles enable row level security;
alter table citas enable row level security;

create policy "Usuarios ven su propio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Usuarios crean su propio perfil"
  on profiles for insert with check (auth.uid() = id);

create policy "Usuarios editan su propio perfil"
  on profiles for update using (auth.uid() = id);

create policy "Pacientes ven sus propias citas"
  on citas for select using (auth.uid() = paciente_id);

create policy "Pacientes crean sus propias citas"
  on citas for insert with check (auth.uid() = paciente_id);

create policy "Pacientes cancelan sus propias citas"
  on citas for delete using (auth.uid() = paciente_id);

-- ============================================================
-- IMPORTANTE: en Authentication → Providers → Email, desactiva
-- "Confirm email" para que el registro inicie sesión al instante
-- (igual que el comportamiento original con localStorage).
-- Si lo dejas activado, el usuario deberá confirmar su correo
-- antes de poder iniciar sesión.
-- ============================================================
