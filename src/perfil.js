// ================= Perfil de aprendizaje: estilos (VAK y Kolb) e inteligencias múltiples =================

// ---------- Test de estilos de aprendizaje VAK (De la Parra Paz, 2004) ----------
const TEST_VAK = [
  ['¿Cuál de las siguientes actividades disfrutas más?', 'Escuchar música', 'Ver películas', 'Bailar con buena música', 'BAC'],
  ['¿Qué programa de televisión prefieres?', 'Reportajes de descubrimientos y lugares', 'Cómico y de entretenimiento', 'Noticias del mundo', 'ACB'],
  ['Cuando conversas con otra persona, tú:', 'La escuchas atentamente', 'La observas', 'Tiendes a tocarla', 'BAC'],
  ['Si pudieras adquirir uno de los siguientes artículos, ¿cuál elegirías?', 'Un jacuzzi', 'Un estéreo', 'Un televisor', 'CBA'],
  ['¿Qué prefieres hacer un sábado por la tarde?', 'Quedarte en casa', 'Ir a un concierto', 'Ir al cine', 'CBA'],
  ['¿Qué tipo de exámenes se te facilitan más?', 'Examen oral', 'Examen escrito', 'Examen de opción múltiple', 'BAC'],
  ['¿Cómo te orientas más fácilmente?', 'Mediante el uso de un mapa', 'Pidiendo indicaciones', 'A través de la intuición', 'ABC'],
  ['¿En qué prefieres ocupar tu tiempo en un lugar de descanso?', 'Pensar', 'Caminar por los alrededores', 'Descansar', 'BAC'],
  ['¿Qué te halaga más?', 'Que te digan que tienes buen aspecto', 'Que te digan que tienes un trato muy agradable', 'Que te digan que tienes una conversación interesante', 'ACB'],
  ['¿Cuál de estos ambientes te atrae más?', 'Uno en el que se sienta un clima agradable', 'Uno en el que se escuchen las olas del mar', 'Uno con una hermosa vista al océano', 'CBA'],
  ['¿De qué manera se te facilita aprender algo?', 'Repitiendo en voz alta', 'Escribiéndolo varias veces', 'Relacionándolo con algo divertido', 'BAC'],
  ['¿A qué evento preferirías asistir?', 'A una reunión social', 'A una exposición de arte', 'A una conferencia', 'BCA'],
  ['¿De qué manera te formas una opinión de otras personas?', 'Por la sinceridad en su voz', 'Por la forma de estrecharte la mano', 'Por su aspecto', 'CAB'],
  ['¿Cómo te consideras?', 'Atlético', 'Intelectual', 'Sociable', 'ABC'],
  ['¿Qué tipo de películas te gustan más?', 'Clásicas', 'De acción', 'De amor', 'BAC'],
  ['¿Cómo prefieres mantenerte en contacto con otra persona?', 'Por correo electrónico', 'Tomando un café juntos', 'Por teléfono', 'ACB'],
  ['¿Cuál de las siguientes frases se identifica más contigo?', 'Me gusta que mi coche se sienta bien al conducirlo', 'Percibo hasta el más ligero ruido que hace mi coche', 'Es importante que mi coche esté limpio por fuera y por dentro', 'CBA', true],
  ['¿Cómo prefieres pasar el tiempo con tu novia o novio?', 'Conversando', 'Acariciándose', 'Mirando algo juntos', 'CAB', true],
  ['Si no encuentras las llaves en una bolsa', 'La buscas mirando', 'Sacudes la bolsa para oír el ruido', 'Buscas al tacto', 'ABC'],
  ['Cuando tratas de recordar algo, ¿cómo lo haces?', 'A través de imágenes', 'A través de emociones', 'A través de sonidos', 'ACB'],
  ['Si tuvieras dinero, ¿qué harías?', 'Comprar una casa', 'Viajar y conocer el mundo', 'Adquirir un estudio de grabación', 'BCA'],
  ['¿Con qué frase te identificas más?', 'Reconozco a las personas por su voz', 'No recuerdo el aspecto de la gente', 'Recuerdo el aspecto de alguien, pero no su nombre', 'CAB'],
  ['Si tuvieras que quedarte en una isla desierta, ¿qué preferirías llevar contigo?', 'Algunos buenos libros', 'Un radio portátil de alta frecuencia', 'Golosinas y comida enlatada', 'ABC'],
  ['¿Cuál de los siguientes entretenimientos prefieres?', 'Tocar un instrumento musical', 'Sacar fotografías', 'Actividades manuales', 'BAC'],
  ['¿Cómo es tu forma de vestir?', 'Impecable', 'Informal', 'Muy informal', 'ABC'],
  ['¿Qué es lo que más te gusta de una fogata nocturna?', 'El calor del fuego y los bombones asados', 'El sonido del fuego quemando la leña', 'Mirar el fuego y las estrellas', 'CBA'],
  ['¿Cómo se te facilita entender algo?', 'Cuando te lo explican verbalmente', 'Cuando utilizan medios visuales', 'Cuando se realiza a través de alguna actividad', 'BAC'],
  ['¿Por qué te distingues?', 'Por tener una gran intuición', 'Por ser un buen conversador', 'Por ser un buen observador', 'CBA'],
  ['¿Qué es lo que más disfrutas de un amanecer?', 'La emoción de vivir un nuevo día', 'Las tonalidades del cielo', 'El canto de las aves', 'BCA'],
  ['Si pudieras elegir, ¿qué preferirías ser?', 'Un gran médico', 'Un gran músico', 'Un gran pintor', 'CBA'],
  ['Cuando eliges tu ropa, ¿qué es lo más importante para ti?', 'Que sea adecuada', 'Que luzca bien', 'Que sea cómoda', 'BAC'],
  ['¿Qué es lo que más disfrutas de una habitación?', 'Que sea silenciosa', 'Que sea confortable', 'Que esté limpia y ordenada', 'CAB'],
  ['¿Qué es más sexy para ti?', 'Una iluminación tenue', 'El perfume', 'Cierto tipo de música', 'ACB', true],
  ['¿A qué tipo de espectáculo preferirías asistir?', 'A un concierto de música', 'A un espectáculo de magia', 'A una muestra gastronómica', 'BAC'],
  ['¿Qué te atrae más de una persona?', 'Su trato y forma de ser', 'Su aspecto físico', 'Su conversación', 'BCA'],
  ['Cuando vas de compras, ¿en dónde pasas mucho tiempo?', 'En una librería', 'En una perfumería', 'En una tienda de discos', 'ACB'],
  ['¿Cuál es tu idea de una noche romántica?', 'A la luz de las velas', 'Con música romántica', 'Bailando tranquilamente', 'ABC', true],
  ['¿Qué es lo que más disfrutas de viajar?', 'Conocer personas y hacer nuevos amigos', 'Conocer lugares nuevos', 'Aprender sobre otras costumbres', 'BCA'],
  ['Cuando estás en la ciudad, ¿qué es lo que más echas de menos del campo?', 'El aire limpio y refrescante', 'Los paisajes', 'La tranquilidad', 'BCA'],
  ['Si te ofrecieran uno de los siguientes empleos, ¿cuál elegirías?', 'Director de una estación de radio', 'Director de un club deportivo', 'Director de una revista', 'CAB'],
];
// La última columna dice qué opción (A, B o C) corresponde a Visual, Auditivo y Cinestésico, en ese orden.
const CANALES = [['V', 'Visual'], ['A', 'Auditivo'], ['K', 'Cinestésico']];
function puntuarVAK(resp, omitirNoAptas) {
  const r = { V: 0, A: 0, K: 0 };
  TEST_VAK.forEach((q, i) => {
    if (omitirNoAptas && q[5]) return;
    const op = resp[i];
    if (!op) return;
    const idx = q[4].indexOf(op.toUpperCase());
    if (idx >= 0) r[CANALES[idx][0]]++;
  });
  return r;
}
function canalPredominante(v) {
  if (!v) return '';
  const orden = CANALES.map(([k, n]) => [n, v[k] || 0]).sort((a, b) => b[1] - a[1]);
  return orden[0][1] === 0 ? '' : orden[0][1] === orden[1][1] ? `${orden[0][0]}-${orden[1][0].toLowerCase()}` : orden[0][0];
}

// ---------- Test de estilos de Kolb ----------
const TEST_KOLB = [
  ['Cuando aprendo:', 'Prefiero valerme de mis sensaciones y sentimientos', 'Prefiero mirar y atender', 'Prefiero pensar en las ideas', 'Prefiero hacer cosas'],
  ['Aprendo mejor cuando:', 'Confío en mis corazonadas y sentimientos', 'Atiendo y observo cuidadosamente', 'Confío en mis pensamientos lógicos', 'Trabajo duramente para que las cosas queden realizadas'],
  ['Cuando estoy aprendiendo:', 'Tengo sentimientos y reacciones fuertes', 'Soy reservado y tranquilo', 'Busco razonar sobre las cosas que están sucediendo', 'Me siento responsable de las cosas'],
  ['Aprendo a través de:', 'Sentimientos', 'Observaciones', 'Razonamientos', 'Acciones'],
  ['Cuando aprendo:', 'Estoy abierto a nuevas experiencias', 'Tomo en cuenta todos los aspectos relacionados', 'Prefiero analizar las cosas dividiéndolas en sus partes componentes', 'Prefiero hacer las cosas directamente'],
  ['Cuando estoy aprendiendo:', 'Soy una persona intuitiva', 'Soy una persona observadora', 'Soy una persona lógica', 'Soy una persona activa'],
  ['Aprendo mejor a través de:', 'Las relaciones con mis compañeros', 'La observación', 'Teorías racionales', 'La práctica de los temas tratados'],
  ['Cuando aprendo:', 'Me siento involucrado en los temas tratados', 'Me tomo mi tiempo antes de actuar', 'Prefiero las teorías y las ideas', 'Prefiero ver los resultados a través de mi propio trabajo'],
  ['Aprendo mejor cuando:', 'Me baso en mis intuiciones y sentimientos', 'Me baso en observaciones personales', 'Tomo en cuenta mis propias ideas sobre el tema', 'Pruebo personalmente la tarea'],
  ['Cuando estoy aprendiendo:', 'Soy una persona abierta', 'Soy una persona reservada', 'Soy una persona racional', 'Soy una persona responsable'],
  ['Cuando aprendo:', 'Me involucro', 'Prefiero observar', 'Prefiero evaluar las cosas', 'Prefiero asumir una actitud activa'],
  ['Aprendo mejor cuando:', 'Soy receptivo y de mente abierta', 'Soy cuidadoso', 'Analizo las ideas', 'Soy práctico'],
];
const DIM_KOLB = ['EC', 'OR', 'CA', 'EA'];
const ESTILOS_KOLB = {
  Acomodador: 'Aprende haciendo y experimentando; le gustan los retos, actuar y trabajar con otros (experiencia concreta + experimentación activa).',
  Divergente: 'Aprende observando desde varios puntos de vista; imaginativo, sensible y bueno para generar ideas (experiencia concreta + observación reflexiva).',
  Asimilador: 'Aprende con teorías y modelos; organiza la información de forma lógica y precisa (conceptualización abstracta + observación reflexiva).',
  Convergente: 'Aprende aplicando ideas a problemas prácticos; busca soluciones concretas (conceptualización abstracta + experimentación activa).',
};
function puntuarKolb(orden) {
  // orden[i] = puntaje de cada opción de la fila i (3 = la que más le sirve … 0 = la que menos)
  const t = { EC: 0, OR: 0, CA: 0, EA: 0 };
  (orden || []).forEach((fila) => (fila || []).forEach((p, j) => { t[DIM_KOLB[j]] += +p || 0; }));
  return t;
}
function estiloKolb(t) {
  if (!t || !Object.values(t).some(Boolean)) return '';
  const y = t.CA - t.EC, x = t.EA - t.OR;
  if (y < 0) return x > 0 ? 'Acomodador' : 'Divergente';
  return x > 0 ? 'Convergente' : 'Asimilador';
}

// ---------- Test de inteligencias múltiples (H. Gardner) ----------
const TEST_IM = [
  'Prefiero hacer un mapa que explicarle a alguien cómo tiene que llegar a un lugar determinado.',
  'Si estoy enojado o contento generalmente sé la razón exacta de por qué es así.',
  'Sé tocar, o antes sabía, un instrumento musical.',
  'Asocio la música con mis estados de ánimo.',
  'Puedo sumar o multiplicar mentalmente con mucha rapidez.',
  'Puedo ayudar a un amigo(a) a manejar y controlar sus sentimientos, porque yo lo pude hacer antes en relación a sentimientos parecidos.',
  'Me gusta trabajar con calculadora y computadoras.',
  'Aprendo rápidamente a bailar un baile nuevo.',
  'No me es difícil decir lo que pienso durante una discusión o debate.',
  'Disfruto de una buena charla, prédica o sermón.',
  'Siempre distingo el Norte del Sur, esté donde esté.',
  'Me gusta reunir grupos de personas en una fiesta o evento especial.',
  'Realmente la vida me parece vacía sin música.',
  'Siempre entiendo los gráficos que vienen en las instrucciones de equipos o instrumentos.',
  'Me gusta resolver puzzles y entretenerme con juegos electrónicos.',
  'Me fue fácil aprender a andar en bicicleta o patines.',
  'Me enojo cuando escucho una discusión o una afirmación que me parece ilógica o absurda.',
  'Soy capaz de convencer a otros que sigan mis planes o ideas.',
  'Tengo buen sentido del equilibrio y de coordinación.',
  'A menudo puedo captar relaciones entre números con mayor rapidez y facilidad que algunos de mis compañeros.',
  'Me gusta construir modelos, maquetas o hacer esculturas.',
  'Soy bueno para encontrar el significado preciso de las palabras.',
  'Puedo mirar un objeto de una manera y con la misma facilidad verlo dado vuelta o al revés.',
  'Con frecuencia establezco la relación que puede haber entre una música o canción y algo que haya ocurrido en mi vida.',
  'Me gusta trabajar con números y figuras.',
  'Me gusta sentarme muy callado y pensar, reflexionar sobre mis sentimientos más íntimos.',
  'Solamente con mirar las formas de las construcciones y estructuras me siento a gusto.',
  'Cuando estoy en la ducha, o cuando estoy solo, me gusta tararear, cantar o silbar.',
  'Soy bueno para el atletismo.',
  'Me gusta escribir cartas largas a mis amigos.',
  'Generalmente me doy cuenta de la expresión o gestos que tengo en la cara.',
  'Muchas veces me doy cuenta de las expresiones o gestos en la cara de las otras personas.',
  'Reconozco mis estados de ánimo, no me cuesta identificarlos.',
  'Me doy cuenta de los estados de ánimo de las personas con quienes me encuentro.',
  'Me doy cuenta bastante bien de lo que los otros piensan de mí.',
];
const INTELIGENCIAS = {
  A: ['Verbal / lingüística', [9, 10, 17, 22, 30]],
  B: ['Lógico / matemática', [5, 7, 15, 20, 25]],
  C: ['Visual / espacial', [1, 11, 14, 23, 27]],
  D: ['Corporal / cinestésica', [8, 16, 19, 21, 29]],
  E: ['Musical / rítmica', [3, 4, 13, 24, 28]],
  F: ['Intrapersonal', [2, 6, 26, 31, 33]],
  G: ['Interpersonal', [12, 18, 32, 34, 35]],
};
function puntuarIM(verdaderas) {
  const r = {};
  for (const [k, [, items]] of Object.entries(INTELIGENCIAS)) r[k] = items.filter((n) => verdaderas.includes(n)).length;
  return r;
}
function inteligenciasDestacadas(r) {
  if (!r) return [];
  return Object.entries(INTELIGENCIAS).filter(([k]) => (r[k] || 0) >= 4).map(([, [n]]) => n);
}

// ---------- Vista del perfil del grupo ----------
RENDERS.perfil = ({ grupoId }) => {
  const g = porId(S.grupos, grupoId);
  if (!g) return '<p>Grupo no encontrado.</p>';
  const alumnos = alumnosDe(grupoId);
  const res = resumenPerfilGrupo(grupoId);
  return `
  <div class="cabecera"><div><h1>Perfil de aprendizaje – ${esc(nombreGrupo(g))}</h1>
    <p class="sub">Estilos de aprendizaje (VAK y Kolb) e inteligencias múltiples (Gardner). El estudiante puede responder en el computador o el docente puede pasar las respuestas de la hoja.</p></div>
    <div class="acciones"><button class="btn" onclick="ir('alumnos',{grupoId:'${grupoId}'})">← Estudiantes</button>
      <button class="btn primario" onclick="usarPerfilEnPlantilla('${grupoId}')" ${res.n ? '' : 'disabled'}>📋 Usar en la plantilla del grupo</button></div></div>
  <div class="tarjeta"><h2>Resumen del grupo</h2>${res.n ? `<p style="white-space:pre-wrap;margin:0">${esc(res.texto)}</p>` : '<p class="ayuda">Aplica al menos un test para ver el resumen.</p>'}</div>
  ${alumnos.length ? `<table class="tabla"><thead><tr><th>Estudiante</th><th>VAK (canal perceptivo)</th><th>Kolb (estilo)</th><th>Inteligencias destacadas</th></tr></thead><tbody>
    ${alumnos.map((a) => { const p = a.perfil || {}; return `<tr><td>${esc(nombreAlumno(a))} ${a.piar ? '<span class="chip piar">PIAR</span>' : ''}</td>
      <td>${p.vak ? `<b>${esc(canalPredominante(p.vak))}</b> <span class="ayuda">V${p.vak.V} · A${p.vak.A} · K${p.vak.K}</span> ` : ''}<button class="btn pequeno" onclick="aplicarTest('vak','${a.id}')">${p.vak ? 'Repetir' : 'Aplicar'}</button></td>
      <td>${p.kolb ? `<b title="${esc(ESTILOS_KOLB[estiloKolb(p.kolb)] || '')}">${esc(estiloKolb(p.kolb))}</b> ` : ''}<button class="btn pequeno" onclick="aplicarTest('kolb','${a.id}')">${p.kolb ? 'Repetir' : 'Aplicar'}</button></td>
      <td>${p.im ? `<span class="ayuda">${esc(inteligenciasDestacadas(p.im).join(', ') || 'ninguna con 4 o más')}</span> ` : ''}<button class="btn pequeno" onclick="aplicarTest('im','${a.id}')">${p.im ? 'Repetir' : 'Aplicar'}</button></td></tr>`; }).join('')}
  </tbody></table>` : '<div class="tarjeta vacio">El grupo no tiene estudiantes.</div>'}
  <p class="ayuda">Fuentes: Test VAK (De la Parra Paz, 2004); Test de estilos de aprendizaje de David Kolb; Test de inteligencias múltiples (H. Gardner). Son instrumentos orientadores, no diagnósticos.</p>`;
};

function resumenPerfilGrupo(grupoId) {
  const alumnos = alumnosDe(grupoId);
  const vak = alumnos.map((a) => canalPredominante(a.perfil?.vak)).filter(Boolean);
  const kolb = alumnos.map((a) => estiloKolb(a.perfil?.kolb)).filter(Boolean);
  const im = alumnos.flatMap((a) => inteligenciasDestacadas(a.perfil?.im));
  const nIm = alumnos.filter((a) => a.perfil?.im).length;
  const pct = (n, t) => `${Math.round((n / t) * 100)}%`;
  const cuenta = (arr) => Object.entries(arr.reduce((o, x) => { o[x] = (o[x] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
  const lineas = [];
  if (vak.length) lineas.push(`Canales perceptivos (${vak.length} estudiantes): ${cuenta(vak).map(([k, n]) => `${k} ${pct(n, vak.length)}`).join(', ')}.`);
  if (kolb.length) lineas.push(`Estilos de Kolb (${kolb.length} estudiantes): ${cuenta(kolb).map(([k, n]) => `${k} ${pct(n, kolb.length)}`).join(', ')}. ${ESTILOS_KOLB[cuenta(kolb)[0][0]]}`);
  if (nIm) lineas.push(`Inteligencias más destacadas (${nIm} estudiantes): ${cuenta(im).slice(0, 4).map(([k, n]) => `${k} (${n})`).join(', ') || 'sin inteligencias con 4 o más'}.`);
  const sug = [];
  const cv = cuenta(vak);
  const top = cv.filter(([, n]) => n === (cv[0] || [])[1]).map(([k]) => k).join(' ');
  if (/Visual/.test(top)) sug.push('apoyos visuales, organizadores gráficos, videos y demostraciones');
  if (/Auditivo/.test(top)) sug.push('explicaciones orales, debates, lecturas en voz alta y canciones');
  if (/Cinestésico/.test(top)) sug.push('actividades prácticas, manipulación de material, movimiento y pausas activas');
  if (sug.length) lineas.push(`Se recomienda privilegiar: ${sug.join('; ')}.`);
  return { n: vak.length + kolb.length + nIm, texto: lineas.join('\n') };
}
function usarPerfilEnPlantilla(grupoId) {
  const r = resumenPerfilGrupo(grupoId);
  let t = S.plantillas.find((x) => x.alcance === 'grupo' && x.grupoId === grupoId && !x.areaId);
  if (!t) { t = nuevaPlantilla({ alcance: 'grupo', grupoId, grado: porId(S.grupos, grupoId).grado, nombre: `Plantilla ${nombreGrupoId(grupoId)}` }); S.plantillas.push(t); }
  t.estilos = r.texto;
  guardar();
  aviso('Resumen copiado en "Estilos de aprendizaje" de la plantilla del grupo', 'ok');
  editarPlantilla(t.id);
}

// ---------- Aplicación de los tests ----------
let testActual = null;
function aplicarTest(tipo, alumnoId) {
  const al = porId(S.alumnos, alumnoId);
  const g = porId(S.grupos, al.grupoId);
  const previo = al.perfil?.[tipo + 'Resp'];
  testActual = { tipo, alumnoId, omitir: tipo === 'vak' ? (g ? +g.grado < 10 : true) : false,
    resp: previo ? structuredClone(previo) : (tipo === 'vak' ? [] : tipo === 'im' ? [] : TEST_KOLB.map(() => [null, null, null, null])) };
  dibujarTest();
}
function dibujarTest() {
  const t = testActual;
  const al = porId(S.alumnos, t.alumnoId);
  let cuerpo = '', resultado = '';
  if (t.tipo === 'vak') {
    cuerpo = `<p class="ayuda">Elige la opción con la que más te identifiques.</p>
      <label style="font-weight:normal;color:inherit"><input type="checkbox" ${t.omitir ? 'checked' : ''} onchange="testActual.omitir=this.checked;dibujarTest()"> Omitir las preguntas no aptas para menores de edad (17, 18, 33 y 37)</label>
      ${TEST_VAK.map((q, i) => (t.omitir && q[5]) ? '' : `<div style="margin:10px 0"><b>${i + 1}. ${esc(q[0])}</b><div class="fila" style="margin-top:4px">${['A', 'B', 'C'].map((op, j) => `<button class="nivel-btn ${t.resp[i] === op ? 'sel' : ''}" style="width:auto;display:inline-block;margin:0" onclick="testActual.resp[${i}]='${op}';dibujarTest()">${op.toLowerCase()}) ${esc(q[j + 1])}</button>`).join('')}</div></div>`).join('')}`;
    const r = puntuarVAK(t.resp, t.omitir);
    const total = TEST_VAK.filter((q) => !(t.omitir && q[5])).length;
    resultado = `Respondidas ${t.resp.filter((x, i) => x && !(t.omitir && TEST_VAK[i][5])).length} de ${total} · Visual ${r.V} · Auditivo ${r.A} · Cinestésico ${r.K} → <b>${esc(canalPredominante(r) || '—')}</b>`;
  } else if (t.tipo === 'kolb') {
    cuerpo = `<p class="ayuda">En cada fila, da <b>3</b> a la opción que más te sirve cuando aprendes, <b>2</b> a la siguiente, <b>1</b> a la siguiente y <b>0</b> a la que menos. No se puede repetir un puntaje en la misma fila.</p>
      <table class="tabla"><tbody>${TEST_KOLB.map((f, i) => `<tr><td style="width:150px"><b>${i + 1}. ${esc(f[0])}</b></td>${[1, 2, 3, 4].map((j) => `<td><div style="font-size:12px;margin-bottom:3px">${esc(f[j])}</div>
        <div class="fila" style="gap:3px">${[3, 2, 1, 0].map((p) => `<button class="nivel-btn ${t.resp[i][j - 1] === p ? 'sel' : ''}" style="width:30px;display:inline-block;margin:0;text-align:center;padding:3px" onclick="ponerKolb(${i},${j - 1},${p})">${p}</button>`).join('')}</div></td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const tot = puntuarKolb(t.resp);
    const completas = t.resp.filter((f) => f.every((x) => x != null)).length;
    resultado = `Filas completas ${completas} de ${TEST_KOLB.length} · EC ${tot.EC} · OR ${tot.OR} · CA ${tot.CA} · EA ${tot.EA} → <b>${esc(estiloKolb(tot) || '—')}</b>`;
  } else {
    cuerpo = `<p class="ayuda">Marca las afirmaciones que son verdaderas para ti. Si dudas, déjala sin marcar.</p>
      ${TEST_IM.map((q, i) => `<label style="display:flex;gap:8px;font-weight:normal;color:inherit;font-size:14px;margin:6px 0"><input type="checkbox" ${t.resp.includes(i + 1) ? 'checked' : ''} onchange="alternarIM(${i + 1},this.checked)"> ${i + 1}. ${esc(q)}</label>`).join('')}`;
    const r = puntuarIM(t.resp);
    resultado = Object.entries(INTELIGENCIAS).map(([k, [n]]) => `${n}: <b>${r[k]}</b>`).join(' · ') + ` → destacadas: <b>${esc(inteligenciasDestacadas(r).join(', ') || 'ninguna')}</b>`;
  }
  const scroll = document.querySelector('#modal')?.scrollTop || 0;
  abrirModal(`<h2>${{ vak: 'Test de estilos de aprendizaje (VAK)', kolb: 'Test de estilos de aprendizaje de Kolb', im: 'Test de inteligencias múltiples' }[t.tipo]} – ${esc(nombreAlumno(al))}</h2>
    ${cuerpo}
    <div class="alerta info" style="position:sticky;bottom:0;margin:10px 0 0">${resultado}</div>
    <div class="botones"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn primario" onclick="guardarTest()">Guardar resultado</button></div>`, { ancho: true });
  document.querySelector('#modal').scrollTop = scroll;
}
function ponerKolb(i, j, p) {
  const fila = testActual.resp[i];
  const otro = fila.indexOf(p);
  if (otro >= 0 && otro !== j) fila[otro] = null;
  fila[j] = p;
  dibujarTest();
}
function alternarIM(n, on) {
  testActual.resp = testActual.resp.filter((x) => x !== n);
  if (on) testActual.resp.push(n);
  dibujarTest();
}
function guardarTest() {
  const t = testActual;
  const al = porId(S.alumnos, t.alumnoId);
  al.perfil ||= {};
  if (t.tipo === 'vak') {
    if (!t.resp.some(Boolean)) return aviso('Responde al menos una pregunta', 'error');
    al.perfil.vak = { ...puntuarVAK(t.resp, t.omitir), fecha: hoyISO() };
  } else if (t.tipo === 'kolb') {
    if (t.resp.some((f) => f.some((x) => x == null))) return aviso('Completa los puntajes de todas las filas', 'error');
    al.perfil.kolb = { ...puntuarKolb(t.resp), fecha: hoyISO() };
  } else {
    al.perfil.im = { ...puntuarIM(t.resp), fecha: hoyISO() };
  }
  al.perfil[t.tipo + 'Resp'] = structuredClone(t.resp);
  guardar(); cerrarModal(); render();
  aviso('Resultado guardado', 'ok');
}
