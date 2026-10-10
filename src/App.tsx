import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  Download,
  Eye,
  FileText,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getIdTokenResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { deleteApp, initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { firebaseConfig, auth, db } from "./firebase";
import {
  getProfiles,
  getQuestions,
  scoreTest,
  type TestType,
} from "./lib/test-data";

type View =
  | "home"
  | "register"
  | "choose"
  | "test"
  | "lookup"
  | "results"
  | "admin-login"
  | "admin";
type Participant = {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  group: string;
  recoveryCode?: string;
  createdAt?: unknown;
};
type Submission = {
  testType: TestType;
  answers: Record<string, string>;
  scores: Record<string, number>;
  dominant: string;
  completedAt?: unknown;
};
const GROUPS = ["Juveniles", "IPAKids", "Adolescentes", "Otro"];
const CAREER_PATHS: Record<
  string,
  { area: string; careers: string[]; why: string; actions: string[] }
> = {
  A: {
    area: "Ciencia, tecnología y análisis",
    careers: [
      "Ingeniería informática o de software",
      "Ingeniería civil, industrial o eléctrica",
      "Ciencia de datos y estadística",
      "Medicina y ciencias de la salud",
      "Biología, química o física",
      "Economía y análisis financiero",
    ],
    why: "Estas áreas suelen requerir razonamiento lógico, comprensión de sistemas, precisión y curiosidad por descubrir cómo funcionan las cosas.",
    actions: [
      "Realizar un proyecto breve de programación o robótica",
      "Participar en una feria científica o club de matemáticas",
      "Conversar con alguien que estudie una carrera STEM",
    ],
  },
  B: {
    area: "Creatividad, diseño y comunicación",
    careers: [
      "Diseño gráfico, industrial o digital",
      "Arquitectura",
      "Publicidad y comunicación audiovisual",
      "Música, teatro o artes visuales",
      "Periodismo y creación de contenidos",
      "Animación, videojuegos o UX/UI",
    ],
    why: "Estas opciones combinan imaginación, sensibilidad estética, comunicación y capacidad para transformar ideas en experiencias o mensajes.",
    actions: [
      "Crear un portafolio con tres trabajos propios",
      "Probar fotografía, edición de video, dibujo o diseño digital",
      "Investigar mallas de Diseño, Arquitectura y Comunicación",
    ],
  },
  C: {
    area: "Liderazgo, gestión y emprendimiento",
    careers: [
      "Administración de empresas",
      "Ingeniería comercial o industrial",
      "Derecho y ciencias políticas",
      "Gestión pública",
      "Emprendimiento e innovación",
      "Relaciones públicas y dirección de proyectos",
    ],
    why: "Son caminos donde ayudan la iniciativa, la organización, la toma de decisiones y la capacidad de movilizar equipos hacia una meta.",
    actions: [
      "Organizar una actividad real con presupuesto y tareas",
      "Participar en un centro de estudiantes o voluntariado",
      "Entrevistar a una persona que lidere un equipo o emprendimiento",
    ],
  },
  D: {
    area: "Personas, educación y servicio",
    careers: [
      "Psicología",
      "Pedagogía y educación diferencial",
      "Trabajo social",
      "Enfermería, terapia ocupacional o fonoaudiología",
      "Sociología y desarrollo comunitario",
      "Recursos humanos y orientación",
    ],
    why: "Estas áreas valoran la escucha, la empatía, la comunicación interpersonal y el interés por acompañar el desarrollo de otras personas.",
    actions: [
      "Participar en tutorías, apoyo escolar o voluntariado",
      "Observar qué tipo de ayuda a otros te entrega más energía",
      "Conversar con profesionales de educación, salud y trabajo social",
    ],
  },
  E: {
    area: "Acción, técnica y trabajo práctico",
    careers: [
      "Kinesiología y ciencias del deporte",
      "Construcción civil y prevención de riesgos",
      "Mecánica, electricidad o automatización",
      "Agronomía, veterinaria o recursos naturales",
      "Gastronomía y producción técnica",
      "Diseño y fabricación industrial",
    ],
    why: "Estos campos permiten aprender haciendo, resolver desafíos concretos, trabajar con movimiento, herramientas, materiales o entornos reales.",
    actions: [
      "Realizar un taller práctico o curso técnico breve",
      "Visitar un instituto técnico, taller o laboratorio aplicado",
      "Construir, reparar o entrenar algo y registrar lo aprendido",
    ],
  },
};
const LEARNING_PLANS: Record<
  string,
  { works: string; strategies: string[]; challenge: string }
> = {
  A: {
    works:
      "Te ayuda ver la información organizada y reconocer relaciones entre ideas.",
    strategies: [
      "Transforma cada tema en un mapa conceptual",
      "Usa colores con un significado constante",
      "Convierte procesos en diagramas o líneas de tiempo",
      "Antes de estudiar, observa el panorama general",
    ],
    challenge:
      "No te quedes solo mirando: cierra el material e intenta reconstruirlo de memoria.",
  },
  B: {
    works:
      "Te ayuda escuchar, explicar y conversar para ordenar lo que estás aprendiendo.",
    strategies: [
      "Explica el contenido en voz alta con tus palabras",
      "Graba resúmenes breves y vuelve a escucharlos",
      "Estudia con preguntas y conversación",
      "Usa ritmo, historias o asociaciones verbales",
    ],
    challenge:
      "Combina la escucha con notas breves y ejercicios para comprobar que realmente comprendiste.",
  },
  C: {
    works:
      "Te ayuda experimentar, moverte y conectar las ideas con acciones concretas.",
    strategies: [
      "Practica con ejemplos, problemas o simulaciones",
      "Estudia en bloques breves con pausas activas",
      "Construye modelos o manipula materiales",
      "Relaciona cada concepto con una experiencia real",
    ],
    challenge:
      "Después de practicar, escribe qué aprendiste y por qué funciona para consolidar la idea.",
  },
};
const cleanCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
const displayCode = (value: string) =>
  cleanCode(value).length <= 4
    ? cleanCode(value)
    : (cleanCode(value)
        .match(/.{1,4}/g)
        ?.join("-") ?? "");
const randomCharacters = (length: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};
const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
const accessHash = async (name: string, code: string) => {
  const data = new TextEncoder().encode(
    `${normalizeName(name)}|${cleanCode(code)}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
};
const label = (type: TestType) =>
  type === "vak" ? "Test VAK" : "Test de habilidades y aptitudes";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [selected, setSelected] = useState<TestType>("aptitudes");
  const [results, setResults] = useState<Submission[]>([]);
  const [admin, setAdmin] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [superAdmin, setSuperAdmin] = useState(false);
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setAuthUser(u);
        if (!u) {
          setAdmin(null);
          setSuperAdmin(false);
          return;
        }
        // Authorization is based exclusively on the ID token custom claims,
        // matching the Firestore rules isAdmin() (request.auth.token.admin).
        // Email is NOT used as an authorization criterion.
        try {
          const token = await getIdTokenResult(u);
          const isAdmin = token.claims.admin === true;
          setAdmin(isAdmin ? u : null);
          setSuperAdmin(token.claims.superAdmin === true);
        } catch {
          setAdmin(null);
          setSuperAdmin(false);
        }
      }),
    [],
  );
  const goHome = () => {
    setView("home");
    setParticipant(null);
    setResults([]);
  };
  return (
    <div className="app">
      <header>
        <button className="brand" onClick={goHome}>
          <span className="brandmark">
            <Sparkles />
          </span>
          <span>
            <b>Portal de Talentos</b>
            <small>Descubre cómo brillas y aprendes</small>
          </span>
        </button>
        <button
          className="admin-link"
          onClick={() => setView(admin ? "admin" : "admin-login")}
        >
          <ShieldCheck /> Administración
        </button>
      </header>
      <main>
        {view === "home" && (
          <Home
            start={() => setView("register")}
            lookup={() => setView("lookup")}
          />
        )}
        {view === "register" && (
          <Registration
            onBack={goHome}
            onDone={(p) => {
              setParticipant(p);
              setView("choose");
            }}
          />
        )}
        {view === "choose" && participant && (
          <Choice
            name={participant.name}
            onChoose={(t) => {
              setSelected(t);
              setView("test");
            }}
          />
        )}
        {view === "test" && participant && (
          <TestFlow
            participant={participant}
            type={selected}
            onDone={(s) => {
              setResults([s]);
              setView("results");
            }}
            onBack={() => setView("choose")}
          />
        )}
        {view === "lookup" && (
          <Lookup
            onBack={goHome}
            onFound={(p, s) => {
              setParticipant(p);
              setResults(s);
              setView("results");
            }}
          />
        )}
        {view === "results" && participant && (
          <Results
            participant={participant}
            submissions={results}
            onOther={(t) => {
              setSelected(t);
              setView("test");
            }}
            onHome={goHome}
          />
        )}
        {view === "admin-login" && (
          <AdminLogin
            admin={admin}
            authUser={authUser}
            onDone={() => setView("admin")}
            onBack={goHome}
          />
        )}
        {view === "admin" && admin && (
          <AdminDashboard
            user={admin}
            isSuperAdmin={superAdmin}
            onExit={async () => {
              await signOut(auth);
              goHome();
            }}
          />
        )}
        {view === "admin" && !admin && (
          <AdminLogin
            admin={null}
            authUser={authUser}
            onDone={() => setView("admin")}
            onBack={goHome}
          />
        )}
      </main>
      <footer>
        Una herramienta de orientación. Los resultados no reemplazan una
        evaluación profesional.
      </footer>
    </div>
  );
}

function Home({ start, lookup }: { start: () => void; lookup: () => void }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">ORIENTACIÓN PERSONAL Y VOCACIONAL</span>
        <h1>
          Descubre tus talentos.
          <br />
          <em>Entiende cómo aprendes.</em>
        </h1>
        <p>
          Dos experiencias breves para reconocer tus fortalezas, explorar
          caminos vocacionales y encontrar estrategias de aprendizaje que
          funcionen para ti.
        </p>
        <div className="actions">
          <button className="primary" onClick={start}>
            Comenzar mis tests <span>→</span>
          </button>
          <button className="secondary" onClick={lookup}>
            <KeyRound /> Ya respondí · Ver resultados
          </button>
        </div>
        <div className="trust">
          <span>
            <Check /> Privado y seguro
          </span>
          <span>
            <Check /> Sin notas ni respuestas malas
          </span>
          <span>
            <Check /> Resultado inmediato
          </span>
        </div>
      </div>
      <div className="test-cards">
        <article className="feature blue">
          <div className="icon">
            <Brain />
          </div>
          <small>25 PREGUNTAS · 8–12 MIN</small>
          <h2>Habilidades y aptitudes</h2>
          <p>
            Explora tus fortalezas lógicas, creativas, sociales, de liderazgo y
            prácticas.
          </p>
          <div className="mini-bars">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </article>
        <article className="feature violet">
          <div className="icon">
            <Eye />
          </div>
          <small>10 PREGUNTAS · 4–6 MIN</small>
          <h2>Estilo de aprendizaje VAK</h2>
          <p>Descubre si aprendes mejor viendo, escuchando o haciendo.</p>
          <div className="vak-row">
            <span>V</span>
            <span>A</span>
            <span>K</span>
          </div>
        </article>
      </div>
    </section>
  );
}

function Registration({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (p: Participant) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    group: "Juveniles",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("Ingresa una edad válida.");
      return;
    }
    setBusy(true);
    try {
      const name = form.name.trim();
      let recoveryCode = "";
      let hash = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        recoveryCode = randomCharacters(4);
        hash = await accessHash(name, recoveryCode);
        if (!(await getDoc(doc(db, "resultAccess", hash))).exists()) break;
      }
      const id = randomCharacters(20);
      const p = {
        id,
        name,
        age,
        phone: form.phone.trim(),
        email: form.email.trim(),
        group: form.group.trim(),
        recoveryCode,
      };
      const { id: _privateId, ...stored } = p;
      const batch = writeBatch(db);
      batch.set(doc(db, "participants", id), {
        ...stored,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "resultAccess", hash), {
        participantId: id,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      onDone(p);
    } catch {
      setError(
        "No pudimos guardar los datos. Revisa tu conexión e inténtalo nuevamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      back={onBack}
      title="Cuéntanos un poco sobre ti"
      subtitle="Usaremos estos datos solo para guardar tus resultados."
    >
      <form onSubmit={submit} className="form-grid">
        <label className="wide">
          Nombre y apellido
          <input
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Martina González"
          />
        </label>
        <label>
          Edad
          <input
            required
            type="number"
            min="1"
            max="120"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
        </label>
        <label>
          Grupo o curso
          <input
            required
            list="groups"
            maxLength={60}
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            placeholder="Ej: 2° medio B"
          />
          <datalist id="groups">
            {GROUPS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </label>
        <label>
          Celular
          <input
            required
            maxLength={30}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+56 9..."
          />
        </label>
        <label>
          Correo <small>(opcional)</small>
          <input
            type="email"
            maxLength={150}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="correo@ejemplo.cl"
          />
        </label>
        {error && <p className="error wide">{error}</p>}
        <button className="primary wide" disabled={busy}>
          {busy ? "Guardando…" : "Continuar →"}
        </button>
      </form>
    </Panel>
  );
}

function Choice({
  name,
  onChoose,
}: {
  name: string;
  onChoose: (t: TestType) => void;
}) {
  return (
    <Panel
      title={`¡Hola, ${name.split(" ")[0]}!`}
      subtitle="Elige el test con el que quieres comenzar. Después podrás realizar el otro."
    >
      <div className="choice-grid">
        <button className="choice" onClick={() => onChoose("aptitudes")}>
          <Brain />
          <span>
            <b>Habilidades y aptitudes</b>
            <small>25 preguntas · 8–12 minutos</small>
          </span>
          <strong>→</strong>
        </button>
        <button className="choice" onClick={() => onChoose("vak")}>
          <Eye />
          <span>
            <b>Estilo de aprendizaje VAK</b>
            <small>10 preguntas · 4–6 minutos</small>
          </span>
          <strong>→</strong>
        </button>
      </div>
    </Panel>
  );
}

function TestFlow({
  participant,
  type,
  onDone,
  onBack,
}: {
  participant: Participant;
  type: TestType;
  onDone: (s: Submission) => void;
  onBack: () => void;
}) {
  const questions = getQuestions(type);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const q = questions[idx];
  async function choose(key: string) {
    const next = { ...answers, [String(q.id)]: key };
    setAnswers(next);
    if (idx < questions.length - 1) {
      setTimeout(() => setIdx(idx + 1), 180);
      return;
    }
    setBusy(true);
    const scored = scoreTest(type, next);
    const s: Submission = {
      testType: type,
      answers: next,
      scores: scored.scores,
      dominant: scored.leaders.join(","),
      completedAt: new Date().toISOString(),
    };
    try {
      await setDoc(
        doc(db, "participants", participant.id, "submissions", type),
        { ...s, completedAt: serverTimestamp() },
      );
      onDone(s);
    } catch {
      setBusy(false);
      alert(
        "No pudimos guardar el resultado. Revisa tu conexión e inténtalo nuevamente.",
      );
    }
  }
  return (
    <section className="test-wrap">
      <button className="back" onClick={idx ? () => setIdx(idx - 1) : onBack}>
        <ChevronLeft /> Volver
      </button>
      <div className="progress-head">
        <span>{label(type)}</span>
        <b>
          {idx + 1} de {questions.length}
        </b>
      </div>
      <div className="progress">
        <i style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <article className="question">
        <span className="qnum">PREGUNTA {idx + 1}</span>
        <h2>{q.text}</h2>
        <div className="options">
          {q.options.map((o) => (
            <button
              key={o.key}
              className={answers[String(q.id)] === o.key ? "selected" : ""}
              onClick={() => choose(o.key)}
              disabled={busy}
            >
              <b>{o.key}</b>
              <span>{o.text}</span>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

function Lookup({
  onBack,
  onFound,
}: {
  onBack: () => void;
  onFound: (p: Participant, s: Submission[]) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const enteredCode = cleanCode(code);
      const hash = await accessHash(name, enteredCode);
      const access = await getDoc(doc(db, "resultAccess", hash));
      if (!access.exists()) throw new Error();
      const id = String(access.data().participantId);
      const subs = await getDocs(
        collection(db, "participants", id, "submissions"),
      );
      onFound(
        {
          id,
          name: name.trim(),
          age: 0,
          phone: "",
          email: "",
          group: "",
          recoveryCode: enteredCode,
        },
        subs.docs.map((d) => d.data() as Submission),
      );
    } catch {
      setError(
        "No encontramos esa combinación de nombre y código. Revisa ambos datos.",
      );
    } finally {
      setBusy(false);
    }
  }
  const validLength =
    cleanCode(code).length === 4 || cleanCode(code).length === 20;
  return (
    <Panel
      back={onBack}
      title="Vuelve a tus resultados"
      subtitle="Ingresa tu nombre y tu código personal de 4 caracteres. Los códigos anteriores también continúan funcionando."
    >
      <form className="lookup" onSubmit={find}>
        <label>
          Nombre y apellido
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tal como lo ingresaste al registrarte"
          />
        </label>
        <label>
          Código personal
          <input
            required
            value={displayCode(code)}
            onChange={(e) => setCode(cleanCode(e.target.value))}
            placeholder="XXXX"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button
          className="primary"
          disabled={busy || !validLength || name.trim().length < 2}
        >
          {busy ? "Buscando…" : "Ver mis resultados"}
        </button>
      </form>
    </Panel>
  );
}

function Results({
  participant,
  submissions,
  onOther,
  onHome,
}: {
  participant: Participant;
  submissions: Submission[];
  onOther: (t: TestType) => void;
  onHome: () => void;
}) {
  const completed = submissions.map((s) => s.testType);
  return (
    <section className="results">
      <div className="result-top">
        <div>
          <span className="eyebrow">TUS RESULTADOS</span>
          <h1>Este es tu mapa personal, {participant.name.split(" ")[0]}</h1>
        </div>
        <button className="secondary" onClick={() => window.print()}>
          <FileText /> Imprimir informe
        </button>
      </div>
      <div className="code-box">
        <div>
          <KeyRound />
          <span>
            <b>Tu código personal</b>
            <small>Guárdalo junto con el nombre usado al registrarte</small>
          </span>
        </div>
        <strong>
          {displayCode(participant.recoveryCode || participant.id)}
        </strong>
      </div>
      {submissions.length === 0 && (
        <div className="empty">Aún no has completado ningún test.</div>
      )}
      {submissions.map((s) => (
        <ResultCard key={s.testType} submission={s} />
      ))}
      {(["aptitudes", "vak"] as TestType[])
        .filter((t) => !completed.includes(t))
        .map((t) => (
          <button key={t} className="other-test" onClick={() => onOther(t)}>
            Completar {label(t)} <span>→</span>
          </button>
        ))}
      <button className="text-button" onClick={onHome}>
        Volver al inicio
      </button>
    </section>
  );
}

function ResultCard({ submission }: { submission: Submission }) {
  const profiles = getProfiles(submission.testType);
  const ranking = Object.entries(submission.scores).sort((a, b) => b[1] - a[1]);
  const leaders = ranking
    .filter(([, score]) => score === ranking[0]?.[1])
    .map(([key]) => key);
  const focus = ranking.slice(0, 2).map(([key]) => key);
  const total =
    Object.values(submission.scores).reduce((a, b) => a + b, 0) || 1;
  const questions = getQuestions(submission.testType);
  const gap = (ranking[0]?.[1] ?? 0) - (ranking[1]?.[1] ?? 0);
  const balanced = gap <= 1;
  return (
    <article className="result-card">
      <div className="result-title">
        <div className="icon">
          <BarChart3 />
        </div>
        <div>
          <small>{label(submission.testType)}</small>
          <h2>{leaders.map((k) => profiles[k]?.title).join(" + ")}</h2>
        </div>
      </div>
      <div className="result-summary">
        <b>
          {balanced
            ? "Tu perfil combina fortalezas"
            : "Tu tendencia principal está bien marcada"}
        </b>
        <p>
          {submission.testType === "aptitudes"
            ? balanced
              ? `Tus dos áreas con mayor presencia son ${profiles[focus[0]]?.short} y ${profiles[focus[1]]?.short}. Conviene explorar opciones que mezclen ambas, no solo una.`
              : `Tu fortaleza ${profiles[focus[0]]?.short.toLowerCase()} aparece con mayor frecuencia. Tu segunda área, ${profiles[focus[1]]?.short.toLowerCase()}, puede ampliar los caminos que explores.`
            : `Tu preferencia más frecuente es ${profiles[focus[0]]?.short.toLowerCase()}, acompañada por recursos de tipo ${profiles[focus[1]]?.short.toLowerCase()}. Puedes aprender de muchas formas; esta combinación indica por dónde empezar a probar estrategias.`}
        </p>
      </div>
      <div className="score-grid">
        {ranking.map(([k, v]) => (
          <div key={k}>
            <div>
              <span>{profiles[k]?.short}</span>
              <b>
                {v} de {total} · {Math.round((v / total) * 100)}%
              </b>
            </div>
            <i>
              <em
                style={{
                  width: `${(v / total) * 100}%`,
                  background: profiles[k]?.color,
                }}
              />
            </i>
          </div>
        ))}
      </div>
      <div className="profile-copy">
        {focus.map((k) => (
          <div key={k}>
            <h3>{profiles[k]?.title}</h3>
            <p>{profiles[k]?.description}</p>
            <ul>
              {profiles[k]?.suggestions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {submission.testType === "aptitudes" ? (
        <CareerGuidance keys={focus} />
      ) : (
        <LearningGuidance keys={focus} />
      )}
      <div className="orientation-note">
        <b>Cómo leer este resultado</b>
        <p>
          Es una orientación inicial basada en tus respuestas actuales. No
          define tu capacidad ni decide una carrera por ti. Úsalo para
          investigar, conversar y probar experiencias reales antes de elegir.
        </p>
      </div>
      <details>
        <summary>Ver mis respuestas</summary>
        <ol className="answer-list">
          {questions.map((q) => {
            const key = submission.answers[String(q.id)];
            return (
              <li key={q.id}>
                <b>{q.text}</b>
                <span>
                  {q.options.find((o) => o.key === key)?.text ??
                    "Sin respuesta"}
                </span>
              </li>
            );
          })}
        </ol>
      </details>
    </article>
  );
}

function CareerGuidance({ keys }: { keys: string[] }) {
  return (
    <section className="guidance">
      <div className="section-heading">
        <span>EXPLORACIÓN VOCACIONAL</span>
        <h3>Carreras y áreas que podrías comenzar a revisar</h3>
        <p>
          No es una lista cerrada: son puntos de partida conectados con tus dos
          fortalezas más visibles.
        </p>
      </div>
      <div className="career-grid">
        {keys.map((key) => {
          const path = CAREER_PATHS[key];
          return (
            <article key={key}>
              <span className="area-label">{path.area}</span>
              <p>{path.why}</p>
              <h4>Opciones para investigar</h4>
              <ul>
                {path.careers.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <h4>Cómo probar esta área</h4>
              <ol>
                {path.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
      <div className="next-steps">
        <h3>Tu siguiente paso en 3 movimientos</h3>
        <ol>
          <li>
            <b>Selecciona tres opciones</b> que te produzcan curiosidad, aunque
            todavía no estés seguro.
          </li>
          <li>
            <b>Compara sus mallas y campos laborales</b> en universidades,
            institutos y centros de formación técnica.
          </li>
          <li>
            <b>Prueba antes de elegir:</b> habla con estudiantes o profesionales
            y realiza una actividad breve relacionada.
          </li>
        </ol>
      </div>
    </section>
  );
}

function LearningGuidance({ keys }: { keys: string[] }) {
  return (
    <section className="guidance">
      <div className="section-heading">
        <span>PLAN DE APRENDIZAJE</span>
        <h3>Estrategias que vale la pena probar</h3>
        <p>
          VAK describe preferencias, no capacidades ni carreras. Comprueba qué
          técnicas mejoran realmente tu comprensión y recuerdo.
        </p>
      </div>
      <div className="career-grid learning-grid">
        {keys.map((key) => {
          const plan = LEARNING_PLANS[key];
          return (
            <article key={key}>
              <span className="area-label">
                Recursos{" "}
                {key === "A"
                  ? "visuales"
                  : key === "B"
                    ? "auditivos"
                    : "prácticos"}
              </span>
              <p>{plan.works}</p>
              <h4>Prueba durante dos semanas</h4>
              <ul>
                {plan.strategies.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h4>Desafío importante</h4>
              <p>{plan.challenge}</p>
            </article>
          );
        })}
      </div>
      <div className="next-steps">
        <h3>Comprueba qué te funciona</h3>
        <ol>
          <li>Elige una estrategia y úsala en una unidad concreta.</li>
          <li>Haz una prueba sin mirar el material después de 24 horas.</li>
          <li>
            Conserva la técnica solo si mejora comprensión, recuerdo o
            aplicación.
          </li>
        </ol>
      </div>
    </section>
  );
}

function AdminLogin({
  admin,
  authUser,
  onDone,
  onBack,
}: {
  admin: User | null;
  authUser: User | null;
  onDone: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (admin)
    return (
      <Panel back={onBack} title="Sesión administrativa activa">
        <button className="primary" onClick={onDone}>
          Abrir dashboard
        </button>
      </Panel>
    );

  // Authenticated but without the admin claim: no privileges in the app or
  // Firestore (rules require request.auth.token.admin == true).
  if (authUser && !admin) {
    return (
      <Panel back={onBack} title="Sin permisos de administración">
        <p>
          Tu cuenta está autenticada, pero aún no tiene el permiso de
          administrador (<code>claim "admin": true</code>) en Firebase.
        </p>
        <p>
          Contacta al administrador del sistema para habilitar tu acceso.
          Cuando se asigne la claim, cierra sesión y vuelve a entrar para
          renovar tu token.
        </p>
        <button
          className="secondary"
          onClick={async () => {
            await signOut(auth);
            onBack();
          }}
        >
          Cerrar sesión
        </button>
      </Panel>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onDone();
    } catch (err: any) {
      const code = String(err?.code || "");
      setError(
        code.includes("invalid-credential")
          ? "Correo o contraseña incorrectos."
          : code.includes("user-not-found")
            ? "No se encontró una cuenta con ese correo."
            : "No fue posible acceder. Verifica tus datos e inténtalo otra vez.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      back={onBack}
      title="Acceso de administración"
      subtitle="Área protegida para revisar participantes, respuestas e informes."
    >
      <form className="lookup" onSubmit={submit}>
        <label>
          Correo
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>
          {busy ? "Verificando…" : "Ingresar"}
        </button>
        {!error && (
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              setError("");
              try {
                await sendPasswordResetEmail(auth, email.trim());
                setError("Enviamos un correo para restablecer la contraseña.");
              } catch {
                setError("No pudimos enviar el correo de recuperación.");
              }
            }}
          >
            Olvidé mi contraseña
          </button>
        )}
      </form>
    </Panel>
  );
}

type AdminRecord = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

function AdminManagement() {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAdmins() {
    const snapshot = await getDocs(collection(db, "admins"));
    setAdmins(
      snapshot.docs.map(
        (item) => ({ id: item.id, ...item.data() }) as AdminRecord,
      ),
    );
  }

  useEffect(() => {
    loadAdmins().catch(() =>
      setMessage("No pudimos cargar los administradores."),
    );
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const secondary = initializeApp(
      firebaseConfig,
      `admin-invite-${Date.now()}`,
    );
    const secondaryAuth = getAuth(secondary);
    try {
      const temporaryPassword = `${randomCharacters(20)}a1!`;
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        normalizedEmail,
        temporaryPassword,
      );
      await setDoc(doc(db, "admins", credential.user.uid), {
        name: name.trim(),
        email: normalizedEmail,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || "(sistema)",
      });
      await sendPasswordResetEmail(auth, normalizedEmail);
      setName("");
      setEmail("");
      setMessage(
        `Administrador agregado. Enviamos a ${normalizedEmail} un correo para crear su contraseña.`,
      );
      await loadAdmins();
    } catch (err: any) {
      const code = String(err?.code || "");
      setMessage(
        code.includes("email-already-in-use")
          ? "Ese correo ya tiene una cuenta. Si no aparece en la lista, necesitará una revisión manual antes de asignarle acceso."
          : "No pudimos agregar al administrador. Revisa el correo e inténtalo nuevamente.",
      );
    } finally {
      await signOut(secondaryAuth).catch(() => undefined);
      await deleteApp(secondary).catch(() => undefined);
      setBusy(false);
    }
  }

  async function toggle(item: AdminRecord) {
    setMessage("");
    try {
      await updateDoc(doc(db, "admins", item.id), { active: !item.active });
      await loadAdmins();
    } catch {
      setMessage("No pudimos cambiar el acceso de ese administrador.");
    }
  }

  return (
    <section className="admin-management">
      <div>
        <span className="eyebrow">ADMINISTRADOR GENERAL</span>
        <h2>Gestionar administradores</h2>
        <p>
          Solo tú puedes conceder o retirar accesos. Los administradores podrán
          revisar participantes, respuestas e informes.
        </p>
      </div>
      <form onSubmit={invite} className="admin-invite-form">
        <label>
          Nombre
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del administrador"
          />
        </label>
        <label>
          Correo
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="persona@correo.cl"
          />
        </label>
        <button className="primary" disabled={busy}>
          {busy ? "Agregando…" : "Agregar administrador"}
        </button>
      </form>
      {message && <p className="admin-message">{message}</p>}
      {admins.length > 0 && (
        <div className="admin-list">
          {admins.map((item) => (
            <div key={item.id}>
              <span>
                <b>{item.name}</b>
                <small>{item.email}</small>
              </span>
              <button
                className={item.active ? "danger-button" : "table-action"}
                onClick={() => toggle(item)}
              >
                {item.active ? "Desactivar acceso" : "Reactivar acceso"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminDashboard({
  user,
  isSuperAdmin,
  onExit,
}: {
  user: User;
  isSuperAdmin: boolean;
  onExit: () => void;
}) {
  const [rows, setRows] = useState<
    Array<Participant & { submissions: Submission[] }>
  >([]);
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState<
    (Participant & { submissions: Submission[] }) | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const ps = await getDocs(collection(db, "participants"));
      const data = await Promise.all(
        ps.docs.map(async (p) => {
          const ss = await getDocs(
            collection(db, "participants", p.id, "submissions"),
          );
          return {
            id: p.id,
            ...p.data(),
            submissions: ss.docs.map((s) => s.data() as Submission),
          } as Participant & { submissions: Submission[] };
        }),
      );
      setRows(data);
      setBusy(false);
    })().catch(() => setBusy(false));
  }, []);
  function csv() {
    const lines = [
      ["Nombre", "Edad", "Celular", "Correo", "Grupo", "Código", "Tests"].join(
        ",",
      ),
      ...rows.map((r) =>
        [
          r.name,
          r.age,
          r.phone,
          r.email,
          r.group,
          displayCode(r.recoveryCode || r.id),
          r.submissions.map((s) => s.testType).join(" + "),
        ]
          .map((x) => `"${String(x).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv" }),
    );
    a.download = "participantes-portal-talentos.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function removeParticipant(
    participant: Participant & { submissions: Submission[] },
  ) {
    if (!isSuperAdmin) return;
    const confirmed = window.confirm(
      `¿Eliminar definitivamente a ${participant.name}? Se borrarán sus datos, respuestas, informes y acceso de recuperación. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setDeletingId(participant.id);
    try {
      const code = participant.recoveryCode || participant.id;
      const hash = await accessHash(participant.name, code);
      const batch = writeBatch(db);
      participant.submissions.forEach((submission) =>
        batch.delete(
          doc(
            db,
            "participants",
            participant.id,
            "submissions",
            submission.testType,
          ),
        ),
      );
      batch.delete(doc(db, "resultAccess", hash));
      batch.delete(doc(db, "participants", participant.id));
      await batch.commit();
      setRows((current) =>
        current.filter((item) => item.id !== participant.id),
      );
      setSelected(null);
    } catch {
      window.alert(
        "No pudimos eliminar el registro completo. Inténtalo nuevamente.",
      );
    } finally {
      setDeletingId(null);
    }
  }
  const completed = useMemo(
    () => rows.filter((r) => r.submissions.length > 0).length,
    [rows],
  );
  return (
    <section className="dashboard">
      <div className="dash-head">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h1>Dashboard de respuestas</h1>
        </div>
        <div>
          <button className="secondary" onClick={csv}>
            <Download /> Descargar CSV
          </button>
          <button className="secondary" onClick={onExit}>
            <LogOut /> Salir
          </button>
        </div>
      </div>
      {isSuperAdmin && <AdminManagement />}
      <div className="stats">
        <article>
          <UserRound />
          <span>
            <b>{rows.length}</b> participantes
          </span>
        </article>
        <article>
          <Check />
          <span>
            <b>{completed}</b> con respuestas
          </span>
        </article>
        <article>
          <BookOpen />
          <span>
            <b>{rows.reduce((n, r) => n + r.submissions.length, 0)}</b> tests
            completados
          </span>
        </article>
      </div>
      {busy ? (
        <div className="empty">Cargando datos…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Participante</th>
                <th>Edad</th>
                <th>Grupo</th>
                <th>Tests</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.name}</b>
                    <small>{r.email || r.phone}</small>
                  </td>
                  <td>{r.age}</td>
                  <td>{r.group}</td>
                  <td>{r.submissions.length}/2</td>
                  <td>
                    <button
                      className="table-action"
                      onClick={() => setSelected(r)}
                    >
                      Ver informe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="modal-back" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              ×
            </button>
            <h2>{selected.name}</h2>
            <p>
              {selected.age} años · {selected.group} · {selected.phone} ·{" "}
              {selected.email || "Sin correo"}
            </p>
            <p className="personal-code">
              Código: {displayCode(selected.recoveryCode || selected.id)}
            </p>
            {selected.submissions.map((s) => (
              <ResultCard key={s.testType} submission={s} />
            ))}
            <div className="modal-actions">
              <button className="primary" onClick={() => window.print()}>
                Imprimir informe
              </button>
              {isSuperAdmin && (
                <button
                  className="delete-record-button"
                  disabled={deletingId === selected.id}
                  onClick={() => removeParticipant(selected)}
                >
                  <Trash2 />
                  {deletingId === selected.id
                    ? "Eliminando…"
                    : "Eliminar registro"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Panel({
  back,
  title,
  subtitle,
  children,
}: {
  back?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel-page">
      {back && (
        <button className="back" onClick={back}>
          <ChevronLeft /> Volver
        </button>
      )}
      <article className="panel">
        <div className="panel-heading">
          <span className="brandmark">
            <Sparkles />
          </span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </article>
    </section>
  );
}
