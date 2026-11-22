// Entradas predeterminadas del banco pedagógico (se cargan una sola vez; el docente puede editarlas o eliminarlas).
// Fuente: compendios de estrategias (Radar 360°), técnicas y los nueve métodos universales de enseñanza-aprendizaje.
// Al agregar entradas nuevas, súbele el número a "version" para que se carguen en los equipos que ya tienen la app.
const BANCO_INICIAL = {
  version: 1,
  items: [
 {
  "id": "bi-EG-P01",
  "codigo": "EG-P01",
  "tipo": "estrategia",
  "nombre": "Clarificación del Objetivo y Resultado Final",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Cuál es el objetivo de esta tarea/técnica/método y cuál será exactamente el producto o resultado final?»\nVariable: Meta clara.",
  "pasos": "El estudiante define por escrito qué entregable concreto va a producir (un ensayo, un prototipo, una solución) y para qué sirve antes de buscar información."
 },
 {
  "id": "bi-EG-P02",
  "codigo": "EG-P02",
  "tipo": "estrategia",
  "nombre": "Desglose de Partes, Secciones y Características",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué partes, secciones, componentes y características de calidad debe tener ese producto o servicio?»\nVariable: Arquitectura del producto.",
  "pasos": "Descomponen la estructura del entregable (ej. título, tesis, tres argumentos, citas, conclusión) para no omitir ningún elemento estructural."
 },
 {
  "id": "bi-EG-P03",
  "codigo": "EG-P03",
  "tipo": "estrategia",
  "nombre": "Identificación del Destinatario o Usuario Final",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿A quién va dirigido este producto o servicio y qué características tiene esa audiencia?»\nVariable: Contextualización de audiencia.",
  "pasos": "Ajustan el registro lingüístico, nivel técnico y formato según si el receptor es un niño, un jurado científico, un cliente o una comunidad."
 },
 {
  "id": "bi-EG-P04",
  "codigo": "EG-P04",
  "tipo": "estrategia",
  "nombre": "Conexiones Interdisciplinares Previas",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué conexiones debemos hacer con otras ciencias o áreas (matemática, comunicación, ciencias, historia) para resolver esto?»\nVariable: Transferencia interdisciplinar.",
  "pasos": "Identifican qué fórmulas, teorías o herramientas de otras asignaturas necesitan movilizar antes de empezar."
 },
 {
  "id": "bi-EG-P05",
  "codigo": "EG-P05",
  "tipo": "estrategia",
  "nombre": "Secuenciación de Pasos y Procedimientos",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Cuáles y cuántos serán los pasos exactos que vamos a seguir en orden (1.°, 2.°, 3.°...) hasta lograr el producto?»\nVariable: Algoritmo de trabajo.",
  "pasos": "Trazan su ruta operativa paso a paso, verificando que no falte ninguna etapa crítica del proceso."
 },
 {
  "id": "bi-EG-P06",
  "codigo": "EG-P06",
  "tipo": "estrategia",
  "nombre": "Búsqueda y Análisis de Modelos Ejemplares",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué modelos o ejemplos terminados existen que nos muestren de forma tangible el estándar de calidad esperado?»\nVariable: Referente tangible.",
  "pasos": "Analizan un modelo real (un artículo publicado, un informe excelente, una maqueta previa) para comprender el estándar antes de producir."
 },
 {
  "id": "bi-EG-P07",
  "codigo": "EG-P07",
  "tipo": "estrategia",
  "nombre": "Inventario de Conocimientos Previos y Vacíos",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué sabemos y qué dominamos ya para realizar esta demanda, y qué conocimientos nos falta investigar?»\nVariable: Contabilidad cognitiva.",
  "pasos": "Separan lo que ya dominan de aquello que requiere búsqueda bibliográfica o consulta al docente."
 },
 {
  "id": "bi-EG-P08",
  "codigo": "EG-P08",
  "tipo": "estrategia",
  "nombre": "Gestión Estratégica del Tiempo y Hitos",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿De cuánto tiempo total disponemos y cómo distribuiremos las horas o días para cada paso sin retrasos?»\nVariable: Cronograma operativo.",
  "pasos": "Asignan plazos realistas a la búsqueda, comprensión, borrador y revisión final."
 },
 {
  "id": "bi-EG-P09",
  "codigo": "EG-P09",
  "tipo": "estrategia",
  "nombre": "Previsión de Recursos, Materiales y Presupuesto",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué materiales, herramientas, fuentes o presupuesto necesitamos gestionar antes de iniciar?»\nVariable: Investigación operativa de insumos.",
  "pasos": "Listan insumos físicos o digitales y calculan costos para evitar interrupciones durante la ejecución."
 },
 {
  "id": "bi-EG-P10",
  "codigo": "EG-P10",
  "tipo": "estrategia",
  "nombre": "Conocimiento Anticipado de Criterios de Evaluación",
  "clasificacion": "Generales · Planificación (antes)",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Con qué instrumento y bajo qué criterios exactos van a evaluar nuestro producto o desempeño?»\nVariable: Transparencia evaluativa.",
  "pasos": "Revisan la rúbrica o lista de cotejo antes de empezar para alinear su producción con los indicadores máximos."
 },
 {
  "id": "bi-EG-E01",
  "codigo": "EG-E01",
  "tipo": "estrategia",
  "nombre": "Medición Continua del Avance",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Cómo estás midiendo tu avance en este momento y qué porcentaje de la meta planificada has completado?»\nVariable: Monitoreo de progreso.",
  "pasos": "El estudiante detiene brevemente su labor para cuantificar cuánto ha avanzado respecto a su cronograma inicial."
 },
 {
  "id": "bi-EG-E02",
  "codigo": "EG-E02",
  "tipo": "estrategia",
  "nombre": "Verificación de Alineamiento con el Plan",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Lo que estás haciendo ahora responde directamente al objetivo y partes planificadas o te estás desviando?»\nVariable: Fidelidad al objetivo.",
  "pasos": "Contrasta su borrador o ejecución actual con el esquema planificado para eliminar digresiones innecesarias."
 },
 {
  "id": "bi-EG-E03",
  "codigo": "EG-E03",
  "tipo": "estrategia",
  "nombre": "Detección Temprana de Errores en Proceso",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué error acabas de identificar en tu procedimiento o redacción en este instante?»\nVariable: Conciencia del error.",
  "pasos": "Audita su propio trabajo paso a paso mientras lo construye, localizando fallas técnicas o conceptuales antes de terminar."
 },
 {
  "id": "bi-EG-E04",
  "codigo": "EG-E04",
  "tipo": "estrategia",
  "nombre": "Aplicación de Ajustes y Correcciones Inmediatas",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué ajuste, modificación o corrección inmediata vas a aplicar para subsanar ese error?»\nVariable: Flexibilidad correctiva.",
  "pasos": "Modifica su estrategia, reescribe el párrafo o recalibra el procedimiento en el acto sin esperar la calificación final."
 },
 {
  "id": "bi-EG-E05",
  "codigo": "EG-E05",
  "tipo": "estrategia",
  "nombre": "Conciencia del Aprendizaje Operativo",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué estás haciendo o resolviendo ahora que antes de empezar esta actividad no podías hacer?»\nVariable: Metacognición de logro.",
  "pasos": "Toma conciencia explícita de las nuevas destrezas y operaciones cognitivas que está adquiriendo en la práctica."
 },
 {
  "id": "bi-EG-E06",
  "codigo": "EG-E06",
  "tipo": "estrategia",
  "nombre": "Evaluación de la Pertinencia de Técnicas Usadas",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿La técnica que estás usando te permite procesar bien la información o conviene cambiar a otra más eficaz?»\nVariable: Selección táctica de técnicas.",
  "pasos": "Si un resumen resulta insuficiente para comparar variables, cambia tácticamente a un cuadro comparativo o flujograma."
 },
 {
  "id": "bi-EG-E07",
  "codigo": "EG-E07",
  "tipo": "estrategia",
  "nombre": "Regulación de la Profundidad y Ritmo",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Estás comprendiendo y validando cada paso antes de avanzar al siguiente o estás ejecutando mecánicamente?»\nVariable: Control de calidad interna.",
  "pasos": "Frena la ejecución superficial y exige verificar el sustento teórico de cada afirmación o cálculo."
 },
 {
  "id": "bi-EG-E08",
  "codigo": "EG-E08",
  "tipo": "estrategia",
  "nombre": "Aprovechamiento del Aprendizaje Colaborativo",
  "clasificacion": "Generales · Ejecución (durante)",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué estás aprendiendo de los procedimientos de tus compañeros y qué aporte crítico puedes brindarles?»\nVariable: Co-regulación entre pares.",
  "pasos": "Contrastan avances en equipo durante la ejecución para enriquecer enfoques y detectar puntos ciegos."
 },
 {
  "id": "bi-EG-V01",
  "codigo": "EG-V01",
  "tipo": "estrategia",
  "nombre": "Contrastación Resultado vs. Objetivo Planificado",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «Compara tu resultado final con el objetivo inicial: ¿cumpliste la meta, la superaste o quedaste por debajo?»\nVariable: Juicio de logro.",
  "pasos": "Realiza una auditoría objetiva entre lo que planificó lograr al inicio y el producto real entregado al final."
 },
 {
  "id": "bi-EG-V02",
  "codigo": "EG-V02",
  "tipo": "estrategia",
  "nombre": "Identificación de Aciertos Metodológicos",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué decisiones, técnicas y pasos ejecutaste bien y fueron clave para lograr los aciertos de tu trabajo?»\nVariable: Consolidación de fortalezas.",
  "pasos": "Reconoce explícitamente por qué ciertas acciones funcionaron bien para replicarlas en futuras asignaciones."
 },
 {
  "id": "bi-EG-V03",
  "codigo": "EG-V03",
  "tipo": "estrategia",
  "nombre": "Diagnóstico Causal de Deficiencias y Errores",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué aspectos salieron deficientes y cuál fue la causa exacta que originó esos errores?»\nVariable: Análisis de causa raíz.",
  "pasos": "Evita excusas externas y determina si la falla provino de mala búsqueda, falta de comprensión o descuido en el tiempo."
 },
 {
  "id": "bi-EG-V04",
  "codigo": "EG-V04",
  "tipo": "estrategia",
  "nombre": "Formulación de Acciones de Mejora Específicas",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «Si volvieras a realizar este trabajo mañana, ¿qué modificarías exactamente para alcanzar la excelencia?»\nVariable: Plan de optimización.",
  "pasos": "Redacta compromisos concretos de mejora técnica o argumentativa sobre su propio producto."
 },
 {
  "id": "bi-EG-V05",
  "codigo": "EG-V05",
  "tipo": "estrategia",
  "nombre": "Evaluación de Eficiencia en Tiempo y Recursos",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué desperdicios de tiempo, esfuerzo o materiales podrías ahorrar en una próxima ejecución?»\nVariable: Optimización operativa.",
  "pasos": "Analiza la relación costo-beneficio de su proceso de trabajo para volverse más ágil y productivo."
 },
 {
  "id": "bi-EG-V06",
  "codigo": "EG-V06",
  "tipo": "estrategia",
  "nombre": "Autoaplicación del Instrumento de Evaluación",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «Evalúa tu producto utilizando la misma rúbrica o lista de cotejo del docente y justifica tu puntaje.»\nVariable: Autoevaluación criterial.",
  "pasos": "Asigna un nivel de desempeño a cada criterio respaldándolo con evidencias concretas de su propio trabajo."
 },
 {
  "id": "bi-EG-V07",
  "codigo": "EG-V07",
  "tipo": "estrategia",
  "nombre": "Formulación de Preguntas Post- Ejecución",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «Formula preguntas sobre las dudas o problemas complejos que surgieron después de concluir la tarea.»\nVariable: Profundización post-tarea.",
  "pasos": "Identifica interrogantes de nivel superior nacidas de la experiencia práctica para recibir orientación especializada."
 },
 {
  "id": "bi-EG-V08",
  "codigo": "EG-V08",
  "tipo": "estrategia",
  "nombre": "Verificación de Coherencia y Rigor Técnico",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «Revisa si cada conclusión o afirmación de tu producto está respaldada por evidencia verificable y sin contradicciones.»\nVariable: Validación interna.",
  "pasos": "Ejecuta una lectura crítica de cierre antes de la entrega definitiva para garantizar rigor científico."
 },
 {
  "id": "bi-EG-V09",
  "codigo": "EG-V09",
  "tipo": "estrategia",
  "nombre": "Balance de Evolución Cognitiva Personal",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿Qué sabes, qué piensas y qué eres capaz de resolver hoy que antes de esta experiencia no dominabas?»\nVariable: Conciencia de crecimiento.",
  "pasos": "Sintetiza el salto cualitativo entre su Zona de Desarrollo Real inicial y su nuevo nivel alcanzado."
 },
 {
  "id": "bi-EG-V10",
  "codigo": "EG-V10",
  "tipo": "estrategia",
  "nombre": "Transferencia Prospectiva (Long-Life Learning)",
  "clasificacion": "Generales · Evaluación metacognitiva (después)",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Pregunta orientadora: «¿En qué otras asignaturas, problemas reales o contextos profesionales aplicarás lo que acabas de aprender?»\nVariable: Transferibilidad vital.",
  "pasos": "Proyecta el uso futuro de las técnicas y criterios aprendidos hacia escenarios nuevos y complejos."
 },
 {
  "id": "bi-EE-I01",
  "codigo": "EE-I01",
  "tipo": "estrategia",
  "nombre": "Especificar de forma clara y breve el resultado o producto de la sesión",
  "clasificacion": "Específicas · Inicio de la sesión",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Especificar de forma clara y breve el resultado o producto de la sesión.",
  "pasos": "Comunica desde el inicio qué objeto, solución o desempeño tangible se logrará al terminar la clase («Al finalizar hoy tendremos diseñado...»), evitando ser un «profesor Netflix» que pregunta «¿En qué nos quedamos?»."
 },
 {
  "id": "bi-EE-I02",
  "codigo": "EE-I02",
  "tipo": "estrategia",
  "nombre": "Declarar las habilidades cognitivas y procedimientos que se emplearán",
  "clasificacion": "Específicas · Inicio de la sesión",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Declarar las habilidades cognitivas y procedimientos que se emplearán.",
  "pasos": "Explicita qué operaciones mentales y destrezas van a ejercitar (ej. «Hoy ejercitaremos el análisis causal y la contrastación de fuentes») y transmite altas expectativas de logro."
 },
 {
  "id": "bi-EE-I03",
  "codigo": "EE-I03",
  "tipo": "estrategia",
  "nombre": "Estructurar de manera general la temática mediante una técnica",
  "clasificacion": "Específicas · Inicio de la sesión",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Estructurar de manera general la temática mediante una técnica.",
  "pasos": "Presenta el panorama lógico de la sesión usando un esquema vertical, un flujograma o una lista de palabras clave / vocabulario de la unidad antes de entrar al detalle."
 },
 {
  "id": "bi-EE-I04",
  "codigo": "EE-I04",
  "tipo": "estrategia",
  "nombre": "Recuperar y activar conocimientos previos y errores mediante una técnica",
  "clasificacion": "Específicas · Inicio de la sesión",
  "momentos": [
   "exploracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Recuperar y activar conocimientos previos y errores mediante una técnica.",
  "pasos": "Realiza revisión diaria (tareas previas, errores frecuentes de la sesión anterior y repaso de vocabulario) aplicando una técnica breve: lluvia de ideas, pregunta de un minuto o un test cloze (párrafo incompleto donde falta cada 4.ª palabra)."
 },
 {
  "id": "bi-EE-D01",
  "codigo": "EE-D01",
  "tipo": "estrategia",
  "nombre": "Dividir y modularizar la sesión en etapas claras, pocas y diferenciadas",
  "clasificacion": "Específicas · Desarrollo de la sesión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Dividir y modularizar la sesión en etapas claras, pocas y diferenciadas.",
  "pasos": "Evita fragmentar la clase en exceso de momentos burocráticos; estructura pocos bloques lógicos y bien delimitados donde el estudiante sabe exactamente qué hacer en cada etapa."
 },
 {
  "id": "bi-EE-D02",
  "codigo": "EE-D02",
  "tipo": "estrategia",
  "nombre": "Proporcionar instrucciones (prompts) claras, continuas y precisas",
  "clasificacion": "Específicas · Desarrollo de la sesión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Proporcionar instrucciones (prompts) claras, continuas y precisas.",
  "pasos": "Formula cada consigna de trabajo como un prompt didáctico inequívoco (qué hacer, con qué técnica, en cuánto tiempo y con qué criterio), verificando que todos comprendieron la instrucción."
 },
 {
  "id": "bi-EE-D03",
  "codigo": "EE-D03",
  "tipo": "estrategia",
  "nombre": "Organizar y limitar el material presentando información en bloques pequeños",
  "clasificacion": "Específicas · Desarrollo de la sesión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Organizar y limitar el material presentando información en bloques pequeños.",
  "pasos": "Dosifica la teoría y las fuentes en cápsulas breves seguidas inmediatamente de práctica guiada (bloque → práctica → bloque → práctica), asegurando dominio de un punto antes de pasar al siguiente."
 },
 {
  "id": "bi-EE-D04",
  "codigo": "EE-D04",
  "tipo": "estrategia",
  "nombre": "Brindar explicaciones detalladas con énfasis en puntos difíciles y principales",
  "clasificacion": "Específicas · Desarrollo de la sesión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Brindar explicaciones detalladas con énfasis en puntos difíciles y principales.",
  "pasos": "Detiene el ritmo en los núcleos conceptuales de alta complejidad, ofreciendo analogías, ejemplos resueltos y modelamiento paso a paso en los puntos críticos."
 },
 {
  "id": "bi-EE-C01",
  "codigo": "EE-C01",
  "tipo": "estrategia",
  "nombre": "Formular preguntas intercaladas durante la exposición o actividad",
  "clasificacion": "Específicas · Control de la comprensión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Formular preguntas intercaladas durante la exposición o actividad.",
  "pasos": "Interrumpe la explicación cada pocos minutos para lanzar preguntas dirigidas a distintos estudiantes (no solo a los voluntarios) comprobando si asimilaron la idea fuerza."
 },
 {
  "id": "bi-EE-C02",
  "codigo": "EE-C02",
  "tipo": "estrategia",
  "nombre": "Solicitar a los estudiantes que verbalicen los pasos y criterios («pensar en voz alta»)",
  "clasificacion": "Específicas · Control de la comprensión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Solicitar a los estudiantes que verbalicen los pasos y criterios («pensar en voz alta»).",
  "pasos": "Pide a los estudiantes que expliquen oralmente qué pasos están ejecutando y qué fundamentos justifican sus decisiones en el ejercicio."
 },
 {
  "id": "bi-EE-C03",
  "codigo": "EE-C03",
  "tipo": "estrategia",
  "nombre": "Solicitar que formulen preguntas sobre sus propias dudas o vacíos",
  "clasificacion": "Específicas · Control de la comprensión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Solicitar que formulen preguntas sobre sus propias dudas o vacíos.",
  "pasos": "Abre pausas específicas para que los estudiantes redacten o expresen preguntas precisas sobre aquello que aún no logran comprender del procedimiento."
 },
 {
  "id": "bi-EE-C04",
  "codigo": "EE-C04",
  "tipo": "estrategia",
  "nombre": "Re-enseñar el material cuando se detectan lagunas de comprensión",
  "clasificacion": "Específicas · Control de la comprensión",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Re-enseñar el material cuando se detectan lagunas de comprensión.",
  "pasos": "Si el control revela que un porcentaje significativo no dominó el concepto clave, vuelve a explicar el punto desde otro ángulo antes de continuar con el temario."
 },
 {
  "id": "bi-EE-A01",
  "codigo": "EE-A01",
  "tipo": "estrategia",
  "nombre": "Solicitar la elaboración de organizadores de síntesis sobre lo aprendido",
  "clasificacion": "Específicas · Activación del aprendizaje",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Solicitar la elaboración de organizadores de síntesis sobre lo aprendido.",
  "pasos": "La estrategia se apodera de técnicas (resumen, síntesis, cuadro comparativo, flujograma) exigiendo que el estudiante procese y reconstruya activamente la información."
 },
 {
  "id": "bi-EE-A02",
  "codigo": "EE-A02",
  "tipo": "estrategia",
  "nombre": "Lograr que todos los estudiantes ejecuten la actividad y la comparen con un par",
  "clasificacion": "Específicas · Activación del aprendizaje",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Lograr que todos los estudiantes ejecuten la actividad y la comparen con un par.",
  "pasos": "Garantiza participación del 100% del aula y organiza contraste inmediato en parejas para detectar aciertos y diferencias entre sus soluciones."
 },
 {
  "id": "bi-EE-A03",
  "codigo": "EE-A03",
  "tipo": "estrategia",
  "nombre": "Incrementar el volumen de práctica guiada hasta lograr autonomía (sobreaprendizaje)",
  "clasificacion": "Específicas · Activación del aprendizaje",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Incrementar el volumen de práctica guiada hasta lograr autonomía (sobreaprendizaje).",
  "pasos": "Mantiene la ejercitación supervisada hasta el punto exacto en que el estudiante puede ejecutar la operación de manera independiente sin asistencia docente."
 },
 {
  "id": "bi-EE-A04",
  "codigo": "EE-A04",
  "tipo": "estrategia",
  "nombre": "Combinar teoría y práctica culminando en un borrador, boceto o prototipo",
  "clasificacion": "Específicas · Activación del aprendizaje",
  "momentos": [
   "practica",
   "transferencia"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Combinar teoría y práctica culminando en un borrador, boceto o prototipo.",
  "pasos": "Conecta inmediatamente leyes y principios con la elaboración de un producto preliminar, boceto técnico o propuesta de servicio aplicable."
 },
 {
  "id": "bi-EE-Ev01",
  "codigo": "EE-Ev01",
  "tipo": "estrategia",
  "nombre": "Solicitar preguntas pre-tarea y post-tarea como diagnóstico de comprensión",
  "clasificacion": "Específicas · Evaluación en sesión",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Solicitar preguntas pre-tarea y post-tarea como diagnóstico de comprensión.",
  "pasos": "Utiliza las preguntas formuladas por los estudiantes antes y después de la actividad como indicador preciso de su nivel de dominio conceptual."
 },
 {
  "id": "bi-EE-Ev02",
  "codigo": "EE-Ev02",
  "tipo": "estrategia",
  "nombre": "Aplicar autoevaluación y coevaluación guiadas por criterios públicos",
  "clasificacion": "Específicas · Evaluación en sesión",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Aplicar autoevaluación y coevaluación guiadas por criterios públicos.",
  "pasos": "Entrega listas de cotejo o rúbricas analíticas para que los estudiantes auditen sus propios productos y los de sus equipos antes de la calificación docente."
 },
 {
  "id": "bi-EE-Ev03",
  "codigo": "EE-Ev03",
  "tipo": "estrategia",
  "nombre": "Verificar productos parciales al término de cada etapa modular",
  "clasificacion": "Específicas · Evaluación en sesión",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Verificar productos parciales al término de cada etapa modular.",
  "pasos": "Evalúa hitos intermedios (ej. esquema, primer borrador, tabla de datos) evitando esperar hasta el final de la unidad para detectar fallas graves."
 },
 {
  "id": "bi-EE-Ev04",
  "codigo": "EE-Ev04",
  "tipo": "estrategia",
  "nombre": "Contrastar el desempeño con evidencias auténticas de transferencia",
  "clasificacion": "Específicas · Evaluación en sesión",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Contrastar el desempeño con evidencias auténticas de transferencia.",
  "pasos": "Evalúa el aprendizaje solicitando resolver una situación nueva o explicar su aplicación práctica en un contexto distinto al ejercitado."
 },
 {
  "id": "bi-EE-R01",
  "codigo": "EE-R01",
  "tipo": "estrategia",
  "nombre": "Brindar retroalimentación descriptiva, específica e inmediata centrada en la tarea",
  "clasificacion": "Específicas · Retroalimentación",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Brindar retroalimentación descriptiva, específica e inmediata centrada en la tarea.",
  "pasos": "Señala con precisión qué parte del producto cumple el estándar, dónde está el error específico y por qué ocurre, evitando elogios o críticas vagas a la persona."
 },
 {
  "id": "bi-EE-R02",
  "codigo": "EE-R02",
  "tipo": "estrategia",
  "nombre": "Ofrecer pistas y preguntas orientadoras antes que dar la respuesta resuelta",
  "clasificacion": "Específicas · Retroalimentación",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Ofrecer pistas y preguntas orientadoras antes que dar la respuesta resuelta.",
  "pasos": "Andamia el razonamiento del estudiante mediante preguntas guía para que él mismo descubra cómo corregir su procedimiento."
 },
 {
  "id": "bi-EE-R03",
  "codigo": "EE-R03",
  "tipo": "estrategia",
  "nombre": "Proporcionar tiempo inmediato para la re- práctica correctiva supervisada",
  "clasificacion": "Específicas · Retroalimentación",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Proporcionar tiempo inmediato para la re- práctica correctiva supervisada.",
  "pasos": "Tras recibir la retroalimentación, el estudiante aplica inmediatamente la corrección en su borrador o ejercicio bajo verificación del docente."
 },
 {
  "id": "bi-EE-R04",
  "codigo": "EE-R04",
  "tipo": "estrategia",
  "nombre": "Sistematizar los errores recurrentes del aula para retroalimentación colectiva",
  "clasificacion": "Específicas · Retroalimentación",
  "momentos": [
   "valoracion"
  ],
  "fuente": "Compendio Completo de las Estrategias de Enseñanza-Aprendizaje (Radar 360°)",
  "recursos": "",
  "areas": "",
  "descripcion": "Sistematizar los errores recurrentes del aula para retroalimentación colectiva.",
  "pasos": "Agrupa los 2 o 3 errores más frecuentes observados en los equipos y realiza una demostración modelada breve para todo el grupo."
 },
 {
  "id": "bi-TB-01",
  "codigo": "TB-01",
  "tipo": "tecnica",
  "nombre": "Formulación de Preguntas (Interrogación Didáctica)",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Detonar la curiosidad cognitiva y delimitar vacíos de conocimiento.",
  "pasos": "1. Observar un fenómeno, texto o imagen\n2. Identificar lo desconocido\n3. Redactar preguntas literales (qué, quién, cuándo), inferenciales (por qué, cómo se relaciona) y críticas (qué ocurriría si)\n4. Jerarquizar de la pregunta central a las subpreguntas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-02",
  "codigo": "TB-02",
  "tipo": "tecnica",
  "nombre": "Observación Sistemática",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Recoger datos empíricos directos de fenómenos, objetos o conductas.",
  "pasos": "1. Definir la unidad de observación\n2. Establecer indicadores objetivos en una ficha de registro\n3. Observar sin intervenir ni emitir juicios prematuros\n4. Anotar frecuencias o descripciones exactas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-03",
  "codigo": "TB-03",
  "tipo": "tecnica",
  "nombre": "Cuestionario de Encuesta (Survey)",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Recolectar información cuantificable de una muestra poblacional.",
  "pasos": "1. Definir las variables a medir\n2. Redactar preguntas cerradas, dicotómicas o de escala Likert sin ambigüedades\n3. Aplicar el instrumento de forma estandarizada\n4. Tabular frecuencias y porcentajes.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-04",
  "codigo": "TB-04",
  "tipo": "tecnica",
  "nombre": "Cuestionario de Entrevista",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Obtener información cualitativa profunda de informantes clave o expertos.",
  "pasos": "1. Seleccionar al informante según su experiencia\n2. Diseñar una guía de preguntas abiertas (estructurada o semiestructurada)\n3. Conducir la entrevista registrando respuestas literales\n4. Categorizar los testimonios.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-05",
  "codigo": "TB-05",
  "tipo": "tecnica",
  "nombre": "Búsqueda Bibliográfica",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Localizar libros, tratados y manuales teóricos rigurosos.",
  "pasos": "1. Definir descriptores temáticos\n2. Consultar catálogos de bibliotecas físicas o digitales\n3. Revisar índice, prólogo y bibliografía de cada obra\n4. Seleccionar fuentes primarias vigentes.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-06",
  "codigo": "TB-06",
  "tipo": "tecnica",
  "nombre": "Búsqueda Hemerográfica",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Rastrear publicaciones periódicas (revistas científicas, boletines, prensa).",
  "pasos": "1. Identificar revistas indexadas o diarios de referencia\n2. Filtrar por fecha de publicación y sección\n3. Extraer artículos arbitrados o noticias verificadas\n4. Registrar datos hemerográficos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-07",
  "codigo": "TB-07",
  "tipo": "tecnica",
  "nombre": "Búsqueda Electrónica y en Bases de Datos",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Recuperar información científica en repositorios digitales y motores especializados.",
  "pasos": "1. Formular ecuaciones de búsqueda usando palabras clave y operadores booleanos (AND, OR, NOT)\n2. Filtrar en repositorios académicos (SciELO, Scopus, Redalyc, Google Académico)\n3. Verificar autoría, institución y rigor metodológico.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-08",
  "codigo": "TB-08",
  "tipo": "tecnica",
  "nombre": "Búsqueda Asistida por Inteligencia Artificial",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Acelerar el rastreo y contraste de información mediante prompts precisos.",
  "pasos": "1. Redactar un prompt delimitando rol, contexto, tema y formato\n2. Exigir fuentes verificables y citas\n3. Auditar y contrastar obligatoriamente cada dato arrojado contra fuentes primarias.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-09",
  "codigo": "TB-09",
  "tipo": "tecnica",
  "nombre": "Fichaje (Bibliográfico, Textual, Resumen y Comentario)",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Almacenar y clasificar ordenadamente los hallazgos de búsqueda.",
  "pasos": "1. Consignar la referencia completa (autor, año, título, editorial)\n2. Transcribir citas literales entrecomilladas con número de página o redactar el resumen/comentario\n3. Asignar una palabra clave clasificadora.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TB-10",
  "codigo": "TB-10",
  "tipo": "tecnica",
  "nombre": "Curaduría de Contenidos Digitales",
  "clasificacion": "Tipo 1 · Búsqueda de la información",
  "momentos": [
   "exploracion"
  ],
  "descripcion": "Finalidad: Filtrar, validar y agrupar recursos multimedia relevantes.",
  "pasos": "1. Rastrear enlaces, videos, infografías y documentos\n2. Evaluar validez científica y actualidad\n3. Descartar ruido informativo\n4. Organizar los recursos validados en carpetas o tableros temáticos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-01",
  "codigo": "TC-01",
  "tipo": "tecnica",
  "nombre": "Lectura Comprensiva (Microsecuencia Obligatoria)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Decodificar y asimilar el significado global y específico de un texto.",
  "pasos": "1. Análisis e interpretación del título\n2. Predicción lectora (formular hipótesis sobre el contenido)\n3. Lectura exploratoria (skimming)\n4. Lectura analítica párrafo por párrafo\n5. Identificación y glosario de términos desconocidos\n6. Subrayado\n7. Resumen\n8. Síntesis.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-02",
  "codigo": "TC-02",
  "tipo": "tecnica",
  "nombre": "Subrayado (Lineal, Estructural y de Realce)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Discriminar las ideas principales y palabras clave de las ideas secundarias.",
  "pasos": "1. Leer el párrafo completo sin marcar\n2. Destacar únicamente sustantivos, verbos y núcleos conceptuales esenciales (máximo 20–25% del texto)\n3. Usar doble línea para idea principal y línea simple para secundarias\n4. Leer solo lo subrayado comprobando coherencia.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-03",
  "codigo": "TC-03",
  "tipo": "tecnica",
  "nombre": "Sumillado (Anotaciones Marginales)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Sintetizar en el margen del texto la idea nuclear de cada párrafo.",
  "pasos": "1. Numerar los párrafos\n2. Extraer la idea subrayada de cada párrafo\n3. Redactar al margen izquierdo una oración breve y autónoma que condense el sentido del párrafo sin alterar la intención del autor.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-04",
  "codigo": "TC-04",
  "tipo": "tecnica",
  "nombre": "Resumen",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Reducir la extensión de un texto conservando fielmente las ideas y el orden del autor.",
  "pasos": "1. Integrar las ideas subrayadas y sumilladas\n2. Redactar un texto continuo en tercera persona eliminando ejemplos, repeticiones y adornos\n3. Mantener una extensión de entre el 20% y 30% del original sin emitir opiniones personales.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-05",
  "codigo": "TC-05",
  "tipo": "tecnica",
  "nombre": "Síntesis",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Reconstruir el contenido comprendido con el propio vocabulario y estructura lógica.",
  "pasos": "1. Analizar una o varias fuentes\n2. Reorganizar los conceptos según el criterio lógico del estudiante\n3. Redactar con palabras propias integrando las conclusiones esenciales extraídas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-06",
  "codigo": "TC-06",
  "tipo": "tecnica",
  "nombre": "Paráfrasis (Constructiva y Mecánica)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Traducir proposiciones complejas a un lenguaje propio manteniendo intacto el sentido.",
  "pasos": "1. Leer la proposición original e identificar su significado exacto\n2. Sustituir términos por sinónimos contextuales y reestructurar la sintaxis\n3. Verificar que no se distorsione la tesis del autor.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-07",
  "codigo": "TC-07",
  "tipo": "tecnica",
  "nombre": "Toma de Apuntes (Método Cornell)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Registrar, procesar y repasar información proveniente de exposiciones o lecturas.",
  "pasos": "1. Dividir la página en columna izquierda (palabras clave/preguntas), columna derecha (notas principales) y pie de página (resumen)\n2. Anotar ideas clave durante la clase\n3. Formular preguntas de control a la izquierda\n4. Redactar el resumen inferior.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-08",
  "codigo": "TC-08",
  "tipo": "tecnica",
  "nombre": "Estructuración Semántica",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Comprender el texto analizando las relaciones gramaticales, lógicas y jerárquicas del lenguaje.",
  "pasos": "1. Identificar conectores lógicos (causa, contraste, consecuencia, condición)\n2. Descomponer las proposiciones en sujeto, núcleo predicativo y complementos\n3. Trazar la red de dependencias semánticas del discurso.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-09",
  "codigo": "TC-09",
  "tipo": "tecnica",
  "nombre": "Mapa Conceptual (Joseph Novak)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Evaluar y consolidar la comprensión exclusivamente de teorías científicas (nunca relatos literarios ni hechos históricos aislados).",
  "pasos": "1. Identificar los conceptos clave de la teoría\n2. Ordenar jerárquicamente del concepto más inclusivo (cúspide) a los específicos\n3. Encerrar conceptos en elipses\n4. Unir con líneas y palabras de enlace (verbos/preposiciones) formando proposiciones verdaderas\n5. Trazar enlaces cruzados.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-10",
  "codigo": "TC-10",
  "tipo": "tecnica",
  "nombre": "Cuadro Comparativo (Matriz de Doble Entrada)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Comprender mediante el contraste sistemático de semejanzas y diferencias.",
  "pasos": "1. Ubicar los objetos, teorías o fenómenos a comparar en el eje horizontal\n2. Definir los criterios o variables de comparación en el eje vertical\n3. Llenar cada intersección con datos verificados\n4. Formular una conclusión comparativa.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-11",
  "codigo": "TC-11",
  "tipo": "tecnica",
  "nombre": "Árbol de Problemas (Diagrama Causa-Efecto)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Comprender la estructura causal de una situación problemática.",
  "pasos": "1. Formular el problema central en el tronco\n2. Identificar las causas directas e indirectas ubicándolas en las raíces\n3. Determinar los efectos o consecuencias ubicándolos en las ramas superiores.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-12",
  "codigo": "TC-12",
  "tipo": "tecnica",
  "nombre": "Test Cloze (Textos Mutilados)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Evaluar y ejercitar la comprensión lectora inferencial y contextual.",
  "pasos": "1. Seleccionar un texto coherente de 200–300 palabras\n2. Dejar intactas la primera y última oración\n3. Suprimir sistemáticamente cada n-ésima palabra (ej. cada 5.ª o 7.ª palabra)\n4. El estudiante restituye los términos exactos o semánticamente equivalentes según el contexto.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-13",
  "codigo": "TC-13",
  "tipo": "tecnica",
  "nombre": "Test Gobet (Reconstrucción Estructural)",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Evaluar la comprensión profunda de la arquitectura lógica de un texto.",
  "pasos": "1. Fragmentar un texto expositivo o científico en párrafos o bloques desordenados\n2. Analizar los marcadores discursivos y la progresión temática\n3. Reordenar la secuencia exacta original justificando la cohesión.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TC-14",
  "codigo": "TC-14",
  "tipo": "tecnica",
  "nombre": "Glosario Técnico Contextual",
  "clasificacion": "Tipo 2 · Comprensión de la información",
  "momentos": [
   "estructuracion"
  ],
  "descripcion": "Finalidad: Dominar el vocabulario especializado de una disciplina científica.",
  "pasos": "1. Extraer los términos técnicos desconocidos durante la lectura\n2. Deducir su significado por el contexto\n3. Contrastar con diccionarios especializados\n4. Redactar una definición operativa y un ejemplo de uso.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-01",
  "codigo": "TR-01",
  "tipo": "tecnica",
  "nombre": "Esquema Vertical (Esquema Índice)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar jerárquicamente la estructura temática de un contenido de arriba hacia abajo.",
  "pasos": "1. Escribir el título general en la parte superior\n2. Asignar numeración decimal o romana (1., 1.1., 1.1.1.) según nivel de subordinación\n3. Aplicar sangrías progresivas hacia la derecha para evidenciar jerarquía.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-02",
  "codigo": "TR-02",
  "tipo": "tecnica",
  "nombre": "Esquema Horizontal (Cuadro Sinóptico / Llaves)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Desglosar clasificaciones y subcategorías de izquierda a derecha.",
  "pasos": "1. Colocar el concepto general en el extremo izquierdo\n2. Abrir una llave principal que abarque las ideas principales\n3. Desprender llaves secundarias y terciarias hacia la derecha hasta llegar a los detalles o ejemplos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-03",
  "codigo": "TR-03",
  "tipo": "tecnica",
  "nombre": "Diagrama (Elíptico, Radial, en Espiral, Circular)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar visualmente relaciones flexibles entre componentes que no siguen un esquema lineal rígido.",
  "pasos": "1. Seleccionar la geometría adecuada (radial, concéntrica, en espiral)\n2. Ubicar los nodos informativos\n3. Conectar mediante vectores o arcos que expresen dirección, ciclo o interdependencia.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-04",
  "codigo": "TR-04",
  "tipo": "tecnica",
  "nombre": "Mapa Mental (Tony Buzan)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar asociaciones irradiantes combinando palabras clave, color e imágenes.",
  "pasos": "1. Ubicar una imagen central multicolor en hoja horizontal\n2. Trazar ramas orgánicas gruesas para ideas ordenadoras básicas en sentido horario\n3. Escribir una sola palabra clave por rama\n4. Añadir subramas e iconos visuales.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-05",
  "codigo": "TR-05",
  "tipo": "tecnica",
  "nombre": "Organigrama",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar estrictamente estructuras de autoridad, jerarquía institucional o pirámides sociales (nunca procesos).",
  "pasos": "1. Ubicar el órgano o estrato de máxima jerarquía en el nivel superior\n2. Descender por niveles de mando conectando con líneas verticales de autoridad y horizontales de coordinación\n3. Diferenciar unidades de línea y de asesoría.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-06",
  "codigo": "TR-06",
  "tipo": "tecnica",
  "nombre": "Flujograma (Diagrama de Flujo)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar exclusivamente la secuencia algorítmica paso a paso de un proceso o procedimiento.",
  "pasos": "1. Marcar el inicio y fin con óvalos\n2. Representar cada operación o actividad con rectángulos\n3. Representar puntos de decisión condicional (Sí/No) con rombos\n4. Unir con flechas direccionales sin cruces ambiguos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-07",
  "codigo": "TR-07",
  "tipo": "tecnica",
  "nombre": "Diagrama de Ishikawa (Espina de Pescado)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar gráficamente las causas múltiples de un efecto o falla de calidad.",
  "pasos": "1. Dibujar una flecha horizontal central apuntando al efecto/problema a la derecha\n2. Trazar espinas diagonales mayores para categorías causales (ej. método, material, entorno, personas)\n3. Añadir espinas menores para causas raíz.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-08",
  "codigo": "TR-08",
  "tipo": "tecnica",
  "nombre": "Diagrama de Venn",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar gráficamente conjuntos, atributos exclusivos e intersecciones comunes.",
  "pasos": "1. Trazar dos o más círculos superpuestos\n2. Escribir en las áreas exteriores las características exclusivas de cada conjunto\n3. Registrar en la zona central de intersección los atributos compartidos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-09",
  "codigo": "TR-09",
  "tipo": "tecnica",
  "nombre": "Línea de Tiempo",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar visualmente la duración, secuencia y distancia proporcional de eventos históricos o evolutivos.",
  "pasos": "1. Trazar un eje recto con escala cronológica exacta y proporcional\n2. Marcar los hitos con fechas precisas\n3. Incorporar etiquetas breves e iconos ilustrativos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-10",
  "codigo": "TR-10",
  "tipo": "tecnica",
  "nombre": "Cronología Simple",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Ordenar secuencialmente acontecimientos de un único sujeto, país o fenómeno.",
  "pasos": "1. Construir una tabla de dos columnas (Fecha / Acontecimiento)\n2. Ordenar rigorosamente del evento más antiguo al más reciente\n3. Describir objetivamente cada suceso.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-11",
  "codigo": "TR-11",
  "tipo": "tecnica",
  "nombre": "Cronología Comparada",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar la simultaneidad de hechos ocurridos en distintos espacios geográficos o disciplinas.",
  "pasos": "1. Colocar los años o periodos en la primera columna\n2. Asignar columnas paralelas para cada región o campo (ej. América, Europa, Asia)\n3. Registrar qué ocurría simultáneamente en cada fila temporal.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-12",
  "codigo": "TR-12",
  "tipo": "tecnica",
  "nombre": "Gráficos Estadísticos (Histograma, Barras, Líneas, Círculos Proporcionales)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar visualmente datos numéricos, frecuencias, tendencias y proporciones.",
  "pasos": "1. Tabular los datos\n2. Elegir el gráfico según la variable (barras para categorías, histograma para intervalos continuos, líneas para series temporales, círculos proporcionales para porcentajes de un todo)\n3. Rotular ejes, unidades y título.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-13",
  "codigo": "TR-13",
  "tipo": "tecnica",
  "nombre": "Mapa Geográfico, Cartográfico y Plano",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar la distribución espacial, territorial o arquitectónica de fenómenos.",
  "pasos": "1. Definir la escala y orientación cardinal\n2. Delimitar contornos espaciales\n3. Aplicar simbología, convenciones de color y leyenda explicativa.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-14",
  "codigo": "TR-14",
  "tipo": "tecnica",
  "nombre": "Maqueta y Prototipo Tridimensional (CAD / Físico)",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Representar a escala en tres dimensiones objetos, ecosistemas o sistemas tecnológicos.",
  "pasos": "1. Elaborar planos o vistas ortogonales\n2. Definir escala de reducción o ampliación\n3. Construir la estructura física o digital (CAD) respetando proporciones y funcionamiento interno.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TR-15",
  "codigo": "TR-15",
  "tipo": "tecnica",
  "nombre": "Cuadro de Resumen y Tabla de Datos",
  "clasificacion": "Tipo 3 · Representación de la información",
  "momentos": [
   "estructuracion",
   "practica"
  ],
  "descripcion": "Finalidad: Condensar información dispersa en filas y columnas estructuradas.",
  "pasos": "1. Identificar las variables clave\n2. Diseñar encabezados claros\n3. Vaciar los datos sintetizados de manera uniforme en cada celda.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-01",
  "codigo": "TCm-01",
  "tipo": "tecnica",
  "nombre": "Conversación Estructurada",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Intercambiar impresiones y saberes iniciales en torno a un tema de interés común.",
  "pasos": "1. Establecer el tópico guía\n2. Escuchar activamente respetando turnos de palabra\n3. Formular aportes pertinentes conectando con lo dicho por el interlocutor.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-02",
  "codigo": "TCm-02",
  "tipo": "tecnica",
  "nombre": "Diálogo Académico",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Profundizar colaborativamente entre dos o más interlocutores para construir significado.",
  "pasos": "1. Plantear una cuestión o tesis abierta\n2. Exponer puntos de vista fundamentados\n3. Interpelar con preguntas aclaratorias\n4. Arribar a acuerdos o síntesis compartidas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-03",
  "codigo": "TCm-03",
  "tipo": "tecnica",
  "nombre": "Discusión Guiada",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Analizar críticamente un problema, caso o texto confrontando diversas perspectivas sin antagonismo.",
  "pasos": "1. Presentar el objeto de análisis\n2. El moderador formula preguntas abiertas\n3. Los participantes aportan evidencias y contraargumentos\n4. Se sistematizan las conclusiones grupales.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-04",
  "codigo": "TCm-04",
  "tipo": "tecnica",
  "nombre": "Debate Formal",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Defender y refutar posturas opuestas sobre una tesis controvertida mediante argumentación rigurosa.",
  "pasos": "1. Formular una moción o tesis polémica\n2. Asignar postura afirmativa y negativa\n3. Ejecutar rondas cronometradas: exposición de tesis, refutación con evidencia, contrarréplica y conclusión\n4. Evaluación por jurado o rúbrica.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-05",
  "codigo": "TCm-05",
  "tipo": "tecnica",
  "nombre": "Panel",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Abordar un tema complejo desde distintos enfoques especializados ante un auditorio.",
  "pasos": "1. Seleccionar de 3 a 5 panelistas con roles o perspectivas distintas\n2. El moderador presenta el tema y formula preguntas secuenciales\n3. Los panelistas dialogan entre sí\n4. Se abre ronda de preguntas del público.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-06",
  "codigo": "TCm-06",
  "tipo": "tecnica",
  "nombre": "Foro",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Promover la participación abierta de todo un auditorio tras una actividad previa (película, experimento, conferencia).",
  "pasos": "1. Presentar el estímulo o ponencia inicial\n2. El moderador abre el uso de la palabra con reglas de tiempo\n3. Registrar opiniones y preguntas del público\n4. Sintetizar tendencias.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-07",
  "codigo": "TCm-07",
  "tipo": "tecnica",
  "nombre": "Seminario Investigativo",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Estudiar exhaustivamente un tema científico mediante la investigación previa de todos los integrantes.",
  "pasos": "1. Asignar subtemas de investigación previa\n2. Elaborar ponencias o fichas\n3. Exponer hallazgos en sesión grupal\n4. Someter las tesis a crítica colectiva y redactar acta de conclusiones.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-08",
  "codigo": "TCm-08",
  "tipo": "tecnica",
  "nombre": "Exposición Académica (Ponencia)",
  "clasificacion": "Tipo 4A · Comunicación oral",
  "momentos": [
   "practica",
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Presentar de forma clara, lógica y persuasiva información estructurada ante un auditorio.",
  "pasos": "1. Apertura (captar atención, declarar propósito y mostrar esquema)\n2. Desarrollo secuencial apoyado en organizadores visuales (nunca leer diapositivas)\n3. Cierre (síntesis de ideas fuerza y conclusión)\n4. Ronda de preguntas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-09",
  "codigo": "TCm-09",
  "tipo": "tecnica",
  "nombre": "Volante Informativo (Flyer)",
  "clasificacion": "Tipo 4B · Comunicación impresa y visual",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Comunicar un mensaje puntual, alerta o convocatoria de impacto inmediato.",
  "pasos": "1. Redactar un titular breve y persuasivo\n2. Incorporar una imagen central y 3–4 puntos clave\n3. Incluir llamado a la acción y datos de referencia en una sola cara.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-10",
  "codigo": "TCm-10",
  "tipo": "tecnica",
  "nombre": "Díptico y Tríptico",
  "clasificacion": "Tipo 4B · Comunicación impresa y visual",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Divulgar información organizada en 4 o 6 paneles plegables.",
  "pasos": "1. Diseñar portada con título e imagen atractiva\n2. Distribuir el contenido lógico en los paneles interiores con subtítulos y gráficos\n3. Reservar la contraportada para síntesis, autores y referencias bibliográficas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-11",
  "codigo": "TCm-11",
  "tipo": "tecnica",
  "nombre": "Afiche Científico (Póster) y Publicitario",
  "clasificacion": "Tipo 4B · Comunicación impresa y visual",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Sintetizar visualmente los resultados de una investigación (estándar en ferias STEAM y congresos) o campaña.",
  "pasos": "1. Encabezado con título, autores e institución\n2. Columnas estructuradas con Introducción, Metodología, Resultados (tablas/gráficos) y Conclusiones\n3. Tipografía legible a distancia y jerarquía visual equilibrada.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-12",
  "codigo": "TCm-12",
  "tipo": "tecnica",
  "nombre": "Infografía",
  "clasificacion": "Tipo 4B · Comunicación impresa y visual",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Explicar procesos o datos complejos integrando texto breve, iconos, gráficos y narrativa visual.",
  "pasos": "1. Definir el hilo conductor\n2. Sintetizar datos duros en bloques visuales\n3. Diseñar recorrido visual claro con paleta de colores coherente y fuentes al pie.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-13",
  "codigo": "TCm-13",
  "tipo": "tecnica",
  "nombre": "Periódico Mural y Cómic Educativo",
  "clasificacion": "Tipo 4B · Comunicación impresa y visual",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Socializar noticias, creaciones o narrativas secuenciales en espacios colectivos.",
  "pasos": "En el periódico mural: organizar secciones (editorial, noticias, ciencia, cultura) con diagramación limpia. En el cómic: redactar guion narrativo, dividir en viñetas e integrar globos de diálogo e ilustraciones.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-14",
  "codigo": "TCm-14",
  "tipo": "tecnica",
  "nombre": "Ensayo Argumentativo",
  "clasificacion": "Tipo 4C · Comunicación de producción escrita",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Defender una postura o tesis personal fundamentada mediante argumentos lógicos y evidencia.",
  "pasos": "1. Introducción con contextualización y tesis explícita\n2. Desarrollo de párrafos argumentativos con citas de autoridad y refutación de contraargumentos\n3. Conclusión que reafirma la tesis y proyecta implicaciones.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-15",
  "codigo": "TCm-15",
  "tipo": "tecnica",
  "nombre": "Informe Técnico / Científico",
  "clasificacion": "Tipo 4C · Comunicación de producción escrita",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Comunicar objetivamente los procedimientos, datos y resultados de una práctica, experimento o proyecto.",
  "pasos": "1. Portada e índice\n2. Introducción y objetivos\n3. Metodología y materiales empleados\n4. Presentación de resultados y análisis\n5. Conclusiones y recomendaciones.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-16",
  "codigo": "TCm-16",
  "tipo": "tecnica",
  "nombre": "Monografía",
  "clasificacion": "Tipo 4C · Comunicación de producción escrita",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Desarrollar un estudio documental exhaustivo y sistemático sobre un tema específico.",
  "pasos": "1. Delimitación del tema y plan de redacción\n2. Revisión bibliográfica profunda\n3. Redacción por capítulos lógicamente articulados con aparato crítico (citas y notas)\n4. Conclusiones y bibliografía.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-17",
  "codigo": "TCm-17",
  "tipo": "tecnica",
  "nombre": "Artículo Científico (Paper) y Tesis",
  "clasificacion": "Tipo 4C · Comunicación de producción escrita",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Comunicar a la comunidad académica los hallazgos originales de una investigación científica.",
  "pasos": "Seguir el estándar internacional IMRyD: Título, Resumen (Abstract) y Palabras clave; Introducción (problema, antecedentes y objetivo); Metodología (diseño, muestra, instrumentos); Resultados (datos sin interpretación); Discusión (contraste teórico y conclusiones) y Referencias.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-18",
  "codigo": "TCm-18",
  "tipo": "tecnica",
  "nombre": "Revista Electrónica y Diario Digital",
  "clasificacion": "Tipo 4D · Comunicación digital y transmedia",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Editar y publicar periódicamente artículos, reportajes y análisis en formato digital hipertextual.",
  "pasos": "1. Conformar comité editorial y definir secciones\n2. Redactar y revisar artículos\n3. Maquetar en plataforma digital integrando hipervínculos y multimedia\n4. Publicar y difundir.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-19",
  "codigo": "TCm-19",
  "tipo": "tecnica",
  "nombre": "Página Web y Blog Académico",
  "clasificacion": "Tipo 4D · Comunicación digital y transmedia",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Construir un repositorio estructurado de conocimiento accesible en red.",
  "pasos": "1. Diseñar arquitectura de navegación (menús y categorías)\n2. Producir entradas o páginas con texto optimizado, imágenes y enlaces a fuentes\n3. Actualizar y moderar comentarios académicos.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-20",
  "codigo": "TCm-20",
  "tipo": "tecnica",
  "nombre": "Podcast y Narrativa Digital (Storytelling)",
  "clasificacion": "Tipo 4D · Comunicación digital y transmedia",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Comunicar contenidos educativos mediante guiones sonoros o audiovisuales narrativos.",
  "pasos": "1. Redactar escaleta o guion técnico-literario\n2. Grabar locución cuidando dicción, ritmo y recursos sonoros\n3. Editar audio/video y publicar en plataformas educativas.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-TCm-21",
  "codigo": "TCm-21",
  "tipo": "tecnica",
  "nombre": "Redes Sociales Educativas y Streaming (Transmisión en Vivo)",
  "clasificacion": "Tipo 4D · Comunicación digital y transmedia",
  "momentos": [
   "transferencia",
   "valoracion"
  ],
  "descripcion": "Finalidad: Divulgar cápsulas de conocimiento, hilos analíticos y clases o sustentaciones sincrónicas en tiempo real.",
  "pasos": "1. Adaptar el contenido al formato específico (hilo argumentativo, microvideo educativo o guion de transmisión en vivo)\n2. Ejecutar la emisión o publicación con apoyo visual\n3. Gestionar la interacción y preguntas de la audiencia en tiempo real.",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo y Taxonomía Científica de las Técnicas de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M01",
  "codigo": "M-01",
  "tipo": "metodologia",
  "nombre": "Método Expositivo",
  "clasificacion": "Potencia Nivel 1 (Baja)",
  "momentos": [],
  "descripcion": "Finalidad: Transmitir fundamentos, hechos, leyes y teoría estructurada.\nFases: 4 fases\nDuración y evaluación: 15–25 min intercalados. Prueba objetiva / control oral.",
  "pasos": "Fase 1: Encuadre y Propósito — El docente declara el resultado esperado de la exposición, presenta el esquema general de contenidos y activa saberes base. (Técnicas: Esquema vertical (índice), Lista de palabras clave, Formulación de preguntas)\nFase 2: Presentación Estructurada — Expone conceptos, leyes, principios y datos en bloques breves (máx. 10 min por bloque) apoyado en organizadores gráficos, nunca leyendo diapositivas. (Técnicas: Exposición académica, Mapa conceptual, Cuadro sinóptico, Flujograma)\nFase 3: Verificación Intercalada — Detiene la exposición para formular preguntas de control y asegurar que los estudiantes procesan y anotan lo explicado antes de avanzar. (Técnicas: Toma de apuntes (Cornell), Interrogación didáctica, Paráfrasis oral)\nFase 4: Síntesis e Integración — Consolida las ideas fuerza de toda la exposición y enlaza inmediatamente con una actividad práctica (problema, caso o ejercicio). (Técnicas: Resumen, Síntesis, Cuadro de resumen)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M02",
  "codigo": "M-02",
  "tipo": "metodologia",
  "nombre": "Método Globalizado",
  "clasificacion": "Potencia Nivel 2 (Baja- Media)",
  "momentos": [],
  "descripcion": "Finalidad: Integrar múltiples áreas en torno a un tópico o centro de interés.\nFases: 4 fases\nDuración y evaluación: 1 a 2 semanas. Lista de cotejo y producciones integradas.",
  "pasos": "Fase 1: Selección del Tópico o Centro de Interés — Se elige un fenómeno vital cercano al contexto del estudiante (ej. alimentación, transporte, agua) y se delimitan las interrogantes centrales. (Técnicas: Conversación estructurada, Formulación de preguntas, Lluvia de ideas)\nFase 2: Observación y Exploración Directa — Los estudiantes interactúan sensorialmente con el fenómeno, recolectando datos reales del entorno inmediato. (Técnicas: Observación sistemática, Cuestionario de entrevista, Fichaje básico)\nFase 3: Asociación Interdisciplinar — Se aborda el mismo tópico desde todas las áreas simultáneamente: cálculo matemático, lectura científica, historia geográfica y expresión artística. (Técnicas: Lectura comprensiva, Subrayado, Cuadro comparativo, Línea de tiempo, Gráficos de barras)\nFase 4: Expresión Concreta y Socialización — Los estudiantes integran lo aprendido en producciones tangibles y las comunican a sus pares o familias. (Técnicas: Periódico mural, Díptico/Tríptico, Maqueta, Exposición)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M03",
  "codigo": "M-03",
  "tipo": "metodologia",
  "nombre": "Método por Modelamiento",
  "clasificacion": "Potencia Nivel 3 (Media)",
  "momentos": [],
  "descripcion": "Finalidad: Demostrar paso a paso la ejecución experta para su dominio guiado.\nFases: 4 fases\nDuración y evaluación: 1 a 3 sesiones. Lista de cotejo procedimental.",
  "pasos": "Fase 1: Presentación del Modelo y Criterios — El docente muestra el producto terminado o la ejecución experta y explica los criterios exactos de calidad que debe cumplir. (Técnicas: Exposición, Flujograma del procedimiento, Lista de palabras clave)\nFase 2: Demostración Verbalizada («Pensar en Voz Alta») — El docente ejecuta la tarea paso a paso de manera lenta, verbalizando en voz alta cada decisión cognitiva y por qué evita ciertos errores. (Técnicas: Toma de apuntes, Flujograma, Observación sistemática)\nFase 3: Práctica Guiada con Retroalimentación — Los estudiantes replican el procedimiento paso a paso bajo supervisión directa; el docente corrige errores en el instante en que ocurren. (Técnicas: Diálogo académico, Paráfrasis procedimental, Borradores/bocetos)\nFase 4: Práctica Independiente y Transferencia — Los estudiantes ejecutan la habilidad de forma autónoma frente a nuevos ejercicios hasta lograr fluidez y automatización. (Técnicas: Informe técnico, Producción escrita o ejecución autónoma evaluada con lista de cotejo)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M04",
  "codigo": "M-04",
  "tipo": "metodologia",
  "nombre": "Método por Descubrimiento",
  "clasificacion": "Potencia Nivel 4 (Media-Alta)",
  "momentos": [],
  "descripcion": "Finalidad: Inducir reglas y principios manipulando materiales/entornos preparados.\nFases: 4 fases\nDuración y evaluación: 1 a 2 semanas. Guía de observación y escala de valoración.",
  "pasos": "Fase 1: Preparación del Entorno y Estímulo — El docente diseña un ambiente controlado con materiales, objetos, simuladores o datos estructurados y plantea un reto exploratorio sin dar la regla teórica. (Técnicas: Formulación de preguntas exploratorias, Observación)\nFase 2: Manipulación y Experimentación Libre — Los estudiantes interactúan directamente con los materiales o dispositivos, prueban combinaciones y registran lo que sucede. (Técnicas: Observación sistemática, Toma de apuntes, Tabla de datos)\nFase 3: Detección de Patrones y Conjeturas — Analizan sus registros buscando regularidades, relaciones causa-efecto y formulan hipótesis inductivas propias. (Técnicas: Cuadro comparativo, Diagrama de Venn, Discusión guiada)\nFase 4: Formalización Conceptual — El docente guía la puesta en común para nombrar científicamente el principio descubierto y consolidarlo en la estructura cognitiva. (Técnicas: Mapa conceptual, Síntesis, Exposición de hallazgos)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M05",
  "codigo": "M-05",
  "tipo": "metodologia",
  "nombre": "Aprendizaje Basado en Problemas (ABP)",
  "clasificacion": "Potencia Nivel 5 (Alta)",
  "momentos": [],
  "descripcion": "Finalidad: Resolver problemas (párrafo + 1 pregunta) aplicando teoría.\nFases: 7 etapas\nDuración y evaluación: 1 semana (mín. 4 h). Rúbrica analítica en 7 etapas.",
  "pasos": "Etapa 1: Lectura y Clarificación de Términos — Leen el párrafo del problema, identifican vocablos técnicos desconocidos y los definen con precisión para asegurar comprensión unívoca. (Técnicas: Lectura comprensiva, Subrayado, Glosario técnico contextual)\nEtapa 2: Definición Exacta del Problema — Analizan la pregunta central única y delimitan qué es exactamente lo que el problema exige resolver o explicar. (Técnicas: Sumillado, Paráfrasis de la pregunta central)\nEtapa 3: Lluvia de Ideas e Hipótesis Previas — Realizan «contabilidad cognitiva»: listan qué saben y qué no saben, proponiendo posibles explicaciones o rutas de solución. (Técnicas: Formulación de preguntas, Conversación estructurada, Esquema vertical)\nEtapa 4: Clasificación y Sistematización — Ordenan las ideas surgidas descartando las irrelevantes y agrupando las hipótesis coherentes por categorías lógicas. (Técnicas: Árbol de problemas, Diagrama de Ishikawa, Mapa mental)\nEtapa 5: Formulación de Objetivos de Aprendizaje — Convierten los vacíos de conocimiento («lo que no sabemos») en objetivos concretos de investigación y distribuyen tareas en el equipo. (Técnicas: Esquema índice, Plan de búsqueda (fichaje))\nEtapa 6: Autoestudio e Investigación Independiente — Es la fase más extensa: cada integrante consulta libros, bases de datos y apuntes de la conferencia previa para reunir evidencia. (Técnicas: Búsqueda bibliográfica, Búsqueda electrónica, Fichaje, Resumen, Síntesis)\nEtapa 7: Discusión, Respuesta y Aplicación — En equipo discuten los hallazgos, redactan la respuesta definitiva a la pregunta central y explican cómo se aplica a la vida real. (Técnicas: Discusión guiada, Cuadro de resumen, Exposición oral breve)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M06",
  "codigo": "M-06",
  "tipo": "metodologia",
  "nombre": "Aprendizaje por Estudio de Casos",
  "clasificacion": "Potencia Nivel 6 (Alta)",
  "momentos": [],
  "descripcion": "Finalidad: Analizar fuentes primarias (10+ preguntas) y tomar decisiones fundamentadas.\nFases: 5 etapas\nDuración y evaluación: 2 semanas (4 sesiones). Rúbrica en 5 etapas + ensayo/informe.",
  "pasos": "Etapa 1: Lectura Profunda y Extracción de Hechos — Cada estudiante lee individualmente la fuente primaria, separa hechos objetivos de opiniones y responde preliminarmente la batería de 10+ preguntas. (Técnicas: Lectura comprensiva, Subrayado estructural, Sumillado, Fichaje textual, Cronología simple)\nEtapa 2: Análisis Diagnóstico en Pequeños Grupos — En equipos contrastan respuestas, identifican actores, causas raíz, restricciones legales/técnicas y evalúan alternativas de solución con sus riesgos. (Técnicas: Cuadro comparativo (alternativas vs. riesgos), Diagrama de Ishikawa, Árbol de problemas)\nEtapa 3: Plenaria de Discusión y Confrontación — Los equipos exponen sus diagnósticos y debaten en plenaria defendiendo sus posturas con citas exactas de la evidencia del caso (Caso Tipo 2). (Técnicas: Debate formal, Discusión guiada, Panel)\nEtapa 4: Toma de Decisiones Fundamentadas — Cada equipo o estudiante formula su decisión final respaldada explícitamente por Evidencia 1, Evidencia 2 y Evidencia 3 extraídas del caso. (Técnicas: Cuadro de resumen de decisiones, Flujograma de implementación)\nEtapa 5: Contrastación y Producción Escrita — Se contrasta la decisión con el desenlace real del caso histórico/empresarial y se redacta el documento formal de cierre (Caso Tipo 3). (Técnicas: Informe técnico, Ensayo argumentativo o Artículo científico)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M07",
  "codigo": "M-07",
  "tipo": "metodologia",
  "nombre": "Aprendizaje Basado en Investigación (STEAM)",
  "clasificacion": "Potencia Nivel 7 (Muy Alta)",
  "momentos": [],
  "descripcion": "Finalidad: Producir conocimiento aplicando el método científico cuantitativo o cualitativo.\nFases: 7 (Prim.) / 12 (Sec./Sup.)\nDuración y evaluación: 1 ciclo (4 meses). 7 o 12 fichas técnicas de seguimiento.",
  "pasos": "Etapa 1: Selección del Problema / Entidad (Prim. E1) — Delimitar el fenómeno o entidad observable, formular el problema de investigación y establecer los objetivos. (Técnicas: Observación sistemática, Formulación de preguntas, Árbol de problemas)\nEtapa 2: Revisión de la Literatura (Prim. E2) — Rastrear antecedentes científicos, teorías y estado del arte en fuentes arbitradas. (Técnicas: Búsqueda bibliográfica, Búsqueda electrónica, Fichaje, Resumen)\nEtapa 3: Hipótesis y Variables — Formular la hipótesis causal (X → Y) y operacionalizar las variables independiente, dependiente e intervinientes. (Técnicas: Mapa conceptual, Cuadro de operacionalización (tabla de datos))\nEtapa 4: Diseño Metodológico (Prim. E3) — Elegir el diseño (experimental con grupo control, cuasi-experimental o descriptivo) y definir población y muestra. (Técnicas: Flujograma del diseño, Esquema vertical)\nEtapa 5: Elaboración de Propuesta e Instrumentos — Redactar el plan de investigación y construir/validar los instrumentos de medición (guías, cuestionarios, sensores). (Técnicas: Cuestionario de encuesta, Ficha de observación, Informe técnico)\nEtapa 6: Trabajo de Campo y Cuaderno de Campo (Prim. E4) — Ejecutar el experimento o recolección de datos registrando cronológicamente cada medición en el cuaderno de campo. (Técnicas: Observación sistemática, Toma de apuntes, Cronología simple)\nEtapa 7: Procesamiento Estadístico (Prim. E5) — Tabular la data recolectada y aplicar estadísticos descriptivos o inferenciales (regresión lineal, ANOVA, chi-cuadrado). (Técnicas: Tabla de datos, Cuadro de resumen)\nEtapa 8: Construcción de Gráficos — Representar visualmente los resultados estadísticos según la naturaleza de las variables. (Técnicas: Gráficos estadísticos (barras, histograma, líneas, dispersión))\nEtapa 9: Interpretación y Discusión (Prim. E6) — Contrastar los resultados obtenidos con las hipótesis iniciales y con los antecedentes de la literatura científica. (Técnicas: Cuadro comparativo, Discusión guiada, Síntesis)\nEtapa 10: Configuración y Normativa — Auditar el aparato crítico, verificar citas, referencias y rigurosidad metodológica de todo el estudio. (Técnicas: Fichaje bibliográfico, Lista de cotejo de normas de citación)\nEtapa 11: Redacción Científica — Redactar los dos entregables escritos: el Informe de Investigación extenso y el Artículo Científico (formato IMRyD). (Técnicas: Informe científico, Artículo científico (IMRyD))\nEtapa 12: Presentación y Sustentación (Prim. E7) — Comunicar públicamente los hallazgos mediante póster científico y defensa oral ante jurado o feria STEAM. (Técnicas: Afiche científico (póster), Exposición académica, Foro/Debate)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M08",
  "codigo": "M-08",
  "tipo": "metodologia",
  "nombre": "Método de Aprendizaje por Proyectos",
  "clasificacion": "Potencia Nivel 8 (Muy Alta)",
  "momentos": [],
  "descripcion": "Finalidad: Satisfacer necesidades, resolver problemas reales o agregar valor con un producto.\nFases: 4 etapas\nDuración y evaluación: 1 ciclo (4 meses). Rúbrica en 4 etapas (prototipo o real).",
  "pasos": "Etapa 1: Delimitación del Proyecto — Diagnosticar la necesidad o problema del usuario, definir el producto/servicio a construir, fijar alcance, beneficiarios y especificaciones técnicas. (Técnicas: Cuestionario de entrevista, Encuesta, Árbol de problemas, Diagrama de Ishikawa)\nEtapa 2: Planificación del Proyecto — Elaborar bocetos y planos técnicos, desglosar actividades, asignar responsables, calcular presupuesto de insumos y fijar cronograma. (Técnicas: Planos/Diagramas, Flujograma de procesos, Línea de tiempo (Gantt), Tabla de presupuesto)\nEtapa 3: Ejecución y Construcción — Adquirir insumos, construir el prototipo o desarrollar el producto/servicio aplicando normas de seguridad, realizando pruebas iterativas de funcionamiento. (Técnicas: Maqueta y prototipo tridimensional (CAD/físico), Observación sistemática, Toma de apuntes)\nEtapa 4: Evaluación y Socialización — Verificar que el producto cumple los estándares técnicos de calidad, medir el impacto en los usuarios y presentar el informe final. (Técnicas: Informe técnico de impacto, Tríptico/Infografía, Exposición académica)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 },
 {
  "id": "bi-M09",
  "codigo": "M-09",
  "tipo": "metodologia",
  "nombre": "Método Clínico",
  "clasificacion": "Potencia Nivel 9 (Máxima)",
  "momentos": [],
  "descripcion": "Finalidad: Desarrollar competencias interviniendo en tiempo y espacio real (o simulado).\nFases: 4 etapas\nDuración y evaluación: 2 experiencias/mes. Lista de cotejo clínico / protocolo real.",
  "pasos": "Etapa 1: Anamnesis y Recolección de Signos — El estudiante interviene sobre el sujeto, paciente, aula o sistema real (o simulado) recogiendo historial, signos y evidencias directas. (Técnicas: Cuestionario de entrevista clínica, Observación sistemática, Fichaje clínico)\nEtapa 2: Diagnóstico Diferencial Fundamentado — Analiza los signos recolectados, descarta hipótesis alternativas y emite un diagnóstico preciso sustentado en evidencia científica. (Técnicas: Cuadro comparativo (diagnóstico diferencial), Árbol de problemas, Síntesis)\nEtapa 3: Diseño y Ejecución del Tratamiento / Intervención — Planifica y aplica directamente el protocolo de intervención, terapia, enseñanza o reparación técnica bajo supervisión de un experto. (Técnicas: Flujograma del protocolo, Toma de apuntes (bitácora de evolución))\nEtapa 4: Seguimiento Evolutivo y Alta / Cierre — Monitorea la respuesta del sujeto o sistema tras la intervención, ajusta dosis o acciones y emite el informe clínico de alta o cierre. (Técnicas: Gráficos de evolución, Informe técnico clínico, Diálogo de devolución)",
  "recursos": "",
  "areas": "",
  "fuente": "Compendio Completo de los Nueve Métodos Universales de Enseñanza-Aprendizaje"
 }
],
};
