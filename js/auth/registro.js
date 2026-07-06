// ============================================================
// js/auth/registro.js
// EP01 - Autenticación y registro de usuarios (Supabase)
// US01: Como paciente, quiero registrarme con nombre, correo
//       y contraseña para crear mi cuenta personal.
// US02: Como profesional de salud mental, quiero registrarme
//       indicando mi especialidad (campo obligatorio) para
//       diferenciarlo del registro de paciente.
// ============================================================

const formulario        = document.querySelector("form");
const selectRol         = document.getElementById("rol");
const campoEspecialidad = document.getElementById("campo-especialidad");
const botonRegistrar    = formulario.querySelector("button[type='submit']");

// EP01 - US02: muestra el campo "Especialidad" solo cuando el
// tipo de cuenta seleccionado es "profesional".
const sincronizar = () => {
  campoEspecialidad.hidden = selectRol.value !== "profesional";
};

// Pre-selecciona "profesional" si se llegó con ?rol=pro en la URL
// (p.ej. desde el botón "Soy profesional" del landing).
selectRol.value = new URLSearchParams(location.search).get("rol") === "pro"
  ? "profesional"
  : "paciente";
sincronizar();
selectRol.addEventListener("change", sincronizar);

// EP01 - US01 y US02: validación y creación de la cuenta en Supabase.
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre       = document.getElementById("nombre").value.trim();
  const email        = document.getElementById("email").value.trim();
  const password     = document.getElementById("password").value;
  const rol          = selectRol.value;
  const especialidad = document.getElementById("especialidad").value.trim();

  // EP01 - US01: el nombre es obligatorio para ambos roles.
  if (!nombre) { mostrarMensaje("Ingresa tu nombre"); return; }

  // EP01 - US02: la especialidad es obligatoria para profesionales.
  if (rol === "profesional" && !especialidad) {
    mostrarMensaje("La especialidad es obligatoria");
    return;
  }

  // EP01 - US01 y US02: validaciones de correo y contraseña.
  if (!esEmailValido(email)) { mostrarMensaje("Ingresa un correo válido"); return; }
  if (password.length < 6)   { mostrarMensaje("La contraseña debe tener al menos 6 caracteres"); return; }

  botonRegistrar.disabled = true;

  // 1. Crea el usuario en Supabase Auth.
  const { data: authData, error: authError } = await db.auth.signUp({ email, password });

  if (authError) {
    botonRegistrar.disabled = false;
    mostrarMensaje(
      authError.message.includes("already registered")
        ? "Ya existe una cuenta con ese correo"
        : authError.message
    );
    return;
  }

  // 2. Crea el perfil asociado (nombre, rol, especialidad).
  const { error: perfilError } = await db.from("profiles").insert({
    id: authData.user.id,
    nombre,
    rol,
    especialidad: rol === "profesional" ? especialidad : null,
  });

  botonRegistrar.disabled = false;

  if (perfilError) {
    mostrarMensaje("Tu cuenta se creó, pero hubo un problema guardando el perfil: " + perfilError.message);
    return;
  }

  // Si "Confirm email" está desactivado en Supabase, ya hay sesión
  // activa y se puede redirigir directo al panel correspondiente.
  if (authData.session) {
    window.location.href = rol === "profesional"
      ? "../profesional/profesional.html"
      : "../paciente/paciente.html";
  } else {
    mostrarMensaje("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.", "exito");
  }
});
