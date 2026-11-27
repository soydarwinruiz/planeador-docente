# Manual de usuario – Tiza (antes Planeador Docente)

Aplicación de escritorio para Windows para planear, evaluar y hacer seguimiento en **educación básica y media en Colombia (1.° a 11.°)**. Funciona **sin internet**; los datos quedan en tu computador.

**Contenido**
1. [Instalación y actualización](#1-instalación-y-actualización)
2. [Primeros pasos](#2-primeros-pasos)
3. [La pantalla principal](#3-la-pantalla-principal)
4. [Módulos](#4-módulos)
5. [Configuración](#5-configuración)
6. [Respaldos y cambio de computador](#6-respaldos-y-cambio-de-computador)
7. [Inteligencia artificial y privacidad](#7-inteligencia-artificial-y-privacidad)
8. [Preguntas frecuentes](#8-preguntas-frecuentes)

---

## 1. Instalación y actualización

Descarga desde https://github.com/soydarwinruiz/planeador-docente/releases (última versión).

| Archivo | Para qué |
|---|---|
| `PlaneadorDocente-Setup-1.13.0.exe` | **Instalador (recomendado).** Crea acceso directo y **se actualiza solo**. |
| `PlaneadorDocente-portable-1.13.0.exe` | Se abre con doble clic, sin instalar (sirve en una USB). Avisa de nuevas versiones, pero se descarga a mano. |

- Si Windows muestra *"Windows protegió su PC"*: **Más información → Ejecutar de todas formas** (el programa no tiene firma comercial).
- **Actualizaciones:** Configuración → *Actualizaciones*. La app revisa sola al abrir; pulsa *Descargar e instalar* y luego *Reiniciar e instalar*. Tus datos no se tocan.
- Los datos se guardan en `%APPDATA%\Planeador Docente\datos.json` (Configuración → *Abrir carpeta de datos*).

## 2. Primeros pasos

1. **Asistente inicial:** institución, docente, año lectivo, número y fechas de periodos, escala (1,0 a 5,0) y componentes de evaluación.
2. **Grupos y alumnos:** crea las áreas (botón para las obligatorias), luego los grupos (601, 702…) con las áreas que dictas e intensidad horaria. Pega la lista de estudiantes desde Excel o el SIMAT.
3. **Mi horario:** registra tus clases de la semana.
4. **Calendario:** agrega los festivos de Colombia con un clic y los eventos institucionales.
5. **Configuración → Hoja membrete:** sube los logos y datos para que aparezcan en todos los documentos.
6. **Planeación curricular:** arma la malla de cada grado. Luego, ¡planea tus clases!

## 3. La pantalla principal

- **Menú lateral:** todos los módulos. El botón **🧭** (abajo) lleva a personalizarlo; **⇤ / ⇥** alterna el menú compacto (solo íconos, se activa solo en ventanas angostas); **🌓** cambia claro/oscuro; **A− / A+** cambia el tamaño de letra.
- **Ocultar el menú lateral (Ctrl + B):** el botón **«** junto al título lo esconde para ganar espacio; el botón **☰** de la esquina superior izquierda (o Ctrl + B otra vez) lo vuelve a mostrar. Se recuerda por separado para los tableros y para el resto de la app.
- **Buscar (Ctrl + K):** encuentra planeaciones, estudiantes, estrategias, mallas, plantillas, pruebas, fichas, entradas del diario y más.
- **Inicio:**
  - **🔔 Alertas** (el número rojo en *Inicio* indica cuántas): cierre de periodo, actividades sin calificar, asistencia sin registrar, estudiantes con muchas faltas o en riesgo alto, planes de apoyo vencidos, observaciones por redactar, clases sin planear, eventos de hoy y mañana. Cada alerta tiene un botón para resolverla y ✕ para ocultarla.
  - **✔️ Mis pendientes:** tu lista de tareas con fecha.
  - **Mis clases de hoy** (según el horario): abrir la planeación, ✅ asistencia, 📓 diario, 🎲 herramientas de aula.
  - Clases de los próximos 7 días y eventos de los próximos 30.
- **Dictado por voz:** en cualquier campo de texto aparece **🎤** (o Ctrl + Shift + D). Ver [sección 7](#7-inteligencia-artificial-y-privacidad).

## 4. Módulos

### Planeación curricular
Pestañas:
- **Plan de área:** diagnóstico, justificación, objetivos por grado, enfoque, metodología, evaluación, inclusión, transversales… (con sugerencias de IA). Word horizontal.
- **Malla curricular:** por área, grado y periodo: ejes, contenidos, estándares, DBA, competencias, desempeños, evidencias y horas. *Copiar de otra malla*, *Sugerir con IA*, Word. Con **⚙️ Campos** ajustas los campos de cada eje a tu institución: ocultar los que no usan, cambiarles el nombre o agregar campos propios (por ejemplo *Proyecto transversal* o *Metodología*). Valen para todas las mallas, los llena la IA y salen en el Word; ocultar no borra lo escrito.
- **Plan de periodo** (unidades o proyectos) y **Plan de aula** por grupo, con el avance de cada eje (sin planear / planeado / desarrollado).
- **🗺️ Cobertura:** tabla de colores con cada DBA, estándar u orientación del grado y su estado por periodo: *sin trabajar*, *en la malla*, *planeado en clase*, *desarrollado*. Exportable a Excel. Para que se detecte, inserta los referentes con el botón **📘 Referentes**.
- **📚 Referentes MEN:** consulta de estándares (1.°–11.°), DBA (Matemáticas, Lenguaje, Ciencias Naturales, Ciencias Sociales, Inglés 6.°–11.°) y orientaciones de Tecnología.

### Planeaciones de clase
- **Nueva planeación:** tipo (sesión, semanal, secuencia), grupo, área, plantilla, fecha y tema. Si tienes horario, las sesiones toman las fechas de tus clases.
- **Crear también para otros grupos:** marca 602, 603… al crearla; cada copia usa las fechas de su grupo y su plantilla de diversidad. Con **👥 Otros grupos** actualizas las copias si cambias la original.
- Secciones: identificación, diversidad del aula, fundamentación (componentes, competencias, estándares, DBA, evidencias, objetivo, pregunta problematizadora, métodos y técnicas, desempeños), criterios por niveles y momentos de cada sesión con sus mediaciones.
- Botones: **✨ Sugerir con IA**, **📘 Referentes**, **📚 Banco**, **📽️ Proyectar**, **🧩 Ficha**, **📑 Duplicar**, **📄 Word**.
- Si en el diario quedó algo pendiente de la clase anterior, aparece un aviso para agregarlo a la exploración.

### Plantillas de planeación
Una por grado o por grupo (opcionalmente por área): duración, minutos por sesión, número de estudiantes, locativos, recursos, estilos de aprendizaje, gustos, barreras y ajustes. Se aplica sola la más específica al crear una planeación.

### Banco de planeaciones
Planeaciones guardadas para reutilizar (las fechas se ajustan solas). **📤 Compartir / 📥 Importar de un colega** con archivos `.planeador`.

### Banco pedagógico
52 estrategias, 60 técnicas, 9 métodos (Radar 360°), 36 consideraciones del **DUA 3.0** y 10 estrategias de **flexibilización curricular**, más las que agregues o importes desde Excel. Se insertan en planeaciones, planes y en *ajustes y apoyos*.

### Pruebas y talleres
1. **Crear:** prueba tipo Saber (selección múltiple con única respuesta) o taller (también preguntas abiertas). Escribe las preguntas o usa **✨ Generar con IA** (toma los referentes de tu malla). Varias preguntas pueden compartir un contexto. **🔀 Repartir respuestas correctas** equilibra A, B, C y D.
2. **Imprimir:** 📄 Word del estudiante (con hoja de respuestas) y 🔑 Clave del docente.
3. **📱 Aplicar en celulares** (sin internet, sin instalar nada):
   - Conecta el portátil y los celulares al mismo WiFi (o al punto de acceso de tu celular; no gasta datos). La primera vez Windows pide permiso: **Redes privadas → Permitir**.
   - Elige opciones (PIN, barajar, mostrar aciertos, tiempo) y pulsa **▶ Abrir la prueba**. Proyecta el **QR** y el código de 4 letras.
   - El estudiante escanea, elige su nombre, escribe su **PIN** (🖨️ imprime los PIN del grupo) y responde. Cada uno recibe otro orden de preguntas y opciones.
   - Ves en vivo quién entró, su avance, si salió de la página y quién entregó. **⏹ Cerrar prueba** hace que todos entreguen lo que llevan.
   - Prueba la red antes de clase abriendo la dirección en tu propio celular.
4. **✅ Calificar:**
   - Digitando las letras de cada estudiante (ej.: `ABDC-A`, el guion es "en blanco").
   - **📷 Con la cámara:** imprime **🖨️ Hojas para cámara** (una por estudiante con su nombre y número de lista, o en blanco). Imprímelas **al 100 %**. Muestra cada hoja a la cámara: se califica sola y suena un pitido. También puedes **calificar desde fotos** tomadas con el celular. `*` = más de una marca.
   - Las preguntas abiertas se califican con puntos (👁️ muestra lo escrito en el celular).
5. **📈 Resultados:** promedio, desempeños, % de acierto por pregunta, opción errada más elegida y preguntas para retroalimentar. **Enviar notas** a una actividad de la planilla.

### Fichas imprimibles
Sopa de letras (fácil, media, difícil), crucigrama, emparejar, completar (marca con \*asteriscos\* las palabras) y guía de trabajo (objetivo, explicación, ejemplos, actividades, reto, autoevaluación). Vista previa en vivo, **PDF** con membrete y **solucionario**, letra grande para primaria, **🔀 Reorganizar**, **📝 Desde una planeación**, **✨ Sugerir con IA**, **💾 Guardar**.

### Herramientas de aula (🎲)
Pantalla completa para el video beam (⛶):
- **Estudiante al azar:** sin repetir y sin los ausentes de hoy; puedes darle puntos al elegido.
- **Grupos de trabajo:** por número de equipos o de integrantes, equilibrados por desempeño, con roles; *Usar en gamificación*.
- **Temporizador:** grande, amarillo en el último minuto, rojo al final, con alarma.
- **Proyector:** momentos de la clase o preguntas de una prueba (← → para avanzar, *Mostrar respuesta*).
- **Tablero** de gamificación.

### Tableros (🖍️)
Pizarra infinita para la clase (el editor **Pizarra Local**, integrado) que queda **asignada a una sesión de una planeación, a uno o varios grupos y a un área**.
- **Crear:** desde una sesión de la planeación (botón *🖍️ Tablero* junto a cada sesión), desde *Mis clases de hoy* en Inicio o en el módulo *Tableros* (*＋ Nuevo tablero*). El tablero de una sesión se abre con el mismo botón (✓). Con *🔗 Asignar* (o tocando las etiquetas de la barra superior) se cambia la planeación, la sesión, los grupos, el área y la fecha.
- **Barra del planeador** (arriba): *🧑‍🎓 Estudiantes* (una nota por estudiante del grupo), *📝 Momentos de la sesión* (lo que escribiste en la planeación), *🎯 Objetivo* (objetivo y pregunta problematizadora), *🎲 Al azar* (estudiante al azar de los grupos del tablero) y *👥 Aula*.
- **Más espacio para la pizarra:** **☰** (barra superior del tablero) oculta o muestra el menú lateral (Ctrl + B). **⤢ Enfoque** (Ctrl + Shift + B) oculta además la barra superior del tablero; sal con el botón **Salir del modo enfoque** de arriba al centro.
- **Herramientas** (barra izquierda): seleccionar (V), mano (H), nota (N), texto (T), formas (R), conector (L), lápiz (P), rotulador (M), borrador (E), marco (F), sellos, comentarios (C), imagen o PDF (I) y plantillas. Atajos completos con **?**.
- **Texto con formato por letra:** doble clic para escribir; selecciona solo algunas letras y usa la barra que aparece encima: negrita, cursiva, subrayado, tachado, **fuente** (todas las del equipo, con buscador), **tamaño** (A−, A+ o la lista), **color**, **resaltado**, listas con viñetas, numeradas o de tareas. Sin seleccionar letras, la fuente y el tamaño del panel derecho cambian todo el texto.
- **El texto se ajusta solo** a la nota o forma: en *Auto (llenar)* ocupa el espacio y crece al agrandar la nota; con tamaño fijo se reduce si no cabe. Las palabras muy largas se parten en varias líneas en lugar de volverse diminutas.
- **Imágenes y PDF:** botón de imagen, arrastrar o pegar (Ctrl+V). Doble clic para **recortar** (Enter aplica); el recorte se puede quitar sin perder la imagen. Cada página de un PDF entra como imagen.
- **Presentar (▶)** los marcos como diapositivas, **temporizador** (⏱), **comentarios** (💬), **buscar** (🔍) y **exportar** (⤓) a PNG, SVG o PDF.

### Gamificación
Por grupo: puntos a uno o varios estudiantes (motivos configurables, también negativos), **niveles** (Explorador, Aprendiz, Experto, Maestro, Leyenda), **12 insignias**, **equipos** con sus puntos, **tablero** proyectable, historial con deshacer y *Nueva temporada* para reiniciar puntos.

### Calendario, Mi horario y Cronograma
- **Calendario:** mes con clases planeadas, periodos, festivos y eventos.
- **Mi horario:** franjas y clases por día; horas semanales por grupo; **🗓️ Planear la semana** muestra las clases sin planeación.
- **Cronograma:** temas previstos semana a semana.

### Grupos y alumnos
Áreas, grupos, intensidad horaria, listas con **acudiente, celular y correo**, PIAR, retiros y traslados. **📋 Pegar lista** (Apellidos · Nombres · Documento · Acudiente · Celular · Correo). **🧠 Perfil de aprendizaje:** tests **VAK**, **Kolb** e **inteligencias múltiples** con calificación automática y resumen del grupo para la plantilla (en VAK, las preguntas 17, 18, 33 y 37 se omiten por defecto para menores de 10.°).

### Inclusión (PIAR)
PIAR según el Decreto 1421: información general, entorno de salud, hogar y escolar, valoración pedagógica, **ajustes razonables por área y periodo** (objetivos, barreras, ajustes, evaluación), recomendaciones, acta de acuerdo y seguimiento. Exportable a Word.

### Diario de campo
Al terminar cada clase (botón 📓 en Inicio): cómo te fue, qué se alcanzó, qué quedó pendiente y novedades. Lo pendiente aparece al planear la siguiente clase. Filtros y exportación a Word y Excel como evidencia.

### Mi clase ahora (🎯)
Al llegar al salón, pulsa **🎯 Mi clase ahora** (en Inicio o en el menú). Se abre la clase que toca según *Mi horario* (o la siguiente del día; puedes elegir otra arriba a la derecha), con:
- **Asistencia** con un clic por estudiante (P → A → T → E) y *Marcar a los demás como presentes*.
- **La sesión de hoy**: objetivo, pregunta y momentos, con una casilla para marcar lo que ya hiciste; las actividades con fecha de hoy y el pendiente que quedó de la clase anterior.
- Botones para **📽️ Proyectar la clase** (objetivo y momentos en pantalla completa; flechas para avanzar, Esc para salir), el **tablero** de la sesión, **estudiante al azar**, **temporizador**, **grupos de trabajo**, la planeación y las **entregas**.
- **✅ Terminar clase** abre el diario de campo para registrar en segundos qué se alcanzó y qué quedó pendiente.

### Tu semana (en Inicio)
Un resumen de lo que hay que resolver esta semana, con un botón para cada cosa: clases del horario sin planear, actividades con fecha cumplida sin calificar, entregas marcadas como "no entregó", estudiantes en rojo en el semáforo y tus pendientes con fecha. Se abre solo los lunes; el resto de la semana queda plegado.

### Asistencia
P (presente), A (ausente), T (tarde), E (excusa) por clase; *Todos presentes*; resumen con % de asistencia; Excel. También se toma desde el celular (ver *Celular del docente*).

### Celular del docente (📱)
Tu celular funciona como una extensión del computador durante la clase, sin instalar nada y sin internet:
1. En el computador: **Configuración → Celular del docente → ＋ Vincular un celular**. Elige cuánto tiempo queda autorizado (1 hora, solo hoy, 7 días, 30 días, hasta el fin del periodo o hasta que lo desautorices).
2. Conecta el celular a la **misma red** que el computador, escanea el código QR y escribe el **PIN** de 6 dígitos (sirve una vez durante 10 minutos).
3. En el celular aparecen **tus clases de hoy** (de *Mi horario*) y puedes abrir cualquier grupo, área y fecha. Pestañas: **✅ Asistencia** (todos empiezan sin marcar; *Marcar a los demás como presentes*), **📊 Notas** (por actividad de la programación evaluativa), **📝 Anotar** (anotación positiva, académica, de convivencia o general de un estudiante, o del grupo para el diario de campo; puedes dictar con el micrófono del teclado), **🏆 Puntos** de gamificación, **📖 Clase** (objetivo y momentos de la sesión) y **🎲 Azar** (sin repetir y sin los ausentes). En **📊 Notas**, el botón de la izquierda de cada estudiante marca la **entrega** (✔ entregó, ⏰ tarde, ✖ no entregó). En **📷 Cámara**: fotografía una **hoja de respuestas** de una prueba y se califica al instante (aparece el nombre y la nota), o fotografía el **trabajo de un estudiante** para hacer en el computador la retroalimentación con IA (las fotos de trabajos no se guardan hasta que las usas). En el inicio también están tus pendientes.

Todo se guarda al instante en el computador. Si la señal se cae, el celular guarda lo marcado y lo envía al volver ("⏳ por enviar"). El computador debe estar encendido con el programa abierto. Si la red del colegio no deja que los equipos se vean, activa el **punto de acceso** del celular y conecta el computador a él. Si pierdes el celular, desautorízalo en Configuración. Las anotaciones de cada estudiante se ven en *Seguimiento del estudiante*.

### Evaluación y notas
- **📅 Programación evaluativa:** componentes con porcentaje y actividades con fecha, técnica e instrumento. Word para padres; copiar a otros grupos.
- **📊 Planilla de notas:** Enter baja al siguiente estudiante; notas en rojo bajo la aprobación. Botones: **✍️ Retroalimentación IA**, **⬇️ Retroalimentaciones** (Word), **📥 Importar notas** (Excel, Google Forms o Classroom; convierte 8/10 a la escala; si un estudiante envió dos veces, queda el último).
- **🔒 Protección:** una actividad o componente con calificaciones **no se puede eliminar**. Para borrar una actividad creada por error, primero **🧹 Vaciar notas** en *Editar actividad*.
- **📥 Entregas y nota por lote:** elige la actividad y marca quién **entregó**, quién **entregó tarde** y quién **no entregó** (o usa *Todos entregaron* y *Los que faltan: no entregaron*). Luego pon una **nota por lote**: a los seleccionados, a los que entregaron, a los que entregaron tarde, a los que no entregaron o a todos los que no tienen nota, sin cambiar las notas que ya están (opcional). Lo marcado como "no entregó" aparece en el seguimiento y en el comunicado de actividades pendientes.
- **🕘 Registro de cambios:** cada vez que una nota se pone, se cambia o se borra (en el computador, desde el celular, al importar, con rúbrica, por lote o al eliminar una actividad) queda registrada con fecha y hora, nota anterior, nota nueva y desde dónde se hizo. Filtra por estudiante, fechas u origen y exporta a Excel. En la planilla, **clic derecho sobre una nota** muestra su historial y permite volver a un valor anterior. Sirve ante reclamos y para recuperar una nota borrada por error.
- **📈 Consolidado anual**, con la columna de **recuperación final** del año.
- **Recuperaciones (SIEE):** en *Configuración → Escala de valoración* eliges cómo se aplican (la nota de recuperación reemplaza la del periodo, se promedia, o un porcentaje de cada una) y la nota máxima después de recuperar (por ejemplo 3,0). En la planilla aparece la columna **Recup.** para quienes no alcanzan la nota aprobatoria; la nota con recuperación se marca con **R** y nunca baja la que el estudiante ya tenía. Se usa en boletín, informes, seguimiento y exportaciones.
- **🆘 Planes de apoyo:** para quienes están en Bajo, con dificultades, desempeños, actividades (sugeridas con IA), compromisos y firmas.
- **🚦 Semáforo de riesgo:** 🔴🟡🟢 por estudiante, con la **nota que necesita** en lo que falta del periodo y para el año.
- **📝 Observaciones del boletín:** con banco de frases editable o IA; copiar a la plataforma, Excel o Word.
- **📋 Instrumentos:** rúbricas, escalas de valoración y listas de cotejo.
- **📑 Informe de cierre:** Word para coordinación con resultados, estudiantes en riesgo, planes de apoyo, avance de la malla, asistencia, PIAR, comunicación con familias y tus observaciones, con firmas.

**Retroalimentación con IA:** elige actividad, estudiante e instrumento; pega el texto o adjunta fotos del cuaderno; **✨ Evaluar con IA**. Revisa la valoración por criterio, la nota, las fortalezas, lo que hay que mejorar y el mensaje para el estudiante; luego **Guardar y siguiente**.

### Seguimiento del estudiante
Por grupo: promedios por área, semáforo y asistencia. Por estudiante: **🧮 ¿Cuánto necesita para aprobar?**, gráficas por periodo y componente, notas, actividades pendientes, planes de apoyo, perfil de aprendizaje y **✉️ Comunicado al acudiente**.

### Años anteriores (🗄️)
Al iniciar un año lectivo, el que termina se **archiva completo**. Aquí lo abres con **👁️ Consultar**: el programa muestra ese año (planillas, consolidados, asistencia, seguimiento, observaciones, PIAR, informes y exportaciones) con una franja morada de **solo lectura**; **↩️ Volver** regresa al año en curso. También puedes **archivar una copia** del año actual o **importar un año desde un respaldo** (por ejemplo, el que se guardó al iniciar el año con versiones anteriores a la 1.15).

### Portafolio docente (🎓)
Evidencias para la **evaluación anual de desempeño (Decreto 1278)** y la ECDF, organizadas por competencia: gestión académica (dominio curricular, planeación, pedagógica y didáctica, evaluación), administrativa, comunitaria y comportamentales. El programa reúne solo las cifras de tu trabajo (planes de área, mallas, planeaciones, programación evaluativa, instrumentos, pruebas, planes de apoyo, recuperaciones, asistencia, diario, comunicados…), sin nombres de estudiantes. Agrega tus propias evidencias (con dónde está el soporte) y una reflexión por competencia, y **⬇️ Exporta a Word** con firmas. Puedes filtrar por fechas.

### Banco de preguntas
En *Pruebas y talleres* → **📚 Banco de preguntas**: todas las preguntas de tus pruebas y talleres (también las de paquetes recibidos), sin repetir, con filtros por área, grado, tipo y texto. Marca las que quieras y **crea una prueba nueva**, o desde una prueba abierta usa **📚 Traer del banco** para agregarlas.

### Material con IA para una sesión
En cada sesión de la planeación, **✨ Material** propone, a partir de lo que planeaste (objetivo, desempeños y momentos): una **guía del estudiante** (ficha imprimible), un **quiz de salida** de 5 preguntas (prueba que se aplica en papel o por QR) o una **rúbrica** de la actividad (queda en tus instrumentos). Revisa siempre lo que propone la IA.

### Frases rápidas
Escribe **;atajo** seguido de un espacio en cualquier campo y se reemplaza por la frase guardada (por ejemplo, `;refuerzo` → "Debe reforzar los temas vistos…"). Con **Ctrl + Espacio** eliges de la lista. Créalas y edítalas en *Configuración → Frases rápidas*. También funcionan en el celular.

### Comunicados a padres
Tipos: bajo desempeño, inasistencias, actividades pendientes, plan de apoyo, citación, felicitación (y los que crees en *Editar textos*). **✨ Sugerir** marca a quién enviar. Cada mensaje es editable: **🟢 WhatsApp** (abre el chat con el texto listo), **✉️ Correo**, **📋 Copiar** o **⬇️ Word** con desprendible para firma. Queda el historial.

## 5. Configuración
En el menú **Ayuda → Acerca de Tiza** (o en Configuración, botón *ℹ️ Acerca de Tiza*) están la versión, los créditos, los contenidos de referencia y el software libre que usa el programa.

Las opciones están agrupadas en **secciones desplegables** (Institución y docente, Evaluación, Apariencia y menú, Frases rápidas, Inteligencia artificial, Seguridad y celular, Respaldos, Año lectivo); el programa recuerda cuáles dejaste abiertas, y el **buscador** de arriba abre la sección donde está lo que buscas.
- Datos institucionales, docente, coordinador, año lectivo.
- **Hoja membrete:** logos, color, líneas (NIT, DANE…), lema y pie de página.
- **Apariencia:** tema claro, oscuro o como el sistema; **color de la barra lateral**, **color de botones y resaltados** y **tipo de letra** (con vista previa y botón para volver a lo original); tamaño de letra; **corrector de ortografía** (subraya en rojo; clic derecho sobre la palabra para ver sugerencias o agregarla al diccionario).
- **🧭 Menú lateral:** desmarca para ocultar un módulo (queda atenuado en la lista y lo vuelves a mostrar marcándolo); ordena arrastrando o con ▲▼. Ocultar no borra datos.
- **🔄 Actualizaciones**, **☁️ Respaldo en la nube**, **🤝 Compartir con otros docentes**.
- SIEE: escala, desempeños, periodos y porcentajes, componentes de evaluación por defecto.
- **✨ Inteligencia artificial** y **🎤 Dictado por voz.**
- **🔒 Clave de acceso:** el programa pide la clave al abrirse y se bloquea tras unos minutos sin uso (o con **Ctrl + L** o el botón 🔒 del menú). Al activarla recibes un **código de recuperación**: guárdalo, es la única forma de entrar si olvidas la clave.
- **📱 Celular del docente:** vincular, ver y desautorizar celulares, y cambiar cuánto dura cada autorización.
- Respaldos y **Nuevo año lectivo**: archiva el año que termina en *Años anteriores* y te deja **elegir qué conservar**: planeaciones (van al banco), planes de área/mallas/planes de periodo, cronograma (corrido a las semanas del año nuevo), plantillas, pruebas (sin resultados), fichas, tableros, grados y grupos (con la opción de **subir cada grupo un grado**; los de 11.° salen), estudiantes, PIAR, programación evaluativa (sin notas, fechas corridas un año), planes de aula, clases del horario, eventos, pendientes y evidencias del portafolio. Lo que depende de los grupos solo se puede conservar si conservas los grupos. Asistencia, notas, recuperaciones, observaciones, anotaciones, diario, comunicados, planes de apoyo y gamificación siempre empiezan vacíos.

## 6. Respaldos y cambio de computador
- **Dónde están tus datos (2.0):** en una base de datos SQLite (`tiza.db`) dentro de tu usuario de Windows, con **cada registro cifrado**. Sin tu usuario de Windows (o, si activas la clave de acceso, sin tu clave o tu código de recuperación) nadie puede leerlos. En *Configuración → Seguridad, datos y celular → Almacenamiento* ves el tamaño y cómo está protegida la llave.
- **Al pasar de la 1.x a la 2.0** todo se migra solo y queda una copia sin cifrar de tus datos anteriores en la carpeta "antes-de-2.0". Cuando compruebes que todo está bien, bórrala desde *Almacenamiento*. Si tenías clave de acceso, la primera vez que la escribas en la 2.0 recibirás un **código de recuperación nuevo**: guárdalo.
- **🗑️ Papelera:** lo que eliminas con los botones de borrar (planeaciones, grupos, estudiantes, notas, actividades, tableros, eventos, pendientes…) se guarda 30 días. Justo después de borrar aparece un aviso con **Deshacer**; más tarde, abre **Papelera** en el menú lateral y pulsa **↩️ Recuperar**. Vuelve a su lugar (un grupo, por ejemplo, con sus estudiantes, asistencia y notas) sin cambiar lo que hiciste después. No guarda lo que cambias escribiendo encima de un dato, como una nota que reemplazas por otra: para eso están los respaldos.
- **Automático:** una copia al abrir la app y cada hora si hubo cambios (se conservan las 15 más recientes) y una por día durante 30 días. Si el archivo de datos se daña (por ejemplo, por un apagón), la app se recupera sola con el respaldo más reciente y te avisa.
- **En la nube:** Configuración → *Respaldo en la nube* → elige la carpeta de OneDrive o de Google Drive para escritorio. Copia cada 20 minutos y al cerrar (14 días).
- **Manual:** *Crear respaldo…* en una USB. El respaldo manual y el de la nube incluyen las imágenes de los tableros y **no** incluyen tus claves de IA.
- **Cambio de computador:** instala la app y usa *Restaurar desde archivo…* con `planeador-ultimo.json`.

## 7. Inteligencia artificial y privacidad
- Es **opcional**. En Configuración → *Inteligencia artificial* eliges el proveedor (Claude, ChatGPT, Gemini u otro compatible como DeepSeek, Groq, OpenRouter, Ollama o LM Studio) y pegas tu clave. Las claves se guardan **cifradas** solo en tu computador, por separado para cada proveedor, y no se copian en los respaldos (si cambias de computador, vuelve a pegarlas).
- **Modelo:** elige de la lista los modelos que tu clave puede usar (se actualiza sola con internet; 🔄 la actualiza al momento). *Automático* es lo recomendado. Sin internet se ve la última lista.
- Google ahora entrega claves que empiezan por **AQ.**; el programa las prueba de todas las formas que Google acepta. Si aun así no funciona, crea una clave en console.cloud.google.com → *APIs y servicios* → *Credenciales* → *Crear credenciales* → *Clave de API*, restringida a *Generative Language API*.
- **IA en tu computador, gratis y sin internet:** instala Ollama (ollama.com), descarga un modelo (`ollama pull qwen3:8b`; con 8 GB de RAM `qwen3:4b`, con tarjeta gráfica de 12 GB o más `gemma3:12b`) y en el proveedor *Otro compatible* pulsa **🖥️ Usar Ollama en este equipo**. Es más lenta y menos precisa que los servicios en la nube, pero útil para borradores.
- En la planeación de clase y en el material de cada sesión, la IA tiene presentes la **identificación** (recursos, locativos, duración, número de estudiantes) y la **diversidad del aula** (estilos, gustos, características y barreras, ajustes y apoyos, necesidades PIAR sin nombres).
- Se usa en: planeación de clase, malla, plan de área, planes de apoyo, observaciones del boletín, preguntas de pruebas, fichas y retroalimentación de trabajos.
- **No se envían nombres de estudiantes.** En la retroalimentación de trabajos, si el nombre está escrito en el trabajo, la IA lo verá.
- **Revisa siempre** lo que propone la IA antes de usarlo.
- **Dictado por voz:** necesita una clave de OpenAI o de Gemini (o un servicio compatible como Groq), aunque uses otro proveedor para las sugerencias. Alternativa gratuita: **Windows + H**.

## 8. Preguntas frecuentes
- **¿Los estudiantes necesitan instalar algo para las pruebas por QR?** No. Usan la cámara y el navegador del celular.
- **La prueba por QR no abre en los celulares.** Verifica que todos estén en la misma red y que Windows haya permitido la conexión. Algunas redes de colegio bloquean la comunicación entre equipos: usa el punto de acceso de tu celular.
- **La cámara no lee la hoja.** Que se vean las 4 marcas negras, la hoja plana, con buena luz y cerca. Imprime al 100 %. Si cambia la lista del grupo, vuelve a imprimir las hojas (el número de lista sigue el orden alfabético).
- **No puedo eliminar una actividad.** Tiene notas: está protegida. Edítala, o vacía sus notas (🧹) si fue un error.
- **Oculté un módulo y no lo encuentro.** Configuración → Menú lateral: aparece atenuado; márcalo de nuevo.
- **¿Qué pasa con mis datos al actualizar?** Se conservan.
