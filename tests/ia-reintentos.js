// IA: reintenta cuando el servicio está saturado (503); con Gemini, si el modelo fue retirado (404) o sigue
// saturado, consulta los modelos de la cuenta y usa el Flash estable más reciente
const assert = require('assert');
const respuesta = { candidates: [{ content: { parts: [{ text: '{"objetivo":"ok"}' }] } }] };
const LISTA = { models: ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.6-flash-preview', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.5-pro', 'text-embedding-004']
  .map((n) => ({ name: 'models/' + n, supportedGenerationMethods: n.startsWith('text-') ? ['embedContent'] : ['generateContent'] })) };
const saturado = [503, { error: { message: 'This model is currently experiencing high demand.' } }];
const retirado = [404, { error: { message: 'This model models/gemini-2.5-flash is no longer available to new users.' } }];
let ia, llamadas;
// porModelo: nombre → lista de respuestas [estado, cuerpo] que da en orden (luego responde bien)
function simular(porModelo) {
  delete require.cache[require.resolve('../ia')]; ia = require('../ia'); // sin el modelo elegido en memoria
  llamadas = [];
  global.fetch = async (url, op = {}) => {
    const m = decodeURIComponent(url.match(/models\/([^:?]+):/)?.[1] || 'LISTA');
    llamadas.push(m);
    const modo = /[?&]key=/.test(url) ? 'direccion' : op.headers?.Authorization ? 'bearer' : op.headers?.['x-goog-api-key'] ? 'encabezado' : 'ninguno';
    if (porModelo.__aceptaSolo && modo !== porModelo.__aceptaSolo) return { ok: false, status: 401, text: async () => JSON.stringify({ error: { message: 'Request had invalid authentication credentials. Expected OAuth 2 access token. ACCESS_TOKEN_TYPE_UNSUPPORTED' } }) };
    const [estado, cuerpo] = m === 'LISTA' ? [200, LISTA] : (porModelo[m] || []).shift() || [200, respuesta];
    return { ok: estado < 400, status: estado, text: async () => JSON.stringify(cuerpo) };
  };
}
const pedir = (modelo, clave = 'AIzaPrueba') => ia.sugerirConIA({ ia: { proveedor: 'gemini', claves: { gemini: clave }, modelos: { gemini: modelo } }, contexto: 'Tema: fracciones', campos: ['objetivo'] });
const t = setTimeout; global.setTimeout = (fn) => t(fn, 0); // sin esperas reales
(async () => {
  // Sin modelo escrito se usa el alias que Google mantiene al día
  simular({}); let r = await pedir('');
  assert.ok(r.ok, r.error); assert.deepStrictEqual(llamadas, ['gemini-flash-latest']);
  // Saturado un momento: reintenta con el mismo modelo
  simular({ 'gemini-3.8-flash': [saturado, saturado] }); r = await pedir('gemini-3.8-flash');
  assert.ok(r.ok, r.error); assert.deepStrictEqual(llamadas, ['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash']);
  // Sigue saturado: busca el Flash estable más reciente de la cuenta
  simular({ 'gemini-3.8-flash': [saturado, saturado, saturado] }); r = await pedir('gemini-3.8-flash');
  assert.ok(r.ok, r.error); assert.deepStrictEqual(llamadas.slice(-2), ['LISTA', 'gemini-3.5-flash']);
  // Modelo retirado ("no longer available"): no se reintenta, se busca otro y se recuerda para las siguientes
  simular({ 'gemini-2.5-flash': [retirado] }); r = await pedir('gemini-2.5-flash');
  assert.ok(r.ok, r.error); assert.deepStrictEqual(llamadas, ['gemini-2.5-flash', 'LISTA', 'gemini-3.5-flash']);
  // Todo saturado: mensaje claro
  simular({ 'gemini-3.8-flash': Array(3).fill(saturado), 'gemini-3.5-flash': Array(3).fill(saturado) }); r = await pedir('gemini-3.8-flash');
  assert.ok(!r.ok); assert.match(r.error, /saturado/);
  // Un error que no es pasajero no se reintenta
  simular({ 'gemini-flash-latest': [[400, { error: { message: 'malo' } }]] }); r = await pedir('');
  assert.ok(!r.ok); assert.deepStrictEqual(llamadas, ['gemini-flash-latest']);
  // Proyecto de Google sin nivel gratuito: mensaje claro con qué hacer, no "clave no válida"
  simular({ 'gemini-flash-latest': [[403, { error: { message: 'The Gemini API free tier is not available for this project. To use the Gemini API, please set up billing to upgrade to a paid tier.' } }]] }); r = await pedir('');
  assert.ok(!r.ok); assert.match(r.error, /facturación/); assert.match(r.error, /proyecto nuevo/); assert.doesNotMatch(r.error, /no es válida/);
  // Claves nuevas "AQ.": si Google no la acepta en el encabezado se prueba en la dirección y como Bearer, y se recuerda
  simular({ __aceptaSolo: 'direccion' }); r = await pedir('', 'AQ.prueba');
  assert.ok(r.ok, r.error); assert.strictEqual(llamadas.length, 2);
  r = await pedir('', 'AQ.prueba'); assert.ok(r.ok, r.error); assert.strictEqual(llamadas.length, 3, 'no recordó la forma que funcionó');
  simular({ __aceptaSolo: 'bearer' }); r = await pedir('', 'AQ.prueba'); assert.ok(r.ok, r.error);
  simular({ __aceptaSolo: 'ninguna' }); r = await pedir('', 'AQ.prueba');
  assert.ok(!r.ok); assert.match(r.error, /AQ\./); assert.match(r.error, /Generative Language API/);
  // Una clave clásica rechazada no se prueba de otras formas
  simular({ __aceptaSolo: 'direccion' }); r = await pedir('', 'AIzaMala'); assert.ok(!r.ok); assert.strictEqual(llamadas.length, 1);
  // Lista de modelos de la cuenta: solo los que generan texto, del más nuevo al más antiguo
  simular({}); const lm = await ia.listarModelos({ ia: { proveedor: 'gemini', claves: { gemini: 'AIzaPrueba' } } });
  assert.ok(lm.ok, lm.error); assert.strictEqual(lm.modelos[0].id, 'gemini-3.6-flash-preview');
  assert.ok(!lm.modelos.some((m) => /embedding/.test(m.id)), 'incluyó modelos que no generan texto');
  assert.ok(!(await ia.listarModelos({ ia: { proveedor: 'gemini', claves: {} } })).ok, 'sin clave debe avisar');
  console.log('✓ IA: reintentos, modelo de Gemini al día, claves nuevas "AQ." de Google y mensajes claros');
})().catch((e) => { console.error('✗ IA reintentos\n', e, llamadas); process.exit(1); });
