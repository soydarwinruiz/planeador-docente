// La IA reintenta cuando el servicio está saturado (503) y, con Gemini, prueba el modelo por defecto
const assert = require('assert');
const { sugerirConIA, PROVEEDORES } = require('../ia');
const respuestaGemini = (json) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] });
function simular(respuestas) {
  const llamadas = [];
  global.fetch = async (url) => {
    llamadas.push(decodeURIComponent(url.match(/models\/([^:]+)/)?.[1] || url));
    const [estado, cuerpo] = respuestas.shift() || [200, respuestaGemini({ objetivo: 'ok' })];
    return { ok: estado < 400, status: estado, text: async () => JSON.stringify(cuerpo) };
  };
  return llamadas;
}
const pedir = (modelo) => sugerirConIA({ ia: { proveedor: 'gemini', claves: { gemini: 'x' }, modelos: { gemini: modelo } }, contexto: 'Tema: fracciones', campos: ['objetivo'] });
const t = setTimeout; global.setTimeout = (fn) => t(fn, 0); // sin esperas reales
(async () => {
  const saturado = [503, { error: { message: 'This model is currently experiencing high demand.' } }];
  let l = simular([saturado, saturado]);
  let r = await pedir('gemini-3.8-flash');
  assert.ok(r.ok, r.error); assert.deepStrictEqual(l, ['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash']);
  l = simular([saturado, saturado, saturado]);
  r = await pedir('gemini-3.8-flash');
  assert.ok(r.ok, r.error); assert.strictEqual(l.at(-1), PROVEEDORES.gemini.modelo, 'no probó el modelo por defecto');
  l = simular(Array(6).fill(saturado));
  r = await pedir('gemini-3.8-flash');
  assert.ok(!r.ok); assert.match(r.error, /saturado/); assert.strictEqual(l.length, 6);
  l = simular([[400, { error: { message: 'malo' } }]]);
  r = await pedir('');
  assert.ok(!r.ok); assert.strictEqual(l.length, 1, 'un error que no es pasajero no se reintenta');
  console.log('✓ IA: reintenta si el servicio está saturado y prueba el modelo por defecto de Gemini');
})().catch((e) => { console.error('✗ IA reintentos\n', e); process.exit(1); });
