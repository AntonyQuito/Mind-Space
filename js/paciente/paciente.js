// js/paciente/paciente.js
// Panel del paciente: cubre los epics EP02, EP03, EP04 y EP05.
// ============================================================

//Devuelve la fecha de hoy en formato YYYY-MM-DD
const hoy = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------
// Catálogo de psicólogos (lectura)
// Usado en EP04 (US11, US12, US13, US14)
// ------------------------------------------------------------
const PSICOLOGOS = [
  { id: 1, nombre: "Ana María Rodríguez", esp: "Ansiedad",       ciudad: "Miraflores", tarifa: 120, anios: 12, match: 94, mod: "Virtual",    bio: "Terapia cognitivo-conductual enfocada en ansiedad y estrés." },
  { id: 2, nombre: "Carlos Mendoza",      esp: "Duelo",           ciudad: "San Isidro", tarifa: 150, anios: 15, match: 88, mod: "Presencial", bio: "Especializado en depresión y procesos de duelo." },
  { id: 3, nombre: "María Elena Torres",  esp: "Autoestima",      ciudad: "Surco",      tarifa: 100, anios: 8,  match: 82, mod: "Virtual",    bio: "Enfocada en autoestima y desarrollo personal." },
  { id: 4, nombre: "Roberto Salazar",     esp: "Estrés laboral",  ciudad: "San Borja",  tarifa: 130, anios: 10, match: 90, mod: "Virtual",    bio: "Manejo del estrés laboral y burnout." },
  { id: 5, nombre: "Patricia Ramírez",    esp: "Relaciones",      ciudad: "Jesús María",tarifa: 110, anios: 9,  match: 86, mod: "Presencial", bio: "Relaciones de pareja y habilidades sociales." },
];

// ------------------------------------------------------------
// EP02 (US04-US07): registros del diario del paciente
// EP05 (US14, US16): cita de ejemplo ya agendada
// ------------------------------------------------------------
sembrar("registros", [
  { tipo: "Emoción",   fecha: "2026-05-10", detalle: "Feliz 😊 · intensidad 4/5" },
  { tipo: "Escritura", fecha: "2026-05-09", detalle: "Hoy logré salir a caminar. Pequeños pasos, pero avanzo." },
]);
sembrar("citas", [
  { id: 1, psicologo: "Ana María Rodríguez", fecha: "2026-06-10", hora: "15:00", modalidad: "Virtual" },
]);

// ------------------------------------------------------------
// EP01 - US03: cerrar sesión
//Limpia la sesión activa y vuelve al inicio
// ------------------------------------------------------------
document.getElementById("cerrar").addEventListener("click", cerrarSesion);

// ------------------------------------------------------------
//Navegación por pestañas del menú lateral
// Activa el panel correspondiente al botón pulsado
// y cierra el menú en móvil (checkbox-hack)
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
   EP02 - Diario emocional
   ============================================================ */

// ------------------------------------------------------------
// EP02 - US04: registro de emoción con etiqueta e intensidad
// El paciente selecciona una emoción de la lista y un nivel
// de intensidad del 1 al 5 antes de guardar.
// ------------------------------------------------------------
const EMOCIONES = [
  { id: "feliz",     label: "Feliz",     emoji: "😊" },
  { id: "tranquilo", label: "Tranquilo", emoji: "😌" },
  { id: "neutral",   label: "Neutral",   emoji: "😐" },
  { id: "ansioso",   label: "Ansioso",   emoji: "😰" },
  { id: "triste",    label: "Triste",    emoji: "😢" },
  { id: "enojado",   label: "Enojado",   emoji: "😠" },
];

let emocionSel   = null; // emoción seleccionada actualmente
let intensidadSel = 3;   // intensidad seleccionada (1-5, por defecto 3)

// Genera los botones de emoción dinámicamente.
const cajaEmociones = document.getElementById("emociones");
cajaEmociones.innerHTML = EMOCIONES.map((e) =>
  `<button type="button" class="emocion" data-id="${e.id}">${e.emoji}<span>${e.label}</span></button>`
).join("");

// Resalta la emoción pulsada y guarda su id.
cajaEmociones.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".emocion");
  if (!boton) return;
  document.querySelectorAll(".emocion").forEach((b) => b.classList.toggle("sel", b === boton));
  emocionSel = boton.dataset.id;
});

// Resalta el número de intensidad pulsado y guarda el valor.
document.querySelectorAll("#intensidad button").forEach((boton) =>
  boton.addEventListener("click", () => {
    document.querySelectorAll("#intensidad button").forEach((b) => b.classList.toggle("sel", b === boton));
    intensidadSel = Number(boton.textContent);
  })
);

// Guarda el registro en localStorage y refresca el historial.
const panelEmocion = document.getElementById("panel-emocion");
document.getElementById("guardar-emocion").addEventListener("click", () => {
  if (!emocionSel) {
    mostrarMensaje("Selecciona una emoción para continuar", "error", panelEmocion);
    return;
  }
  const e = EMOCIONES.find((x) => x.id === emocionSel);
  agregar("registros", { tipo: "Emoción", fecha: hoy(), detalle: `${e.label} ${e.emoji} · intensidad ${intensidadSel}/5` });
  mostrarMensaje("Emoción registrada con éxito", "exito", panelEmocion);
  mostrarHistorial();
});

// ------------------------------------------------------------
// EP02 - US05: escritura libre con recuperación de borrador.
// El texto se guarda automáticamente en localStorage mientras
// el paciente escribe, y se recupera si recarga la página.
// ------------------------------------------------------------
const textoLibre = document.getElementById("texto-libre");

// Recupera el borrador de la sesión anterior si existe.
textoLibre.value = localStorage.getItem("borrador") || "";

// Guarda el borrador en cada pulsación de tecla.
textoLibre.addEventListener("input", () => {
  localStorage.setItem("borrador", textoLibre.value);
});

const panelTexto = document.getElementById("panel-texto");
document.getElementById("guardar-texto").addEventListener("click", () => {
  if (!textoLibre.value.trim()) {
    mostrarMensaje("No puedes guardar una entrada vacía", "error", panelTexto);
    return;
  }
  // Guarda la entrada y limpia el borrador temporal.
  agregar("registros", { tipo: "Escritura", fecha: hoy(), detalle: textoLibre.value.trim() });
  textoLibre.value = "";
  localStorage.removeItem("borrador");
  mostrarMensaje("Entrada guardada en tu historial", "exito", panelTexto);
  mostrarHistorial();
});

// ------------------------------------------------------------
// EP02 - US06: nota de voz (simulada en el frontend).
// Simula una grabación de 1.5 s y guarda el registro
// como si fuera un audio real.
// ------------------------------------------------------------
const panelVoz  = document.getElementById("panel-voz");
const botonVoz  = document.getElementById("grabar-voz");

botonVoz.addEventListener("click", () => {
  // Bloquea el botón durante la grabación simulada.
  botonVoz.disabled    = true;
  botonVoz.textContent = "● Grabando...";
  setTimeout(() => {
    botonVoz.disabled    = false;
    botonVoz.textContent = "🎙️ Grabar nota de voz";
    agregar("registros", { tipo: "Nota de voz", fecha: hoy(), detalle: "Audio de 0:03" });
    mostrarMensaje("Nota de voz guardada", "exito", panelVoz);
    mostrarHistorial();
  }, 1500);
});

// ------------------------------------------------------------
// EP02 - US07: historial con filtro por rango de fechas.
// Muestra todos los registros del diario ordenados por fecha
// descendente; permite filtrar por fecha de inicio y fin.
// ------------------------------------------------------------
const mostrarHistorial = () => {
  const desde = document.getElementById("desde").value;
  const hasta = document.getElementById("hasta").value;

  const registros = obtener("registros")
    .filter((r) => (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  document.getElementById("historial").innerHTML = registros.length
    ? registros.map((r) => `
        <div class="hist-item">
          <div class="hist-cab"><strong>${r.tipo}</strong><span class="muted">${r.fecha}</span></div>
          <p>${r.detalle}</p>
        </div>`).join("")
    : `<p class="muted">Aún no hay registros, empieza tu primer diario.</p>`;
};

// Aplica el filtro al pulsar el botón y carga el historial al iniciar.
document.getElementById("filtrar").addEventListener("click", mostrarHistorial);
mostrarHistorial();

/* ============================================================
   EP03 - Contención inmediata y SOS
   ============================================================ */

// ------------------------------------------------------------
// EP03 - US10: tips de contención emocional.
// Muestra una lista de técnicas rápidas de regulación
// cuando el paciente pulsa "Ver tips".
// ------------------------------------------------------------
const TIPS = [
  "Nombra 5 cosas que veas, 4 que toques y 3 que oigas.",
  "Bebe un vaso de agua despacio y concéntrate en la sensación.",
  "Apoya los pies en el suelo y siéntelos durante un minuto.",
  "Escribe en una frase lo que sientes ahora, sin juzgarlo.",
];

document.getElementById("ver-tips").addEventListener("click", () => {
  document.getElementById("tips").innerHTML = TIPS.map((t) => `<li>${t}</li>`).join("");
  document.getElementById("tips").hidden = false;
});

// ------------------------------------------------------------
// EP03 - US08: botón SOS con pop-up de confirmación.
// Abre un modal de confirmación antes de marcar la Línea 113
// del MINSA. Se puede cancelar, cerrar con Escape o clic fuera.
// ------------------------------------------------------------
const panelContencion = document.getElementById("panel-contencion");
const modalSos        = document.getElementById("modal-sos");
const cerrarSos       = () => { modalSos.hidden = true; };

// Cualquier elemento con [data-sos] abre el modal (botón flotante y el del panel).
document.querySelectorAll("[data-sos]").forEach((boton) =>
  boton.addEventListener("click", () => { modalSos.hidden = false; })
);

// Cancelar: cierra el modal sin llamar.
document.getElementById("sos-cancelar").addEventListener("click", cerrarSos);

// Confirmar: intenta la llamada y muestra aviso en pantalla.
document.getElementById("sos-llamar").addEventListener("click", () => {
  cerrarSos();
  window.location.href = "tel:113";
  mostrarMensaje("Si estás en una computadora, marca 113 desde tu teléfono.", "info", panelContencion);
});

// Cierra el modal al pulsar Escape o al hacer clic en el fondo oscuro.
modalSos.addEventListener("click", (evento) => { if (evento.target === modalSos) cerrarSos(); });
document.addEventListener("keydown", (evento) => { if (evento.key === "Escape") cerrarSos(); });

// ------------------------------------------------------------
// EP03 - US09: respiración guiada 4-7-8 con iniciar/pausar.
// Cicla por las tres fases (inhala 4s / retén 7s / exhala 8s)
// durante 4 ciclos. El botón "Pausar" suspende el contador
// sin reiniciarlo.
// ------------------------------------------------------------
const circulo      = document.getElementById("breath");
const botonIniciar = document.getElementById("breath-iniciar");
const botonPausar  = document.getElementById("breath-pausar");

// Fases: [nombre, duración en segundos, clase CSS de tamaño]
const fases = [
  ["Inhala", 4, "grande"],
  ["Retén",  7, "grande"],
  ["Exhala", 8, "chico"],
];
let cronometro = null, faseActual = 0, restante = 0, ciclo = 0, enPausa = false;

// Actualiza el texto y la clase visual del círculo.
const pintarFase = () => {
  const [nombre, , clase] = fases[faseActual];
  circulo.className   = "breath " + clase;
  circulo.textContent = `${nombre} · ${restante}`;
};

// Detiene el temporizador y restaura los botones al estado inicial.
const terminarRespiracion = (texto) => {
  clearInterval(cronometro);
  circulo.className   = "breath";
  circulo.textContent = texto;
  botonIniciar.hidden = false;
  botonPausar.hidden  = true;
  enPausa = false;
};

botonIniciar.addEventListener("click", () => {
  // Reinicia el estado y arranca el temporizador de 1 s.
  faseActual = 0; ciclo = 0; restante = fases[0][1]; enPausa = false;
  botonIniciar.hidden    = true;
  botonPausar.hidden     = false;
  botonPausar.textContent = "Pausar";
  pintarFase();
  clearInterval(cronometro);
  cronometro = setInterval(() => {
    if (enPausa) return;
    restante = restante - 1;
    if (restante > 0) { pintarFase(); return; }
    // Avanza a la siguiente fase; si completó las 3, suma un ciclo.
    faseActual = faseActual + 1;
    if (faseActual >= fases.length) { faseActual = 0; ciclo = ciclo + 1; }
    // Tras 4 ciclos completos, termina el ejercicio.
    if (ciclo >= 4) { terminarRespiracion("¡Listo!"); return; }
    restante = fases[faseActual][1];
    pintarFase();
  }, 1000);
});

// Alterna entre pausa y reanudación sin reiniciar el cronómetro.
botonPausar.addEventListener("click", () => {
  enPausa = !enPausa;
  botonPausar.textContent = enPausa ? "Reanudar" : "Pausar";
});

/* ============================================================
   EP04 - Búsqueda y match con psicólogos
   ============================================================ */

// ------------------------------------------------------------
// EP04 - US11: preferencias del paciente (presupuesto obligatorio).
// El paciente configura su presupuesto y motivo de consulta
// antes de ver los resultados. El presupuesto es obligatorio.
// ------------------------------------------------------------
const panelPrefs = document.getElementById("panel-prefs");

document.getElementById("buscar").addEventListener("click", () => {
  if (!document.getElementById("pref-presupuesto").value) {
    mostrarMensaje("Selecciona un presupuesto para continuar", "error", panelPrefs);
    return;
  }
  mostrarMensaje("Mostrando profesionales compatibles", "exito", panelPrefs);
  document.getElementById("resultados").hidden = false;
  mostrarPsicologos();
});

// Los filtros de especialidad y modalidad refrescan la lista en tiempo real.
document.getElementById("filtro-esp").addEventListener("change", mostrarPsicologos);
document.getElementById("filtro-mod").addEventListener("change", mostrarPsicologos);

// ------------------------------------------------------------
// EP04 - US12: lista de psicólogos ordenada por % de
// compatibilidad con filtros de especialidad y modalidad.
// ------------------------------------------------------------
function mostrarPsicologos() {
  const esp  = document.getElementById("filtro-esp").value;
  const mod  = document.getElementById("filtro-mod").value;

  // Filtra y ordena de mayor a menor porcentaje de match.
  const lista = PSICOLOGOS
    .filter((p) => (!esp || p.esp === esp) && (!mod || p.mod === mod))
    .sort((a, b) => b.match - a.match);

  document.getElementById("sin-psi").hidden = lista.length > 0;
  document.getElementById("lista-psi").innerHTML = lista.map((p) => `
    <article class="psi">
      <div class="psi-top">
        <span class="avatar">${p.nombre[0]}</span>
        <div><strong>${p.nombre}</strong><span class="muted">${p.esp}</span></div>
        <span class="match">${p.match}%</span>
      </div>
      <p class="muted">📍 ${p.ciudad} · S/ ${p.tarifa} · ${p.mod}</p>
      <button class="btn btn-block" data-ver="${p.id}" style="margin-top:10px">Ver perfil y agendar</button>
    </article>`).join("");

  // Asigna el evento a cada tarjeta después de renderizarlas.
  document.querySelectorAll("[data-ver]").forEach((b) =>
    b.addEventListener("click", () => verPerfil(Number(b.dataset.ver)))
  );
}

// ------------------------------------------------------------
// EP04 - US13: detalle del profesional.
// EP04 - US14: agendar una cita con el profesional seleccionado.
// Muestra el perfil completo en un panel en línea y permite
// elegir fecha y hora para confirmar la cita.
// ------------------------------------------------------------
function verPerfil(id) {
  const p       = PSICOLOGOS.find((x) => x.id === id);
  const detalle = document.getElementById("detalle-psi");

  // US13: información del profesional (bio, experiencia, tarifa, modalidad).
  detalle.innerHTML = `
    <p class="form-mensaje" hidden></p>
    <h2 class="panel-title">${p.nombre}</h2>
    <p class="muted">${p.esp} · ${p.match}% compatible</p>
    <p style="margin:10px 0">${p.bio}</p>
    <p class="muted">Experiencia: ${p.anios} años · Tarifa: S/ ${p.tarifa} · ${p.mod}</p>
    <label>Fecha</label>
    <input type="date" id="cita-fecha" min="${hoy()}" value="${hoy()}" />
    <label>Hora</label>
    <select id="cita-hora">
      <option>09:00</option><option>11:00</option><option>15:00</option><option>18:00</option>
    </select>
    <button class="btn" id="confirmar-cita" style="margin-top:14px">Confirmar cita</button>`;

  detalle.hidden = false;
  detalle.scrollIntoView({ behavior: "smooth" });

  // US14: guarda la cita en localStorage y notifica al paciente.
  document.getElementById("confirmar-cita").addEventListener("click", () => {
    agregar("citas", {
      id:        Date.now(),
      psicologo: p.nombre,
      fecha:     document.getElementById("cita-fecha").value,
      hora:      document.getElementById("cita-hora").value,
      modalidad: p.mod,
    });
    mostrarMensaje('Cita agendada con éxito. La verás en "Mis citas".', "exito", detalle);
    mostrarCitas(); // refresca la pestaña de citas
  });
}

/* ============================================================
   EP05 - Gestión de citas y privacidad
   ============================================================ */

// ------------------------------------------------------------
// EP05 - US16: ver, cancelar y reprogramar citas próximas.
// Lista todas las citas ordenadas por fecha y hora.
// Cancelar elimina la cita del almacenamiento.
// Reprogramar muestra un aviso (flujo simulado).
// ------------------------------------------------------------
const panelCitas = document.getElementById("panel-citas");

function mostrarCitas() {
  const citas = obtener("citas").sort((a, b) =>
    (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
  );

  document.getElementById("sin-citas").hidden   = citas.length > 0;
  document.getElementById("citas-tabla").hidden = citas.length === 0;

  document.querySelector("#citas-tabla tbody").innerHTML = citas.map((c) => `
    <tr>
      <td>${c.fecha}</td>
      <td>${c.hora}</td>
      <td>${c.psicologo}</td>
      <td>${c.modalidad}</td>
      <td class="acciones">
        <a href="#" data-reprogramar="${c.id}">Reprogramar</a>
        <a href="#" data-cancelar="${c.id}">Cancelar</a>
      </td>
    </tr>`).join("");
}

// Delegación de eventos para cancelar y reprogramar.
panelCitas.addEventListener("click", (evento) => {
  const idCancelar     = evento.target.dataset.cancelar;
  const idReprogramar  = evento.target.dataset.reprogramar;

  // US16: cancelar cita — solicita confirmación y la elimina.
  if (idCancelar) {
    evento.preventDefault();
    if (confirm("¿Seguro que quieres cancelar esta cita?")) {
      eliminar("citas", "id", Number(idCancelar));
      mostrarCitas();
      mostrarMensaje("Cita cancelada", "info", panelCitas);
    }
  }

  // US16: reprogramar cita — flujo simulado con aviso en pantalla.
  if (idReprogramar) {
    evento.preventDefault();
    mostrarMensaje("Te enviamos opciones para reprogramar", "info", panelCitas);
  }
});

mostrarCitas(); // carga inicial de la tabla

// ------------------------------------------------------------
// EP05 - US15: control de privacidad del paciente.
// El paciente activa o desactiva qué módulos comparte con su
// psicólogo. "Ocultar todo" desmarca todos los módulos.
// ------------------------------------------------------------
const panelPrivacidad = document.getElementById("panel-privacidad");
const ocultarTodo     = document.getElementById("ocultar-todo");

// Si se activa "ocultar todo", desmarca los módulos individuales.
ocultarTodo.addEventListener("change", () => {
  if (ocultarTodo.checked) {
    document.querySelectorAll(".priv-mod").forEach((c) => (c.checked = false));
    mostrarMensaje("Se ocultó toda tu información al profesional", "info", panelPrivacidad);
  }
});

// Si se activa cualquier módulo individual, desmarca "ocultar todo".
document.querySelectorAll(".priv-mod").forEach((c) =>
  c.addEventListener("change", () => { if (c.checked) ocultarTodo.checked = false; })
);

// Guarda las preferencias (simulado: confirma con aviso en pantalla).
document.getElementById("guardar-privacidad").addEventListener("click", () => {
  const activos = [...document.querySelectorAll(".priv-mod")].filter((c) => c.checked).length;
  if (activos === 0 && !ocultarTodo.checked) {
    mostrarMensaje("Tu psicólogo no podrá ver ninguna información", "error", panelPrivacidad);
    return;
  }
  mostrarMensaje("Preferencias de privacidad guardadas", "exito", panelPrivacidad);
});
