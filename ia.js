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

class ErrorIA extends Error {}

async function llamarAnthropic({ clave, modelo }, sistema, prompt) {
  const client = new Anthropic({ apiKey: clave, maxRetries: 2, timeout: 180000 });
  try {
    const r = await client.beta.messages.create({
      model: modelo || PROVEEDORES.anthropic.modelo,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: sistema,
      messages: [{ role: 'user', content: prompt }],
    });
    if (r.stop_reason === 'refusal') throw new ErrorIA('La IA no pudo generar esta sugerencia. Ajusta el tema e inténtalo de nuevo.');
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

async function pedirJSON(url, opciones) {
  let r;
  try {
    r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(180000) });
  } catch (e) {
    throw new ErrorIA(e.name === 'TimeoutError' ? 'El servicio tardó demasiado en responder.' : 'No hay conexión a internet o no se pudo contactar el servicio (' + (e.cause?.code || e.message) + ').');
  }
  const texto = await r.text();
  let datos = null;
  try { datos = JSON.parse(texto); } catch { /* respuesta no JSON */ }
  if (!r.ok) {
    const msg = datos?.error?.message || datos?.message || texto.slice(0, 300);
    if (r.status === 401 || r.status === 403) throw new ErrorIA('La clave de API no es válida o no tiene permisos. ' + msg);
    if (r.status === 404) throw new ErrorIA('No se encontró el modelo o la dirección del servicio. ' + msg);
    if (r.status === 429) throw new ErrorIA('Se alcanzó el límite de uso o no hay saldo en la cuenta. ' + msg);
    throw new ErrorIA(`Error del servicio de IA (${r.status}): ${msg}`);
  }
  return datos;
}

async function llamarCompatibleOpenAI({ clave, modelo, url }, sistema, prompt) {
  const base = (url || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (clave) headers.Authorization = `Bearer ${clave}`;
  const datos = await pedirJSON(`${base}/chat/completions`, {
    method: 'POST', headers,
    body: JSON.stringify({ model: modelo, messages: [{ role: 'system', content: sistema }, { role: 'user', content: prompt }] }),
  });
  const texto = datos?.choices?.[0]?.message?.content;
  if (!texto) throw new ErrorIA('El servicio respondió sin contenido.');
  return texto;
}

async function llamarGemini({ clave, modelo }, sistema, prompt) {
  const m = encodeURIComponent(modelo || PROVEEDORES.gemini.modelo);
  const datos = await pedirJSON(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  const cand = datos?.candidates?.[0];
  const texto = (cand?.content?.parts || []).map((p) => p.text || '').join('');
  if (!texto) throw new ErrorIA(cand?.finishReason === 'SAFETY' ? 'Gemini bloqueó la respuesta por sus filtros de seguridad.' : 'Gemini respondió sin contenido.');
  return texto;
}

async function llamarModelo(ia, sistema, prompt) {
  const p = ia.proveedor || 'anthropic';
  const cfg = { clave: (ia.claves?.[p] || '').trim(), modelo: (ia.modelos?.[p] || PROVEEDORES[p]?.modelo || '').trim(), url: (ia.url || '').trim() };
  if (p !== 'compatible' && !cfg.clave) throw new ErrorIA(`Falta la clave de API de ${PROVEEDORES[p]?.nombre || p}. Configúrala en Configuración > Inteligencia artificial.`);
  if (p === 'compatible' && (!cfg.url || !cfg.modelo)) throw new ErrorIA('Para un servicio compatible con OpenAI indica la dirección (URL) y el nombre del modelo.');
  if (p === 'anthropic') return llamarAnthropic(cfg, sistema, prompt);
  if (p === 'gemini') return llamarGemini(cfg, sistema, prompt);
  if (p === 'openai') return llamarCompatibleOpenAI({ ...cfg, url: 'https://api.openai.com/v1' }, sistema, prompt);
  return llamarCompatibleOpenAI(cfg, sistema, prompt);
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

async function sugerirConIA({ ia, contexto, campos = [], numSesiones = 0, tarea = 'clase', numItems = 3 }) {
  if (!ia) return { ok: false, error: 'Configura la inteligencia artificial en Configuración.' };
  const prompt = tarea === 'malla' ? promptMalla(contexto, numItems)
    : tarea === 'planArea' ? promptPlanArea(contexto, campos)
    : tarea === 'apoyo' ? `Datos del plan de apoyo (Decreto 1290) para un estudiante con desempeño bajo:\n${contexto}\n\nPropón un plan de apoyo realizable en casa y en clase en 2 a 3 semanas. Devuelve un JSON con:\n- "actividades": 3 a 5 actividades numeradas, concretas y graduales (de repaso a aplicación), con lo que debe entregar en cada una y una sustentación final.\n- "recursos": materiales y recursos accesibles.\n- "criterios": criterios de evaluación observables del plan.`
    : tarea === 'prueba' ? 'Responde exactamente con este JSON: {"ok": true}'
    : promptClase(contexto, campos, numSesiones);
  try {
    const texto = await llamarModelo(ia, SISTEMA, prompt);
    return { ok: true, datos: extraerJSON(texto) };
  } catch (e) {
    if (e instanceof ErrorIA) return { ok: false, error: e.message };
    if (e instanceof SyntaxError) return { ok: false, error: 'La respuesta de la IA no tuvo el formato esperado. Inténtalo de nuevo o prueba otro modelo.' };
    return { ok: false, error: e.message };
  }
}

module.exports = { sugerirConIA, PROVEEDORES };
