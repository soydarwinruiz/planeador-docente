// Sugerencias con IA. Proveedores: Claude (Anthropic), OpenAI, Google Gemini o cualquier API compatible con OpenAI.
// Solo funciona con internet (salvo un servidor local como Ollama) y una clave de API configurada.
const Anthropic = require('@anthropic-ai/sdk');

const SISTEMA = `Eres un asesor pedagógico experto en educación básica primaria, básica secundaria y media en Colombia (grados 1° a 11°). Adapta el lenguaje, la complejidad y las actividades a la edad y el grado indicados.
Conoces los Estándares Básicos de Competencias, los Derechos Básicos de Aprendizaje (DBA), los Lineamientos Curriculares del MEN,
el Decreto 1290 de 2009 (evaluación) y el Decreto 1421 de 2017 (educación inclusiva, PIAR y ajustes razonables).
Redactas en español de Colombia, con lenguaje claro, concreto y realizable en un aula pública con recursos limitados.
No inventes códigos ni números de DBA: si no estás seguro del número exacto, describe el aprendizaje sin numerarlo.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin bloques de código.`;

function extraerJSON(texto) {
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio === -1 || fin === -1) throw new Error('La respuesta de la IA no tuvo el formato esperado.');
  return JSON.parse(texto.slice(inicio, fin + 1));
}

function promptMalla(contexto, numItems) {
  return `Datos para la malla curricular:
${contexto}

Propón ${numItems} ejes temáticos / unidades para este periodo, coherentes con los referentes del MEN para el área y grado.
Devuelve un JSON con:
- "pregunta": una pregunta problematizadora para el periodo.
- "items": arreglo de ${numItems} objetos, cada uno con las claves (todas texto, usa viñetas "• " cuando ayude):
  "eje" (nombre corto del eje temático o unidad), "contenidos", "estandares", "dba", "competencias",
  "desempenoSaber", "desempenoHacer", "desempenoSer", "evidencias", y "horas" (número entero de horas sugeridas).`;
}

function promptPlanArea(contexto, campos) {
  return `Datos del plan de área:
${contexto}

Redacta un borrador para estas secciones del plan de área institucional: ${campos.join(', ')}.
Devuelve un JSON con solo esas claves (cada valor es texto de uno a tres párrafos o viñetas "• "):
- "diagnostico": diagnóstico del área (resultados, fortalezas y dificultades típicas; deja marcadores [completar] donde se requieran datos reales de la institución).
- "justificacion": justificación e importancia del área.
- "objetivoGeneral": objetivo general del área.
- "referentes": marco legal y referentes (Ley 115 de 1994, lineamientos, estándares, DBA, Decreto 1290, Decreto 1421, etc.).
- "enfoque": enfoque pedagógico y didáctico.
- "metodologia": metodología y estrategias.
- "evaluacion": criterios y estrategias de evaluación según el Decreto 1290.
- "recursos": recursos.
- "inclusion": estrategias de inclusión (DUA, PIAR, ajustes razonables).
- "transversales": articulación con proyectos transversales.
- "bibliografia": bibliografía y webgrafía sugerida (solo documentos que existan con certeza).`;
}

const PROVEEDORES = {
  anthropic: { nombre: 'Claude (Anthropic)', modelo: 'claude-opus-5-5' },
  openai: { nombre: 'ChatGPT (OpenAI)', modelo: 'gpt-5-mini' },
  gemini: { nombre: 'Gemini (Google)', modelo: 'gemini-2.5-flash' },
  compatible: { nombre: 'Compatible con OpenAI', modelo: '' },
};

class ErrorIA extends Error { constructor(m, estado) { super(m); this.estado = estado; } }
const PASAJERO = new Set([500, 502, 503, 504, 529]); // saturación o falla momentánea del servicio: vale la pena reintentar
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const RESPUESTA_LARGA = 'La respuesta de la IA fue demasiado larga y quedó incompleta. Pide menos sesiones, ítems o secciones a la vez.';

async function llamarAnthropic({ clave, modelo }, sistema, prompt, imagenes = []) {
  const client = new Anthropic({ apiKey: clave, maxRetries: 2, timeout: 180000 });
  try {
    const r = await client.beta.messages.create({
      model: modelo || PROVEEDORES.anthropic.modelo,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: sistema,
      messages: [{ role: 'user', content: imagenes.length ? [...imagenes.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.tipo, data: i.datos } })), { type: 'text', text: prompt }] : prompt }],
    });
    if (r.stop_reason === 'refusal') throw new ErrorIA('La IA no pudo generar esta sugerencia. Ajusta el tema e inténtalo de nuevo.');
    if (r.stop_reason === 'max_tokens') throw new ErrorIA(RESPUESTA_LARGA);
    return r.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  } catch (e) {
    if (e instanceof ErrorIA) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new ErrorIA('La clave de API de Claude no es válida.');
    if (e instanceof Anthropic.NotFoundError) throw new ErrorIA(`El modelo "${modelo}" no existe o tu cuenta no tiene acceso.`);
    if (e instanceof Anthropic.RateLimitError) throw new ErrorIA('Se alcanzó el límite de uso de la API. Espera un momento.');
    if (e instanceof Anthropic.APIConnectionError) throw new ErrorIA('No hay conexión a internet o el servicio no responde.');
    if (e instanceof Anthropic.APIError) throw new ErrorIA(`Error del servicio de IA (${e.status}): ${e.message}`);
    throw e;
  }
}

// Si el servicio está saturado (503 y similares) se reintenta dos veces, esperando un poco más cada vez
async function pedirJSON(url, opciones, esperas = [2000, 6000]) {
  let r;
  for (let intento = 0; ; intento++) {
    try {
      r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(180000) });
    } catch (e) {
      throw new ErrorIA(e.name === 'TimeoutError' ? 'El servicio tardó demasiado en responder.' : 'No hay conexión a internet o no se pudo contactar el servicio (' + (e.cause?.code || e.message) + ').');
    }
    if (!PASAJERO.has(r.status) || intento >= esperas.length) break;
    await r.text().catch(() => '');
    await pausa(esperas[intento]);
  }
  const texto = await r.text();
  let datos = null;
  try { datos = JSON.parse(texto); } catch { /* respuesta no JSON */ }
  if (!r.ok) {
    const msg = datos?.error?.message || datos?.message || texto.slice(0, 300);
    if (r.status === 401 || r.status === 403) throw new ErrorIA('La clave de API no es válida o no tiene permisos. ' + msg);
    if (r.status === 404) throw new ErrorIA('No se encontró el modelo o la dirección del servicio. ' + msg);
    if (r.status === 429) throw new ErrorIA('Se alcanzó el límite de uso o no hay saldo en la cuenta. ' + msg);
    if (PASAJERO.has(r.status)) throw new ErrorIA(`El servicio de IA está saturado o con fallas en este momento (${r.status}); se reintentó varias veces. Suele pasar en minutos: vuelve a intentarlo o prueba otro modelo. (${msg})`, r.status);
    throw new ErrorIA(`Error del servicio de IA (${r.status}): ${msg}`, r.status);
  }
  return datos;
}

async function llamarCompatibleOpenAI({ clave, modelo, url }, sistema, prompt, imagenes = []) {
  const base = (url || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (clave) headers.Authorization = `Bearer ${clave}`;
  const datos = await pedirJSON(`${base}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model: modelo, messages: [{ role: 'system', content: sistema }, { role: 'user', content: imagenes.length ? [{ type: 'text', text: prompt }, ...imagenes.map((i) => ({ type: 'image_url', image_url: { url: `data:${i.tipo};base64,${i.datos}` } }))] : prompt }] }),
  });
  const texto = datos?.choices?.[0]?.message?.content;
  if (datos?.choices?.[0]?.finish_reason === 'length') throw new ErrorIA(RESPUESTA_LARGA);
  if (!texto) throw new ErrorIA('El servicio respondió sin contenido.');
  return texto;
}

async function llamarGemini({ clave, modelo }, sistema, prompt, imagenes = []) {
  const m = encodeURIComponent(modelo || PROVEEDORES.gemini.modelo);
  const datos = await pedirJSON(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: 'user', parts: [{ text: prompt }, ...imagenes.map((i) => ({ inlineData: { mimeType: i.tipo, data: i.datos } }))] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  const cand = datos?.candidates?.[0];
  const texto = (cand?.content?.parts || []).map((p) => p.text || '').join('');
  if (cand?.finishReason === 'MAX_TOKENS') throw new ErrorIA(RESPUESTA_LARGA);
  if (!texto) throw new ErrorIA(cand?.finishReason === 'SAFETY' ? 'Gemini bloqueó la respuesta por sus filtros de seguridad.' : 'Gemini respondió sin contenido.');
  return texto;
}

async function llamarModelo(ia, sistema, prompt, imagenes = []) {
  const p = ia.proveedor || 'anthropic';
  const cfg = { clave: (ia.claves?.[p] || '').trim(), modelo: (ia.modelos?.[p] || PROVEEDORES[p]?.modelo || '').trim(), url: (ia.url || '').trim() };
  if (p !== 'compatible' && !cfg.clave) throw new ErrorIA(`Falta la clave de API de ${PROVEEDORES[p]?.nombre || p}. Configúrala en Configuración > Inteligencia artificial.`);
  if (p === 'compatible' && (!cfg.url || !cfg.modelo)) throw new ErrorIA('Para un servicio compatible con OpenAI indica la dirección (URL) y el nombre del modelo.');
  if (p === 'anthropic') return llamarAnthropic(cfg, sistema, prompt, imagenes);
  if (p === 'gemini') {
    try { return await llamarGemini(cfg, sistema, prompt, imagenes); } catch (e) {
      // El modelo elegido está saturado: se prueba una vez con el modelo por defecto
      const defecto = PROVEEDORES.gemini.modelo;
      if (!(e instanceof ErrorIA) || !PASAJERO.has(e.estado) || !cfg.modelo || cfg.modelo === defecto) throw e;
      try { return await llamarGemini({ ...cfg, modelo: defecto }, sistema, prompt, imagenes); } catch { throw e; }
    }
  }
  if (p === 'openai') return llamarCompatibleOpenAI({ ...cfg, url: 'https://api.openai.com/v1' }, sistema, prompt, imagenes);
  return llamarCompatibleOpenAI(cfg, sistema, prompt, imagenes);
}

function promptClase(contexto, campos, numSesiones) {
  const sesionesTxt = numSesiones > 0
    ? `- "sesiones": un arreglo de exactamente ${numSesiones} objetos, cada uno con "titulo" y los momentos "exploracion", "estructuracion", "practica", "transferencia", "valoracion" (acciones concretas con tiempos aproximados y preguntas orientadoras) y sus mediaciones "exploracionMed", "estructuracionMed", "practicaMed", "transferenciaMed", "valoracionMed" (recursos o materiales didácticos de cada momento).`
    : '';
  const otros = campos.filter((c) => c !== 'criterios');
  return `Datos de la planeación:
${contexto}

Genera un borrador para estos campos: ${[...otros, ...(campos.includes('criterios') ? ['criterios'] : []), ...(numSesiones ? ['sesiones'] : [])].join(', ')}.
Devuelve un JSON con solo esas claves (los valores de texto pueden usar saltos de línea y viñetas "• "):
- "componentes": componentes o ejes del área que se trabajan.
- "competencias": competencias a desarrollar.
- "estandares": estándares básicos de competencias pertinentes.
- "dba": Derechos Básicos de Aprendizaje relacionados (si el área los tiene).
- "evidencias": evidencias de aprendizaje.
- "objetivo": objetivo de aprendizaje de la clase.
- "pregunta": situación o pregunta problematizadora.
- "tme": método rector, técnicas y estrategias didácticas que se usarán.
- "desempenoSaber", "desempenoHacer", "desempenoSer": indicadores de desempeño (saber, hacer, ser).
- "recursos": recursos generales.
- "evaluacion": técnicas e instrumentos de evaluación (alineados con las técnicas usadas).
- "ajustes": ajustes y apoyos para la diversidad del aula y PIAR.
- "bibliografia": bibliografía o cibergrafía (solo fuentes que existan con certeza).
- "criterios": arreglo de 3 a 4 objetos con "criterio", "superior", "alto", "basico", "bajo" (descriptor observable de cada nivel de desempeño).
${sesionesTxt}`;
}

async function sugerirConIA({ ia, contexto, campos = [], numSesiones = 0, tarea = 'clase', numItems = 3, imagenes = [] }) {
  if (!ia) return { ok: false, error: 'Configura la inteligencia artificial en Configuración.' };
  const prompt = tarea === 'malla' ? promptMalla(contexto, numItems)
    : tarea === 'planArea' ? promptPlanArea(contexto, campos)
    : tarea === 'apoyo' ? `Datos del plan de apoyo (Decreto 1290) para un estudiante con desempeño bajo:\n${contexto}\n\nPropón un plan de apoyo realizable en casa y en clase en 2 a 3 semanas. Devuelve un JSON con:\n- "actividades": 3 a 5 actividades numeradas, concretas y graduales (de repaso a aplicación), con lo que debe entregar en cada una y una sustentación final.\n- "recursos": materiales y recursos accesibles.\n- "criterios": criterios de evaluación observables del plan.`
    : tarea === 'prueba' ? 'Responde exactamente con este JSON: {"ok": true}'
    : tarea === 'boletin' ? `Redacta la observación del boletín de periodo para cada estudiante (identificados como E1, E2…; no conoces sus nombres).
${contexto}

Reglas: 2 a 3 oraciones (máximo 55 palabras) por estudiante, en tercera persona, tono respetuoso y motivador, sin repetir la nota numérica.
Empieza con el marcador {nombre} (se reemplazará por el nombre real). Incluye una fortaleza concreta del área, un aspecto por mejorar si lo hay y una recomendación práctica para el estudiante y su familia.
Varía la redacción entre estudiantes. Devuelve un JSON: {"observaciones": {"E1": "...", "E2": "..."}}`
    : tarea === 'retro' ? `Evalúa el trabajo de un estudiante con el instrumento indicado y escribe una retroalimentación formativa.
${contexto}

${imagenes.length ? 'El trabajo está en la(s) imagen(es) adjunta(s): primero transcríbelo con fidelidad (si algo no se entiende, escribe [ilegible]). ' : ''}Sé justo y basa cada valoración en evidencias concretas del trabajo. Si el trabajo no corresponde a la consigna, dilo.
Devuelve un JSON con:
- "transcripcion": ${imagenes.length ? 'el texto del trabajo tal como está escrito' : '""'},
- "criterios": arreglo con un objeto por criterio, en el mismo orden: {"criterio": "nombre", "nivel": número del nivel elegido empezando en 0 según la lista dada (en lista de cotejo usa 1 = sí cumple, 0 = no cumple), "evidencia": "frase corta citando o describiendo lo que justifica el nivel"},
- "fortalezas": 2 o 3 viñetas "• " con lo que hizo bien,
- "mejoras": 2 o 3 viñetas "• " con lo que debe mejorar y cómo,
- "retroalimentacion": mensaje para el estudiante en segunda persona (tú), cálido, concreto y motivador, de 60 a 120 palabras, sin mencionar la nota numérica.`
    : tarea === 'rubrica' ? `Diseña una rúbrica analítica para valorar la actividad o el producto principal de esta sesión de clase.
${contexto}

Usa de 4 a 6 criterios observables y coherentes con el objetivo y los desempeños. Para cada criterio escribe un descriptor por cada nivel de desempeño indicado, en el mismo orden (de mayor a menor), concreto y que se pueda observar, en lenguaje claro para el grado.
Devuelve un JSON: {"nombre": "Rúbrica – (producto)", "producto": "qué se valora (exposición, taller, maqueta…)", "criterios": [{"nombre": "criterio", "descriptores": ["nivel más alto", "…", "nivel más bajo"]}]}`
    : tarea === 'ficha' ? `Prepara el contenido de una ficha de trabajo imprimible para estudiantes.
${contexto}

Usa vocabulario adecuado a la edad y al grado. Devuelve un JSON con solo las claves del tipo pedido:
- sopa: {"palabras": ["10 a 14 palabras clave del tema, una sola palabra cada una, sin tildes problemáticas"]}
- crucigrama: {"pistas": [{"palabra": "UNA PALABRA SIN ESPACIOS", "pista": "definición o pregunta corta"}]} (8 a 12)
- emparejar: {"pares": [{"a": "término o pregunta", "b": "definición o respuesta"}]} (6 a 10)
- completar: {"texto": "párrafo de 80 a 150 palabras sobre el tema donde las 6 a 10 palabras clave que el estudiante debe completar van entre asteriscos, por ejemplo: la *fotosíntesis* ocurre en las *hojas*"}
- guia: {"objetivo": "", "explicacion": "explicación clara y breve del tema con ejemplos", "ejemplos": "1 a 3 ejemplos resueltos", "actividades": ["4 a 6 actividades graduales, de lo simple a lo complejo"], "reto": "una actividad de profundización", "autoevaluacion": ["3 a 4 afirmaciones del tipo 'Puedo...'"]}`
    : tarea === 'saber' ? `Diseña preguntas para evaluar en el aula con el estilo de las pruebas Saber del ICFES.
${contexto}

Cada pregunta de selección múltiple con única respuesta debe tener: un "contexto" (situación, texto corto, tabla descrita en texto o caso; puede repetirse exactamente igual en varias preguntas si comparten el mismo contexto), un "enunciado" claro, 4 "opciones" plausibles sin "todas/ninguna de las anteriores", la letra "correcta" (A, B, C o D, variando la posición), la "competencia" o evidencia que evalúa y una "explicacion" breve de por qué es correcta y por qué fallan los distractores.
Las preguntas abiertas tienen "contexto", "enunciado" y "respuesta" (respuesta esperada o criterios de calificación).
Devuelve un JSON: {"instrucciones": "instrucciones para el estudiante", "preguntas": [{"tipo": "multiple" o "abierta", "contexto": "", "enunciado": "", "opciones": ["", "", "", ""], "correcta": "A", "competencia": "", "explicacion": "", "respuesta": ""}]}`
    : promptClase(contexto, campos, numSesiones);
  try {
    const texto = await llamarModelo(ia, SISTEMA, prompt, imagenes);
    return { ok: true, datos: extraerJSON(texto) };
  } catch (e) {
    if (e instanceof ErrorIA) return { ok: false, error: e.message };
    if (e instanceof SyntaxError) return { ok: false, error: 'La respuesta de la IA no tuvo el formato esperado. Inténtalo de nuevo o prueba otro modelo.' };
    return { ok: false, error: e.message };
  }
}

// ---------- Transcripción de voz (dictado) ----------
// audio: WAV mono 16 kHz en base64. Usa OpenAI, Gemini o un servicio compatible (p. ej. Groq con whisper-large-v3).
async function transcribirAudio({ ia, voz = {}, audio }) {
  try {
    const p = voz.proveedor && voz.proveedor !== 'auto' ? voz.proveedor
      : ia.claves?.openai ? 'openai' : ia.claves?.gemini ? 'gemini' : (ia.url && ia.proveedor === 'compatible') ? 'compatible' : '';
    if (!p) return { ok: false, error: 'Para dictar con la app se necesita una clave de OpenAI o de Gemini (o un servicio compatible) en Configuración → Inteligencia artificial. También puedes usar el dictado de Windows: tecla Windows + H.' };
    const buf = Buffer.from(audio, 'base64');
    if (p === 'gemini') {
      const clave = (ia.claves?.gemini || '').trim();
      if (!clave) return { ok: false, error: 'Falta la clave de Gemini.' };
      const m = encodeURIComponent(voz.modelo || ia.modelos?.gemini || PROVEEDORES.gemini.modelo);
      const d = await pedirJSON(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Transcribe literalmente este audio en español de Colombia, con puntuación correcta. Responde solo con el texto transcrito, sin comillas ni comentarios.' }, { inlineData: { mimeType: 'audio/wav', data: audio } }] }] }),
      });
      return { ok: true, texto: (d?.candidates?.[0]?.content?.parts || []).map((x) => x.text || '').join('').trim() };
    }
    const base = p === 'openai' ? 'https://api.openai.com/v1' : (ia.url || '').replace(/\/+$/, '');
    const clave = (p === 'openai' ? ia.claves?.openai : ia.claves?.compatible || '') || '';
    const modelo = voz.modelo || (p === 'openai' ? 'gpt-4o-mini-transcribe' : 'whisper-large-v3');
    const form = new FormData();
    form.append('file', new Blob([buf], { type: 'audio/wav' }), 'dictado.wav');
    form.append('model', modelo);
    form.append('language', 'es');
    const headers = clave ? { Authorization: `Bearer ${clave.trim()}` } : {};
    const d = await pedirJSON(`${base}/audio/transcriptions`, { method: 'POST', headers, body: form });
    return { ok: true, texto: String(d?.text || '').trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { sugerirConIA, transcribirAudio, PROVEEDORES };
