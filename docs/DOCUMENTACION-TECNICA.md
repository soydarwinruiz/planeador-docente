# Documentación técnica – Planeador Docente 1.10.0

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
- **Estado:** todo el estado vive en el objeto `S` del renderer y se guarda como JSON con `guardar()` (espera 400 ms y escribe de forma segura). Al cerrar la ventana se guarda de forma síncrona lo pendiente (`datos:guardarSync`).
- **Vistas:** cada módulo registra `RENDERS.nombre = () => html`. `ir(vista, params)` cambia de vista y `render()` repinta. `RENDERS.nombre_despues` corre tras pintar.
- **Migración:** `migrar()` completa con valores por defecto las claves que falten, para que los datos de versiones anteriores sigan funcionando.

## 3. Archivos

### Proceso principal
| Archivo | Contenido |
|---|---|
| `main.js` | Ventana y menú; `PLANEADOR_DATA_DIR` permite otra carpeta de datos (pruebas); datos y respaldos automáticos (15); Word (`word:planeacion`, `word:curricular` con generadores `informe, tabla, comunicados, prueba, malla, planArea, planPeriodo, planAula, programacion, apoyo, piar`); Excel y CSV; respaldo en carpeta de nube (cada 20 min y al cerrar, 14 días); paquetes `.planeador`; PDF desde HTML (`pdf:html`, ventana oculta + `printToPDF`, tamaño carta); exportaciones de los tableros con diálogo de guardar (`will-download`); lectura de tablas (`tabla:abrir`: .xlsx con exceljs, CSV con detección de separador y codificación); IA (`ia:sugerir`, `ia:transcribir`) |
| `preload.js` | Puente `window.api` |
| `exportar-word.js` | Membrete (logos, color, líneas, lema, pie), páginas horizontales y verticales, todos los documentos |
| `ia.js` | Prompt de sistema (contexto colombiano, JSON estricto), tareas: `clase, malla, planArea, apoyo, boletin, retro, ficha, saber, prueba`; imágenes para Claude, OpenAI/compatibles y Gemini; transcripción de audio WAV (OpenAI `audio/transcriptions`, Gemini con audio en línea, o compatible como Groq) |
| `actualizaciones.js` | Instalada: `autoUpdater` (sin descarga automática). Portable o desarrollo: consulta la última versión en la API de GitHub y solo avisa |
| `servidor-aula.js` | Servidor HTTP en `0.0.0.0` (puertos 8765…); sesión con código de 4 letras, PIN con límite de intentos, token por estudiante, orden de preguntas y opciones propio de cada uno (semilla), conversión de letras mostradas a originales, la clave nunca se envía; eventos en vivo al renderer (`qr:evento`); evita que la pantalla se suspenda |
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
| `buscador.js` | Buscador, apariencia y menú personalizable |
| `compartir.js` | Actualizaciones, respaldo en nube, paquetes para compartir |
| `voz.js` | Dictado por voz |
| `configuracion.js` | Configuración, asistente inicial, nuevo año lectivo |

## 4. Modelo de datos (`datos.json`)

| Clave | Contenido |
|---|---|
| `config` | Institución, docente, coordinador, año, escala, desempeños, periodos (nombre, inicio, fin, peso), componentes por defecto, membrete, apariencia, menú, IA (proveedor, claves por proveedor, modelos), voz, nube, frases del boletín, plantillas de comunicados, motivos de puntos |
| `areas`, `grupos`, `alumnos` | Áreas; grupos con grado y áreas (horas); estudiantes con documento, PIAR, acudiente, celular, correo, PIN, perfil |
| `planeaciones` | Planeaciones con sesiones y momentos; `vinculadas` (copias en otros grupos) |
| `plantillas` | Plantillas de planeación |
| `planesArea`, `mallas`, `planesPeriodo`, `planesAula` | Planeación curricular |
| `planillas` | Por grupo, área y periodo: componentes (`criterios`) con peso y actividades |
| `notas` | `{ actividadId: { alumnoId: nota } }` |
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
| `pizarras` | Tableros: `titulo`, `planeacionId`, `sesionId`, `grupoIds`, `areaId`, `fecha`, `formato: 'pizarra-local'`, `items` (elementos de Pizarra Local: sticky, shape, text, connector, pen, image, frame, emoji, comment; el texto con formato va en `rich`, con fuente, tamaño y resaltado por fragmento), `assets` (imágenes en `data:`), `view` y `miniatura` (JPEG pequeño para la lista) |
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
Las pruebas de punta a punta usan Playwright con Electron (`_electron.launch`) y una carpeta de datos aparte (`PLANEADOR_DATA_DIR`); en Linux se ejecutan con `xvfb-run`. Simulan diálogos de guardar/abrir, proveedores de IA (reemplazando el manejador IPC), celulares (Chromium con perfil de teléfono contra el servidor local), micrófono (`--use-fake-device-for-media-stream`) y fotos de hojas de respuestas (generadas, rellenadas y deformadas con Python/PIL).
