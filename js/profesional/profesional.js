// ============================================================
// js/profesional/profesional.js
// Panel del profesional: cubre EP06 (US17, US18, US19) y
// EP07 (US20 prioridad, US21 mensajes de seguimiento).
//
// Nota: además de las user stories, este panel incluye vistas de
// métricas y contenido de contexto (Resumen, KPIs, agenda,
// actividad) que enriquecen la presentación del dashboard sin
// introducir nuevas historias de usuario.
// ============================================================

// Utilidad: fecha de hoy en formato YYYY-MM-DD.
const hoyPro = () => new Date().toISOString().slice(0, 10);

// Etiquetas, clases CSS y colores para cada nivel de estabilidad.
const NIVEL = {
  estable:  ["Estable",   "pill-estable",  "#10B981"],
  atencion: ["Atención",  "pill-atencion", "#2F55E7"],
  crisis:   ["Crisis",    "pill-crisis",   "#e0414f"],
};

// ------------------------------------------------------------
// Datos de ejemplo sembrados en localStorage la primera vez.
// US17: lista de pacientes vinculados (con campos extra de contexto
//       como adherencia, motivo, próxima cita y teléfono para
//       enriquecer la vista sin cambiar la historia de usuario).
// US19: alertas SOS generadas por pacientes.
// ------------------------------------------------------------
sembrar("pacientes", [
  { id: 1, nombre: "Ana M.",      ult: "2 días",   bienestar: 78, nivel: "estable",  edad: 28, motivo: "Ansiedad",       adherencia: 92, racha: 12, proxima: "Mié 2 Jul · 15:00", telefono: "+51 987 111 222" },
  { id: 2, nombre: "Carlos R.",   ult: "5 días",   bienestar: 45, nivel: "atencion", edad: 34, motivo: "Duelo",          adherencia: 61, racha: 3,  proxima: "Jue 3 Jul · 11:00", telefono: "+51 987 333 444" },
  { id: 3, nombre: "Lucía P.",    ult: "1 día",    bienestar: 82, nivel: "estable",  edad: 25, motivo: "Autoestima",     adherencia: 88, racha: 21, proxima: "Vie 4 Jul · 09:00", telefono: "+51 987 555 666" },
  { id: 4, nombre: "Miguel S.",   ult: "3 días",   bienestar: 35, nivel: "crisis",   edad: 41, motivo: "Ansiedad severa", adherencia: 40, racha: 0,  proxima: "Hoy · 18:00",       telefono: "+51 987 654 321" },
  { id: 5, nombre: "Patricia L.", ult: "1 semana", bienestar: 52, nivel: "atencion", edad: 30, motivo: "Estrés laboral", adherencia: 55, racha: 5,  proxima: "Lun 7 Jul · 16:00", telefono: "+51 987 777 888" },
  { id: 6, nombre: "Jorge V.",    ult: "4 días",   bienestar: 71, nivel: "estable",  edad: 38, motivo: "Relaciones",     adherencia: 80, racha: 9,  proxima: "Mar 8 Jul · 10:00", telefono: "+51 987 999 000" },
  { id: 7, nombre: "Sofía N.",    ult: "6 días",   bienestar: 48, nivel: "atencion", edad: 22, motivo: "Depresión leve", adherencia: 58, racha: 2,  proxima: "Mié 9 Jul · 12:00", telefono: "+51 986 121 314" },
]);
sembrar("alertas", [
  { id: 1, nombre: "Miguel S.",   urgente: true,  hora: "Hoy, 11:45 PM", motivo: "Ansiedad severa",   contacto: "+51 987 654 321", detalle: 'Diario: "No puedo dormir, pensamientos recurrentes."' },
  { id: 2, nombre: "Laura T.",    urgente: false, hora: "Ayer, 3:20 PM", motivo: "Tristeza profunda", contacto: "+51 912 345 678", detalle: "Atendida por la Línea 113." },
  { id: 3, nombre: "Carlos R.",   urgente: true,  hora: "Hoy, 9:10 AM",  motivo: "Ánimo muy bajo",    contacto: "+51 987 333 444", detalle: 'Diario: "Me cuesta levantarme, no encuentro sentido."' },
  { id: 4, nombre: "Patricia L.", urgente: false, hora: "Hace 2 días",   motivo: "Sin registros",     contacto: "+51 987 777 888", detalle: "No registra emociones desde hace 5 días." },
]);

// ------------------------------------------------------------
// EP01 - US03: cerrar sesión del profesional.
// ------------------------------------------------------------
document.getElementById("cerrar").addEventListener("click", cerrarSesion);

// ------------------------------------------------------------
// Navegación por pestañas del menú lateral.
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
   Métricas y helpers de presentación (contexto del dashboard)
   Derivan de los datos de US17/US18; no son nuevas historias.
   ============================================================ */

// Calcula indicadores agregados a partir de la lista de pacientes.
function calcularMetricas() {
  const pacientes = obtener("pacientes");
  const total = pacientes.length;
  const porNivel = { estable: 0, atencion: 0, crisis: 0 };
  let sumaBienestar = 0, sumaAdherencia = 0;
  pacientes.forEach((p) => {
    porNivel[p.nivel]++;
    sumaBienestar += p.bienestar;
    sumaAdherencia += p.adherencia;
  });
  return {
    total,
    porNivel,
    bienestarProm: total ? Math.round(sumaBienestar / total) : 0,
    adherenciaProm: total ? Math.round(sumaAdherencia / total) : 0,
    prioritarios: obtenerPrioritarios().length,
    alertasUrgentes: obtener("alertas").filter((a) => a.urgente).length,
  };
}

// Construye una tarjeta KPI.
function kpi(label, num, sub, clase = "") {
  return `<div class="kpi"><div class="kpi-label">${label}</div>
    <div class="kpi-num ${clase}">${num}</div>
    <div class="kpi-sub">${sub}</div></div>`;
}

// Serie agregada de bienestar del panel (promedio de todos los pacientes).
function serieAgregada() {
  const pacientes = obtener("pacientes");
  const series = pacientes.map((p) => serie30(p.id));
  return Array.from({ length: 30 }, (_, i) => ({
    dia: i + 1,
    val: Math.round(series.reduce((a, s) => a + s[i].val, 0) / series.length),
  }));
}

// Compara la última semana contra la previa para estimar la tendencia.
function tendenciaDe(serie) {
  const ult = serie.slice(-7).reduce((a, b) => a + b.val, 0) / 7;
  const prev = serie.slice(-14, -7).reduce((a, b) => a + b.val, 0) / 7;
  const dif = Math.round(ult - prev);
  if (dif >= 2) return { txt: `▲ +${dif}% esta semana`, clase: "sube", palabra: "al alza" };
  if (dif <= -2) return { txt: `▼ ${dif}% esta semana`, clase: "baja", palabra: "a la baja" };
  return { txt: "▬ estable esta semana", clase: "plana", palabra: "estable" };
}

/* ============================================================
   EP06 - Resumen (vista de métricas del profesional)
   ============================================================ */
function renderResumen() {
  const m = calcularMetricas();

  // KPIs principales.
  document.getElementById("kpis").innerHTML = [
    kpi("Pacientes activos", m.total, "vinculados a tu perfil"),
    kpi("Prioritarios", m.prioritarios, `de ${MAX_PRIORITARIOS} posibles`, m.prioritarios ? "warn" : ""),
    kpi("En crisis", m.porNivel.crisis, "requieren atención inmediata", m.porNivel.crisis ? "bad" : "ok"),
    kpi("En atención", m.porNivel.atencion, "seguimiento cercano", "warn"),
    kpi("Bienestar promedio", m.bienestarProm + "%", "del panel completo", m.bienestarProm >= 60 ? "ok" : "warn"),
    kpi("Adherencia media", m.adherenciaProm + "%", "cumplimiento de registros"),
  ].join("");

  document.getElementById("tag-total").textContent = `${m.total} pacientes`;

  // Barras de distribución por estado.
  const filas = [
    ["Estables", m.porNivel.estable, NIVEL.estable[2]],
    ["En atención", m.porNivel.atencion, NIVEL.atencion[2]],
    ["En crisis", m.porNivel.crisis, NIVEL.crisis[2]],
  ];
  document.getElementById("barras-estado").innerHTML = filas.map(([nombre, n, color]) => {
    const pct = m.total ? Math.round((n / m.total) * 100) : 0;
    return `<div class="barra-row">
      <span>${nombre}</span>
      <div class="barra-track"><div class="barra-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="barra-val">${n}</span>
    </div>`;
  }).join("");
  document.getElementById("nota-estado").textContent =
    m.porNivel.crisis > 0
      ? `Tienes ${m.porNivel.crisis} paciente(s) en crisis. Prioriza su contacto hoy.`
      : "Ningún paciente en crisis por ahora. Buen trabajo de seguimiento.";

  // Gráfico agregado de bienestar del panel.
  const serie = serieAgregada();
  document.getElementById("grafico-agregado").innerHTML = grafico(serie, false);
  const t = tendenciaDe(serie);
  document.getElementById("tendencia-global").innerHTML =
    `Tendencia general: <span class="tendencia ${t.clase}">${t.txt}</span> · el bienestar del panel está ${t.palabra}.`;

  // Agenda de hoy (contenido de contexto).
  const agenda = [
    { hora: "10:00", quien: "Lucía P.", tipo: "Seguimiento · Virtual" },
    { hora: "12:30", quien: "Jorge V.", tipo: "Primera sesión · Presencial" },
    { hora: "16:00", quien: "Patricia L.", tipo: "Seguimiento · Virtual" },
    { hora: "18:00", quien: "Miguel S.", tipo: "Sesión de contención · Virtual" },
  ];
  document.getElementById("agenda-hoy").innerHTML = agenda.map((c) =>
    `<li><span><strong>${c.hora}</strong> · ${c.quien}</span><span class="cuando">${c.tipo}</span></li>`
  ).join("");

  // Actividad reciente (contenido de contexto).
  const actividad = [
    { ico: "📝", txt: "<strong>Ana M.</strong> registró una emoción (Feliz · 4/5).", cuando: "Hace 15 min" },
    { ico: "🚨", txt: "<strong>Miguel S.</strong> activó el botón SOS.", cuando: "Hace 1 h" },
    { ico: "📉", txt: "<strong>Carlos R.</strong> bajó su bienestar a 45%.", cuando: "Hace 3 h" },
    { ico: "✉️", txt: "Enviaste un mensaje de seguimiento a <strong>Lucía P.</strong>", cuando: "Ayer" },
    { ico: "⭐", txt: "Marcaste a <strong>Miguel S.</strong> como prioritario.", cuando: "Ayer" },
  ];
  document.getElementById("actividad").innerHTML = actividad.map((a) =>
    `<div class="feed-act"><div class="ico">${a.ico}</div><div class="txt">${a.txt}<div class="cuando">${a.cuando}</div></div></div>`
  ).join("");
}

/* ============================================================
   EP06 - US17: lista de pacientes vinculados y búsqueda
   EP07 - US20: marcar paciente prioritario (estrella)
   ============================================================ */
const cuerpoTabla = document.querySelector("#tabla-pacientes tbody");
const MAX_PRIORITARIOS = 10; // US20: límite de pacientes prioritarios
let filtroEstado = "todos";  // filtro por estado activo en la tabla

// Lee/guarda la lista de ids de pacientes marcados como prioritarios.
const obtenerPrioritarios = () => obtener("prioritarios"); // arreglo de ids
const esPrioritario = (id) => obtenerPrioritarios().includes(id);

// Barra de color para la adherencia dentro de la celda.
function celdaAdherencia(valor) {
  const color = valor >= 75 ? "#10B981" : valor >= 50 ? "#d98a00" : "#e0414f";
  return `<div style="display:flex;align-items:center;gap:8px">
    <div class="barra-track" style="width:60px"><div class="barra-fill" style="width:${valor}%;background:${color}"></div></div>
    <span style="font-size:.82rem;color:var(--texto-2)">${valor}%</span></div>`;
}

// Mini-métricas de la cartera de pacientes (encabezado de la pestaña).
function renderKpisPacientes() {
  const m = calcularMetricas();
  document.getElementById("kpis-pacientes").innerHTML = [
    kpi("Total", m.total, "pacientes vinculados"),
    kpi("Bienestar prom.", m.bienestarProm + "%", "del panel", m.bienestarProm >= 60 ? "ok" : "warn"),
    kpi("Adherencia media", m.adherenciaProm + "%", "de registros"),
    kpi("Prioritarios", m.prioritarios, "en seguimiento cercano", m.prioritarios ? "warn" : ""),
  ].join("");
}

// Renderiza la tabla. US20: los pacientes prioritarios se muestran
// primero (con estrella activa y fila resaltada), luego el resto.
function renderPacientes() {
  const pacientes = obtener("pacientes");
  const prioritarios = obtenerPrioritarios();

  // Ordena: primero los prioritarios (en su orden), luego los demás.
  let ordenados = [
    ...prioritarios.map((id) => pacientes.find((p) => p.id === id)).filter(Boolean),
    ...pacientes.filter((p) => !prioritarios.includes(p.id)),
  ];

  // Aplica el filtro por estado (chips).
  if (filtroEstado !== "todos") ordenados = ordenados.filter((p) => p.nivel === filtroEstado);

  document.getElementById("sin-pacientes").hidden = ordenados.length > 0;

  cuerpoTabla.innerHTML = ordenados.map((p) => {
    const [texto, clase] = NIVEL[p.nivel];
    const on = esPrioritario(p.id);
    return `<tr data-id="${p.id}" class="${on ? "fila-prioritaria" : ""}">
      <td><button class="star ${on ? "on" : ""}" data-estrella="${p.id}" title="Marcar prioridad">${on ? "★" : "☆"}</button></td>
      <td><strong>${p.nombre}</strong><br><span class="muted" style="font-size:.78rem">${p.edad} años</span></td>
      <td>${p.motivo}</td>
      <td>Hace ${p.ult}</td>
      <td>${p.bienestar}%</td>
      <td>${celdaAdherencia(p.adherencia)}</td>
      <td><span class="muted" style="font-size:.85rem">${p.proxima}</span></td>
      <td><span class="pill ${clase}">${texto}</span></td>
    </tr>`;
  }).join("");

  renderKpisPacientes();
}

// US20: clic en la estrella marca/desmarca prioridad (sin abrir el detalle).
// US18: clic en el resto de la fila abre el detalle del paciente.
cuerpoTabla.addEventListener("click", (evento) => {
  const estrella = evento.target.closest("[data-estrella]");
  if (estrella) {
    evento.stopPropagation();
    togglePrioritario(Number(estrella.dataset.estrella));
    return;
  }
  const fila = evento.target.closest("tr[data-id]");
  if (fila) verPaciente(Number(fila.dataset.id));
});

// US20: alterna el estado prioritario de un paciente.
function togglePrioritario(id) {
  const lista = obtenerPrioritarios();
  if (lista.includes(id)) {
    // Escenario alternativo: vuelve al orden normal de la lista.
    guardar("prioritarios", lista.filter((x) => x !== id));
  } else {
    // Escenario de error: máximo 10 pacientes prioritarios.
    if (lista.length >= MAX_PRIORITARIOS) {
      mostrarMensaje(`Ya tienes ${MAX_PRIORITARIOS} pacientes prioritarios. Desmarca uno antes de agregar otro.`, "error", document.querySelector('[data-panel="pacientes"]'));
      return;
    }
    // Escenario exitoso: se agrega al inicio de la lista de prioridad.
    guardar("prioritarios", [id, ...lista]);
  }
  renderPacientes();
  renderResumen(); // mantiene los KPIs sincronizados
}

// Filtro por estado (chips): actualiza la tabla en tiempo real.
document.getElementById("chips-estado").addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip-estado");
  if (!chip) return;
  document.querySelectorAll(".chip-estado").forEach((c) => c.classList.toggle("on", c === chip));
  filtroEstado = chip.dataset.estado;
  renderPacientes();
});

// US17: búsqueda en tiempo real ocultando las filas que no coinciden.
document.getElementById("buscar-paciente").addEventListener("input", (evento) => {
  const texto = evento.target.value.toLowerCase();
  cuerpoTabla.querySelectorAll("tr").forEach((fila) => {
    fila.style.display = fila.textContent.toLowerCase().includes(texto) ? "" : "none";
  });
});

/* ============================================================
   EP06 - US18: patrones emocionales del paciente (gráfico 30 días)
   EP07 - US21: enviar mensaje de seguimiento desde el detalle
   ============================================================ */

// Plantillas de mensaje de seguimiento (US21).
const PLANTILLAS = [
  "¿Cómo te has sentido desde nuestra última sesión?",
  "Recuerda tus ejercicios de respiración esta semana. Estoy aquí para ti.",
  "Quería saber cómo vas. No dudes en escribirme si lo necesitas.",
];

// Distribución de emociones simulada (estable por paciente) para el
// desglose del detalle. Es contenido de contexto de US18.
function emocionesDe(id) {
  const bases = {
    1: [50, 25, 15, 10], 2: [20, 20, 35, 25], 3: [55, 25, 12, 8],
    4: [10, 15, 40, 35], 5: [22, 28, 30, 20], 6: [45, 30, 15, 10], 7: [18, 27, 33, 22],
  }[id] || [30, 30, 20, 20];
  const etiquetas = [["Positivas", "#10B981"], ["Neutras", "#8B93A7"], ["Ansiosas", "#2F55E7"], ["Negativas", "#e0414f"]];
  return etiquetas.map((e, i) => ({ nombre: e[0], color: e[1], pct: bases[i] }));
}

function verPaciente(id) {
  const p      = obtener("pacientes").find((x) => x.id === id);
  const serie  = serie30(id);
  const [texto, clase] = NIVEL[p.nivel];
  const detalle = document.getElementById("detalle");
  const t = tendenciaDe(serie);

  // Desglose de emociones (barras de contexto).
  const desglose = emocionesDe(id).map((e) => `
    <div class="barra-row">
      <span>${e.nombre}</span>
      <div class="barra-track"><div class="barra-fill" style="width:${e.pct}%;background:${e.color}"></div></div>
      <span class="barra-val">${e.pct}%</span>
    </div>`).join("");

  // Historial de sesiones (contenido de contexto).
  const sesiones = [
    { fecha: "24 Jun 2026", tipo: "Seguimiento", nota: "Trabajamos técnicas de respiración. Mejora leve." },
    { fecha: "17 Jun 2026", tipo: "Seguimiento", nota: "Refiere problemas de sueño. Se ajustan objetivos." },
    { fecha: "10 Jun 2026", tipo: "Primera sesión", nota: "Evaluación inicial y encuadre terapéutico." },
  ];

  detalle.innerHTML = `
    <p class="form-mensaje" hidden></p>
    <h2 class="page-title">${p.nombre} <span class="pill ${clase}">${texto}</span></h2>
    <p class="page-subtitle">${p.edad} años · ${p.motivo} · 📞 ${p.telefono}</p>

    <!-- US18: métricas clínicas del paciente (contexto ampliado) -->
    <div class="stat-grid">
      <div class="stat"><div class="stat-label">Bienestar actual</div><div class="stat-val">${p.bienestar}%</div></div>
      <div class="stat"><div class="stat-label">Promedio 30 días</div><div class="stat-val">${promedio(serie)}%</div></div>
      <div class="stat"><div class="stat-label">Tendencia</div><div class="stat-val"><span class="tendencia ${t.clase}" style="font-size:1rem">${t.txt.split(" ")[0]}</span></div></div>
      <div class="stat"><div class="stat-label">Adherencia</div><div class="stat-val">${p.adherencia}%</div></div>
      <div class="stat"><div class="stat-label">Racha</div><div class="stat-val">${p.racha} días</div></div>
      <div class="stat"><div class="stat-label">Próxima cita</div><div class="stat-val" style="font-size:.95rem">${p.proxima}</div></div>
    </div>

    <!-- US18: patrón emocional de los últimos 30 días -->
    <h3 class="panel-sub-titulo" style="margin-top:8px">Evolución del bienestar (30 días)</h3>
    <div class="grafico">${grafico(serie)}</div>
    <p class="muted" style="margin-top:6px">Haz clic en un punto para ver el registro de ese día. Tendencia semanal: <span class="tendencia ${t.clase}">${t.txt}</span>.</p>

    <h3 class="panel-sub-titulo" style="margin-top:18px">Distribución emocional</h3>
    <div class="barras">${desglose}</div>

    <!-- Historial de sesiones (contexto) -->
    <h3 class="panel-sub-titulo" style="margin-top:20px">Historial de sesiones</h3>
    <div class="tabla-wrap">
      <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Nota clínica</th></tr></thead>
      <tbody>${sesiones.map((s) => `<tr><td>${s.fecha}</td><td>${s.tipo}</td><td>${s.nota}</td></tr>`).join("")}</tbody></table>
    </div>

    <div class="mini-nota">Nota: el bienestar y la adherencia se calculan a partir de los registros del diario del paciente. Los módulos ocultos por el paciente (privacidad) no se muestran aquí.</div>

    <!-- EP07 - US21: mensaje de seguimiento -->
    <h3 class="panel-sub-titulo" style="margin-top:22px">Enviar seguimiento</h3>
    <label>Plantilla</label>
    <select id="plantilla-msg">
      ${PLANTILLAS.map((tpl) => `<option>${tpl}</option>`).join("")}
      <option value="__custom">Escribir mensaje personalizado...</option>
    </select>
    <textarea id="msg-custom" placeholder="Tu mensaje personalizado..." hidden style="margin-top:10px"></textarea>
    <button class="btn" id="enviar-seguimiento" style="margin-top:12px">Enviar seguimiento</button>`;

  document.getElementById("vista-lista").hidden   = true;
  document.getElementById("vista-detalle").hidden = false;

  // US18: clic en un punto del gráfico muestra el valor de ese día.
  detalle.querySelectorAll(".punto").forEach((punto) =>
    punto.addEventListener("click", () => {
      mostrarMensaje(`Día ${punto.dataset.dia}: bienestar ${punto.dataset.val}%`, "info", detalle);
    })
  );

  // US21: muestra el textarea solo si se elige "mensaje personalizado".
  const selectPlantilla = document.getElementById("plantilla-msg");
  const areaCustom = document.getElementById("msg-custom");
  selectPlantilla.addEventListener("change", () => {
    areaCustom.hidden = selectPlantilla.value !== "__custom";
  });

  // US21: enviar el mensaje de seguimiento (simulado).
  document.getElementById("enviar-seguimiento").addEventListener("click", () => {
    const esCustom = selectPlantilla.value === "__custom";
    const mensaje = esCustom ? areaCustom.value.trim() : selectPlantilla.value;

    // Escenario de error: el mensaje personalizado no puede ir vacío.
    if (esCustom && !mensaje) {
      mostrarMensaje("El mensaje no puede estar vacío", "error", detalle);
      return;
    }

    // Escenario alternativo: si ya se envió un mensaje en los últimos
    // 3 días al mismo paciente, se pide confirmación para no saturarlo.
    const seguimientos = obtener("seguimientos"); // [{ id, fecha }]
    const previo = seguimientos.find((s) => s.id === id);
    if (previo) {
      const dias = (new Date(hoyPro()) - new Date(previo.fecha)) / (1000 * 60 * 60 * 24);
      if (dias < 3 && !confirm("Ya enviaste un mensaje en los últimos 3 días. ¿Deseas enviar otro?")) {
        return;
      }
    }

    // Registra el envío y muestra la confirmación.
    guardar("seguimientos", [...seguimientos.filter((s) => s.id !== id), { id, fecha: hoyPro() }]);
    mostrarMensaje("Mensaje enviado", "exito", detalle);
  });
}

document.getElementById("volver").addEventListener("click", () => {
  document.getElementById("vista-detalle").hidden = true;
  document.getElementById("vista-lista").hidden   = false;
});

// Serie pseudo-aleatoria pero estable por paciente (determinista).
function serie30(semilla) {
  const base = { 1: 70, 2: 48, 3: 76, 4: 35, 5: 52, 6: 66, 7: 50 }[semilla] || 60;
  return Array.from({ length: 30 }, (_, i) => {
    const v = Math.max(15, Math.min(95,
      Math.round(base + Math.sin((i + semilla) / 3) * 9 + (i / 30) * 8)
    ));
    return { dia: i + 1, val: v };
  });
}
const promedio = (serie) =>
  Math.round(serie.reduce((a, b) => a + b.val, 0) / serie.length);

// Gráfico de línea en SVG con guías y puntos (US18).
// conPuntos: si es false, dibuja solo la línea (para el gráfico agregado).
function grafico(serie, conPuntos = true) {
  const ancho = 640, alto = 180, m = 24;
  const x = (i) => m + (i * (ancho - m * 2)) / (serie.length - 1);
  const y = (v) => alto - m - (v / 100) * (alto - m * 2);
  const linea  = serie.map((d, i) => `${i ? "L" : "M"} ${x(i).toFixed(0)} ${y(d.val).toFixed(0)}`).join(" ");
  const puntos = conPuntos ? serie.map((d, i) =>
    `<circle class="punto" cx="${x(i).toFixed(0)}" cy="${y(d.val).toFixed(0)}" r="4" fill="#2F55E7" style="cursor:pointer" data-dia="${d.dia}" data-val="${d.val}"></circle>`
  ).join("") : "";
  const guias = [25, 50, 75].map((g) =>
    `<line x1="${m}" y1="${y(g)}" x2="${ancho - m}" y2="${y(g)}" stroke="#E2E8F0" stroke-dasharray="3 4"></line>`
  ).join("");
  return `<svg viewBox="0 0 ${ancho} ${alto}">${guias}<path d="${linea}" fill="none" stroke="#2F55E7" stroke-width="2.5"></path>${puntos}</svg>`;
}

/* ============================================================
   EP06 - US19: alertas SOS y acción de contacto
   ============================================================ */
const panelAlertas = document.getElementById("panel-alertas");

// Resumen de alertas (KPIs de contexto).
function renderKpisAlertas() {
  const alertas = obtener("alertas");
  const urgentes = alertas.filter((a) => a.urgente).length;
  const hoy = alertas.filter((a) => /hoy/i.test(a.hora)).length;
  document.getElementById("kpis-alertas").innerHTML = [
    kpi("Alertas activas", alertas.length, "en total", alertas.length ? "warn" : "ok"),
    kpi("Urgentes", urgentes, "atención inmediata", urgentes ? "bad" : "ok"),
    kpi("Registradas hoy", hoy, "en las últimas horas"),
    kpi("Línea 113", "24/7", "derivación de crisis"),
  ].join("");
}

function renderAlertas() {
  renderKpisAlertas();
  document.getElementById("lista-alertas").innerHTML = obtener("alertas").map((a) => `
    <div class="alerta ${a.urgente ? "urgente" : ""}">
      <div class="alerta-cab">
        <strong>${a.nombre} · ${a.motivo}</strong>
        <span class="muted">${a.hora}${a.urgente ? ' · <span style="color:#e0414f;font-weight:600">Urgente</span>' : ""}</span>
      </div>
      <p>${a.detalle}</p>
      <button class="btn btn-coral" data-alerta="${a.id}">Contactar</button>
    </div>`).join("");

  // US19: botón "Contactar" pide confirmación antes de la llamada.
  document.querySelectorAll("[data-alerta]").forEach((boton) =>
    boton.addEventListener("click", () => {
      const a = obtener("alertas").find((x) => x.id === Number(boton.dataset.alerta));
      if (confirm(`Contactar a ${a.nombre} (${a.contacto}). ¿Llamar ahora?`)) {
        mostrarMensaje(`Contactando a ${a.nombre}...`, "info", panelAlertas);
      }
    })
  );
}

// ------------------------------------------------------------
// Render inicial de todas las vistas.
// ------------------------------------------------------------
renderResumen();
renderPacientes();
renderAlertas();
