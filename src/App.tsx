import { useState, useEffect, useRef, useCallback } from "react";
import { generateDecks, type GeneratedDecks } from "./groq";

// ─── Palette ──────────────────────────────────────────────────────────────────

const BLUE  = "#4599B8";
const RED   = "#E35878";
const INK   = "#1A1612";
const PAPER = "#FCF8E9";
const GRID  = "#6E6560";
const MUTED = "#5C5550";
const FAINT = "#8A837C";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 0 | 1 | 2 | 3 | 4;

interface State {
  started: boolean;
  phase: Phase;
  verbs: string[];
  chosenVerb: string;
  noun: string;
  mother: string;
  cantPhoto: boolean;
  rule: string;
  river: string;
  riverUsed: boolean;
  projectName: string;
  userCard: string;
  scaleCard: string;
  wildcardCard: string;
  userFlipped: boolean;
  scaleFlipped: boolean;
  wildcardFlipped: boolean;
  userCardUsed: boolean;
  scaleCardUsed: boolean;
  wildcardCardUsed: boolean;
  objName: string;
  objUser: string;
  objRelations: string;
  objPieces: string;
  fichaReviewed: boolean;
  answers: [boolean | null, boolean | null, boolean | null];
  generatedDecks: GeneratedDecks | null;
}

const INITIAL: State = {
  started: false,
  phase: 0,
  verbs: [], chosenVerb: "",
  noun: "", mother: "", cantPhoto: false, rule: "",
  river: "", riverUsed: false,
  projectName: "",
  userCard: "", scaleCard: "", wildcardCard: "",
  userFlipped: false, scaleFlipped: false, wildcardFlipped: false,
  userCardUsed: false, scaleCardUsed: false, wildcardCardUsed: false,
  objName: "", objUser: "", objRelations: "", objPieces: "",
  fichaReviewed: false,
  answers: [null, null, null],
  generatedDecks: null,
};

const PHASE_LABELS = ["Leer", "Desenterrar", "Saltar", "Construir", "Probar"];

const RIVERS   = ["duelo","fiesta","migración","máquina","barrio","silencio","fantasma","ruido","espíritu","utopía","enfermedad","tránsito","contagio","encierro"];
const USERS    = ["un booker","la abuela de un fan","una curadora de festival","un taxista","un DJ de barrio","una bibliotecaria"];
const SCALES   = ["cuesta menos de 5.000 pesos","solo lo tienen 12 personas","funciona sin internet","se vende en la calle","dura un solo día"];
const WILDCARDS= ["se destruye al usarse","el nombre del artista no aparece","cabe en un bolsillo","se hace con lo que hay en la casa"];

const INTROS: Record<Phase, { label: string; body: string }> = {
  0: { label: "Fase 01 / Leer", body: "Antes de crear, lee. Mira tu día y tu entorno: hiciste algo con las manos, te moviste de cierta forma, moldeaste un objeto. Anota los verbos sin juzgarlos. Los verbos menores sirven más que los grandes, porque un mundo motivado en el origen nace de algo real." },
  1: { label: "Fase 02 / Desenterrar", body: "Todo verbo esconde una fuerza. Convierte el verbo en carne, en un objeto, y súbelo un peldaño más, hasta que deje de ser una cosa y se vuelva una condición. Si se puede fotografiar, todavía es muy concreto. Esa condición es la madre de tu mundo, y de ella sale la regla." },
  2: { label: "Fase 03 / Saltar", body: "Un solo río hace un canal, no un mundo. Ahora vas a cruzar tu madre con un concepto ajeno que no escogiste. Tu proyecto vive en ese cruce. Si el cruce te incomoda, vas bien: el mundo es motivado en el origen y arbitrario en el destino." },
  3: { label: "Fase 04 / Construir", body: "Un mundo se conoce por sus objetos. Bautiza tu proyecto a partir de la regla, no del verbo, y diseña su primer objeto. Un objeto no se arma, se orienta: primero define quién lo tiene en la mano y qué hace con él, y después de qué está hecho." },
  4: { label: "Fase 05 / Probar", body: "La pregunta es una sola: ¿la regla sigue viva en el objeto, o solo le pusiste el nombre encima? Si el objeto funcionaría igual para cualquier otro artista, es decoración. Si la regla le cambió la forma, es un salto." },
};

function pick<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY = "umbral_v3";
function load(): State {
  try { const r = localStorage.getItem(KEY); if (r) return { ...INITIAL, ...JSON.parse(r) }; } catch {}
  return INITIAL;
}
function save(s: State) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: FAINT, fontFamily: "IBM Plex Mono" }}>{children}</p>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: MUTED }}>{children}</p>;
}
function FieldInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      className="w-full bg-transparent px-3 py-2.5 outline-none transition-colors"
      style={{ color: INK, border: `1px solid ${focus ? BLUE : GRID}` }}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    />
  );
}
function FieldTextarea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      className="w-full bg-transparent px-3 py-2.5 outline-none resize-none transition-colors"
      style={{ color: INK, border: `1px solid ${focus ? BLUE : GRID}` }}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    />
  );
}
function PrimaryBtn({ label, enabled, onClick }: { label: string; enabled: boolean; onClick: () => void }) {
  return (
    <button disabled={!enabled} onClick={onClick}
      className="w-full py-4 text-xs uppercase tracking-[0.18em] transition-all duration-200"
      style={{ background: enabled ? BLUE : "transparent", color: enabled ? "#fff" : FAINT, border: `1px solid ${enabled ? BLUE : FAINT}`, cursor: enabled ? "pointer" : "not-allowed" }}>
      {label}
    </button>
  );
}

// ─── FlipCard ─────────────────────────────────────────────────────────────────

function FlipCard({ label, value, flipped, used, onFlip, onRedraw }: {
  label: string; value: string; flipped: boolean; used: boolean; onFlip: () => void; onRedraw: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="card-flip" style={{ height: 150 }}>
        <div className={`card-inner ${flipped ? "flipped" : ""}`}>
          <div className="card-face flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{ border: `1px solid ${GRID}`, background: PAPER }}
            onClick={!flipped ? onFlip : undefined}>
            <span className="text-[9px] uppercase tracking-widest mb-3" style={{ color: MUTED }}>{label}</span>
            <span className="text-3xl" style={{ color: FAINT }}>◆</span>
            <span className="text-[9px] mt-3" style={{ color: FAINT }}>voltear</span>
          </div>
          <div className="card-face card-back flex flex-col items-center justify-center px-3 text-center"
            style={{ border: `1px solid ${BLUE}`, background: "#EBF4F8" }}>
            <span className="text-[9px] uppercase tracking-widest mb-2" style={{ color: BLUE }}>{label}</span>
            <span className="text-sm font-semibold leading-snug" style={{ fontFamily: "IBM Plex Mono", color: INK }}>{value}</span>
          </div>
        </div>
      </div>
      {flipped && !used && (
        <button className="text-[10px] uppercase tracking-widest py-1.5 transition-colors"
          style={{ border: `1px solid ${FAINT}`, color: FAINT }}
          onMouseOver={e => { e.currentTarget.style.borderColor = MUTED; e.currentTarget.style.color = MUTED; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = FAINT; e.currentTarget.style.color = FAINT; }}
          onClick={onRedraw}>
          otra vez
        </button>
      )}
    </div>
  );
}

// ─── Mobile intro accordion ───────────────────────────────────────────────────

function IntroAccordion({ phase }: { phase: Phase }) {
  const [open, setOpen] = useState(false);
  const intro = INTROS[phase];
  return (
    <div className="lg:hidden mb-5" style={{ border: `1px solid ${FAINT}` }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-widest"
        style={{ color: MUTED }}
        onClick={() => setOpen(o => !o)}>
        <span>{intro.label}</span>
        <span style={{ color: BLUE }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${FAINT}` }}>
          <p className="pt-3 leading-relaxed text-sm" style={{ fontFamily: "Newsreader", color: INK, opacity: 0.8 }}>
            {intro.body}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="phase-enter flex flex-col justify-center min-h-[60vh] max-w-xl">
      <p className="text-[10px] uppercase tracking-widest mb-8" style={{ color: BLUE }}>Entrada</p>
      <p className="leading-relaxed mb-4" style={{ fontFamily: "Newsreader", fontSize: "1.5rem", color: INK, lineHeight: 1.4 }}>
        Todo mundo nace de una partícula enana.
      </p>
      <p className="leading-relaxed mb-10" style={{ fontFamily: "Newsreader", fontSize: "1.1rem", color: INK, opacity: 0.7 }}>
        Aquí, empezamos por un movimiento: algo que hiciste hoy. Desde esa corriente, construye algo más amplio.
      </p>
      <button
        onClick={onStart}
        className="self-start px-8 py-4 text-xs uppercase tracking-[0.2em] transition-all duration-200"
        style={{ background: INK, color: PAPER, border: `1px solid ${INK}` }}
        onMouseOver={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.borderColor = BLUE; }}
        onMouseOut={e => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}>
        Comenzar →
      </button>
    </div>
  );
}

// ─── Phase 1: LEER ───────────────────────────────────────────────────────────

function Phase1({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !state.verbs.includes(v)) update({ verbs: [...state.verbs, v], chosenVerb: "" });
    setInput("");
  };
  const remove = (v: string) => {
    const next = state.verbs.filter(x => x !== v);
    update({ verbs: next, chosenVerb: state.chosenVerb === v ? "" : state.chosenVerb });
  };
  const canProceed = state.verbs.length >= 3 && !!state.chosenVerb;

  return (
    <div className="space-y-5">
      <div>
        <Label>Agrega verbos</Label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-transparent px-3 py-2.5 outline-none transition-colors"
            style={{ color: INK, border: `1px solid ${GRID}` }}
            onFocus={e => e.target.style.borderColor = BLUE}
            onBlur={e => e.target.style.borderColor = GRID}
            value={input} placeholder="ej. doblar, esperar, frotar..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
          />
          <button onClick={add} className="px-5 py-2 text-sm transition-colors"
            style={{ border: `1px solid ${GRID}`, color: INK }}
            onMouseOver={e => e.currentTarget.style.borderColor = INK}
            onMouseOut={e => e.currentTarget.style.borderColor = GRID}>+</button>
        </div>
        <Hint>verbos pequeños y concretos: doblar, esperar, reparar, circular, frotar</Hint>
      </div>

      {state.verbs.length > 0 && (
        <div>
          <Label>Elige uno</Label>
          <div style={{ border: `1px solid ${GRID}` }}>
            {state.verbs.map((v, i) => (
              <div key={v} className="flex items-center"
                style={{ borderTop: i > 0 ? `1px solid ${FAINT}` : "none" }}>
                <button
                  className="flex-1 text-left px-4 py-3 text-sm transition-colors"
                  style={{ background: state.chosenVerb === v ? BLUE : "transparent", color: state.chosenVerb === v ? "#fff" : INK, fontFamily: "IBM Plex Mono" }}
                  onClick={() => update({ chosenVerb: v })}>
                  {state.chosenVerb === v ? "→ " : "   "}{v}
                </button>
                <button
                  className="px-3 py-3 text-xs transition-colors"
                  style={{ color: state.chosenVerb === v ? "rgba(255,255,255,0.6)" : FAINT }}
                  onClick={() => remove(v)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.verbs.length < 3 && (
        <p className="text-[11px]" style={{ color: MUTED }}>
          {Math.max(0, 3 - state.verbs.length)} verbo{3 - state.verbs.length !== 1 ? "s" : ""} más antes de elegir
        </p>
      )}
      <PrimaryBtn label="Desenterrar →" enabled={canProceed} onClick={() => update({ phase: 1 })} />
    </div>
  );
}

// ─── Phase 2: DESENTERRAR ────────────────────────────────────────────────────

function Phase2({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const [generating, setGenerating] = useState(false);
  const [groqError, setGroqError] = useState<string | null>(null);
  const tooConcreteBlock = !!(state.mother && !state.cantPhoto);
  const canProceed = !!(state.noun && state.mother && state.rule && state.cantPhoto);

  const handleAdvance = async () => {
    setGenerating(true);
    setGroqError(null);
    try {
      const decks = await generateDecks(state.chosenVerb, state.noun, state.mother, state.rule);
      update({ phase: 2, generatedDecks: decks });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGroqError(msg);
      // Fall back to static decks after showing error briefly
      setTimeout(() => {
        update({ phase: 2 });
        setGroqError(null);
      }, 3000);
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 px-3 py-1.5" style={{ border: `1px solid ${BLUE}` }}>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: BLUE }}>verbo</span>
        <span className="text-sm" style={{ fontFamily: "Newsreader", color: INK }}>{state.chosenVerb}</span>
      </div>

      <div>
        <Label>Conviértelo en sustantivo</Label>
        <FieldInput value={state.noun} onChange={v => update({ noun: v })} placeholder="ej. doblez, encierro, fricción..." />
        <Hint>doblar → doblez. Un sustantivo que nombra sin explicar.</Hint>
      </div>

      <div>
        <Label>¿Cuál es la ley detrás del sustantivo?</Label>
        <FieldInput value={state.mother} onChange={v => update({ mother: v })} placeholder="ej. pliegue, deuda, umbral..." />
        <Hint>doblez → pliegue. Debe sonar a ley, no a acción. Esta es la madre.</Hint>
      </div>

      <div>
        <Label>¿No se puede fotografiar directamente?</Label>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
            style={{ border: `1px solid ${state.cantPhoto ? BLUE : GRID}`, background: state.cantPhoto ? BLUE : "transparent" }}
            onClick={() => update({ cantPhoto: !state.cantPhoto })}>
            {state.cantPhoto && <span className="text-white text-xs leading-none">✓</span>}
          </div>
          <span className="text-sm leading-snug" style={{ fontFamily: "Newsreader", color: INK }}>
            La condición existe pero no tiene imagen directa.
          </span>
        </label>
        {tooConcreteBlock && (
          <p className="text-xs mt-2 px-3 py-2.5" style={{ color: RED, border: `1px solid ${RED}` }}>
            Todavía es muy concreto: sube un peldaño más. ¿Se puede fotografiar? Si la respuesta es sí, la madre todavía no es una ley.
          </p>
        )}
        <Hint>"pliegue" no tiene foto; "papel doblado" sí — eso es demasiado concreto.</Hint>
      </div>

      <div>
        <Label>La regla del mundo</Label>
        <div style={{ border: `1px solid ${GRID}` }}>
          <div className="px-3 py-2 text-xs select-none" style={{ color: MUTED, borderBottom: `1px solid ${FAINT}`, fontFamily: "IBM Plex Mono" }}>
            En este mundo, todo —
          </div>
          <textarea className="w-full bg-transparent px-3 py-2.5 outline-none resize-none" style={{ color: INK }}
            rows={2} value={state.rule} onChange={e => update({ rule: e.target.value })} placeholder="completa la regla..." />
        </div>
        <Hint>ej. "es la versión de prueba de otra cosa que nunca llega"</Hint>
      </div>

      {groqError && (
        <p className="text-[11px] px-3 py-2 leading-relaxed" style={{ color: RED, border: `1px solid ${RED}` }}>
          Error Groq: {groqError}
        </p>
      )}
      <PrimaryBtn
        label={generating ? "Generando tu mundo..." : "Saltar →"}
        enabled={canProceed && !generating}
        onClick={handleAdvance}
      />
    </div>
  );
}

// ─── Phase 3: SALTAR ─────────────────────────────────────────────────────────

function Phase3({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const rivers = state.generatedDecks?.rivers ?? RIVERS;
  const draw = () => {
    const r = pick(rivers, state.river || undefined);
    update({ river: r, riverUsed: state.river !== "" });
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div style={{ border: `1px solid ${BLUE}`, padding: "12px 14px" }}>
          <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ color: BLUE }}>madre</span>
          <p className="text-sm" style={{ fontFamily: "Newsreader", color: INK }}>{state.mother}</p>
        </div>
        <div className="flex flex-col items-center justify-center" style={{ border: `1px solid ${GRID}`, padding: "12px 14px" }}>
          <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ color: MUTED }}>río</span>
          {state.river
            ? <p className="text-sm font-semibold" style={{ fontFamily: "Newsreader", color: BLUE }}>{state.river}</p>
            : <span style={{ color: FAINT, fontSize: "1.5rem" }}>?</span>}
        </div>
      </div>

      {state.river && (
        <div className="py-5 text-center" style={{ border: `1px solid ${INK}` }}>
          <span className="text-[9px] uppercase tracking-widest block mb-2" style={{ color: MUTED }}>el cruce</span>
          <p style={{ fontFamily: "Newsreader", fontSize: "1.25rem" }}>
            <span style={{ color: BLUE }}>{state.mother}</span>
            <span style={{ color: RED, margin: "0 12px" }}>×</span>
            <span style={{ color: BLUE }}>{state.river}</span>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button className="flex-1 py-3 text-xs uppercase tracking-widest transition-colors"
          style={{ background: BLUE, color: "#fff", border: `1px solid ${BLUE}`, opacity: state.riverUsed ? 0.35 : 1, cursor: state.riverUsed ? "not-allowed" : "pointer" }}
          onClick={draw} disabled={state.riverUsed}>
          {state.river ? "nuevo río" : "saca un río"}
        </button>
        {state.river && !state.riverUsed && (
          <button className="px-5 py-3 text-xs uppercase tracking-widest transition-colors"
            style={{ border: `1px solid ${FAINT}`, color: FAINT }}
            onMouseOver={e => { e.currentTarget.style.borderColor = MUTED; e.currentTarget.style.color = MUTED; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = FAINT; e.currentTarget.style.color = FAINT; }}
            onClick={draw}>otra vez</button>
        )}
      </div>
      {state.riverUsed && <p className="text-[11px]" style={{ color: MUTED }}>solo puedes volver a sacar una vez</p>}

      <PrimaryBtn label="Construir →" enabled={!!state.river} onClick={() => update({ phase: 3 })} />
    </div>
  );
}

// ─── Phase 4: CONSTRUIR ──────────────────────────────────────────────────────

function Phase4({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const users     = state.generatedDecks?.users     ?? USERS;
  const scales    = state.generatedDecks?.scales    ?? SCALES;
  const wildcards = state.generatedDecks?.wildcards ?? WILDCARDS;

  useEffect(() => {
    if (!state.userCard)     update({ userCard: pick(users) });
    if (!state.scaleCard)    update({ scaleCard: pick(scales) });
    if (!state.wildcardCard) update({ wildcardCard: pick(wildcards) });
  }, []);

  const missing: string[] = [];
  if (!state.projectName)  missing.push("nombre del proyecto");
  if (!state.userFlipped)  missing.push("carta Usuario");
  if (!state.scaleFlipped) missing.push("carta Escala");
  if (!state.wildcardFlipped) missing.push("carta Comodín");
  if (!state.objName)  missing.push("nombre del objeto");
  if (!state.objUser)  missing.push("usuario y uso");
  if (!state.objPieces) missing.push("tres piezas");
  const canProceed = missing.length === 0;

  const fields = [
    { label: "Nombre del objeto", key: "objName", ph: "ej. el mapa del ruido, la partitura ciega...", rows: 1 },
    { label: "Usuario y qué hace con él", key: "objUser", ph: "ej. un taxista lo escucha en su turno de noche...", rows: 2 },
    { label: "Relaciones con otros objetos", key: "objRelations", ph: "ej. convive con el silencio entre canciones...", rows: 2 },
    { label: "Tres piezas que lo componen", key: "objPieces", ph: "ej. un sonido, una instrucción, un tiempo límite", rows: 2 },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <Label>Nombre del proyecto musical</Label>
        <Hint>a partir de la regla, no del verbo</Hint>
        <div className="mt-2">
          <FieldInput value={state.projectName} onChange={v => update({ projectName: v })} placeholder="ej. Provisionalidad, El índice..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FlipCard label="Usuario" value={state.userCard} flipped={state.userFlipped} used={state.userCardUsed}
          onFlip={() => update({ userFlipped: true })}
          onRedraw={() => update({ userCard: pick(users, state.userCard), userCardUsed: true })} />
        <FlipCard label="Escala" value={state.scaleCard} flipped={state.scaleFlipped} used={state.scaleCardUsed}
          onFlip={() => update({ scaleFlipped: true })}
          onRedraw={() => update({ scaleCard: pick(scales, state.scaleCard), scaleCardUsed: true })} />
        <div className="col-span-2 sm:col-span-1">
          <FlipCard label="Comodín" value={state.wildcardCard} flipped={state.wildcardFlipped} used={state.wildcardCardUsed}
            onFlip={() => update({ wildcardFlipped: true })}
            onRedraw={() => update({ wildcardCard: pick(wildcards, state.wildcardCard), wildcardCardUsed: true })} />
        </div>
      </div>
      <Hint>las cartas son restricciones, no sugerencias: el objeto las obedece</Hint>

      <div className="space-y-4 pt-3" style={{ borderTop: `1px solid ${FAINT}` }}>
        <Label>Ficha del objeto</Label>
        {fields.map(({ label, key, ph, rows }) => (
          <div key={key}>
            <Label>{label}</Label>
            <FieldTextarea value={state[key as keyof State] as string} onChange={v => update({ [key]: v })} placeholder={ph} rows={rows} />
          </div>
        ))}
      </div>

      {!canProceed && missing.length > 0 && (
        <p className="text-[11px] leading-relaxed" style={{ color: FAINT }}>
          falta: {missing.join(", ")}
        </p>
      )}
      <PrimaryBtn label="Probar →" enabled={canProceed} onClick={() => update({ phase: 4 })} />
    </div>
  );
}

// ─── Phase 5: PROBAR ─────────────────────────────────────────────────────────

const RUBRIC = [
  "¿La regla cambia la forma del objeto?",
  "¿Funcionaría igual para cualquier otro artista?",
  "¿Alguien que lea solo la regla podría imaginar cómo suena este mundo?",
];

function Ficha({ state }: { state: State }) {
  return (
    <div className="p-5 space-y-3" style={{ border: `1px solid ${INK}`, background: PAPER }}>
      <p className="text-[10px] uppercase tracking-widest pb-2" style={{ color: MUTED, borderBottom: `1px solid ${FAINT}` }}>
        Umbral — ficha de mundo
      </p>
      {[
        { label: "Verbo",    value: state.chosenVerb },
        { label: "Madre",    value: state.mother },
        { label: "Regla",    value: `En este mundo, todo ${state.rule}` },
        { label: "Cruce",    value: `${state.mother} × ${state.river}` },
        { label: "Proyecto", value: state.projectName },
        { label: "Objeto",   value: state.objName },
      ].map(({ label, value }) => (
        <div key={label} className="grid gap-2" style={{ gridTemplateColumns: "72px 1fr" }}>
          <span className="text-[10px] uppercase tracking-widest pt-0.5" style={{ color: MUTED }}>{label}</span>
          <span style={{ fontFamily: "Newsreader", fontSize: "0.95rem", color: INK }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function Phase5({ state, update, onRestart }: { state: State; update: (s: Partial<State>) => void; onRestart: (seed: string) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const setAnswer = (i: number, val: boolean) => {
    const next = [...state.answers] as [boolean | null, boolean | null, boolean | null];
    next[i] = val;
    update({ answers: next });
  };

  const allAnswered = state.answers.every(a => a !== null);
  const salto = allAnswered && state.answers[0] === true && state.answers[1] === false && state.answers[2] === true;
  const result = allAnswered
    ? salto
      ? { label: "Salto", color: BLUE, note: "La regla opera como forma. Este mundo tiene su propia gravedad." }
      : { label: "Decoración", color: RED, note: "La regla todavía no transforma el objeto." }
    : null;

  const download = async () => {
    const el = cardRef.current; if (!el) return;
    try {
      const { default: h2c } = await import("html2canvas");
      const canvas = await h2c(el, { scale: 2, backgroundColor: PAPER });
      const a = document.createElement("a");
      a.download = `umbral-${state.projectName || "ficha"}.png`;
      a.href = canvas.toDataURL("image/png"); a.click();
    } catch { alert("No se pudo generar la imagen."); }
  };

  // Pause: show ficha only first, then rubric
  if (!state.fichaReviewed) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            Antes de evaluar — revisa lo que construiste
          </p>
          <div ref={cardRef}><Ficha state={state} /></div>
        </div>
        <button
          className="w-full py-4 text-xs uppercase tracking-[0.18em] transition-all duration-200"
          style={{ background: INK, color: PAPER, border: `1px solid ${INK}` }}
          onMouseOver={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.borderColor = BLUE; }}
          onMouseOut={e => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}
          onClick={() => update({ fichaReviewed: true })}>
          Listo, evaluar →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={cardRef}><Ficha state={state} /></div>

      <div className="space-y-3">
        <Label>Rúbrica</Label>
        {RUBRIC.map((q, i) => (
          <div key={i} className="p-4" style={{ border: `1px solid ${FAINT}` }}>
            <p className="text-sm mb-3 leading-snug" style={{ fontFamily: "Newsreader", color: INK }}>{q}</p>
            <div className="flex gap-3">
              {[true, false].map(val => {
                const active = state.answers[i] === val;
                return (
                  <button key={String(val)} className="px-5 py-2 text-xs uppercase tracking-widest transition-colors"
                    style={{ border: `1px solid ${active ? BLUE : GRID}`, background: active ? BLUE : "transparent", color: active ? "#fff" : INK }}
                    onClick={() => setAnswer(i, val)}>
                    {val ? "Sí" : "No"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="px-5 py-6 text-center" style={{ border: `2px solid ${result.color}` }}>
          <p className="text-4xl tracking-widest uppercase mb-2" style={{ fontFamily: "IBM Plex Mono", color: result.color }}>
            {result.label}
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "Newsreader", color: MUTED }}>{result.note}</p>
          {result.label === "Decoración" && (
            <div className="text-left mt-3 space-y-2 pt-3" style={{ borderTop: `1px solid ${FAINT}` }}>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: RED }}>para diagnosticar</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                · ¿La madre todavía se puede fotografiar? Sube otro peldaño.<br/>
                · ¿El nombre del proyecto viene del verbo, no de la regla? Renómbralo.<br/>
                · ¿El objeto funcionaría en otro mundo? La regla no entró en su forma.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cierre — siempre visible */}
      <div className="pt-4" style={{ borderTop: `1px solid ${FAINT}` }}>
        <p className="text-sm leading-relaxed" style={{ fontFamily: "Newsreader", color: MUTED }}>
          Tu objeto terminado no es el final, es lo siguiente que vas a leer. Todo mundo crece así: cada objeto se vuelve la semilla de la próxima vuelta.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button className="w-full py-3.5 text-xs uppercase tracking-widest transition-colors"
          style={{ border: `1px solid ${GRID}`, color: INK }}
          onMouseOver={e => e.currentTarget.style.borderColor = INK}
          onMouseOut={e => e.currentTarget.style.borderColor = GRID}
          onClick={download}>
          Descargar ficha
        </button>
        <button className="w-full py-3.5 text-xs uppercase tracking-widest transition-colors"
          style={{ border: `1px solid ${RED}`, color: RED }}
          onClick={() => onRestart(state.objName)}>
          ← Nueva vuelta
        </button>
      </div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function PhaseNav({ phase, maxReached, onGo }: { phase: Phase; maxReached: Phase; onGo: (p: Phase) => void }) {
  return (
    <>
      {/* Desktop: full tabs */}
      <div className="hidden sm:flex items-stretch" style={{ borderBottom: `1px solid ${FAINT}` }}>
        {PHASE_LABELS.map((label, i) => {
          const active = i === phase;
          const done = i < maxReached || (i < phase);
          const reachable = i <= maxReached;
          return (
            <button key={label} disabled={!reachable} onClick={() => reachable && onGo(i as Phase)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
              style={{ borderRight: i < PHASE_LABELS.length - 1 ? `1px solid ${FAINT}` : "none", borderBottom: active ? `2px solid ${BLUE}` : "2px solid transparent", marginBottom: -1, cursor: reachable ? "pointer" : "not-allowed", background: "transparent" }}>
              {done && !active && <span className="text-[9px]" style={{ color: BLUE }}>✓</span>}
              <span className="text-[10px] tracking-widest uppercase transition-colors"
                style={{ color: active ? BLUE : done ? MUTED : FAINT, fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile: compact arrow nav */}
      <div className="flex sm:hidden items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${FAINT}` }}>
        <button
          disabled={phase === 0}
          onClick={() => phase > 0 && onGo((phase - 1) as Phase)}
          className="text-xs uppercase tracking-widest transition-colors"
          style={{ color: phase === 0 ? FAINT : MUTED, cursor: phase === 0 ? "not-allowed" : "pointer" }}>
          ←
        </button>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: BLUE }}>
          {phase + 1} / {PHASE_LABELS.length} — {PHASE_LABELS[phase]}
        </span>
        <button
          disabled={phase >= maxReached || phase === 4}
          onClick={() => phase < maxReached && onGo((phase + 1) as Phase)}
          className="text-xs uppercase tracking-widest transition-colors"
          style={{ color: phase >= maxReached || phase === 4 ? FAINT : MUTED, cursor: (phase >= maxReached || phase === 4) ? "not-allowed" : "pointer" }}>
          →
        </button>
      </div>
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState<State>(load);
  const [animKey, setAnimKey] = useState(0);
  const [maxReached, setMaxReached] = useState<Phase>(() => load().phase);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const update = useCallback((partial: Partial<State>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      save(next);
      setSavedAt(Date.now());
      return next;
    });
    if (partial.phase !== undefined) {
      const p = partial.phase as Phase;
      setMaxReached(m => (p > m ? p : m));
      setAnimKey(k => k + 1);
    }
  }, []);

  const goTo = (p: Phase) => {
    setState(prev => { const next = { ...prev, phase: p }; save(next); return next; });
    setAnimKey(k => k + 1);
  };

  const restart = (seed: string) => {
    const fresh: State = { ...INITIAL, started: true, verbs: seed ? [seed] : [] };
    save(fresh);
    setState(fresh);
    setMaxReached(0);
    setAnimKey(k => k + 1);
  };

  const renderPhase = () => {
    if (!state.started) return <Welcome onStart={() => update({ started: true })} />;
    switch (state.phase) {
      case 0: return <Phase1 state={state} update={update} />;
      case 1: return <Phase2 state={state} update={update} />;
      case 2: return <Phase3 state={state} update={update} />;
      case 3: return <Phase4 state={state} update={update} />;
      case 4: return <Phase5 state={state} update={update} onRestart={restart} />;
    }
  };

  // "Guardado" indicator fades after 2s
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (savedAt === null) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  return (
    <div className="min-h-screen relative" style={{ background: PAPER }}>
      <div className="grid-paper" />

      {/* Contour decoration */}
      <div className="hidden lg:block fixed top-0 right-0 pointer-events-none"
        style={{ width: "38vw", height: "100vh", overflow: "hidden", zIndex: 1, opacity: 0.14 }}>
        <img src="/assets/4df8b.svg" alt="" className="absolute"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left center" }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div style={{ background: PAPER }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-baseline justify-between">
            {/* Riso misregistration on UMBRAL */}
            <h1
              className="riso-text tracking-[0.3em] uppercase text-sm"
              data-text="Umbral"
              style={{ fontFamily: "IBM Plex Mono", color: INK }}>
              Umbral
            </h1>
            <div className="flex items-center gap-5">
              <span
                className="text-[10px] tracking-widest transition-opacity duration-500"
                style={{ color: BLUE, opacity: showSaved ? 1 : 0 }}>
                guardado
              </span>
              <span className="text-[10px] tracking-widest hidden sm:block" style={{ color: MUTED }}>
                construcción de mundos
              </span>
              {state.started && (
                <button
                  className="text-[10px] uppercase tracking-widest transition-colors pb-0.5"
                  style={{ color: FAINT, borderBottom: `1px solid ${FAINT}` }}
                  onMouseOver={e => { e.currentTarget.style.color = RED; e.currentTarget.style.borderColor = RED; }}
                  onMouseOut={e => { e.currentTarget.style.color = FAINT; e.currentTarget.style.borderColor = FAINT; }}
                  onClick={() => {
                    if (confirm("¿Empezar de cero? Se perderá el mundo actual.")) {
                      const fresh: State = { ...INITIAL };
                      save(fresh);
                      setState(fresh);
                      setMaxReached(0);
                      setAnimKey(k => k + 1);
                    }
                  }}>
                  reiniciar
                </button>
              )}
            </div>
          </div>
          {state.started && <div className="max-w-7xl mx-auto px-6 lg:px-12"><PhaseNav phase={state.phase} maxReached={maxReached} onGo={goTo} /></div>}
        </div>

        {/* Body */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 lg:py-16">
          {!state.started ? (
            <div key={animKey} className="phase-enter">{renderPhase()}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20">
              {/* Left: intro */}
              <div className="lg:sticky lg:top-16 lg:self-start">
                <div key={`intro-${state.phase}`} className="phase-enter">
                  <IntroAccordion phase={state.phase} />
                  <div className="hidden lg:block">
                    <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: BLUE }}>
                      {INTROS[state.phase].label}
                    </p>
                    <p className="leading-relaxed" style={{ fontFamily: "Newsreader", fontSize: "1.05rem", color: INK, opacity: 0.8 }}>
                      {INTROS[state.phase].body}
                    </p>
                  </div>
                </div>
                {state.phase > 0 && (
                  <button
                    className="hidden lg:block mt-10 text-xs uppercase tracking-widest transition-colors pb-0.5"
                    style={{ color: FAINT, borderBottom: `1px solid ${FAINT}` }}
                    onMouseOver={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = MUTED; }}
                    onMouseOut={e => { e.currentTarget.style.color = FAINT; e.currentTarget.style.borderColor = FAINT; }}
                    onClick={() => goTo((state.phase - 1) as Phase)}>
                    ← {PHASE_LABELS[state.phase - 1]}
                  </button>
                )}
              </div>

              {/* Right: form */}
              <div>
                <div key={animKey} className="phase-enter">{renderPhase()}</div>
                {state.phase > 0 && (
                  <button className="lg:hidden mt-6 text-xs uppercase tracking-widest" style={{ color: FAINT }}
                    onClick={() => goTo((state.phase - 1) as Phase)}>
                    ← {PHASE_LABELS[state.phase - 1]}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {state.started && (
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-4 flex justify-end"
            style={{ borderTop: `1px solid ${FAINT}` }}>
            <span className="text-[10px] tracking-widest" style={{ color: FAINT }}>
              {state.phase + 1} / {PHASE_LABELS.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
