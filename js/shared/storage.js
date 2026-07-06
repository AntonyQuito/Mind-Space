// ============================================================
// shared/storage.js
// Capa de datos: CRUD sobre localStorage y gestión de sesión.
// Usado por todos los módulos JS del proyecto.
// ============================================================

// Lee un arreglo guardado en localStorage; devuelve [] si no existe.
const obtener = (clave) => JSON.parse(localStorage.getItem(clave)) || [];

// Sobreescribe un arreglo completo en localStorage.
const guardar = (clave, lista) => localStorage.setItem(clave, JSON.stringify(lista));

// Añade un ítem al arreglo de la clave indicada.
const agregar = (clave, item) => {
  const lista = obtener(clave);
  lista.push(item);
  guardar(clave, lista);
};

// Elimina el ítem cuyo campo coincide con el valor dado.
const eliminar = (clave, campo, valor) => {
  const lista = obtener(clave).filter((x) => x[campo] !== valor);
  guardar(clave, lista);
};

// Siembra datos de ejemplo solo si la clave está vacía (primera carga).
const sembrar = (clave, lista) => {
  if (obtener(clave).length === 0) guardar(clave, lista);
};

// EP01 - US03: cerrar sesión (Supabase Auth) y volver al inicio.
const cerrarSesion = async () => {
  await db.auth.signOut();
  window.location.href = "../../index.html";
};
