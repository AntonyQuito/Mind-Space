// ============================================================
// shared/ui.js
// Utilidades de interfaz reutilizables.
// Reemplaza alert() y confirm() con mensajes en pantalla,
// siguiendo las convenciones del proyecto de referencia.
// Usado por todos los epics (EP01 a EP06).
// ============================================================

// Muestra un mensaje de éxito, error o info dentro del panel indicado.
// contenedor: elemento DOM donde buscar la caja .form-mensaje.
const mostrarMensaje = (texto, tipo = "error", contenedor = document) => {
  const caja = contenedor.querySelector(".form-mensaje");
  if (!caja) return;
  caja.textContent = texto;
  caja.className = `form-mensaje form-mensaje--${tipo}`;
  caja.hidden = false;
};
