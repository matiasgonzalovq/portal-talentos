export type TestType = "aptitudes" | "vak";
export type TestOption = { key: string; text: string };
export type TestQuestion = { id: number; text: string; options: TestOption[] };

const aptitudeRows = [
  ["Cuando te enfrentas a un acertijo, rompecabezas o juego difícil…", "Analizo las pistas con calma hasta encontrar la respuesta lógica.", "Busco una solución diferente o una idea creativa.", "Organizo a mis compañeros para resolverlo rápido.", "Pregunto a los demás para pensarlo entre todos.", "Pruebo directamente moviendo las piezas o usando las manos."],
  ["En tu tiempo libre, lo que más te divierte hacer es…", "Descubrir cómo funcionan las cosas, jugar estrategia o aprender datos curiosos.", "Dibujar, inventar historias, hacer manualidades, música o editar videos.", "Planear juegos, organizar amigos o inventar retos para el grupo.", "Hablar con amigos, escuchar sus problemas y pasar tiempo juntos.", "Hacer deporte, andar en bici, bailar o arreglar cosas."],
  ["En un trabajo grupal del colegio, prefieres…", "Buscar información, revisar datos y corregir errores.", "Encargarte del diseño, la portada o los dibujos.", "Repartir tareas y controlar que terminen a tiempo.", "Escuchar a todos y procurar que nadie quede fuera.", "Hacer la parte práctica, la maqueta o el experimento."],
  ["Si tuvieras un canal de videos, tu contenido trataría de…", "Datos curiosos, tecnología, ciencia o trucos de videojuegos.", "Dibujo, animación, música, actuación o baile.", "Organización, retos grupales o ideas para emprender.", "Vida cotidiana, consejos o entrevistas a amigos.", "Deporte, recetas o cómo construir y reparar cosas."],
  ["La asignatura o clase que más te gusta o facilita es…", "Matemática, computación, tecnología o ciencias.", "Arte, música, lenguaje o literatura.", "Historia, formación ciudadana o ciencias sociales.", "Biología, naturaleza o convivencia escolar.", "Educación física, talleres prácticos o laboratorio."],
  ["Si ves que un amigo está triste…", "Le ayudo a pensar cómo resolver lo que le ocurrió.", "Le hago un dibujo, una carta o algo creativo para animarlo.", "Pienso en un plan concreto para ayudarlo.", "Me siento a su lado y lo escucho con paciencia.", "Le propongo jugar, caminar o hacer deporte."],
  ["Si te regalan un juguete o mueble desarmado…", "Leo con atención el instructivo antes de comenzar.", "Imagino una forma distinta de armarlo.", "Organizo quién sostiene o arma cada pieza.", "Procuro que todos colaboren sin discutir.", "Comienzo a encajar y atornillar las piezas."],
  ["¿Qué historias o videos te atrapan más?", "Misterios, detectives o documentales de ciencia.", "Fantasía, animación, magia y mundos coloridos.", "Grandes líderes, competencias y héroes.", "Historias sobre amistad, familia y ayuda a otros.", "Acción, carreras, deportes o fabricación de cosas."],
  ["En un deporte o juego de equipo, te destacas por…", "Entender las reglas y pensar la mejor estrategia.", "Inventar jugadas vistosas o pases creativos.", "Motivar al equipo y dar instrucciones.", "Apoyar a quien se equivoca y mantener unido al grupo.", "Tu rapidez, fuerza, resistencia o puntería."],
  ["Si organizaran un festival en tu escuela, elegirías…", "Llevar cuentas, dinero o listas de invitados.", "Diseñar carteles, decorar o elegir la música.", "Presentar y coordinar los horarios.", "Recibir a la gente y ayudar a quien lo necesite.", "Armar el escenario, mover sillas y conectar equipos."],
  ["¿Cómo te resulta más fácil explicarle algo a un compañero?", "Con un esquema de pasos y una lógica sencilla.", "Con ejemplos divertidos, dibujos o una historia.", "Explicando la idea directamente y convenciéndolo.", "Preguntando qué no entiende y explicando con paciencia.", "Mostrando cómo se hace y practicándolo juntos."],
  ["Cuando tienes un día difícil, prefieres…", "Pensar qué causó el problema y cómo resolverlo.", "Dibujar, escribir, pintar o escuchar música.", "Hacer una lista para ordenar tus ideas.", "Conversar con alguien de confianza.", "Moverte, hacer ejercicio o una actividad manual."],
  ["¿Qué te gustaría aprender a hacer muy bien?", "Programar, crear aplicaciones o hacer experimentos.", "Tocar un instrumento, diseñar, pintar o editar videos.", "Dirigir un proyecto, emprender o hablar en público.", "Enseñar, acompañar o cuidar a otras personas.", "Destacarte en deporte, baile o construcción."],
  ["Un día de lluvia sin internet, probablemente estarías…", "Leyendo, jugando ajedrez o resolviendo acertijos.", "Dibujando, componiendo o inventando una historia.", "Ordenando tu espacio o planificando la semana.", "Conversando con un familiar o amigo.", "Haciendo ejercicio, armando o reparando algo."],
  ["¿Qué suelen decir los demás sobre ti?", "Que comprendo bien los números y cómo funcionan las cosas.", "Que tengo mucha imaginación y talento artístico.", "Que sé decidir, organizar y actuar con seguridad.", "Que sé escuchar y soy un buen amigo.", "Que tengo energía y habilidad física o manual."],
  ["Si tuvieras que hablar frente a toda tu escuela…", "Prepararía datos exactos para no equivocarme.", "Usaría dibujos o una presentación visual.", "Hablaría con voz clara y segura.", "Hablaría desde el corazón para conectar con la gente.", "Mostraría objetos o haría una demostración en vivo."],
  ["Aprendes mucho mejor cuando…", "Te explican las reglas y el porqué.", "Te muestran imágenes, dibujos o videos.", "Conoces la meta y para qué sirve.", "Conversas y escuchas opiniones.", "Lo pruebas directamente y practicas."],
  ["¿En qué lugar te imaginas trabajando feliz?", "En un laboratorio con computadores, datos o ciencia.", "En un estudio creativo, de diseño o en un escenario.", "Dirigiendo un equipo o una empresa.", "En una escuela, centro de salud o comunidad.", "En una cancha, taller, naturaleza o aire libre."],
  ["Si dos amigos se pelean por un juego…", "Reviso las reglas para entender qué ocurrió.", "Uso el humor o invento algo para cambiar el ánimo.", "Propongo una solución rápida y equilibrada.", "Escucho a ambos y los ayudo a reconciliarse.", "Propongo otro reto o actividad física."],
  ["Si pudieras cambiar algo del mundo, elegirías…", "Crear tecnología o ciencia para resolver problemas.", "Crear arte, música o historias que inspiren.", "Crear proyectos que den oportunidades a otros.", "Combatir el acoso y acompañar a quien está solo.", "Proteger animales y naturaleza o construir viviendas."],
  ["Cuando un plan no sale bien…", "Analizo qué falló y busco otra opción.", "Invento una alternativa diferente sobre la marcha.", "Reorganizo al grupo para cambiar de rumbo.", "Pregunto cómo están todos y decidimos juntos.", "Pongo manos a la obra para repararlo."],
  ["En internet te llaman más la atención los videos de…", "Ciencia, experimentos, informática o datos curiosos.", "Dibujo, música, manualidades o baile.", "Organización, éxito, proyectos o negocios.", "Historias conmovedoras, rescates o consejos.", "Deporte, viajes, naturaleza o reparaciones."],
  ["Si pudieras mejorar tu escuela, invertirías en…", "Computadores, internet o materiales científicos.", "Arte, instrumentos musicales o murales.", "Espacios para proyectos y organización estudiantil.", "Zonas de descanso y programas de acompañamiento.", "Canchas, gimnasio y equipamiento práctico."],
  ["¿Cuándo sientes que el tiempo pasa sin darte cuenta?", "Resolviendo un problema o juego de ingenio.", "Dibujando, escribiendo, tocando música o creando.", "Organizando a otros para lograr una meta.", "Conversando profundamente con alguien.", "Haciendo deporte o armando algo."],
  ["Al terminar el día, te sientes satisfecho si…", "Aprendiste o comprendiste algo difícil.", "Creaste o expresaste algo único.", "Cumpliste todo lo que te propusiste.", "Ayudaste o hiciste sentir bien a alguien.", "Te mantuviste activo y usaste tu energía."],
] as const;

export const aptitudeQuestions: TestQuestion[] = aptitudeRows.map((row, index) => ({
  id: index + 1,
  text: row[0],
  options: ["A", "B", "C", "D", "E"].map((key, optionIndex) => ({ key, text: row[optionIndex + 1] })),
}));

export const vakQuestions: TestQuestion[] = [
  { id: 1, text: "Cuando conoces a alguien, después, ¿qué es lo que más recuerdas de esa persona?", options: [{key:"A",text:"Su rostro."},{key:"B",text:"Su nombre."},{key:"C",text:"La impresión que te produjo."}] },
  { id: 2, text: "Tienes que aprender a usar un nuevo programa informático. ¿Qué haces?", options: [{key:"A",text:"Consultas el manual o buscas un tutorial por internet."},{key:"B",text:"Llamas a un contacto y le preguntas."},{key:"C",text:"Quedas con una amistad para que te ayude con la tarea."}] },
  { id: 3, text: "Prefieres a los formadores que utilizan…", options: [{key:"A",text:"Apuntes o diapositivas con imágenes."},{key:"B",text:"Conferencias, debates y foros."},{key:"C",text:"Sesiones prácticas, excursiones y trabajo de campo."}] },
  { id: 4, text: "Para aprender a cuidar un jardín y animales de compañía, consideras que lo mejor será…", options: [{key:"A",text:"Ver cómo lo hace otra persona."},{key:"B",text:"Recibir instrucciones y aclararlas."},{key:"C",text:"Que alguien te acompañe mientras lo haces."}] },
  { id: 5, text: "Para realizar una presentación ante un grupo, te sientes más a gusto si…", options: [{key:"A",text:"Tienes notas o una presentación para consultar."},{key:"B",text:"Conoces bien el discurso y qué vas a decir."},{key:"C",text:"Has ensayado la presentación varias veces."}] },
  { id: 6, text: "¿Con cuál de las siguientes aficiones disfrutas más?", options: [{key:"A",text:"Hacer fotos, dibujar o ver paisajes."},{key:"B",text:"Escuchar música, cantar o contar historias."},{key:"C",text:"Pasear, bailar o meditar."}] },
  { id: 7, text: "A la hora de adquirir una nueva habilidad prefieres…", options: [{key:"A",text:"Ver ejemplos de cómo lo hace otra persona."},{key:"B",text:"Escuchar una descripción y hacer preguntas."},{key:"C",text:"Hacer ejercicios prácticos."}] },
  { id: 8, text: "Al elegir dónde comer en una calle llena de restaurantes, te fijas en…", options: [{key:"A",text:"Los platos de otros comensales."},{key:"B",text:"El ambiente, la música y los sonidos del local."},{key:"C",text:"El olor de la comida o la sensación que transmite el lugar."}] },
  { id: 9, text: "Por lo general, eres una persona que pasa más tiempo…", options: [{key:"A",text:"Soñando con tus planes."},{key:"B",text:"Escuchando tus pensamientos o hablando contigo."},{key:"C",text:"Navegando en tus sentimientos."}] },
  { id: 10, text: "Tienes que hacer la compra semanal. ¿Qué haces?", options: [{key:"A",text:"Miras lo que falta y haces una foto mental."},{key:"B",text:"Haces una lista con lo que hay que comprar."},{key:"C",text:"Improvisas y compras lo que te parece necesario."}] },
];

export const aptitudeProfiles: Record<string, {title:string; short:string; description:string; color:string; suggestions:string[]}> = {
  A:{title:"Perfil lógico y científico",short:"Lógico",description:"Tiendes a analizar, ordenar información y buscar explicaciones claras antes de decidir.",color:"#5368d8",suggestions:["Programación y tecnología","Ciencias e investigación","Ingeniería y análisis de datos"]},
  B:{title:"Perfil creativo y artístico",short:"Creativo",description:"Destacas por imaginar posibilidades, expresarte y crear soluciones originales.",color:"#9a57c7",suggestions:["Diseño y comunicación","Música y artes","Producción audiovisual"]},
  C:{title:"Perfil de liderazgo y gestión",short:"Liderazgo",description:"Tiendes a organizar, tomar iniciativa y movilizar a otras personas hacia una meta.",color:"#ef7b45",suggestions:["Gestión de proyectos","Emprendimiento","Comunicación y liderazgo"]},
  D:{title:"Perfil social y empático",short:"Social",description:"Te importa escuchar, acompañar y construir ambientes donde las personas se sientan incluidas.",color:"#28a17a",suggestions:["Educación y orientación","Salud y bienestar","Trabajo comunitario"]},
  E:{title:"Perfil práctico y kinestésico",short:"Práctico",description:"Aprendes haciendo y sueles disfrutar el movimiento, las herramientas y los desafíos concretos.",color:"#d84e4e",suggestions:["Deporte y movimiento","Construcción y mecánica","Naturaleza y actividades prácticas"]},
};

export const vakProfiles: Record<string, {title:string; short:string; description:string; color:string; suggestions:string[]}> = {
  A:{title:"Aprendizaje visual",short:"Visual",description:"Sueles comprender mejor cuando la información se presenta mediante imágenes, formas, colores y relaciones espaciales.",color:"#7556bd",suggestions:["Mapas mentales y conceptuales","Código de colores y subrayado","Flashcards con imágenes","Diagramas y cuadros comparativos"]},
  B:{title:"Aprendizaje auditivo",short:"Auditivo",description:"Sueles aprender bien mediante el oído, la explicación oral, la conversación y el ritmo verbal.",color:"#2684d8",suggestions:["Explicar en voz alta","Grabar y escuchar resúmenes","Debatir en grupo","Usar ritmo y reglas mnemotécnicas"]},
  C:{title:"Aprendizaje kinestésico",short:"Kinestésico",description:"Sueles aprender haciendo, experimentando, tocando y conectando los contenidos con el movimiento.",color:"#ef4d3f",suggestions:["Practicar con casos reales","Crear materiales a mano","Usar pausas de movimiento","Simular y experimentar"]},
};

export function getQuestions(testType: TestType) { return testType === "vak" ? vakQuestions : aptitudeQuestions; }
export function getProfiles(testType: TestType) { return testType === "vak" ? vakProfiles : aptitudeProfiles; }

export function scoreTest(testType: TestType, answers: Record<string,string>) {
  const keys = testType === "vak" ? ["A","B","C"] : ["A","B","C","D","E"];
  const scores = Object.fromEntries(keys.map(key => [key,0])) as Record<string,number>;
  Object.values(answers).forEach(value => { if (value in scores) scores[value] += 1; });
  const max = Math.max(...Object.values(scores));
  const leaders = keys.filter(key => scores[key] === max);
  const ordered = [...keys].sort((a,b) => scores[b] - scores[a]);
  const secondaryScore = Math.max(...ordered.filter(key => !leaders.includes(key)).map(key => scores[key]), -1);
  const secondary = secondaryScore >= 0 ? ordered.filter(key => !leaders.includes(key) && scores[key] === secondaryScore) : [];
  return { scores, leaders, secondary };
}
