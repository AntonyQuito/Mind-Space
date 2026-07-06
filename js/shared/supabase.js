// ============================================================
// js/shared/supabase.js
// Cliente de Supabase usado por toda la app.
// Requiere que el CDN de @supabase/supabase-js se cargue ANTES
// que este archivo en el <script> del HTML.
// ============================================================

const SUPABASE_URL = "https://TU-PROYECTO.supabase.co"; // <-- reemplaza con tu Project URL
const SUPABASE_KEY = "TU-ANON-KEY";                      // <-- reemplaza con tu anon public key

// "db" es el cliente que usan registro.js, login.js y paciente.js
// para hablar con Supabase (Auth + tabla profiles/citas).
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
