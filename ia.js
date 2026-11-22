// Sugerencias con IA (Claude). Solo funciona con internet y una clave de API configurada.
const Anthropic = require('@anthropic-ai/sdk');

const SISTEMA = `Eres un asesor pedagógico experto en educación básica secundaria en Colombia (grados 6° a 9°).
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

async function sugerirConIA({ apiKey, contexto, campos = [], numSesiones = 0, tarea = 'clase', numItems = 3 }) {
  if (!apiKey) return { ok: false, error: 'Configura tu clave de API en Configuración > Inteligencia artificial.' };

  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 180000 });
  const sesionesTxt = numSesiones > 0
    ? `"sesiones": un arreglo de exactamente ${numSesiones} objetos, cada uno con "titulo", "exploracion", "estructuracion", "practica", "valoracion" (cada momento con actividades concretas, tiempos aproximados y preguntas orientadoras).`
    : '';

  const prompt = tarea === 'malla' ? promptMalla(contexto, numItems) : tarea === 'planArea' ? promptPlanArea(contexto, campos) : `Datos de la planeación:
${contexto}

Genera un borrador para estos campos: ${campos.join(', ')}.
Devuelve un JSON con solo esas claves (cada valor es texto; usa saltos de línea y viñetas "• " cuando ayude):
- "estandares": estándares básicos de competencias pertinentes.
- "dba": Derechos Básicos de Aprendizaje relacionados.
- "competencias": competencias a desarrollar.
- "desempenoSaber", "desempenoHacer", "desempenoSer": indicadores de desempeño (saber, hacer, ser).
- "recursos": materiales y recursos.
- "evaluacion": criterios e instrumentos de evaluación formativa y sumativa.
- "evidencias": evidencias de aprendizaje.
- "ajustes": ajustes razonables y estrategias de inclusión (DUA, PIAR) aplicables.
${sesionesTxt}`;

  try {
    const respuesta = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: SISTEMA,
      messages: [{ role: 'user', content: prompt }],
    });
    if (respuesta.stop_reason === 'refusal') return { ok: false, error: 'La IA no pudo generar esta sugerencia. Ajusta el tema e inténtalo de nuevo.' };
    const texto = respuesta.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return { ok: true, datos: extraerJSON(texto) };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: 'La clave de API no es válida.' };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'Se alcanzó el límite de uso de la API. Espera un momento.' };
    if (e instanceof Anthropic.APIConnectionError) return { ok: false, error: 'No hay conexión a internet o el servicio no responde.' };
    if (e instanceof Anthropic.APIError) return { ok: false, error: `Error del servicio de IA (${e.status}): ${e.message}` };
    return { ok: false, error: e.message };
  }
}

module.exports = { sugerirConIA };
