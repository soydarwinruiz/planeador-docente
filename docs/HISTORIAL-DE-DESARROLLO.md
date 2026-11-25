# Historial de desarrollo del Planeador Docente

Este documento cuenta cómo se construyó la aplicación, paso a paso: qué se pidió, qué se decidió, qué se incorporó en cada versión y qué problemas se resolvieron en el camino.

- **Repositorio:** https://github.com/soydarwinruiz/planeador-docente
- **Descargas de cada versión:** https://github.com/soydarwinruiz/planeador-docente/releases
- **Periodo de desarrollo:** 22 a 24 de noviembre de 2026 (versiones 1.0.0 a 1.13.0)

---

## 1. Cómo se trabajó

El programa se construyó en conversación entre el docente (quien define qué necesita el aula) y un asistente de programación con IA (Claude Code), en ciclos cortos:

1. **El docente plantea la necesidad** (a veces con documentos: compendios pedagógicos, plantillas, estándares, DBA, capturas de pantalla de errores).
2. **Se aclaran decisiones** con preguntas puntuales (nivel educativo, formato de salida, escala de notas, etc.).
3. **Se programa** el módulo completo.
4. **Se prueba** la app real de forma automática: un robot abre el programa, hace clic, escribe, genera los Word/Excel/PDF y toma capturas de pantalla que se revisan visualmente.
5. **Se publica** una versión nueva en GitHub. Un servidor de GitHub con Windows compila el instalador y la versión portable.
6. **El docente prueba** en su computador y devuelve observaciones, que alimentan la siguiente versión.

Principios que se mantuvieron en todo el proceso:

- **Funciona sin internet.** Todos los datos quedan en el computador del docente; la IA es opcional.
- **Privacidad de los estudiantes.** Nunca se envían nombres de estudiantes a la IA. En las observaciones del boletín, por ejemplo, la IA recibe "E1, E2…" y el nombre se pone después en el computador.
- **Contexto colombiano:** Ley 115, Decreto 1290 de 2009 (evaluación), Decreto 1421 de 2017 (inclusión y PIAR), Estándares Básicos de Competencias, DBA y orientaciones del MEN, festivos de Colombia, SIMAT.
- **Todo exportable** a Word, Excel o PDF con el membrete de la institución.
- **Nada se rompe al actualizar:** cada versión nueva conserva los datos de la anterior.

---

## 2. Requisitos iniciales

La primera solicitud fue *"un aplicativo para Windows, un sistema de planeación docente"*. Con un cuestionario inicial se definió:

| Tema | Decisión |
|---|---|
| Nivel | Básica secundaria (luego se amplió de 1.° a 11.°) |
| País / normativa | Colombia |
| Funciones | Todas: planeación, notas, asistencia, calendario, banco |
| Exportación | Word |
| Usuarios | Un solo docente, sin conexión |
| Evaluación | Criterios y rúbricas, escala 1,0 a 5,0 |
| Tipos de planeación | Por sesión, semanal y secuencia didáctica |
| Extras | Banco de planeaciones, sugerencias con IA, respaldos |
| Periodos | Configurables |
| Carga | Varios grados y áreas |
| Campos de la planeación | Todos los habituales (estándares, DBA, competencias, desempeños, momentos, evaluación, ajustes) |

---

## 3. Versiones

### Versión 1.0.0 — La base (22 de noviembre)
Primera versión funcional para Windows:

- Planeaciones de clase por sesión, semanales o por secuencia didáctica, con estándares, DBA, competencias, desempeños (saber, hacer, ser), momentos de la clase, recursos, evaluación y ajustes razonables.
- Exportación de la planeación a **Word**.
- **Banco de planeaciones** para reutilizar en otro grupo o en el siguiente año (las fechas se ajustan solas).
- **Grupos y alumnos:** áreas, grupos, intensidad horaria, listas pegadas desde Excel o el SIMAT, marca de PIAR.
- **Asistencia** (presente, ausente, tarde, excusa).
- **Calificaciones** con criterios y rúbricas; consolidado anual.
- **Calendario** con festivos de Colombia y eventos institucionales; **cronograma** de temas por semana.
- **Respaldos** automáticos y manuales.
- Sugerencias opcionales con IA.
- Compilación automática en GitHub: instalador y versión portable.

Primeras preguntas del docente: *"¿cómo lo descargo?"*. Se configuró la publicación automática de las descargas en la página de versiones de GitHub.

### Versión 1.1.0 — Planeación curricular
El docente señaló: *"Algo que se me olvidó, que es muy importante… la planeación curricular"*. Se agregó:

- **Plan de área** (diagnóstico, justificación, objetivos por grado, enfoque, metodología, evaluación, inclusión…).
- **Malla curricular** por grado y periodo (ejes, contenidos, estándares, DBA, competencias, desempeños, evidencias, horas).
- **Plan de periodo** por unidades o proyectos y **plan de aula** por grupo con el avance de cada eje.
- Todo **conectado**: al elegir un eje de la malla en una planeación de clase se copian sus estándares, DBA y desempeños.
- Exportación a Word en hoja horizontal.

### Versión 1.2.0 — Banco pedagógico e IA con cualquier proveedor
- **Banco pedagógico** de estrategias, metodologías y técnicas (clasificación, momentos de la clase, descripción y pasos), insertables con un botón en planeaciones y planes.
- A pedido del docente (*"que se pueda usar cualquiera: Claude, GPT, Gemini…"*), la IA admite **Claude, ChatGPT, Gemini y cualquier servicio compatible con OpenAI** (DeepSeek, Groq, OpenRouter, Ollama o LM Studio en el propio computador).

### Versión 1.3.0 — Programación evaluativa, instrumentos y seguimiento
El docente compartió compendios pedagógicos en PDF y su plantilla de planeación. Con base en ellos:

- **Programación evaluativa por componentes**: Evaluaciones (4 actividades), Consultas o investigaciones, Actividades de aplicación, Actitudinal (auto, co y heteroevaluación) y Prueba final, sumando 100 %. Exportable para los padres y copiable a otros grupos.
- **Banco de instrumentos**: rúbricas, escalas de valoración y listas de cotejo; la nota se calcula al marcar niveles.
- **Seguimiento del estudiante**: tablero por grupo y por estudiante con gráficas.
- **Asistente de configuración inicial** (institución, periodos, escala, componentes).
- **Nueva estructura de la planeación de clase** según las orientaciones didácticas: identificación, diversidad del aula, fundamentación, criterios por niveles y momentos (exploración, estructuración, práctica, transferencia, valoración) con sus mediaciones.
- Banco precargado del compendio Radar 360°: **52 estrategias, 60 técnicas y 9 métodos**.

### Versión 1.4.0 — Estándares Básicos de Competencias
El docente preguntó si convenía cargar los documentos oficiales del MEN. Como los archivos eran pesados, se compartieron primero por GitHub y luego por una carpeta de Google Drive. Se extrajeron y verificaron los **Estándares Básicos de Competencias** de Lenguaje, Matemáticas, Ciencias Naturales, Ciencias Sociales y Competencias Ciudadanas (6.° a 9.°), consultables e insertables con el botón **📘 Referentes**.

### Versión 1.5.0 — DBA y orientaciones de Tecnología
- **DBA** con sus evidencias: Matemáticas, Lenguaje, Ciencias Naturales, Ciencias Sociales e Inglés.
- **Orientaciones curriculares de Tecnología e Informática** (competencias y evidencias por componente).
- La IA usa estos referentes para no inventar estándares.

### Versión 1.6.0 — Grados 1.° a 11.° y plantillas
Solicitud: *"Quiero que tengas desde grado primero hasta 11… y que permita crear plantillas para la planeación"*.

- Todos los grados de **1.° a 11.°**; los referentes se ampliaron a **545 bloques** (estándares en 5 bandas, DBA por grado, Inglés 6.°–11.°, Tecnología en 5 bandas).
- **Plantillas de planeación** por grado o por grupo (y opcionalmente por área): duración, minutos por sesión, número de estudiantes, locativos, recursos, estilos de aprendizaje, gustos, barreras y ajustes. Cada planeación nueva empieza con esos datos.

### Versión 1.7.0 — Las 15 mejoras (23 de noviembre)
El docente preguntó *"¿qué crees que se podría mejorar?"* y respondió una lista de 15 propuestas con *"hagamos lo que haya que hacer para mejorar"*. Se incorporó:

- **Hoja membrete** institucional (logos, color, lema, pie de página) en todos los Word.
- **Exportación a Excel real (.xlsx)** con encabezado de la institución.
- **Planes de apoyo / mejoramiento** (Decreto 1290) con sugerencias de IA y formato con firmas.
- **Módulo PIAR** completo (Decreto 1421), exportable a Word.
- **Banco DUA 3.0** (36 consideraciones) y 10 estrategias de **flexibilización curricular**.
- **Tests de perfil de aprendizaje** con calificación automática: VAK, Kolb e inteligencias múltiples.
- **Mi horario**: clases de hoy en Inicio, fechas automáticas de las sesiones y asistencia del grupo correcto.
- **Buscador general** (Ctrl + K), **modo oscuro**, **tamaño de letra** e **ícono** propio.
- **Actualizaciones automáticas** para la versión instalada.
- **Respaldo en la nube** en la carpeta de OneDrive o Google Drive del docente.
- **Compartir con otros docentes** mediante archivos `.planeador` (nunca con datos de estudiantes).
- Soporte para **firma digital** del instalador (requiere comprar un certificado).
- **Menú lateral personalizable** (ocultar y ordenar módulos), pedido durante esta misma versión.
- Corrección: los cambios hechos justo antes de cerrar la ventana ahora se guardan.

*Nota del proceso:* la publicación de esta versión se demoró porque el control de permisos de la sesión bloqueaba los commits. Se resolvió cuando el docente cambió el modo de permisos y autorizó la publicación.

### Versión 1.7.1 — Corrección visual
A partir de una captura de pantalla del docente: el encabezado de la tabla de periodos quedaba fijo al desplazarse y tapaba las filas. Ahora el encabezado fijo solo se usa en las tablas largas con desplazamiento propio (planillas, asistencia). Fue además la primera prueba de la actualización automática.

### Versión 1.8.0 — Productividad docente
Pregunta: *"¿qué funciones para mejorar la productividad docente se hacen necesarias?"*. Se eligieron 8:

- **Observaciones para el boletín**: redactadas con un banco de frases editable o con IA, a partir de notas, componentes, actividades pendientes, asistencia y planes de apoyo.
- **Planear varios grupos a la vez**: cada copia toma las fechas del horario de su grupo; las copias se actualizan con un clic. "Planear la semana" en Mi horario.
- **Diario de campo**: lo pendiente aparece al planear la siguiente clase.
- **Importar notas** desde Excel, Google Forms o Classroom (convierte puntajes como 8/10).
- **Comunicados a padres** por WhatsApp, correo o Word con desprendible. Se agregaron acudiente, celular y correo a cada estudiante.
- **Alertas y pendientes** en Inicio.
- **Pruebas tipo Saber y talleres**: generados a mano o con IA, Word con hoja de respuestas y clave, calificación digitando letras, análisis por pregunta.
- **Herramientas de aula**: estudiante al azar, grupos de trabajo, temporizador y modo proyector.

### Versión 1.9.0 — Innovación en el aula
Pregunta: *"¿qué otra mejora se le podría hacer, innovación?"*. El docente pidió explicación de las pruebas por celular (*"¿los estudiantes deben tener una app?"* — no, solo el navegador) y eligió 9:

- **Pruebas en el celular por código QR**, por el WiFi del salón, sin internet ni instalación; PIN por estudiante, preguntas y opciones en distinto orden para cada uno, tablero en vivo.
- **Calificar hojas de respuestas con la cámara** o con fotos del celular (lectura óptica propia).
- **Semáforo de riesgo** y **nota necesaria** para aprobar el periodo y el año.
- **Mapa de cobertura curricular** de estándares, DBA y orientaciones.
- **Retroalimentación de trabajos escritos con IA** (texto o foto) usando las rúbricas del docente.
- **Dictado por voz** en cualquier campo de texto.
- **Fichas imprimibles**: sopa de letras, crucigrama, emparejar, completar y guía de trabajo.
- **Informe de cierre de periodo** para coordinación.
- **Gamificación**: puntos, niveles, insignias y tablero proyectable.

### Versión 1.9.1 — Protección de notas y menú
Observaciones del docente:

- *"Que no se borre una actividad si ya tiene calificaciones"*: ya no se pueden eliminar actividades ni componentes con notas, ni reemplazar la estructura de una planilla calificada. Para borrar una actividad creada por error primero hay que vaciar sus notas de forma explícita (🧹).
- *"Si los ocultos desaparecen por completo… lo ideal es volver a mostrarla pulsando en el check"*: los módulos ocultos siguen en la lista de Configuración, atenuados, y se vuelven a mostrar marcando el check. (La causa era un nombre de estilo que la app ya usaba para "no mostrar nada".)

### Versión 1.10.0 — Tableros tipo Miro (24 de noviembre)
Pedido del docente: *"una herramienta tipo tablero Miro con muchas opciones, que lo que se haga se asigne a una sesión con los grupos; que las etiquetas de texto se ajusten, que el texto se pueda personalizar con fuentes del sistema y por letras, no solo de forma global; poder insertar imágenes y recortarlas, todo integrado"*.

- **Módulo Tableros** con lienzo infinito: notas, textos, 20 formas, conectores, lápiz, resaltador, borrador, imágenes, marcos, tablas y sellos; zoom, minimapa, guías de alineación, agrupar, bloquear, capas, deshacer y rehacer, copiar y pegar (también imágenes del portapapeles) y menú contextual.
- **Asignación a la sesión y a los grupos:** cada tablero guarda planeación, sesión, grupos, área y fecha. Se crea o se abre desde cada sesión de la planeación y desde *Mis clases de hoy*; aparece en el buscador.
- **Texto:** formato por letra (fuente del sistema, tamaño, color, resaltado, negrita, cursiva, subrayado, tachado, superíndice, subíndice, mayúsculas, sombra, contorno, espaciado), listas, alineación, interlineado y ajuste automático del tamaño a la caja.
- **Imágenes:** insertar, arrastrar o pegar; recorte no destructivo con proporciones y forma circular o redondeada; ajustes de color, voltear, borde y sombra. Las fotos grandes se reducen para no inflar el archivo de datos.
- **Integración con el aula:** estudiantes del grupo como notas, momentos de la sesión, objetivo y pregunta problematizadora, estudiante al azar durante la presentación y acceso a las herramientas de aula.
- **Presentación** por marcos en pantalla completa con lápiz para escribir encima, y **exportación** a PNG y PDF.

### Versión 1.11.0 — Pizarra Local integrada (24 de noviembre)
A pedido del docente (*"no se ajusta bien… si pudieras integrar este"*, con una captura de una nota donde una palabra larga quedaba diminuta) el editor pasó a ser [Pizarra Local](https://github.com/soydarwinruiz/pizarra-local), que dibuja en canvas y parte las palabras largas en vez de achicarlas. Se integró dentro del planeador (los tableros se guardan en los datos del planeador con su sesión y sus grupos) y se le agregó **fuente, tamaño y resaltado por letra**. Los tableros hechos antes se convierten solos.

### Versión 1.12.0 — Menú lateral plegable y modo enfoque (24 de noviembre)
A pedido del docente (*"me gustaría que la barra lateral pudiera ocultarse temporalmente… y si estoy en el tablero que también se pueda ocultar"*):
- **Menú lateral plegable** con el botón « o Ctrl + B; un botón ☰ flotante lo vuelve a mostrar. Se recuerda por separado en los tableros y en el resto de la app.
- **Modo enfoque en los tableros** (⤢ Enfoque o Ctrl + Shift + B): oculta el menú y la barra superior del tablero. Los atajos funcionan también desde dentro de la pizarra.
- **Menú compacto** (solo íconos, botón ⇤ / ⇥), que se activa solo en ventanas de menos de 1000 px.
- El botón para personalizar el menú pasó de ☰ a 🧭 para no confundirse con el de mostrar el menú.

### Versión 1.12.1 — Puntas de flecha de los conectores (24 de noviembre)
A partir de una captura del docente en la que la línea gruesa atravesaba la punta de la flecha:
- La línea ahora termina dentro de la punta, sin asomar por delante.
- La punta crece con el grosor de la línea y se orienta según el final de la curva.
- Las líneas punteadas siempre empiezan y terminan con un trazo, para que la punta no quede suelta.
- Lo mismo se aplica al exportar el tablero como SVG.

### Versión 1.13.0 — Papelera (24 de noviembre)
A la pregunta del docente (*"si por error borro alguna calificación o algo del programa, ¿existe una manera de recuperarlo?"*): hasta ahora solo se podía restaurar un respaldo completo, que reemplaza todos los datos.
- **Papelera** en el menú lateral: lo eliminado se guarda 30 días y se recupera con un clic, sin tocar lo que se hizo después.
- Funciona en todos los módulos a la vez: al confirmar un borrado se toma una foto de los datos y, al guardar, se registra solo lo que desapareció, incluidos los borrados en cascada (un grupo con sus estudiantes, asistencia y notas).
- Aviso con **Deshacer** justo después de cada borrado.
- No se guardan en la papelera la restauración de respaldos ni el inicio de un nuevo año lectivo (este ya crea un respaldo).

### Versión 1.14.0 — Consolidación: datos más seguros y guardado más rápido (24 de noviembre)
A pedido del docente (*"analízalo todo, quiero que se consolide y quede bien robusto, sólido, rápido, ágil"*) se revisó todo el código y se corrigió lo encontrado:
- **Corrección importante:** las observaciones del boletín y los comunicados a padres fallaban desde la 1.13.0, porque la papelera declaró una función con el mismo nombre (`rellenar`) que usan sus plantillas.
- **Recuperación automática:** si el archivo de datos se daña (apagón, cierre inesperado) la app carga sola el respaldo válido más reciente, conserva una copia del archivo dañado y avisa.
- **Escritura más segura:** se fuerza a disco antes de reemplazar el archivo y se reintenta cuando Windows, el antivirus u OneDrive lo bloquean un instante.
- **Más respaldos automáticos:** al abrir y cada hora si hubo cambios (15 recientes) y uno por día durante 30 días.
- **Una sola ventana del programa:** abrirlo dos veces ya no puede pisar los datos.
- **Guardado mucho más rápido:** las imágenes de los tableros se guardan en un archivo por tablero; con 15 tableros con fotos el archivo de datos pasa de ~9 MB a ~0,4 MB y cada guardado de ~340 ms a menos de 10 ms. Si nada cambió, no se reescribe.
- **Claves de IA cifradas** con el sistema operativo y fuera de los respaldos y de la carpeta de la nube.
- Respaldo manual y de la nube completos (con las imágenes de los tableros) y escritos de forma segura.
- **Pruebas automáticas en el repositorio** (`npm test`) y en GitHub en cada cambio, incluida una revisión que detecta nombres repetidos entre módulos (el origen del error del boletín).

### Versión 1.15.0 — Celular del docente, clave, años anteriores, recuperaciones y portafolio (24 de noviembre)
El docente eligió cinco de las propuestas del análisis. Sobre el celular pidió *"que funcione como una extensión del PC"* y *"que el programa permita escoger el tiempo"* de la autorización.
- **📱 Celular del docente:** página web servida por el computador en la red local (sin internet ni instalación). Vinculación con QR y PIN de un solo uso; autorización de 1 hora, solo hoy, 7 o 30 días, hasta el fin del periodo o indefinida; lista de celulares con último uso, cambio de autorización y desautorización. En el celular: clases de hoy, asistencia, notas por actividad, anotaciones (del estudiante o del grupo al diario de campo), puntos de gamificación, la sesión planeada, estudiante al azar y pendientes. Lo marcado sin señal queda en cola y se envía al volver. El celular solo guarda un permiso aleatorio; el computador guarda su resumen, nunca el permiso.
- **🔒 Clave de acceso:** resumen con scrypt (la clave no se guarda), sin la clave el proceso principal no entrega los datos, bloqueo por inactividad y con Ctrl + L, freno a intentos repetidos y código de recuperación.
- **🗄️ Años anteriores:** el nuevo año lectivo archiva el año completo; consulta de solo lectura con todas las vistas, importación desde respaldos de versiones anteriores, y los años viajan en los respaldos.
- **Recuperaciones según el SIEE:** reemplaza, promedia o pondera, con nota máxima; columna en la planilla y en el consolidado anual; aplicada en todos los cálculos y exportaciones.
- **🎓 Portafolio docente:** evidencias automáticas por competencia del Decreto 1278 (sin nombres de estudiantes), evidencias y reflexiones propias, exportación a Word.
- **Anotaciones de estudiantes** en *Seguimiento del estudiante* (desde el celular o el PC).
- Pruebas automáticas de las cinco funciones (`tests/e2e-funciones.js`), incluida una página de celular real marcando asistencia.
- **Nuevo año lectivo a elección:** el docente marca qué conservar (planeaciones, curricular, cronograma, plantillas, pruebas, fichas, tableros, grupos con opción de subir de grado, estudiantes, PIAR, programación evaluativa, planes de aula, horario, eventos, pendientes, portafolio).
- **Corrector de ortografía** en español latinoamericano con sugerencias en el clic derecho y *Agregar al diccionario* (se puede apagar en Configuración → Apariencia).

### Versión 1.15.1 — Segunda revisión completa (25 de noviembre)
A pedido del docente (*"revisa nuevamente todo el código… que todo esté funcionando correctamente"*):
- **Seguridad:** un paquete `.planeador` o un respaldo manipulado podía meter código en los botones del programa a través de los identificadores internos. Ahora todos se validan al cargar, restaurar o importar.
- El generador de PDF ya no acepta rutas de destino desde la interfaz.
- Buscadores que fallaban si se cambiaba de pantalla justo después de escribir.
- Mensaje claro cuando la respuesta de la IA queda incompleta por larga.
- Prueba nueva que recorre todas las pantallas y pestañas con un año completo de datos, y otra con un paquete malicioso. Las pruebas corren ahora también en Windows en GitHub.

### Versión 1.16.0 — Productividad en el aula (25 de noviembre)
El docente pidió el registro de cambios de notas, más personalización y una configuración por secciones, y aprobó *"vamos con todo"* para las demás propuestas de productividad:
- **Registro de cambios de notas** (antes, después, fecha, origen), historial con clic derecho y restaurar.
- **Personalización:** color de la barra lateral, color de acento y tipo de letra.
- **Configuración por secciones desplegables** con buscador.
- **🎯 Mi clase ahora:** la clase que toca con asistencia, sesión con avance por momentos, proyección, herramientas de aula y cierre con el diario.
- **Entregas y nota por lote**, conectadas con pendientes y comunicados.
- **Frases rápidas** (;atajo y Ctrl + Espacio), también en el celular.
- **Tu semana** en Inicio.
- **Banco de preguntas** reutilizable.
- **Material con IA** desde cada sesión: guía, quiz de salida y rúbrica.
- **Cámara del celular:** hojas de respuesta calificadas al instante y fotos de trabajos para la retroalimentación con IA; entregas desde el celular.
- Correcciones encontradas por las pruebas: el banco de preguntas y el banco pedagógico compartían el estado de sus filtros; calificar una hoja por foto fallaba si la cámara del computador no estaba abierta.

---

## 4. Problemas resueltos durante el desarrollo

| Problema | Solución |
|---|---|
| Los PDF oficiales de los DBA tenían dos columnas, viñetas en fuentes especiales y textos de ejemplo en color | Extracción por columnas detectando el espacio central, reconocimiento de viñetas por el nombre de la fuente y filtrado de los textos de ejemplo |
| El PDF de DBA de Ciencias Sociales era solo imagen y el reconocimiento de texto (OCR) no era confiable | Transcripción manual y verificación |
| Algunas líneas de los DBA de Inglés quedaban cortadas por imágenes | Recuperación con la extracción "con diseño" del PDF |
| GitHub no permitía adjuntar los documentos de referencia | Se compartieron por una carpeta de Google Drive |
| En el membrete, al escribir rápido el cursor saltaba de campo | El enfoque automático de las ventanas ahora respeta el campo en uso |
| El buscador no encontraba palabras dentro de los pasos de las estrategias | Se indexaron también los pasos |
| En modo oscuro algunos números y pestañas no se leían | Colores específicos para el modo oscuro |
| El plan de apoyo contaba como "sin entregar" actividades futuras | Solo cuentan las actividades con fecha vencida |
| Cambios hechos justo antes de cerrar la ventana se perdían | Guardado inmediato al cerrar |
| Encabezados de tabla que tapaban filas (captura del docente) | Encabezado fijo solo en tablas largas |
| Crucigramas en los que no cabía alguna palabra | Se prueban varias distribuciones y se elige la que ubica todas |
| Lector óptico que fallaba con la hoja inclinada | Detección de las marcas de esquina independiente del giro; funciona hasta 20° |
| Las fotos no se podían abrir por la política de seguridad de la app | Lectura de la imagen como datos |
| Módulos ocultos que desaparecían de la lista | Cambio del nombre del estilo |
| El nuevo botón de ocultar el menú no respondía: ya existía otra función con el mismo nombre (la de personalizar el menú) | Nombre propio para la nueva función (`alternarBarraLateral`) |
| Observaciones del boletín y comunicados fallaban: la papelera declaró otra función `rellenar` | Nombre propio (`rellenarFaltantes`) y revisión automática de nombres repetidos (`tests/estatico.js`) |

---

## 5. Cómo se probó

- **Pruebas automáticas de punta a punta** (más de 20 guiones) que abren la aplicación real, la usan como lo haría un docente y revisan errores: planeaciones, curricular, notas, Excel, Word, apoyo, PIAR, tests, horario, buscador, modo oscuro, menú, compartir, actualizaciones, importar notas, pruebas, aula, alertas, comunicados, QR, cámara, retroalimentación y voz.
- **Revisión visual**: capturas de pantalla de cada pantalla nueva y conversión de los Word y PDF generados a imágenes para revisarlos.
- **Simulaciones**: tres celulares virtuales presentando una prueba por QR; hojas de respuestas rellenadas, giradas, con sombra y lápiz claro para la cámara; un micrófono virtual para el dictado; respuestas de IA simuladas para no depender de claves reales.
- **Lo que no se pudo probar en el entorno de desarrollo** (y conviene que el docente ensaye): una cámara física, la red WiFi real del colegio y las respuestas reales de los servicios de IA y de dictado.

---

## 6. Tamaño del proyecto (versión 1.9.1)

- 12 versiones publicadas en GitHub (1.0.0 a 1.9.1).
- Unos 12.000 líneas de código propio, más los datos de referentes curriculares (545 bloques de estándares, DBA y orientaciones) y el banco pedagógico (52 estrategias, 60 técnicas, 9 métodos, 36 consideraciones DUA, 10 de flexibilización).
- 35 archivos JavaScript de interfaz y 7 del proceso principal.
- 21 módulos en el menú lateral.
