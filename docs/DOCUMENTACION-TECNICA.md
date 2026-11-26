# Documentación técnica – Tiza 2.0 (antes Planeador Docente)

Para quien quiera mantener, modificar o compilar la aplicación.

## 1. Tecnologías

| Componente | Uso |
|---|---|
| **Electron 45** | Aplicación de escritorio (Chromium + Node.js) |
| **electron-builder 26** | Instalador NSIS y versión portable para Windows x64 |
| **electron-updater** | Actualizaciones automáticas desde GitHub Releases |
| **docx** | Generación de documentos Word |
| **exceljs** | Exportar e importar Excel (.xlsx) |
| **@anthropic-ai/sdk** | Claude; OpenAI, Gemini y compatibles por `fetch` |
| **qrcode** | Código QR de las pruebas por celular |
| JavaScript sin frameworks | Interfaz (HTML + CSS + JS) |

## 2. Arquitectura

```
┌──────────────────────── Proceso principal (Node.js) ────────────────────────┐
│ main.js            ventana, datos, respaldos, Word, Excel, PDF, nube,       │
│                    paquetes, lectura de Excel/CSV, IA                      │
│ exportar-word.js   generadores de Word (membrete, tablas, pruebas, cartas…) │
│ ia.js              proveedores de IA, prompts, imágenes y transcripción     │
│ actualizaciones.js electron-updater / aviso para la portable               │
│ servidor-aula.js   servidor HTTP local para pruebas por QR                 │
│ pagina-movil.js    página que ven los estudiantes en el celular            │
└──────────────▲──────────────────────────────────────────────────────────────┘
               │ IPC (ipcMain.handle / ipcRenderer.invoke)
┌──────────────┴── preload.js: expone window.api (contextIsolation, sin Node) ─┐
│ Interfaz (src/): estado global S, vistas RENDERS[vista], ir(), guardar()     │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Seguridad:** `contextIsolation: true`, `nodeIntegration: false`; la interfaz solo accede a lo que expone `preload.js`. Los enlaces externos solo se abren si son `http(s)`, `mailto` o `whatsapp`. La página tiene una política de contenido que bloquea imágenes `blob:` (por eso las fotos se leen como `data:`).
- **Estado:** todo el estado vive en el objeto `S` del renderer. `guardar()` (tras 400 ms) divide el estado en partes de primer nivel (`partesEstado()`), compara con lo último guardado y envía solo las partes que cambiaron (`{ cambios, quitar }`); el proceso principal las pasa a filas de SQLite y escribe solo las filas distintas. Antes de la 2.0 se guardaba como JSON con `guardar()` (espera 400 ms; los guardados van en cola y nunca se cruzan). Se envía como texto (`textoEstado()`), sin `config.ia.claves` (van a `claves:guardar`) y sin las imágenes de los tableros (`externalizarRecursos()` las pasa a `tablero:guardarRecursos`). Al cerrar la ventana se guarda de forma síncrona lo pendiente (`datos:guardarSync`).
- **Vistas:** cada módulo registra `RENDERS.nombre = () => html`. `ir(vista, params)` cambia de vista y `render()` repinta. `RENDERS.nombre_despues` corre tras pintar.
- **Identificadores seguros:** los id se insertan en atributos `onclick`; `sanearIds()` (en `migrar()` y al importar paquetes) reemplaza todo `id` con caracteres fuera de `[A-Za-z0-9_.:-]` y vacía las referencias `*Id` / `*Ids` y `grado` inválidos.
- **Migración:** `migrar()` completa con valores por defecto las claves que falten, para que los datos de versiones anteriores sigan funcionando.

## 3. Archivos

### Proceso principal
| Archivo | Contenido |
|---|---|
| `main.js` | Ventana y menú (una sola instancia, `sandbox`, sin navegación externa); `PLANEADOR_DATA_DIR` permite otra carpeta de datos (pruebas); datos (recibe el estado como texto JSON y no reescribe si no cambió); Word (`word:planeacion`, `word:curricular` con generadores `informe, tabla, comunicados, prueba, malla, planArea, planPeriodo, planAula, programacion, apoyo, piar`); Excel y CSV; respaldo en carpeta de nube (cada 20 min y al cerrar, 14 días); paquetes `.planeador`; PDF desde HTML (`pdf:html`, ventana oculta + `printToPDF`, tamaño carta); exportaciones de los tableros con diálogo de guardar (`will-download`); lectura de tablas (`tabla:abrir`: .xlsx con exceljs, CSV con detección de separador y codificación); IA (`ia:sugerir`, `ia:transcribir`) |
| `basedatos.js` | **Base de datos SQLite** (`node:sqlite`, incluido en Electron 45/Node 24: sin módulos nativos). Archivo `tiza.db` con tablas `colecciones` (tipo de cada parte del estado), `filas` (una fila por elemento: listas con `id` → una fila por elemento; mapas → una fila por clave; `asistencia` → una fila por grupo\|área#fecha; lo demás → una fila), `registro` (cambios de notas), `anios` (años archivados) e `info`. Cada `datos` va cifrado con **AES-256-GCM** (iv + etiqueta + texto). Solo se escriben las filas que cambian, en una transacción (`journal_mode=DELETE`, `synchronous=FULL`). **Llave de datos** aleatoria en `llave.dat`: protegida por Windows (DPAPI/`safeStorage`) o, con clave de acceso, encerrada con la clave y con el código de recuperación (scrypt + AES-GCM); `TIZA_LLAVE_PLANA=1` solo en pruebas. Respaldos con `VACUUM INTO` |
| `almacen.js` | Escritura atómica con `fsync` y reintentos (bloqueos de antivirus/OneDrive en Windows); carga con recuperación automática desde el último respaldo válido si `datos.json` está dañado (guarda `datos-danado_*.json`); respaldos automáticos al abrir y cada hora si hubo cambios (`respaldo_*` 15 recientes, `diario_*` 30 días); claves de IA cifradas con `safeStorage` en `claves.dat`; imágenes de los tableros en `tableros/<id>.json`; respaldo completo (con imágenes, sin claves) para la nube y el respaldo manual |
| `acceso.js` | Clave de acceso: `acceso.json` con resumen scrypt + sal de la clave y del código de recuperación, minutos de bloqueo; `estaBloqueado()` impide `datos:cargar` y otras lecturas; freno a intentos (5 fallos → 30 s, doblando hasta 5 min) |
| `pagina-celular.html` / `pagina-celular.js` | Página del celular del docente (`/cel`): vincular con PIN, inicio, pestañas de clase, cola de envíos en `localStorage` |
| `preload.js` | Puente `window.api` |
| Nombre | `productName` es **Tiza**; `main.js` fija `userData` en `%APPDATA%/Planeador Docente` para conservar los datos de versiones anteriores; `appId` (`co.planeador.docente`) y la carpeta de respaldos en la nube no cambian |
| `exportar-word.js` | Membrete (logos, color, líneas, lema, pie), páginas horizontales y verticales, todos los documentos |
| `ia.js` | Prompt de sistema (contexto colombiano, JSON estricto), tareas: `clase, malla, planArea, apoyo, boletin, retro, ficha, saber, prueba`; imágenes para Claude, OpenAI/compatibles y Gemini; transcripción de audio WAV (OpenAI `audio/transcriptions`, Gemini con audio en línea, o compatible como Groq) |
| `actualizaciones.js` | Instalada: `autoUpdater` (sin descarga automática). Portable o desarrollo: consulta la última versión en la API de GitHub y solo avisa |
| `servidor-aula.js` | Servidor HTTP en `0.0.0.0` (puertos 8765…). Rutas `/cel` y `POST /cel/api/<acción>` para el celular del docente: se reenvían a la interfaz (`cel:solicitud` → `cel:respuesta`, 15 s de espera), que valida el permiso y ejecuta la acción; el servidor sigue encendido mientras el celular esté activo aunque termine una prueba. Pruebas por QR: sesión con código de 4 letras, PIN con límite de intentos, token por estudiante, orden de preguntas y opciones propio de cada uno (semilla), conversión de letras mostradas a originales, la clave nunca se envía; eventos en vivo al renderer (`qr:evento`); evita que la pantalla se suspenda |
| `pagina-movil.js` | HTML autocontenido para el celular: código, nombre y PIN, una pregunta por pantalla, guardado inmediato con reintentos sin señal, temporizador, detección de salida de la página, entrega automática al cerrar el docente o acabarse el tiempo |

### Interfaz (`src/`)
| Archivo | Módulo |
|---|---|
| `index.html`, `styles.css`, `icono.svg` | Estructura, estilos (claro/oscuro con variables CSS), ícono |
| `app.js` | Estado inicial, utilidades (fechas, nombres, notas, desempeños), guardado, modales, navegación, menú, Inicio |
| `grupos.js` | Áreas, grupos, estudiantes (acudiente, celular, correo), pegar listas |
| `planeaciones.js` | Planeaciones de clase, editor, varios grupos, duplicar, banco de planeaciones, IA |
| `plantillas.js` | Plantillas por grado o grupo |
| `curricular.js` | Plan de área, malla, plan de periodo, plan de aula |
| `referentes-datos.js`, `referentes.js` | 545 bloques de referentes del MEN y su selector |
| `cobertura.js` | Mapa de cobertura curricular |
| `banco-inicial.js`, `banco-pedagogico.js` | Banco precargado (estrategias, técnicas, métodos, DUA, flexibilización) y su gestión |
| `evaluacion.js` | Asistencia, planillas, cálculo de notas, protección de actividades con notas |
| `programacion.js` | Programación evaluativa e instrumentos (rúbricas, escalas, listas de cotejo) |
| `importar-notas.js` | Importar notas (Excel, Forms, Classroom) |
| `retro.js` | Retroalimentación de trabajos con IA |
| `apoyo.js` | Planes de apoyo |
| `boletin.js` | Observaciones del boletín |
| `piar.js` | PIAR |
| `perfil.js` | Tests VAK, Kolb e inteligencias múltiples |
| `calendario.js`, `horario.js` | Calendario, festivos, cronograma; horario y clases de hoy |
| `diario.js` | Diario de campo |
| `seguimiento.js` | Tablero del estudiante y gráficas SVG |
| `riesgo.js` | Semáforo de riesgo y nota necesaria |
| `informe.js` | Informe de cierre de periodo |
| `comunicados.js` | Comunicados a padres |
| `alertas.js` | Alertas y pendientes |
| `pruebas.js` | Pruebas tipo Saber, calificación, resultados, pruebas por QR |
| `omr.js` | Hojas para cámara y lectura óptica |
| `fichas.js` | Fichas imprimibles |
| `aula.js` | Herramientas de aula |
| `pizarra.js` | Tableros: lista, asignación a planeación/sesión/grupos/área, botones en las sesiones y en las clases de hoy, inserción de estudiantes, momentos de la sesión y objetivo, estudiante al azar, conversión de los tableros de la versión anterior. El editor es **Pizarra Local** (`src/pizarra-local/index.html`) dentro de un iframe; se comunican por `postMessage` (ver `src/pizarra-local/ORIGEN.md`) |
| `gamificacion.js` | Gamificación |
| `buscador.js` | Buscador, apariencia (tema, `colorMenu`, `colorAcento`, `fuente`, validados) y menú personalizable |
| `compartir.js` | Actualizaciones, respaldo en nube, paquetes para compartir |
| `voz.js` | Dictado por voz |
| `configuracion.js` | Configuración en secciones `<details>` (`seccionConfig`, `config.apariencia.secciones`, `filtrarConfig`, `irAConfig`), asistente inicial, nuevo año lectivo |
| `bloqueo.js` | Pantalla de bloqueo, recuperación con código, bloqueo por inactividad (también cuenta la actividad dentro de los tableros) y tarjeta de configuración |
| `anios.js` | Años anteriores: lista, consulta (`ui.archivo = { actual, meta }`: `S` pasa a ser el año consultado, `estadoActual()` y `conAnioActual()` mantienen el guardado sobre el año en curso), archivar copia, importar desde respaldo |
| `celular.js` | Celular del docente: vinculación (PIN de 6 dígitos, 10 min, un uso; límites por IP y totales), dispositivos en `config.celular.dispositivos` con el SHA-256 del permiso y su vencimiento, `ACCIONES_CEL` (inicio, clase, asistencia, todosPresentes, notas, nota, entrega, foto, anotacion, puntos, pendiente, pendienteHecho, desvincular). `foto` acepta hasta 6 MB: hoja de respuestas (se lee con `leerHojaOMR` y se registra) o trabajo de un estudiante (queda en `CEL.fotos`, en memoria, para la retroalimentación), repintado de la vista del PC y anotaciones de estudiantes |
| `portafolio.js` | Portafolio docente: competencias del Decreto 1278, `evidenciasAutomaticas(desde, hasta)`, evidencias y reflexiones propias, Word con `generarDocxInforme` |
| `registro-notas.js` | Registro de cambios de notas: en cada guardado `registrarCambiosNotas()` compara `S.notas` y `S.recuperaciones` con la foto anterior (`REG`) y anota `{ f, act, al, antes, despues, o, g, ar, p, n, c }`. Se agregan como líneas a `registro-notas.jsonl` (`registro:agregar`, fuera de `datos.json`); `REG.cache` es la copia en memoria. Un `S.registroNotas` que venga en los datos (1.16 o un respaldo) se pasa al archivo con `registro:reemplazar`. Los respaldos completos y los años archivados lo incluyen como `registroNotas`. `origenNotas()` marca el origen (celular, importación, rúbrica, retro, lote, restaurada, papelera). `reiniciarRegistroNotas()` al abrir, restaurar un respaldo e iniciar un año |
| `entregas.js` | `S.entregas[actId][alId] = 'E'\|'T'\|'N'`, `actividadPendiente()` (usada en seguimiento y comunicados), pestaña de entregas y nota por lote |
| `miclase.js` | Vista `miClase` (clase actual por horario), asistencia rápida, avance de momentos (`sesion.hechos`), proyección en pantalla completa |
| `semana.js` | Tarjeta "Tu semana" en Inicio |
| `banco-preguntas.js` | Vista `bancoPreguntas`: preguntas de todas las pruebas sin repetir (estado en `ui.bq`) |
| `material.js` | Material con IA desde una sesión: guía (ficha tipo guía), quiz de salida (prueba con `dialogoIAPrueba`) y rúbrica (tarea `rubrica` de `ia.js`) |
| `frases.js` | Frases rápidas (`config.frases`): reemplazo de `;atajo` al escribir y selector con Ctrl + Espacio |
| `acerca.js` | Ventana *Acerca de Tiza* (menú Ayuda): `CREDITOS`, contenidos de referencia y software libre |
| `papelera.js` | Papelera: al confirmar un borrado (`confirmar()` o `iniciarPapelera()`) toma una foto de `S`; en el siguiente `guardar()` guarda solo las diferencias (`ops`: elementos que desaparecieron por `id` o clave, y valores cambiados) y las puede volver a aplicar sobre el estado actual |

## 4. Modelo de datos (partes del estado; en la 2.0 se guardan como filas de `tiza.db`)

| Clave | Contenido |
|---|---|
| `config` | Institución, docente, coordinador, año, escala, desempeños, periodos (nombre, inicio, fin, peso), componentes por defecto, membrete, apariencia, menú, IA (proveedor, claves por proveedor, modelos), voz, nube, frases del boletín, plantillas de comunicados, motivos de puntos |
| `areas`, `grupos`, `alumnos` | Áreas; grupos con grado y áreas (horas); estudiantes con documento, PIAR, acudiente, celular, correo, PIN, perfil |
| `planeaciones` | Planeaciones con sesiones y momentos; `vinculadas` (copias en otros grupos) |
| `plantillas` | Plantillas de planeación |
| `planesArea`, `mallas`, `planesPeriodo`, `planesAula` | Planeación curricular |
| `planillas` | Por grupo, área y periodo: componentes (`criterios`) con peso y actividades |
| `notas` | `{ actividadId: { alumnoId: nota } }` |
| `recuperaciones` | `{ "grupo\|área\|periodoId": { alumnoId: { nota, fecha } } }` (`periodoId = 'anual'` para la recuperación final); la forma de aplicarlas está en `config.recuperacion = { modo: 'reemplaza'\|'promedio'\|'ponderada', tope, peso }`. `notaDefinitiva()` es la nota sin recuperación y `notaFinal()`/`notaAnual()` ya la incluyen |
| `anotaciones` | `{ id, alumnoId, grupoId, areaId, fecha, tipo: positiva\|academica\|convivencia\|general, texto, origen: celular\|pc }` |
| `portafolio` | `{ evidencias: [{ id, competencia, titulo, fecha, descripcion, ubicacion }], reflexiones: { competencia: texto } }` |
| `notasRubrica` | Niveles marcados en cada instrumento |
| `rubricas` | Instrumentos de evaluación |
| `asistencia` | `{ "grupo|área": { fecha: { alumnoId: P/A/T/E } } }` |
| `eventos`, `cronograma`, `horario` | Calendario, cronograma, horario (franjas y celdas) |
| `bancoPedagogico` | Entradas del banco |
| `planesApoyo`, `piar` | Planes de apoyo y PIAR |
| `observaciones` | `{ "grupo|área|periodo": { alumnoId: texto } }` |
| `diario`, `pendientes`, `alertasOcultas` | Diario de campo, tareas del docente, alertas ocultas |
| `comunicadosEnviados` | Historial de comunicados |
| `pruebas` | Preguntas, respuestas por estudiante (letras), puntos de abiertas, textos escritos en el celular |
| `pizarras` | Tableros (las imágenes van en `tableros/<id>.json`, no en `datos.json`): `titulo`, `planeacionId`, `sesionId`, `grupoIds`, `areaId`, `fecha`, `formato: 'pizarra-local'`, `items` (elementos de Pizarra Local: sticky, shape, text, connector, pen, image, frame, emoji, comment; el texto con formato va en `rich`, con fuente, tamaño y resaltado por fragmento), `assets` (imágenes en `data:`; solo mientras están por escribir en su archivo), `view` y `miniatura` (JPEG pequeño para la lista) |
| `config.celular` | `{ duracion, apagado, dispositivos: [{ id, nombre, hash (SHA-256 del permiso), creado, expira, ultimo }] }` |
| Fuera de la base de datos | `claves.dat` (claves de IA cifradas), `acceso.json` (clave de acceso), `tableros/<id>.json` (imágenes), `anios-anteriores/<id>.json` y `.meta.json` (años archivados; van en los respaldos completos como `aniosAnteriores`) |
| `papelera` | Elementos eliminados (30 días, máximo 200): `{ id, fecha, etiqueta, ops: [{ op: 'agregar', ruta, id/clave, indice, valor } \| { op: 'valor', ruta, antes, despues }] }`; `ruta` usa `{ id }` para entrar en listas con identificador |
| `fichas`, `gamificacion`, `retro`, `informes` | Fichas guardadas; puntos, equipos e insignias por grupo; retroalimentaciones; textos del informe de cierre |

## 5. Algoritmos destacados
- **Nota del periodo:** promedio de las actividades de cada componente, ponderado por su porcentaje (las faltantes no cuentan, o cuentan como la mínima si así se configura).
- **Nota necesaria:** la nota final es lineal en la nota *x* de las actividades sin calificar: `final = A + B·x`, donde A es lo ya ganado y B la fracción pendiente; se despeja *x* para llegar a la aprobación.
- **Lectura óptica:** umbral local con imagen integral, componentes conexas para hallar las 4 marcas (por tamaño parecido, tolerante al giro), homografía de 8 parámetros al marco de la hoja, oscuridad media dentro de cada burbuja comparada con el fondo de la fila (en blanco, una sola o varias marcas).
- **Crucigrama:** colocación por cruces con reglas de vecindad; se prueban hasta 40 distribuciones y se elige la que ubica más palabras en menos espacio. **Sopa de letras:** generador con semilla y direcciones según dificultad.
- **Pruebas por QR:** orden barajado por estudiante con semilla derivada del código de la sesión, manteniendo juntas las preguntas con el mismo contexto.

## 6. Desarrollo, compilación y publicación
```bash
npm install
npm start
```
- **Compilar en Windows:** `npm run dist:win` (instalador + portable) o `npm run dist:portable`.
- **Publicar:** subir el cambio a `main` con `version` actualizada en `package.json` y ejecutar el flujo **Compilar para Windows** (`.github/workflows/compilar-windows.yml`), que compila en `windows-latest`, sube `PlaneadorDocente-Setup-X.exe`, la portable, el `.blockmap` y `latest.yml` a la versión `vX` de GitHub. De ahí descarga la app instalada sus actualizaciones.
- **Firma digital (opcional):** con un certificado de firma de código (OV/EV o Azure Trusted Signing), crear los secretos `CSC_LINK` (pfx en base64) y `CSC_KEY_PASSWORD` en GitHub.

## 7. Pruebas
`npm run test:robot` (varios minutos) activa cada botón, lista y casilla de todas las pantallas con un año completo y genera todas las exportaciones; falla si aparece un error de programa. `npm test` ejecuta `tests/estatico.js`, `tests/e2e-productividad.js` (registro de notas, personalización, secciones, frases, entregas y lote, Mi clase, semana, banco de preguntas, material con IA simulada, celular con cámara y una hoja de respuestas rellenada y fotografiada), `tests/e2e-completo.js` (todas las pantallas y pestañas con un año completo; paquete con identificadores manipulados), `tests/e2e-funciones.js` (recuperaciones, clave de acceso, años anteriores, celular con una página real y portafolio) y (sintaxis y nombres globales repetidos entre los scripts de `src/`, que comparten ámbito, y funciones inexistentes en `onclick`) y `tests/e2e.js` (vistas, plantillas, claves cifradas, migración de datos anteriores, imágenes de tableros, respaldo en nube, recuperación de un `datos.json` dañado, papelera y rendimiento del guardado). En Linux: `xvfb-run -a npm test`. El flujo `.github/workflows/pruebas.yml` las corre en cada cambio, en Linux y en Windows, y la compilación de Windows corre la revisión estática antes de compilar.

Las pruebas de punta a punta usan Playwright con Electron (`_electron.launch`) y una carpeta de datos aparte (`PLANEADOR_DATA_DIR`); en Linux se ejecutan con `xvfb-run`. Simulan diálogos de guardar/abrir, proveedores de IA (reemplazando el manejador IPC), celulares (Chromium con perfil de teléfono contra el servidor local), micrófono (`--use-fake-device-for-media-stream`) y fotos de hojas de respuestas (generadas, rellenadas y deformadas con Python/PIL).

## 8. Migración a la 2.0 (SQLite)
La primera vez que se abre la 2.0, `almacen.migrarDesde1x()` lee `datos.json`, `registro-notas.jsonl` y `anios-anteriores/`, los escribe en `tiza.db`, verifica que se puedan leer y los mueve a la carpeta `antes-de-2.0` (copia sin cifrar, que el docente puede borrar desde *Configuración → Seguridad, datos y celular → Almacenamiento*). Los respaldos automáticos `.json` antiguos siguen apareciendo en la lista y se pueden restaurar. Si `tiza.db` está dañada al abrir, se copia como `datos-danado_*.db`, se cargan los datos del respaldo válido más reciente (`.db` o `.json`) y la base se vuelve a crear. Si después de migrar aparece un `datos.json` más reciente que `tiza.db` (el docente volvió a la 1.x), se respalda la base de datos (`respaldo_*_antes-de-volver-a-2.0.db`) y se migra otra vez. Las versiones beta (`X.Y.Z-beta.N`) se publican como *prerelease* y solo llegan a quien ya tiene una beta (`allowPrerelease`).

**Empaquetado:** `tests/estatico.js` revisa que todo archivo que carga el programa esté en `build.files`, y `tests/empaquetado.js <ejecutable>` abre el programa empaquetado (lo usan las pruebas de GitHub y el flujo de publicación antes de publicar).
