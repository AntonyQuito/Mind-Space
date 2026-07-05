// ============================================================
// js/landing.js
// EP10 - Suscripción SaaS y Landing Page
// US28: Navegar la landing page.
//   - Las secciones (hero, cómo funciona, features, planes, FAQ,
//     CTA) ya están en index.html y la FAQ se expande con <details>.
//   - Aquí se valida el formulario de contacto: si algún campo
//     está vacío, se muestra "Por favor completa todos los campos
//     antes de enviar".
// ============================================================

const panelContacto = document.getElementById("panel-contacto");

document.getElementById("c-enviar").addEventListener("click", () => {
  const nombre  = document.getElementById("c-nombre").value.trim();
  const correo  = document.getElementById("c-correo").value.trim();
  const mensaje = document.getElementById("c-mensaje").value.trim();

  // US28 (escenario de error): ningún campo puede quedar vacío.
  if (!nombre || !correo || !mensaje) {
    mostrarMensaje("Por favor completa todos los campos antes de enviar", "error", panelContacto);
    return;
  }

  // Envío simulado (solo frontend): confirma y limpia el formulario.
  mostrarMensaje("¡Gracias! Hemos recibido tu mensaje.", "exito", panelContacto);
  document.getElementById("c-nombre").value = "";
  document.getElementById("c-correo").value = "";
  document.getElementById("c-mensaje").value = "";
});
