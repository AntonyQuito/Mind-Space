// ============================================================
// js/auth/login.js
// EP01 - Autenticación y registro de usuarios (Supabase)
// US03: Como usuario registrado, quiero iniciar sesión con mi
//       correo y contraseña, para acceder a mi cuenta.
// ============================================================

// EP01 - US03: validación del formulario de inicio de sesión.
// Verifica formato de email y credenciales contra Supabase Auth.
document.querySelector("form").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Valida formato de email antes de intentar el inicio de sesión.
  if (!esEmailValido(email)) {
    mostrarMensaje("Ingresa un correo válido");
    return;
  }

  // Intenta iniciar sesión con Supabase Auth.
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    mostrarMensaje("Correo o contraseña incorrectos");
    return;
  }

  // Busca el perfil del usuario para saber a qué panel redirigirlo.
  const { data: perfil, error: perfilError } = await db
    .from("profiles")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  if (perfilError || !perfil) {
    mostrarMensaje("No se encontró tu perfil. Contacta soporte.");
    return;
  }

  // EP01 - US03: redirige según el rol del usuario.
  // Paciente → panel EP02-EP05 | Profesional → panel EP06.
  window.location.href = perfil.rol === "profesional"
    ? "../profesional/profesional.html"
    : "../paciente/paciente.html";
});
