// ============================================================
// js/profesional/profesional.js
// EP06 - Dashboard del profesional de salud mental.
// US17: lista de pacientes vinculados con búsqueda y estado.
// US18: patrones emocionales (gráfico de línea SVG, 30 días).
// US19: alertas SOS de pacientes y acción de contacto.
// ============================================================

// Etiquetas y clases CSS para cada nivel de estabilidad del paciente.
// Usado en US17 (tabla) y US18 (detalle).
const NIVEL = {
  estable:  ["Estable",   "pill-estable"],
  atencion: ["Atención",  "pill-atencion"],
  crisis:   ["Crisis",    "pill-crisis"],
};

// ------------------------------------------------------------
// Datos de ejemplo sembrados en localStorage la primera vez.
// US17: lista de pacientes vinculados al profesional.
// US19: alertas SOS generadas por pacientes.
// ------------------------------------------------------------
sembrar("pacientes", [
  { id: 1, nombre: "Ana M.",      ult: "2 días",   bienestar: 78, nivel: "estable",  edad: 28 },
  { id: 2, nombre: "Carlos R.",   ult: "5 días",   bienestar: 45, nivel: "atencion", edad: 34 },
  { id: 3, nombre: "Lucía P.",    ult: "1 día",    bienestar: 82, nivel: "estable",  edad: 25 },
  { id: 4, nombre: "Miguel S.",   ult: "3 días",   bienestar: 35, nivel: "crisis",   edad: 41 },
  { id: 5, nombre: "Patricia L.", ult: "1 semana", bienestar: 52, nivel: "atencion", edad: 30 },
]);
sembrar("alertas", [
  { id: 1, nombre: "Miguel S.", urgente: true,  hora: "Hoy, 11:45 PM", motivo: "Ansiedad severa",   contacto: "+51 987 654 321", detalle: 'Diario: "No puedo dormir, pensamientos recurrentes."' },
  { id: 2, nombre: "Laura T.",  urgente: false, hora: "Ayer, 3:20 PM", motivo: "Tristeza profunda", contacto: "+51 912 345 678", detalle: "Atendida por la Línea 113." },
]);

// ------------------------------------------------------------
// EP01 - US03: cerrar sesión del profesional.
// ------------------------------------------------------------
document.getElementById("cerrar").addEventListener("click", cerrarSesion);

// ------------------------------------------------------------
// Navegación por pestañas del menú lateral.
// Activa el panel correspondiente al botón pulsado
// y cierra el menú en móvil (checkbox-hack).
// ------------------------------------------------------------
const pestanas = document.querySelectorAll(".nav-link[data-tab]");
pestanas.forEach((boton) => boton.addEventListener("click", () => {
  pestanas.forEach((b) => b.classList.toggle("active", b === boton));
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.dataset.panel === boton.dataset.tab);
  });
  document.getElementById("nav-toggle").checked = false;
  window.scrollTo(0, 0);
}));

/* ============================================================
   EP06 - US17: lista de pacientes vinculados y búsqueda
   ============================================================ */

// Renderiza la tabla con todos los pacientes almacenados.
// Cada fila muestra el nivel de estabilidad con una píldora de color.
const cuerpoTabla = document.querySelector("#tabla-pacientes tbody");
cuerpoTabla.innerHTML = obtener("pacientes").map((p) => {
  const [texto, clase] = NIVEL[p.nivel];
  return `<tr data-id="${p.id}">
    <td><strong>${p.nombre}</strong></td>
    <td>Hace ${p.ult}</td>
    <td>${p.bienestar}%</td>
    <td><span class="pill ${clase}">${texto}</span></td>
  </tr>`;
}).join("");

// Clic en una fila abre el detalle con el gráfico de patrones (US18).
cuerpoTabla.querySelectorAll("tr").forEach((fila) =>
  fila.addEventListener("click", () => verPaciente(Number(fila.dataset.id)))
);

// US17: búsqueda en tiempo real ocultando las filas que no coinciden.
document.getElementById("buscar-paciente").addEventListener("input", (evento) => {
  const texto = evento.target.value.toLowerCase();
  cuerpoTabla.querySelectorAll("tr").forEach((fila) => {
    fila.style.display = fila.textContent.toLowerCase().includes(texto) ? "" : "none";
  });
});

/* ============================================================
   EP06 - US18: patrones emocionales del paciente (gráfico 30 días)
   ============================================================ */

// Muestra el detalle de un paciente con su gráfico de bienestar.
// El profesional puede ver el valor de cada punto al hacer clic.
function verPaciente(id) {
  const p      = obtener("pacientes").find((x) => x.id === id);
  const serie  = serie30(id);
  const [texto, clase] = NIVEL[p.nivel];
  const detalle = document.getElementById("detalle");

  detalle.innerHTML = `
    <p class="form-mensaje" hidden></p>
    <h2 class="page-title">${p.nombre} <span class="pill ${clase}">${texto}</span></h2>
    <p class="page-subtitle">
      ${p.edad} años · bienestar promedio ${promedio(serie)}% · ${serie.length} días de registros
    </p>
    <div class="grafico">${grafico(serie)}</div>
    <p class="muted" style="margin-top:10px">Haz clic en un punto para ver el registro de ese día.</p>`;

  // Cambia la vista: oculta la lista y muestra el detalle.
  document.getElementById("vista-lista").hidden   = true;
  document.getElementById("vista-detalle").hidden = false;

  // US18: clic en un punto del gráfico muestra el valor de ese día.
  detalle.querySelectorAll(".punto").forEach((punto) =>
    punto.addEventListener("click", () => {
      mostrarMensaje(`Día ${punto.dataset.dia}: bienestar ${punto.dataset.val}%`, "info", detalle);
    })
  );
}

// Volver a la lista de pacientes desde el detalle.
document.getElementById("volver").addEventListener("click", () => {
  document.getElementById("vista-detalle").hidden = true;
  document.getElementById("vista-lista").hidden   = false;
});

// Genera una serie de 30 valores pseudo-aleatoria pero estable
// por paciente (determinista según la semilla/id).
function serie30(semilla) {
  const base = { 1: 70, 2: 48, 3: 76, 4: 35, 5: 52 }[semilla] || 60;
  return Array.from({ length: 30 }, (_, i) => {
    const v = Math.max(15, Math.min(95,
      Math.round(base + Math.sin((i + semilla) / 3) * 9 + (i / 30) * 8)
    ));
    return { dia: i + 1, val: v };
  });
}

// Calcula el bienestar promedio de la serie.
const promedio = (serie) =>
  Math.round(serie.reduce((a, b) => a + b.val, 0) / serie.length);

// Genera el gráfico de línea en SVG con guías horizontales y
// puntos clicables. Cada punto lleva data-dia y data-val.
function grafico(serie) {
  const ancho = 640, alto = 180, m = 24;
  const x = (i) => m + (i * (ancho - m * 2)) / (serie.length - 1);
  const y = (v) => alto - m - (v / 100) * (alto - m * 2);

  const linea  = serie.map((d, i) =>
    `${i ? "L" : "M"} ${x(i).toFixed(0)} ${y(d.val).toFixed(0)}`
  ).join(" ");

  const puntos = serie.map((d, i) =>
    `<circle class="punto" cx="${x(i).toFixed(0)}" cy="${y(d.val).toFixed(0)}"
      r="4" fill="#2F55E7" style="cursor:pointer"
      data-dia="${d.dia}" data-val="${d.val}"></circle>`
  ).join("");

  const guias = [25, 50, 75].map((g) =>
    `<line x1="${m}" y1="${y(g)}" x2="${ancho - m}" y2="${y(g)}"
      stroke="#E2E8F0" stroke-dasharray="3 4"></line>`
  ).join("");

  return `<svg viewBox="0 0 ${ancho} ${alto}">
    ${guias}
    <path d="${linea}" fill="none" stroke="#2F55E7" stroke-width="2.5"></path>
    ${puntos}
  </svg>`;
}

/* ============================================================
   EP06 - US19: alertas SOS y acción de contacto
   ============================================================ */

// Renderiza la lista de alertas. Las urgentes llevan clase
// "urgente" para resaltarse con borde coral en el CSS.
const panelAlertas = document.getElementById("panel-alertas");

document.getElementById("lista-alertas").innerHTML = obtener("alertas").map((a) => `
  <div class="alerta ${a.urgente ? "urgente" : ""}">
    <div class="alerta-cab">
      <strong>${a.nombre} · ${a.motivo}</strong>
      <span class="muted">${a.hora}</span>
    </div>
    <p>${a.detalle}</p>
    <button class="btn btn-coral" data-alerta="${a.id}">Contactar</button>
  </div>`).join("");

// US19: botón "Contactar" muestra el número y pide confirmación
// antes de intentar la llamada (flujo simulado).
document.querySelectorAll("[data-alerta]").forEach((boton) =>
  boton.addEventListener("click", () => {
    const a = obtener("alertas").find((x) => x.id === Number(boton.dataset.alerta));
    if (confirm(`Contactar a ${a.nombre} (${a.contacto}). ¿Llamar ahora?`)) {
      mostrarMensaje(`Contactando a ${a.nombre}...`, "info", panelAlertas);
    }
  })
);
