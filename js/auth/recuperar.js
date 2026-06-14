// ============================================================
// js/auth/recuperar.js
// EP01 - Autenticación y registro de usuarios
// US03: Como usuario, quiero poder recuperar mi contraseña
//       ingresando mi correo para recibir un enlace de
//       restablecimiento (flujo simulado en el frontend).
// ============================================================

document.querySelector("form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const email = document.getElementById("email").value.trim();

  // EP01 - US03: valida el formato del correo antes de
  // simular el envío del enlace de recuperación.
  if (!esEmailValido(email)) {
    mostrarMensaje("Ingresa un correo válido");
    return;
  }

  // Simulación del envío (solo frontend, sin backend real).
  mostrarMensaje("Te enviamos un enlace para restablecer tu contraseña", "exito");
});
