// ============================================================
// js/planes/planes.js
// EP10 - Suscripción SaaS y Landing Page
// US26: ver planes de suscripción (Freemium, Mensual, Anual).
// US27: simular el pago de la suscripción al plan elegido.
// ============================================================

// Catálogo de planes con precios y beneficios.
const PLANES = [
  { id: "freemium", nombre: "Freemium", precio: "Gratis", precioNum: 0,
    beneficios: ["Diario emocional ilimitado", "Match inteligente", "Botón SOS Línea 113", "Reportes semanales"] },
  { id: "mensual", nombre: "Profesional Mensual", precio: "S/49 /mes", precioNum: 49,
    beneficios: ["Todo lo de Freemium", "Hasta 50 pacientes", "Panel clínico y patrones", "30 días de prueba"] },
  { id: "anual", nombre: "Profesional Anual", precio: "S/39 /mes", precioNum: 39, popular: true,
    beneficios: ["Todo lo de Freemium", "Pacientes ilimitados", "Panel clínico y patrones", "Alertas y métricas"] },
];

// Matriz para la tabla de comparación completa (US26).
const COMPARACION = [
  ["Pacientes",          "—",      "Hasta 50", "Ilimitados"],
  ["Panel clínico",      "No",     "Sí",       "Sí"],
  ["Alertas y métricas", "No",     "Básicas",  "Avanzadas"],
  ["Soporte",            "Comunidad", "Email",  "Prioritario"],
  ["Precio",             "Gratis", "S/49/mes", "S/39/mes"],
];

const panelPlanes = document.getElementById("vista-planes");

// ------------------------------------------------------------
// US26: muestra los planes con precios y beneficios. Si el
// profesional ya está suscrito, destaca su plan actual.
// ------------------------------------------------------------
function mostrarPlanes() {
  // El plan suscrito se guarda en localStorage tras un pago exitoso.
  const suscripcion = localStorage.getItem("suscripcion");

  document.getElementById("lista-planes").innerHTML = PLANES.map((plan) => {
    const actual = suscripcion === plan.id;
    return `
      <div class="plan ${plan.popular ? "popular" : ""} ${actual ? "actual" : ""}">
        ${plan.popular ? '<span class="plan-badge">Más popular · Ahorra 20%</span>' : ""}
        ${actual ? '<span class="plan-actual-tag">Tu plan actual</span>' : ""}
        <h3>${plan.nombre}</h3>
        <div class="precio">${plan.precio}</div>
        <ul>${plan.beneficios.map((b) => `<li>${b}</li>`).join("")}</ul>
        ${plan.precioNum === 0
          ? `<a class="btn btn-secundario btn-block" href="../auth/login.html">Empezar gratis</a>`
          : `<button class="btn btn-block" data-elegir="${plan.id}">${actual ? "Renovar plan" : "Elegir plan"}</button>`}
        <button class="btn btn-secundario btn-block" data-detalles="${plan.id}" style="margin-top:8px">Más detalles</button>
      </div>`;
  }).join("");

  // US27: "Elegir plan" abre el formulario de pago.
  document.querySelectorAll("[data-elegir]").forEach((b) =>
    b.addEventListener("click", () => abrirPago(b.dataset.elegir))
  );

  // US26 (escenario de error/extra): "Más detalles" muestra la
  // tabla de comparación completa de beneficios.
  document.querySelectorAll("[data-detalles]").forEach((b) =>
    b.addEventListener("click", () => {
      const tabla = document.getElementById("comparacion");
      document.getElementById("comparacion-body").innerHTML = COMPARACION
        .map((fila) => `<tr><td><strong>${fila[0]}</strong></td><td>${fila[1]}</td><td>${fila[2]}</td><td>${fila[3]}</td></tr>`)
        .join("");
      tabla.hidden = false;
      tabla.scrollIntoView({ behavior: "smooth" });
    })
  );

  // US26 (escenario alternativo): si ya hay un plan activo, lo indica.
  if (suscripcion) {
    const plan = PLANES.find((p) => p.id === suscripcion);
    mostrarMensaje(`Estás suscrito al plan ${plan.nombre}. Mejora al Anual y ahorra 20%.`, "info", panelPlanes);
  }
}

// ------------------------------------------------------------
// US27: formulario de pago, validación y confirmación.
// ------------------------------------------------------------
let planElegido = null;

function abrirPago(idPlan) {
  planElegido = PLANES.find((p) => p.id === idPlan);
  document.getElementById("pago-sub").textContent =
    `Plan ${planElegido.nombre} · ${planElegido.precio}`;
  cambiarVista("vista-pago");
}

const inputTarjeta = document.getElementById("pago-tarjeta");
const panelPago = document.querySelector("#vista-pago .panel");

document.getElementById("pago-pagar").addEventListener("click", () => {
  // Cuenta solo los dígitos del número de tarjeta.
  const digitos = inputTarjeta.value.replace(/\D/g, "");

  // US27 (escenario de error): tarjeta con menos de 16 dígitos.
  if (digitos.length < 16) {
    inputTarjeta.classList.add("input-error");
    mostrarMensaje("El número de tarjeta debe tener 16 dígitos", "error", panelPago);
    return;
  }
  inputTarjeta.classList.remove("input-error");

  // Escenario exitoso: guarda la suscripción y muestra confirmación.
  localStorage.setItem("suscripcion", planElegido.id);
  document.getElementById("exito-sub").textContent =
    `Tu plan ${planElegido.nombre} está activo. ¡Funciones premium desbloqueadas!`;
  cambiarVista("vista-exito");
});

// US27 (escenario alternativo): "Volver a planes" no guarda nada.
document.getElementById("pago-volver").addEventListener("click", () => {
  inputTarjeta.classList.remove("input-error");
  cambiarVista("vista-planes");
});
document.getElementById("exito-volver").addEventListener("click", () => {
  mostrarPlanes();
  cambiarVista("vista-planes");
});

// Alterna entre las tres vistas de la página (planes / pago / éxito).
function cambiarVista(id) {
  ["vista-planes", "vista-pago", "vista-exito"].forEach((v) => {
    document.getElementById(v).hidden = v !== id;
  });
  window.scrollTo(0, 0);
}

mostrarPlanes();
