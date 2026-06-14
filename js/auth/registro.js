// ============================================================
// js/auth/registro.js
// EP01 - Autenticación y registro de usuarios
// US01: Como paciente, quiero registrarme con nombre, correo
//       y contraseña para crear mi cuenta personal.
// US02: Como profesional de salud mental, quiero registrarme
//       indicando mi especialidad (campo obligatorio) para
//       diferenciarlo del registro de paciente.
// ============================================================

const formulario        = document.querySelector("form");
const selectRol         = document.getElementById("rol");
const campoEspecialidad = document.getElementById("campo-especialidad");

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

// EP01 - US01 y US02: validación y creación de la cuenta.
formulario.addEventListener("submit", (evento) => {
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

  // Verifica que el correo no esté ya registrado.
  if (obtener("usuarios").some((u) => u.email === email)) {
    mostrarMensaje("Ya existe una cuenta con ese correo");
    return;
  }

  // Guarda el nuevo usuario y abre la sesión inmediatamente.
  agregar("usuarios", { nombre, email, password, rol, especialidad });
  guardarSesion(email);

  // Redirige al panel correspondiente según el rol registrado.
  window.location.href = rol === "profesional"
    ? "../profesional/profesional.html"
    : "../paciente/paciente.html";
});
