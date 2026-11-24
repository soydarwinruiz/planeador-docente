# Planeador Docente

Aplicación de escritorio para Windows para planear clases de **educación básica y media en Colombia (grados 1.° a 11.°)**.
Funciona **sin internet**: todos los datos quedan guardados en tu computador.

## Documentación

- [Manual de usuario](docs/MANUAL-DE-USUARIO.md): cómo usar cada módulo.
- [Historial de desarrollo](docs/HISTORIAL-DE-DESARROLLO.md): cómo se construyó y qué trae cada versión.
- [Documentación técnica](docs/DOCUMENTACION-TECNICA.md): arquitectura, archivos, datos, compilación y pruebas.

## Cómo abrirla

- **Instalador** (`PlaneadorDocente-Setup-1.12.0.exe`, recomendado): instala la app con acceso directo en el escritorio
  y **se actualiza sola** (Configuración → *Actualizaciones*).
- **Versión portable** (`PlaneadorDocente-portable-1.12.0.exe`): haz doble clic y listo. No necesita instalación.
  Puedes llevarla en una memoria USB. Avisa cuando hay versión nueva, pero se descarga a mano.
- La primera vez, Windows puede mostrar *"Windows protegió su PC"* (el programa no tiene firma digital comercial).
  Haz clic en **Más información → Ejecutar de todas formas**.

Tus datos se guardan en `%APPDATA%\Planeador Docente\datos.json` (los puedes ver desde Configuración → *Abrir carpeta de datos*).

## Primeros pasos

Al abrir la app por primera vez aparece el **asistente de configuración** (institución, número y fechas de periodos, escala de valoración y componentes de evaluación). Puedes volver a abrirlo desde Configuración.


1. **Configuración**: escribe la institución, el docente y el año lectivo. Revisa las fechas y porcentajes de los periodos,
   la escala (1.0 a 5.0) y los rangos de desempeño (Bajo, Básico, Alto, Superior).
2. **Grupos y alumnos**: crea tus áreas (hay un botón para agregar las áreas obligatorias), luego tus grupos (601, 702…)
   indicando qué áreas dictas en cada uno. Pega la lista de estudiantes desde Excel o el SIMAT y marca quiénes tienen PIAR.
3. **Calendario**: agrega los festivos de Colombia con un clic y los eventos institucionales.
4. **Planeación curricular**: arma el plan de área y la malla curricular de cada grado (por periodo), organiza
   cada periodo en unidades y revisa el plan de aula de cada grupo.
5. **Planeaciones de clase**: crea planeaciones por sesión, semanales o por secuencia didáctica, con estándares, DBA, competencias,
   desempeños (saber, hacer, ser), momentos de la clase (exploración, estructuración, práctica, valoración), recursos,
   evaluación, evidencias y ajustes razonables. Expórtalas a **Word** con un clic.

## Módulos

| Módulo | Qué hace |
|---|---|
| Referentes MEN | Para 1.° a 11.°: **Estándares Básicos de Competencias** (MEN, 2006) de Lenguaje, Matemáticas, Ciencias Naturales, Ciencias Sociales y Competencias Ciudadanas; **DBA** con sus evidencias de Matemáticas, Lenguaje, Ciencias Naturales, Ciencias Sociales e Inglés (6.° a 11.°); y **Orientaciones curriculares de Tecnología e Informática** (competencias y evidencias por componente). Se consultan en *Planeación curricular → Referentes MEN* y se insertan con el botón **📘 Referentes** en la malla y la planeación. La IA los usa para no inventar estándares |
| Planeación curricular | **Mapa de cobertura**: qué estándares, DBA u orientaciones ya están en la malla, planeados o desarrollados en cada periodo. **Plan de área** (diagnóstico, justificación, objetivos por grado, enfoque, metodología, evaluación, inclusión…), **malla curricular** por grado y periodo (ejes, contenidos, estándares, DBA, competencias, desempeños, evidencias, horas), **plan de periodo** por unidades o proyectos y **plan de aula** por grupo con el avance de cada eje. Todo exportable a Word en hoja horizontal |
| Planeaciones de clase | Estructura de orientaciones didácticas: identificación, diversidad del aula (desde el perfil del grupo), fundamentación, criterios de evaluación por niveles y acciones metodológicas (exploración, estructuración, práctica, transferencia y valoración, con mediaciones). Crear, buscar, filtrar, duplicar y exportar a Word. Se vinculan a la malla: al elegir un eje se copian sus estándares, DBA, competencias y desempeños |
| Banco pedagógico | Incluye de fábrica **52 estrategias** (Radar 360°: generales y específicas de sesión), **60 técnicas** (búsqueda, comprensión, representación y comunicación) y los **9 métodos universales**, con código, clasificación y pasos. Estrategias, metodologías y técnicas con clasificación, momentos de la clase, descripción y pasos. Se agregan a mano o se importan desde Excel, y se insertan con el botón **📚 Banco** en la planeación de clase, el plan de periodo, el plan de aula y el plan de área |
| Plantillas de planeación | Una plantilla por grado o por grupo (y opcionalmente por área) con duración, minutos por sesión, número de estudiantes, locativos, recursos, estilos de aprendizaje, gustos, barreras, ajustes y datos de fundamentación. Al crear una planeación se aplica sola la plantilla más específica |
| Planear varios grupos | Al crear una planeación puedes crearla también para los demás grupos del área: cada copia toma las fechas del horario de su grupo y su plantilla de diversidad. Si luego cambias la original, actualizas las copias con un clic. En *Mi horario*, **Planear la semana** muestra las clases que aún no tienen planeación |
| Banco de planeaciones | Reutilizar planeaciones en otro grupo o en el siguiente año (las fechas se ajustan solas). **Compartir con otros docentes** mediante un archivo `.planeador` (planeaciones, mallas, planes de área, plantillas, instrumentos, estrategias y pruebas; nunca datos de estudiantes) |
| Mi horario | Horario semanal por franjas. Muestra *Mis clases de hoy* en Inicio, propone las fechas de las sesiones al planear y abre la asistencia del grupo correcto |
| Inclusión (PIAR) | PIAR completo según el Decreto 1421 de 2017: valoración pedagógica, ajustes razonables por área y periodo, recomendaciones, acta de acuerdo y seguimiento. Exportable a Word |
| Perfil de aprendizaje | Tests con calificación automática: estilos **VAK**, estilos de **Kolb** e **inteligencias múltiples**. El resumen del grupo se puede pasar a la plantilla de planeación |
| DUA y flexibilización | 36 consideraciones del **DUA 3.0** y 10 estrategias de flexibilización curricular dentro del banco pedagógico, que se insertan en *ajustes razonables* y *apoyos* |
| Pruebas y talleres | Pruebas **tipo Saber** (selección múltiple con única respuesta, contextos compartidos) y talleres con preguntas abiertas, escritas a mano o **generadas con IA** desde tu malla. Word del estudiante con **hoja de respuestas** y Word del docente con la **clave**. Se califican digitando las letras (ej.: ABDC…), muestran el **% de acierto por pregunta** y la opción errada más elegida, y las notas se **envían a la planilla** con un clic |
| Pruebas en el celular (QR) | La prueba se abre en los **celulares de los estudiantes** escaneando un código QR: tu computador la comparte por el WiFi del salón (o el punto de acceso de tu celular), **sin internet y sin instalar nada**. Cada estudiante entra con su nombre y PIN, recibe las preguntas y opciones en otro orden, y tú ves en vivo quién entra, cuánto lleva, si sale de la página y quién entregó. Se califica sola y las notas pasan a la planilla. La clave nunca sale de tu computador |
| Calificar con la cámara | Hojas de respuestas imprimibles con marcas en las esquinas y número de lista. Se califican mostrándolas a la **cámara del computador** o con **fotos del celular**: detecta la hoja aunque esté inclinada, marca las preguntas en blanco y las de doble marca |
| Fichas imprimibles | **Sopas de letras, crucigramas, emparejar, completar y guías de trabajo** en PDF con el membrete y solucionario. Se generan sin internet; la IA es opcional para sugerir palabras, pistas o el texto a partir del tema o de una planeación |
| Gamificación | Puntos por estudiante y por equipo con motivos configurables, **niveles** (Explorador → Leyenda), **insignias** y un **tablero** para proyectar. Se integra con "Estudiante al azar" y "Grupos de trabajo" |
| Herramientas de aula | En pantalla completa para el video beam: **estudiante al azar** (sin repetir y sin ausentes), **grupos de trabajo** aleatorios (equilibrados por desempeño y con roles), **temporizador** grande con alarma y **modo proyector** que muestra los momentos de la clase o las preguntas de una prueba |
| Tableros (pizarra) | Pizarra infinita tipo Miro (**Pizarra Local** integrada) **asignada a una sesión de la planeación y a sus grupos**: notas, textos con **formato por letra** (fuente del equipo, tamaño, color, resaltado, negrita…), texto que **se ajusta solo a la nota**, formas, conectores, lápiz, **imágenes con recorte**, PDF, marcos para **presentar**, comentarios, temporizador, plantillas, estudiantes del grupo como notas, momentos de la sesión y exportación a PNG, SVG o PDF |
| Diario de campo | Al terminar la clase registras en segundos qué se alcanzó, qué quedó pendiente y las novedades. Lo pendiente aparece al planear la siguiente clase. Exportable a Word y Excel como evidencia para la evaluación de desempeño |
| Comunicados a padres | Mensajes listos (bajo desempeño, inasistencias, actividades pendientes, plan de apoyo, citación, felicitación o los tuyos) con los datos de cada estudiante. Se envían por **WhatsApp** o **correo** con un clic, o se imprimen en Word con **desprendible** para firma del acudiente. Sugiere a quién enviar y guarda el historial |
| Calendario | Vista mensual con clases planeadas, periodos, festivos y eventos |
| Cronograma | Temas previstos semana a semana por área, grado y periodo |
| Grupos y alumnos | Áreas, grupos, intensidad horaria, listas con **acudiente, celular y correo**, PIAR, retiros y traslados |
| Evaluación y notas | **Programación evaluativa** por grupo, área y periodo: componentes con porcentaje (Evaluaciones, Consultas o investigaciones, Actividades de aplicación, Actitudinal con auto/co/heteroevaluación y Prueba final) y sus actividades con fecha, técnica e instrumento; exportable a Word para los padres y copiable a otros grupos. Planilla de notas, consolidado anual, **planes de apoyo** (para quienes están en Bajo, con actividades, criterios y firmas; sugeridos con IA), **semáforo de riesgo** (🔴🟡🟢 por estudiante con la **nota que necesita** en lo que falta del periodo y del año), **retroalimentación con IA** de trabajos escritos (texto o foto del cuaderno, valorados con tu rúbrica; tú revisas antes de guardar), **observaciones del boletín** (redactadas con un banco de frases editable o con IA a partir de notas, componentes, pendientes, asistencia y planes de apoyo; se copian a la plataforma o se exportan a Word y Excel), **importación de notas** desde Excel, Google Forms o Classroom (convierte puntajes como 8/10 a la escala) y **banco de instrumentos**: rúbricas, escalas de valoración y listas de cotejo |
| Seguimiento del estudiante | Tablero por grupo (quién requiere atención) y por estudiante: promedio por periodo, componentes, notas por área, asistencia y actividades pendientes |
| Asistencia | Presente / ausente / tarde / excusa por clase, con resumen y % de asistencia |
| Configuración | Datos institucionales, **hoja membrete** (logos, color, lema y pie de página para todos los Word), SIEE, periodos, IA, apariencia (modo oscuro y tamaño de letra), actualizaciones, respaldos y cambio de año lectivo |

Las listas, la asistencia, las planillas, la programación evaluativa y el cronograma se exportan a **Excel (.xlsx)** con el encabezado de la institución.

**Informe de cierre de periodo** (Evaluación y notas → 📑): un Word para coordinación con resultados por grupo y área, estudiantes en riesgo, planes de apoyo, avance de la malla, asistencia, PIAR, comunicación con familias y tus observaciones.

**Dictado por voz**: en cualquier campo de texto aparece el botón 🎤 (o Ctrl + Shift + D). Usa una clave de OpenAI o Gemini; la alternativa gratuita es el dictado de Windows (Windows + H).

**Alertas y pendientes**: Inicio muestra lo que requiere atención (cierre de periodo, actividades sin calificar, asistencia sin registrar, estudiantes con muchas faltas, planes de apoyo vencidos, observaciones del boletín por redactar, clases sin planear) y tu lista de **pendientes** con fecha. El número rojo en *Inicio* indica cuántas hay.

**Menú a tu medida**: en Configuración → *Menú lateral* (o el botón ☰ abajo en el menú) ocultas los módulos que no usas, por ejemplo PIAR o Cronograma, y los ordenas arrastrándolos. Ocultar no borra datos.

**Buscador general**: con **Ctrl + K** (o el cuadro *Buscar* del menú) encuentras planeaciones, estudiantes, estrategias, mallas, plantillas, planes de apoyo, PIAR y eventos.

## Respaldos

- **Automático**: cada vez que abres la aplicación se guarda una copia (se conservan las últimas 15).
- **En la nube**: Configuración → *Respaldo en la nube* → elige la carpeta de **OneDrive** o de **Google Drive para escritorio**.
  La app copia tus datos allí cada 20 minutos y al cerrar (conserva 14 días). Si se daña o se pierde el computador,
  instala la app en otro y usa *Restaurar desde archivo…* con `planeador-ultimo.json`.
- **Manual**: Configuración → *Crear respaldo…* y guárdalo en una USB o en OneDrive/Google Drive.
  Para pasar tus datos a otro computador, usa *Restaurar desde archivo…*.

## Sugerencias con IA (opcional)

En **Configuración → Inteligencia artificial** eliges el proveedor y pegas tu clave de API:

| Proveedor | Dónde se obtiene la clave | Modelo por defecto |
|---|---|---|
| Claude (Anthropic) | console.anthropic.com | claude-opus-5-5 |
| ChatGPT (OpenAI) | platform.openai.com | gpt-5-mini |
| Gemini (Google) | aistudio.google.com | gemini-2.5-flash |
| Otro compatible con OpenAI | DeepSeek, Groq, OpenRouter, Ollama o LM Studio (locales)… | el que indiques |

Puedes escribir cualquier otro modelo de tu proveedor. Usa **Probar conexión** para verificar la configuración.
Con Ollama o LM Studio la IA corre en tu propio computador, sin costo y sin internet (requiere un equipo potente).

La IA genera borradores de la planeación de clase, propone ejes para la malla y redacta el plan de área.
Se envían el tema, el área, el grado y lo escrito; **no se envían nombres de estudiantes**.

## Para desarrolladores

```bash
npm install
npm start              # abrir en modo desarrollo
npm run dist:portable  # generar el .exe portable
npm run dist:win       # instalador + portable (ejecutar en Windows)
```

El flujo `.github/workflows/compilar-windows.yml` genera el instalador en GitHub Actions y publica la versión
(`latest.yml` + `.blockmap`), de donde la app instalada descarga sus actualizaciones.

### Firma digital (opcional)

Sin firma, Windows SmartScreen muestra *"Windows protegió su PC"*. Para quitarlo se necesita un certificado de firma de código
(OV o EV de una entidad como Sectigo, DigiCert o SSL.com, o el servicio Azure Trusted Signing). Con el certificado `.pfx`:

1. Conviértelo a base64 (`certutil -encode cert.pfx cert.txt` y quita las líneas BEGIN/END).
2. En GitHub → *Settings → Secrets and variables → Actions* crea los secretos `CSC_LINK` (el texto base64) y `CSC_KEY_PASSWORD`.
3. Vuelve a ejecutar el flujo: electron-builder firmará el instalador y la portable automáticamente.
