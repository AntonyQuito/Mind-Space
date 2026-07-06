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
// EP02 (US04-US07): registros del diario del paciente.
// Se siembran los últimos 8 días con una emoción por día para que
// el historial (US07), el gráfico de progreso (US22) y la racha
// (US23) tengan datos con fechas actuales la primera vez.
// EP05 (US14, US16): cita de ejemplo ya agendada.
// ------------------------------------------------------------
const fechaHace = (dias) => {
  const f = new Date();
  f.setDate(f.getDate() - dias);
  return f.toISOString().slice(0, 10);
};
const EMOCIONES_SEED = [
  { label: "Feliz", emoji: "😊", int: 4 }, { label: "Tranquilo", emoji: "😌", int: 4 },
  { label: "Neutral", emoji: "😐", int: 3 }, { label: "Ansioso", emoji: "😰", int: 2 },
  { label: "Feliz", emoji: "😊", int: 5 }, { label: "Triste", emoji: "😢", int: 2 },
  { label: "Tranquilo", emoji: "😌", int: 3 }, { label: "Feliz", emoji: "😊", int: 4 },
];
sembrar(
  "registros",
  EMOCIONES_SEED.map((e, i) => ({
    tipo: "Emoción",
    fecha: fechaHace(EMOCIONES_SEED.length - 1 - i), // del más antiguo a hoy
    detalle: `${e.label} ${e.emoji} · intensidad ${e.int}/5`,
  })).concat([
    { tipo: "Escritura", fecha: fechaHace(1), detalle: "Hoy logré salir a caminar. Pequeños pasos, pero avanzo." },
  ])
);
// Las citas ahora viven en Supabase (tabla "citas"), ya no se siembran en localStorage.

// ------------------------------------------------------------
// EP01 - US03: cerrar sesión
//Limpia la sesión activa y vuelve al inicio
// ------------------------------------------------------------
document.getElementById("cerrar").addEventListener("click", cerrarSesion);

// ------------------------------------------------------------
// Guard de sesión (Supabase): si no hay usuario logueado,
// vuelve al login. Guarda el usuario activo en "usuarioActual"
// para usarlo al crear, listar y cancelar citas.
// ------------------------------------------------------------
let usuarioActual = null;

(async () => {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }
  usuarioActual = user;
  mostrarCitas(); // ahora sí, carga las citas del paciente desde Supabase
})();

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

  // US14: guarda la cita en Supabase y notifica al paciente.
  document.getElementById("confirmar-cita").addEventListener("click", async () => {
    const { error } = await db.from("citas").insert({
      paciente_id: usuarioActual.id,
      psicologo:   p.nombre,
      fecha:       document.getElementById("cita-fecha").value,
      hora:        document.getElementById("cita-hora").value,
      modalidad:   p.mod,
    });

    if (error) {
      mostrarMensaje("No se pudo agendar la cita: " + error.message, "error", detalle);
      return;
    }

    mostrarMensaje('Cita agendada con éxito. La verás en "Mis citas".', "exito", detalle);
    mostrarCitas(); // refresca la pestaña de citas
  });
}

/* ============================================================
   EP05 - Gestión de citas y privacidad
   ============================================================ */

// ------------------------------------------------------------
// EP05 - US16: ver, cancelar y reprogramar citas próximas.
// Lista todas las citas (Supabase) ordenadas por fecha y hora.
// Cancelar elimina la cita de la base de datos.
// Reprogramar muestra un aviso (flujo simulado).
// ------------------------------------------------------------
const panelCitas = document.getElementById("panel-citas");

// Trae las citas del paciente activo desde Supabase y las pinta.
async function mostrarCitas() {
  if (!usuarioActual) return; // aún no se resolvió la sesión

  const { data: citas, error } = await db
    .from("citas")
    .select("*")
    .eq("paciente_id", usuarioActual.id)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) {
    mostrarMensaje("No se pudieron cargar tus citas: " + error.message, "error", panelCitas);
    return;
  }

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
panelCitas.addEventListener("click", async (evento) => {
  const idCancelar     = evento.target.dataset.cancelar;
  const idReprogramar  = evento.target.dataset.reprogramar;

  // US16: cancelar cita — solicita confirmación y la elimina en Supabase.
  if (idCancelar) {
    evento.preventDefault();
    if (confirm("¿Seguro que quieres cancelar esta cita?")) {
      const { error } = await db.from("citas").delete().eq("id", idCancelar);
      if (error) {
        mostrarMensaje("No se pudo cancelar la cita: " + error.message, "error", panelCitas);
        return;
      }
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

// Nota: la carga inicial de la tabla ocurre dentro del guard de
// sesión (más arriba), una vez que "usuarioActual" está disponible.


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

/* ============================================================
   EP08 - Progreso personal y hábito de uso
   ============================================================ */

// Extrae la intensidad (1-5) y la etiqueta de emoción desde el
// texto de un registro de tipo "Emoción". Devuelve null si no aplica.
function leerEmocion(registro) {
  if (registro.tipo !== "Emoción") return null;
  const m = registro.detalle.match(/intensidad\s+(\d)/i);
  const etiqueta = registro.detalle.split(" ")[0]; // primera palabra = emoción
  return { etiqueta, intensidad: m ? Number(m[1]) : 3 };
}

// Dibuja un gráfico de línea simple en SVG a partir de una lista
// de puntos { fecha, val } (val en escala 1-5). Reutilizado por US22.
function graficoLinea(puntos) {
  if (!puntos.length) return "";
  const ancho = 640, alto = 180, m = 26;
  const x = (i) => m + (i * (ancho - m * 2)) / Math.max(1, puntos.length - 1);
  const y = (v) => alto - m - ((v - 1) / 4) * (alto - m * 2); // escala 1..5
  const linea = puntos.map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(0)} ${y(p.val).toFixed(0)}`).join(" ");
  const circulos = puntos.map((p, i) =>
    `<circle cx="${x(i).toFixed(0)}" cy="${y(p.val).toFixed(0)}" r="4" fill="#2F55E7"></circle>`
  ).join("");
  const guias = [2, 3, 4].map((g) =>
    `<line x1="${m}" y1="${y(g)}" x2="${ancho - m}" y2="${y(g)}" stroke="#E2E8F0" stroke-dasharray="3 4"></line>`
  ).join("");
  return `<svg viewBox="0 0 ${ancho} ${alto}">${guias}<path d="${linea}" fill="none" stroke="#2F55E7" stroke-width="2.5"></path>${circulos}</svg>`;
}

// ------------------------------------------------------------
// EP08 - US22: ver mi progreso emocional en gráficos.
// Muestra un gráfico de líneas con la evolución de la intensidad
// emocional y la emoción predominante. Permite alternar entre
// vista semanal (7 días) y mensual (30 días). Si hay menos de 7
// días con registros, indica que se necesitan al menos 7 días.
// ------------------------------------------------------------
const panelProgreso = document.getElementById("panel-progreso");

function mostrarProgreso(rango) {
  const dias = rango === "mensual" ? 30 : 7;
  const limite = fechaHace(dias - 1);

  // Registros de emoción dentro del rango seleccionado.
  const emociones = obtener("registros")
    .filter((r) => r.tipo === "Emoción" && r.fecha >= limite)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // US22 (escenario de error): se exigen al menos 7 días distintos.
  const diasDistintos = new Set(emociones.map((r) => r.fecha)).size;
  if (diasDistintos < 7) {
    document.getElementById("prog-grafico").innerHTML = "";
    document.getElementById("prog-predominante").textContent = "";
    mostrarMensaje("Necesitas al menos 7 días de registros para mostrar tu evolución.", "info", panelProgreso);
    return;
  }

  // Construye los puntos del gráfico (intensidad por registro).
  const puntos = emociones.map((r) => ({ fecha: r.fecha, val: leerEmocion(r).intensidad }));
  document.getElementById("prog-grafico").innerHTML = graficoLinea(puntos);

  // Calcula la emoción predominante (la etiqueta más frecuente).
  const conteo = {};
  emociones.forEach((r) => {
    const et = leerEmocion(r).etiqueta;
    conteo[et] = (conteo[et] || 0) + 1;
  });
  const predominante = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0];
  document.getElementById("prog-predominante").textContent =
    `Emoción predominante (${rango}): ${predominante}`;

  // Oculta cualquier mensaje previo de "datos insuficientes".
  const caja = panelProgreso.querySelector(".form-mensaje");
  if (caja) caja.hidden = true;
}

// US22 (escenario alternativo): los botones cambian el rango del gráfico.
document.getElementById("prog-semanal").addEventListener("click", () => mostrarProgreso("semanal"));
document.getElementById("prog-mensual").addEventListener("click", () => mostrarProgreso("mensual"));

// ------------------------------------------------------------
// EP08 - US23: racha de días consecutivos.
// Cuenta los días seguidos (terminando hoy) con al menos un
// registro y muestra un mensaje motivador. Si se rompió la racha
// muestra un mensaje empático y reinicia a 0. La opción "Día de
// descanso" conserva la racha aunque hoy no se registre nada.
// ------------------------------------------------------------
const checkDescanso = document.getElementById("dia-descanso");
checkDescanso.checked = localStorage.getItem("diaDescanso") === "1";
checkDescanso.addEventListener("change", () => {
  localStorage.setItem("diaDescanso", checkDescanso.checked ? "1" : "0");
  mostrarRacha();
});

function calcularRacha() {
  const fechas = new Set(obtener("registros").map((r) => r.fecha));
  const descanso = localStorage.getItem("diaDescanso") === "1";
  const iso = (d) => d.toISOString().slice(0, 10);

  let cursor = new Date();
  // Si hoy no hay registro: con "día de descanso" la racha se conserva
  // (empezamos a contar desde ayer); sin él, la racha se considera rota.
  if (!fechas.has(iso(cursor))) {
    if (descanso) cursor.setDate(cursor.getDate() - 1);
    else return { dias: 0, rota: true };
  }
  let dias = 0;
  while (fechas.has(iso(cursor))) {
    dias++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { dias, rota: false };
}

function mostrarRacha() {
  const { dias, rota } = calcularRacha();
  document.getElementById("racha-num").textContent = dias;
  const msg = document.getElementById("racha-msg");
  if (dias === 0 && rota) {
    // Escenario de error: mensaje empático tras romper la racha.
    msg.textContent = "No pasa nada, hoy es un buen día para retomar tu hábito 💙";
  } else if (dias === 0) {
    msg.textContent = "Registra una emoción para empezar tu racha.";
  } else {
    // Escenario exitoso: mensaje motivador.
    msg.textContent = `¡Llevas ${dias} día${dias === 1 ? "" : "s"} seguidos cuidándote! Sigue así 🌱`;
  }
}
mostrarRacha();
mostrarProgreso("semanal");

/* ============================================================
   EP09 - Comunidad anónima
   ============================================================ */

// Listas para autogenerar alias anónimos (adjetivo + animal).
const ALIAS_ADJ = ["Sereno", "Valiente", "Tranquilo", "Luminoso", "Paciente", "Amable", "Curioso", "Constante"];
const ALIAS_ANIMAL = ["Colibrí", "Zorro", "Búho", "Delfín", "Lince", "Nutria", "Gorrión", "Venado"];

// ------------------------------------------------------------
// EP09 - US24: publicar en la comunidad de forma anónima.
// Genera (o recupera) un alias, valida el mensaje y publica con
// tema y alias. Si detecta datos personales (correos o secuencias
// largas de dígitos como teléfonos) bloquea la publicación.
// ------------------------------------------------------------

// Genera un alias aleatorio y lo guarda como alias actual.
function generarAlias() {
  const a = ALIAS_ADJ[Math.floor(Math.random() * ALIAS_ADJ.length)];
  const an = ALIAS_ANIMAL[Math.floor(Math.random() * ALIAS_ANIMAL.length)];
  const alias = `${an} ${a}`;
  localStorage.setItem("alias", alias);
  return alias;
}

// Recupera el alias actual o crea uno la primera vez.
let aliasActual = localStorage.getItem("alias") || generarAlias();
document.getElementById("alias").textContent = aliasActual;

// US24 (escenario alternativo): generar un alias nuevo.
document.getElementById("nuevo-alias").addEventListener("click", () => {
  aliasActual = generarAlias();
  document.getElementById("alias").textContent = aliasActual;
});

// Siembra publicaciones de ejemplo la primera vez.
sembrar("posts", [
  { id: 1, alias: "Búho Paciente",   tema: "Ansiedad", texto: "Hoy fue un día difícil, pero respiré y lo logré.", reacciones: 3, fecha: fechaHace(1), reaccionado: false, oculto: false },
  { id: 2, alias: "Delfín Amable",   tema: "Logros",   texto: "Después de semanas, por fin pedí ayuda. Me siento aliviado.", reacciones: 7, fecha: fechaHace(2), reaccionado: false, oculto: false },
]);

const panelPublicar = document.getElementById("panel-publicar");
document.getElementById("publicar").addEventListener("click", () => {
  const texto = document.getElementById("post-texto").value.trim();
  const tema  = document.getElementById("post-tema").value;

  // No permite publicar mensajes vacíos.
  if (!texto) {
    mostrarMensaje("Escribe un mensaje para publicar", "error", panelPublicar);
    return;
  }

  // US24 (escenario de error): detecta datos personales (correos o
  // números de teléfono) y bloquea la publicación.
  const tieneCorreo   = /\S+@\S+\.\S+/.test(texto);
  const tieneTelefono = /\d[\d\s().-]{6,}\d/.test(texto);
  if (tieneCorreo || tieneTelefono) {
    mostrarMensaje("Tu mensaje parece incluir datos personales (correo o teléfono). Reformúlalo para mantener tu anonimato.", "error", panelPublicar);
    return;
  }

  // Publica con alias autogenerado y refresca el feed.
  agregar("posts", {
    id: Date.now(), alias: aliasActual, tema, texto,
    reacciones: 0, fecha: hoy(), reaccionado: false, oculto: false,
  });
  document.getElementById("post-texto").value = "";
  mostrarMensaje("Tu mensaje se publicó de forma anónima", "exito", panelPublicar);
  mostrarFeed();
});

// ------------------------------------------------------------
// EP09 - US25: reaccionar a publicaciones.
// "Te entiendo" suma una reacción; si ya reaccionaste, el botón
// cambia a "Quitar reacción". "Reportar" oculta la publicación
// de tu feed.
// ------------------------------------------------------------
function mostrarFeed() {
  const posts = obtener("posts")
    .filter((p) => !p.oculto)
    .sort((a, b) => b.id - a.id);

  document.getElementById("feed").innerHTML = posts.length
    ? posts.map((p) => `
        <div class="post" data-id="${p.id}">
          <div class="post-cab">
            <span class="post-alias">${p.alias}</span>
            <span class="post-tema">${p.tema}</span>
          </div>
          <p>${p.texto}</p>
          <div class="post-acc">
            <button class="btn btn-secundario ${p.reaccionado ? "reaccionado" : ""}" data-reaccion="${p.id}">
              ${p.reaccionado ? "Quitar reacción" : "Te entiendo"} · ${p.reacciones}
            </button>
            <button class="btn btn-secundario" data-reportar="${p.id}">Reportar</button>
          </div>
        </div>`).join("")
    : `<p class="muted">Aún no hay publicaciones. ¡Sé el primero en compartir!</p>`;
}

// Delegación de eventos para reaccionar y reportar.
document.getElementById("feed").addEventListener("click", (evento) => {
  const idReaccion = evento.target.dataset.reaccion;
  const idReportar = evento.target.dataset.reportar;

  // US25: alternar reacción "Te entiendo" / "Quitar reacción".
  if (idReaccion) {
    const posts = obtener("posts");
    const post = posts.find((p) => p.id === Number(idReaccion));
    if (post.reaccionado) { post.reacciones--; post.reaccionado = false; }
    else { post.reacciones++; post.reaccionado = true; }
    guardar("posts", posts);
    mostrarFeed();
  }

  // US25 (escenario alternativo): reportar oculta la publicación.
  if (idReportar) {
    const posts = obtener("posts");
    const post = posts.find((p) => p.id === Number(idReportar));
    post.oculto = true;
    guardar("posts", posts);
    mostrarFeed();
  }
});
mostrarFeed();
