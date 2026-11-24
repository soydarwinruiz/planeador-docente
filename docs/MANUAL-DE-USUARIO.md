# Manual de usuario – Planeador Docente 1.11.0

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
| `PlaneadorDocente-Setup-1.11.0.exe` | **Instalador (recomendado).** Crea acceso directo y **se actualiza solo**. |
| `PlaneadorDocente-portable-1.11.0.exe` | Se abre con doble clic, sin instalar (sirve en una USB). Avisa de nuevas versiones, pero se descarga a mano. |

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

- **Menú lateral:** todos los módulos. El botón **☰** (abajo) lleva a personalizarlo; **🌓** cambia claro/oscuro; **A− / A+** cambia el tamaño de letra.
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
- **Malla curricular:** por área, grado y periodo: ejes, contenidos, estándares, DBA, competencias, desempeños, evidencias y horas. *Copiar de otra malla*, *Sugerir con IA*, Word.
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

### Asistencia
P (presente), A (ausente), T (tarde), E (excusa) por clase; *Todos presentes*; resumen con % de asistencia; Excel.

### Evaluación y notas
- **📅 Programación evaluativa:** componentes con porcentaje y actividades con fecha, técnica e instrumento. Word para padres; copiar a otros grupos.
- **📊 Planilla de notas:** Enter baja al siguiente estudiante; notas en rojo bajo la aprobación. Botones: **✍️ Retroalimentación IA**, **⬇️ Retroalimentaciones** (Word), **📥 Importar notas** (Excel, Google Forms o Classroom; convierte 8/10 a la escala; si un estudiante envió dos veces, queda el último).
- **🔒 Protección:** una actividad o componente con calificaciones **no se puede eliminar**. Para borrar una actividad creada por error, primero **🧹 Vaciar notas** en *Editar actividad*.
- **📈 Consolidado anual.**
- **🆘 Planes de apoyo:** para quienes están en Bajo, con dificultades, desempeños, actividades (sugeridas con IA), compromisos y firmas.
- **🚦 Semáforo de riesgo:** 🔴🟡🟢 por estudiante, con la **nota que necesita** en lo que falta del periodo y para el año.
- **📝 Observaciones del boletín:** con banco de frases editable o IA; copiar a la plataforma, Excel o Word.
- **📋 Instrumentos:** rúbricas, escalas de valoración y listas de cotejo.
- **📑 Informe de cierre:** Word para coordinación con resultados, estudiantes en riesgo, planes de apoyo, avance de la malla, asistencia, PIAR, comunicación con familias y tus observaciones, con firmas.

**Retroalimentación con IA:** elige actividad, estudiante e instrumento; pega el texto o adjunta fotos del cuaderno; **✨ Evaluar con IA**. Revisa la valoración por criterio, la nota, las fortalezas, lo que hay que mejorar y el mensaje para el estudiante; luego **Guardar y siguiente**.

### Seguimiento del estudiante
Por grupo: promedios por área, semáforo y asistencia. Por estudiante: **🧮 ¿Cuánto necesita para aprobar?**, gráficas por periodo y componente, notas, actividades pendientes, planes de apoyo, perfil de aprendizaje y **✉️ Comunicado al acudiente**.

### Comunicados a padres
Tipos: bajo desempeño, inasistencias, actividades pendientes, plan de apoyo, citación, felicitación (y los que crees en *Editar textos*). **✨ Sugerir** marca a quién enviar. Cada mensaje es editable: **🟢 WhatsApp** (abre el chat con el texto listo), **✉️ Correo**, **📋 Copiar** o **⬇️ Word** con desprendible para firma. Queda el historial.

## 5. Configuración
- Datos institucionales, docente, coordinador, año lectivo.
- **Hoja membrete:** logos, color, líneas (NIT, DANE…), lema y pie de página.
- **Apariencia:** tema claro, oscuro o como el sistema; tamaño de letra.
- **🧭 Menú lateral:** desmarca para ocultar un módulo (queda atenuado en la lista y lo vuelves a mostrar marcándolo); ordena arrastrando o con ▲▼. Ocultar no borra datos.
- **🔄 Actualizaciones**, **☁️ Respaldo en la nube**, **🤝 Compartir con otros docentes**.
- SIEE: escala, desempeños, periodos y porcentajes, componentes de evaluación por defecto.
- **✨ Inteligencia artificial** y **🎤 Dictado por voz.**
- Respaldos y **Nuevo año lectivo** (conserva lo curricular, planeaciones y pruebas; borra grupos, estudiantes, notas, asistencia y demás datos del año; antes crea un respaldo).

## 6. Respaldos y cambio de computador
- **Automático:** una copia cada vez que abres la app (se conservan 15).
- **En la nube:** Configuración → *Respaldo en la nube* → elige la carpeta de OneDrive o de Google Drive para escritorio. Copia cada 20 minutos y al cerrar (14 días).
- **Manual:** *Crear respaldo…* en una USB.
- **Cambio de computador:** instala la app y usa *Restaurar desde archivo…* con `planeador-ultimo.json`.

## 7. Inteligencia artificial y privacidad
- Es **opcional**. En Configuración → *Inteligencia artificial* eliges el proveedor (Claude, ChatGPT, Gemini u otro compatible como DeepSeek, Groq, OpenRouter, Ollama o LM Studio) y pegas tu clave. Las claves se guardan solo en tu computador y se guardan por separado para cada proveedor.
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
