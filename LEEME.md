# Planeador Docente

Aplicación de escritorio para Windows para planear clases de **básica secundaria en Colombia**.
Funciona **sin internet**: todos los datos quedan guardados en tu computador.

## Cómo abrirla

- **Versión portable** (`PlaneadorDocente-portable-1.3.0.exe`): haz doble clic y listo. No necesita instalación.
  Puedes llevarla en una memoria USB.
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
| Planeación curricular | **Plan de área** (diagnóstico, justificación, objetivos por grado, enfoque, metodología, evaluación, inclusión…), **malla curricular** por grado y periodo (ejes, contenidos, estándares, DBA, competencias, desempeños, evidencias, horas), **plan de periodo** por unidades o proyectos y **plan de aula** por grupo con el avance de cada eje. Todo exportable a Word en hoja horizontal |
| Planeaciones de clase | Estructura de orientaciones didácticas: identificación, diversidad del aula (desde el perfil del grupo), fundamentación, criterios de evaluación por niveles y acciones metodológicas (exploración, estructuración, práctica, transferencia y valoración, con mediaciones). Crear, buscar, filtrar, duplicar y exportar a Word. Se vinculan a la malla: al elegir un eje se copian sus estándares, DBA, competencias y desempeños |
| Banco pedagógico | Incluye de fábrica **52 estrategias** (Radar 360°: generales y específicas de sesión), **60 técnicas** (búsqueda, comprensión, representación y comunicación) y los **9 métodos universales**, con código, clasificación y pasos. Estrategias, metodologías y técnicas con clasificación, momentos de la clase, descripción y pasos. Se agregan a mano o se importan desde Excel, y se insertan con el botón **📚 Banco** en la planeación de clase, el plan de periodo, el plan de aula y el plan de área |
| Banco de planeaciones | Reutilizar planeaciones en otro grupo o en el siguiente año (las fechas se ajustan solas) |
| Calendario | Vista mensual con clases planeadas, periodos, festivos y eventos |
| Cronograma | Temas previstos semana a semana por área, grado y periodo |
| Grupos y alumnos | Áreas, grupos, intensidad horaria, listas, PIAR, retiros y traslados |
| Evaluación y notas | **Programación evaluativa** por grupo, área y periodo: componentes con porcentaje (Evaluaciones, Consultas o investigaciones, Actividades de aplicación, Actitudinal con auto/co/heteroevaluación y Prueba final) y sus actividades con fecha, técnica e instrumento; exportable a Word para los padres y copiable a otros grupos. Planilla de notas, consolidado anual y **banco de instrumentos**: rúbricas, escalas de valoración y listas de cotejo |
| Seguimiento del estudiante | Tablero por grupo (quién requiere atención) y por estudiante: promedio por periodo, componentes, notas por área, asistencia y actividades pendientes |
| Asistencia | Presente / ausente / tarde / excusa por clase, con resumen y % de asistencia |
| Configuración | Datos institucionales, SIEE, periodos, IA, respaldos y cambio de año lectivo |

Las listas, la asistencia, las planillas y el cronograma se pueden **exportar a Excel** (formato CSV).

## Respaldos

- **Automático**: cada vez que abres la aplicación se guarda una copia (se conservan las últimas 15).
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

El flujo `.github/workflows/compilar-windows.yml` genera el instalador en GitHub Actions.
