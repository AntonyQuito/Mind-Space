// ============================================================
// js/Asistente.js - VERSIÓN ESTABLE Y SIN ERRORES
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tu API Key de Groq queda fija e integrada aquí
  const GROQ_API_KEY = "Añadiora_aquí_tu_API_KEY_de_Groq";

  // 2. Modelo de procesamiento de Llama seleccionado
  const MODELO_LLAMA = "llama-3.3-70b-versatile"; 

  // Elementos de la interfaz recuperados del DOM
  const toggleBtn = document.getElementById("mindbot-toggle-btn");
  const closeBtn = document.getElementById("mindbot-close-btn");
  const chatWindow = document.getElementById("mindbot-window");
  const chat = document.getElementById("chat");
  const form = document.getElementById("formChat");
  const inputPreg = document.getElementById("pregunta");

  // Controladores interactivos de la interfaz (Abrir / Cerrar)
  toggleBtn.addEventListener("click", () => {
    chatWindow.classList.add("activo"); // Muestra la ventana usando clases CSS
    toggleBtn.style.display = "none";    // Oculta el botón redondo del robot
  });

  closeBtn.addEventListener("click", () => {
    chatWindow.classList.remove("activo"); // Oculta la ventana de chat
    toggleBtn.style.display = "flex";       // Devuelve el botón redondo a la pantalla
  });

  // Prompt del Sistema para delimitar las respuestas comerciales y proteger la psique
  const SYSTEM = `Eres MindBot, el asistente interactivo de orientación de la landing page de MindSpace.
Tu único rol es ser una guía de navegación para explicar qué secciones e innovaciones tiene el sitio web.

INSTRUCCIONES CLAVE DE RESPUESTA:
1. Rol de PACIENTES: Infórmales que en MindSpace disponen de un "Diario Emocional ilimitado" para registrar notas de voz y estados de ánimo, un sistema de "Match Inteligente" para filtrar psicólogos por presupuesto y modalidad, y reportes semanales de bienestar.
2. Rol de PROFESIONALES: Infórmales que disponemos de un "Panel Clínico Avanzado" para rastrear alertas de riesgo, automatización de agendas, plantillas de seguimiento y planes accesibles (S/.39 al mes en la suscripción anual y S/.49 en la mensual).
3. REGLA INQUEBRANTABLE DE PROTECCIÓN DE LA PSIQUE: Bajo ningún concepto debes hacer terapia, diagnosticar, analizar la mente, ni tratar síntomas o problemas de la psique humana. Si el usuario te escribe sobre un trauma, depresión, problemas emocionales personales o intenciones de crisis, debes responder obligatoriamente de esta forma:
"Comprendo tu situación, pero soy únicamente un asistente de navegación de la página web MindSpace. No tengo permitido realizar análisis clínicos ni ofrecer terapia. Te sugerimos registrarte en la plataforma para agendar una cita formal con cualquiera de nuestros psicólogos colegiados y verificados."

Sé muy breve, estructurado y responde siempre usando párrafos de texto planos limpios.`;

  const mensajes = [{ role: "system", content: SYSTEM }];

  // Petición HTTP directa hacia el entorno de Groq
  const llamarAPI = async (ruta, body) => {
    const r = await fetch(`https://api.groq.com/openai/v1/${ruta}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  // Escuchador del formulario (Envío de mensajes)
  form.addEventListener("submit", async (e) => {
    // SE EJECUTA DE INMEDIATO: Bloquea el refresco nativo de la página web
    e.preventDefault(); 

    const texto = inputPreg.value.trim();
    if (!texto) return;

    // Pintar mensaje del usuario en la burbuja azul
    chat.innerHTML += `<div class="mindbot-msg user">${texto}</div>`;
    inputPreg.value = "";
    
    // Crear indicador visual de carga ("Pensando...")
    chat.innerHTML += `<div class="mindbot-msg bot" id="mindbot-loading"><i>MindBot está pensando...</i></div>`;
    chat.scrollTop = chat.scrollHeight;
    const indicadorCarga = document.getElementById("mindbot-loading");

    try {
      mensajes.push({ role: "user", content: texto });
      
      const data = await llamarAPI("chat/completions", { 
        model: MODELO_LLAMA, 
        messages: mensajes 
      });

      // Validación defensiva para confirmar que Groq devolvió la estructura esperada
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        const respuesta = data.choices[0].message.content;
        mensajes.push({ role: "assistant", content: respuesta });
        
        // Reemplazar el mensaje de carga por el texto real de la IA
        indicadorCarga.outerHTML = `<div class="mindbot-msg bot">${respuesta}</div>`;
      } else {
        throw new Error("Estructura de respuesta inválida");
      }
    } catch (error) {
      console.error("Error en MindBot:", error);
      indicadorCarga.outerHTML = `<div class="mindbot-msg bot" style="color: #ef4444; border-color: #fca5a5;">Lo siento, hubo un problema al conectar con el servidor de Llama. Inténtalo de nuevo.</div>`;
    }
    
    // Auto-scroll al último mensaje enviado
    chat.scrollTop = chat.scrollHeight;
  });
});