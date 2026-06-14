// ============================================================
// js/auth/login.js
// EP01 - Autenticación y registro de usuarios
// US03: Como usuario registrado, quiero iniciar sesión con mi
//       correo y contraseña, y recuperar mi contraseña si la
//       olvido, para acceder a mi cuenta de forma segura.
// ============================================================

// EP01 - US01 y US02: siembra dos cuentas de demo para poder
// probar el sistema sin registrarse desde cero.
// La cuenta de paciente cubre US01 y la de profesional US02.
sembrar("usuarios", [
  { nombre: "María González",    email: "paciente@mindspace.pe", password: "123456", rol: "paciente" },
  { nombre: "Dr. Roberto Sánchez", email: "pro@mindspace.pe",   password: "123456", rol: "profesional", especialidad: "Psicología clínica" },
]);

// EP01 - US03: validación del formulario de inicio de sesión.
// Verifica formato de email y que las credenciales coincidan
// con un usuario registrado en localStorage.
document.querySelector("form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Valida formato de email antes de buscar en el almacenamiento.
  if (!esEmailValido(email)) {
    mostrarMensaje("Ingresa un correo válido");
    return;
  }

  // Busca el usuario; si no existe o la contraseña es incorrecta, muestra error.
  const usuario = obtener("usuarios").find((u) => u.email === email && u.password === password);
  if (!usuario) {
    mostrarMensaje("Correo o contraseña incorrectos");
    return;
  }

  // EP01 - US03: guarda la sesión y redirige según el rol del usuario.
  // Paciente → panel EP02-EP05 | Profesional → panel EP06.
  guardarSesion(usuario.email);
  window.location.href = usuario.rol === "profesional"
    ? "../profesional/profesional.html"
    : "../paciente/paciente.html";
});
