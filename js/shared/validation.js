// ============================================================
// shared/validation.js
// Funciones de validación reutilizables.
// EP01 (US01, US02, US03): usadas en registro y login
// para asegurar que el correo tenga formato válido.
// ============================================================

const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
