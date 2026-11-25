// Pruebas de la versión 1.16: registro de cambios de notas, personalización, configuración por secciones,
// frases rápidas, "Mi clase ahora", entregas, resumen semanal, banco de preguntas, material con IA y cámara del celular.
const { fs, path, assert, abrir, esperarGuardado, datos, nuevaCarpeta, prueba, sembrar, terminar } = require('./util');

async function sembrarPlanilla(w) {
  return w.evaluate(() => {
    const per = periodoDeFecha(hoyISO()) || S.config.periodos[0];
    S.planillas.push({ id: 'pl1', grupoId: 'g1', areaId: 'a1', periodoId: per.id, criterios: [{ id: 'c1', nombre: 'Saber', peso: 100, actividades: [{ id: 'act1', nombre: 'Taller', fecha: hoyISO() }, { id: 'act2', nombre: 'Quiz', fecha: hoyISO() }] }] });
    S.notas.act1 = { al0: 3.0, al1: 4.0 };
    guardar();
    return per.id;
  });
}
module.exports = { sembrarPlanilla };

if (require.main === module) (async () => {
  await prueba('Registro de cambios de notas: guarda antes/después y origen, y permite restaurar', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const per = await sembrarPlanilla(w);
    await esperarGuardado(w);
    await w.evaluate(async () => {
      S.notas.act1.al0 = 3.8; guardar(); await new Promise((r) => setTimeout(r, 450)); await cadenaGuardado;
      origenNotas('importacion'); S.notas.act1.al1 = 2.5; delete S.notas.act1.al0; guardar(); await new Promise((r) => setTimeout(r, 450)); await cadenaGuardado;
      S.recuperaciones[claveRecuperacion('g1', 'a1', S.planillas[0].periodoId)] = { al1: { nota: 3 } }; guardar();
    });
    await esperarGuardado(w);
    const reg = datos(dir).registroNotas;
    const al0 = reg.filter((r) => r.act === 'act1' && r.al === 'al0').map((r) => [r.antes, r.despues, r.o]);
    assert.deepStrictEqual(al0, [[null, 3, 'computador'], [3, 3.8, 'computador'], [3.8, null, 'importacion']]);
    assert.ok(reg.some((r) => r.al === 'al1' && r.antes === 4 && r.despues === 2.5 && r.n === 'Taller' && r.g === 'g1'));
    assert.ok(reg.some((r) => r.tipo === 'recuperacion' && r.despues === 3));
    // historial con clic derecho y restaurar
    const r = await w.evaluate((per) => {
      ui.cal = { grupoId: 'g1', areaId: 'a1', periodoId: per, pestana: 'planilla' }; ir('calificaciones');
      document.querySelector('tr[data-al="al0"] input[data-col="0"]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      const filas = document.querySelectorAll('#modal tbody tr').length;
      restaurarNotaRegistro('act1', 'al0', 3.8);
      ui.cal.pestana = 'registro'; render();
      return { filas, nota: S.notas.act1.al0, enPestana: document.querySelectorAll('#contenido tbody tr').length };
    }, per);
    assert.deepStrictEqual(r, { filas: 3, nota: 3.8, enPestana: 6 });
    await esperarGuardado(w);
    assert.ok(datos(dir).registroNotas.some((x) => x.o === 'restaurada' && x.despues === 3.8));
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Personalización (barra, acento, letra) y configuración por secciones desplegables con buscador', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    const r = await w.evaluate(() => {
      ir('configuracion');
      const cerradas = [...document.querySelectorAll('.seccion-config')].every((d) => !d.open);
      const n = document.querySelectorAll('.seccion-config').length;
      cambiarApariencia('colorMenu', '#2e7d32'); cambiarApariencia('colorAcento', '#e53935'); cambiarApariencia('fuente', 'Verdana');
      const menu = getComputedStyle(document.getElementById('menu')).backgroundColor;
      const boton = getComputedStyle(document.querySelector('.btn.primario')).backgroundColor;
      const letra = getComputedStyle(document.body).fontFamily;
      cambiarApariencia('colorMenu', '#e8eef7');
      const claro = document.body.classList.contains('menu-claro');
      cambiarApariencia('colorMenu', 'red;}body{display:none'); // no válido: se ignora
      const ignorado = S.config.apariencia.colorMenu === '#e8eef7';
      document.querySelector('[data-sec="seguridad"] summary').click();
      filtrarConfig('membrete');
      const visibles = [...document.querySelectorAll('.seccion-config')].filter((d) => !d.hidden).map((d) => d.dataset.sec);
      filtrarConfig('');
      restablecerApariencia();
      return { cerradas, n, menu, boton, letra, claro, ignorado, visibles, seguridad: S.config.apariencia.secciones.seguridad, sinColor: !S.config.apariencia.colorMenu };
    });
    await app.close();
    assert.ok(r.cerradas && r.n === 8, JSON.stringify(r));
    assert.strictEqual(r.menu, 'rgb(46, 125, 50)');
    assert.strictEqual(r.boton, 'rgb(229, 57, 53)');
    assert.match(r.letra, /Verdana/);
    assert.ok(r.claro && r.ignorado && r.seguridad && r.sinColor);
    assert.deepStrictEqual(r.visibles, ['institucion']);
    assert.deepStrictEqual(errores, []);
  });

  await prueba('Frases rápidas: ";atajo" + espacio se reemplaza y queda guardado; Ctrl + Espacio inserta desde la lista', async () => {
    const dir = nuevaCarpeta();
    const { app, w, errores } = await abrir(dir);
    await sembrar(w);
    await w.evaluate(() => { frases(); S.config.frases.push({ id: 'f9', atajo: 'obj', texto: 'Reconocer fracciones equivalentes' }); guardar(); abrirDiario('g1', 'a1'); });
    await w.click('#dc-logrado');
    await w.keyboard.type('Hoy: ;obj y repaso ');
    assert.strictEqual(await w.inputValue('#dc-logrado'), 'Hoy: Reconocer fracciones equivalentes y repaso ');
    await w.keyboard.press('Control+Space');
    await w.keyboard.type('refuer');
    await w.keyboard.press('Enter');
    assert.match(await w.inputValue('#dc-logrado'), /repaso Debe reforzar/);
    await w.click('text=Guardar');
    await esperarGuardado(w);
    assert.match(datos(dir).diario[0].logrado, /Reconocer fracciones equivalentes y repaso Debe reforzar/);
    await app.close();
    assert.deepStrictEqual(errores, []);
  });

  terminar();
})();
