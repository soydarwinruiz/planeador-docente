// Abre el programa ya empaquetado (como lo instala el docente) y comprueba que arranca, guarda y crea la base de datos.
// Uso: node tests/empaquetado.js <ejecutable>   (p. ej. dist/win-unpacked/Tiza.exe o dist/linux-unpacked/planeador-docente)
// Detecta errores que las demás pruebas no ven, como un archivo que falta en la lista del instalador.
const { _electron } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const exe = path.resolve(process.argv[2] || '');
  if (!fs.existsSync(exe)) throw new Error('No existe el ejecutable: ' + exe);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiza-empaquetado-'));
  const app = await _electron.launch({ executablePath: exe, args: ['--no-sandbox'], env: { ...process.env, PLANEADOR_DATA_DIR: dir, TIZA_LLAVE_PLANA: '1' } });
  const w = await app.firstWindow({ timeout: 60000 });
  const errores = [];
  w.on('pageerror', (e) => errores.push(e.message));
  await w.waitForFunction(() => typeof S !== 'undefined' && S, null, { timeout: 60000 });
  const r = await w.evaluate(async () => {
    cerrarModal();
    S.config.institucion = 'IE Empaquetada';
    guardar(); await new Promise((ok) => setTimeout(ok, 600)); await cadenaGuardado;
    for (const v of Object.keys(RENDERS).filter((k) => !k.endsWith('_despues'))) ir(v, {});
    const ial = await api.iaLocalEstado(); // el módulo de la IA local va en el instalador
    if (!ial || !ial.modelos) throw new Error('La IA local no responde en el programa empaquetado');
    return { version: (await api.infoVersion()).version, empaquetado: !!(await api.infoVersion()).instalada || !!(await api.infoVersion()).portable };
  });
  await app.close();
  if (!fs.existsSync(path.join(dir, 'tiza.db'))) throw new Error('No se creó la base de datos');
  // Windows: las bibliotecas de Visual C++ para el motor de la IA local van en el instalador
  if (process.platform === 'win32') {
    const vc = path.join(path.dirname(exe), 'resources', 'vcrt');
    for (const f of ['vcruntime140.dll', 'vcruntime140_1.dll', 'msvcp140.dll']) if (!fs.existsSync(path.join(vc, f))) throw new Error('Falta ' + f + ' en el instalador (resources/vcrt)');
  }
  if (errores.length) throw new Error('Errores en la interfaz: ' + errores.join(' | '));
  console.log(`✓ Programa empaquetado ${r.version}: abre, muestra todas las pantallas y guarda en la base de datos`);
})().catch((e) => { console.error('✗ El programa empaquetado no funciona: ' + e.message.split('\n')[0]); process.exit(1); });
