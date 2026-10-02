import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = "#4599B8";
const INK  = "#1A1612";
const PAPER = "#F0EBE3";
const GRID  = "#6E6560";
const MUTED = "#5C5550";
const FAINT = "#8A837C";

type Phase = 0 | 1 | 2 | 3 | 4;

interface State {
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
  objName: string;
  objUser: string;
  objRelations: string;
  objPieces: string;
  answers: [boolean | null, boolean | null, boolean | null];
}

const INITIAL: State = {
  phase: 0, verbs: [], chosenVerb: "",
  noun: "", mother: "", cantPhoto: false, rule: "",
  river: "", riverUsed: false,
  projectName: "", userCard: "", scaleCard: "", wildcardCard: "",
  userFlipped: false, scaleFlipped: false, wildcardFlipped: false,
  objName: "", objUser: "", objRelations: "", objPieces: "",
  answers: [null, null, null],
};

const PHASE_LABELS = ["Leer", "Desenterrar", "Saltar", "Construir", "Probar"];

const RIVERS = ["duelo","fiesta","migración","máquina","barrio","silencio",
  "fantasma","ruido","espíritu","utopía","enfermedad","tránsito","contagio","encierro"];
const USERS = ["un booker","la abuela de un fan","una curadora de festival",
  "un taxista","un DJ de barrio","una bibliotecaria"];
const SCALES = ["cuesta menos de 5.000 pesos","solo lo tienen 12 personas",
  "funciona sin internet","se vende en la calle","dura un solo día"];
const WILDCARDS = ["se destruye al usarse","el nombre del artista no aparece",
  "cabe en un bolsillo","se hace con lo que hay en la casa"];

// Intro texts
const INTROS: Record<Phase, { label: string; body: string }> = {
  0: {
    label: "Entrada",
    body: "Todo mundo nace de una partícula enana. Aquí, empezamos por un movimiento: algo que hiciste hoy. Desde esa corriente, construye algo más amplio.",
  },
  1: {
    label: "Fase 01 / Leer",
    body: "Antes de crear, lee. Mira tu día y tu entorno: hiciste algo con las manos, te moviste de cierta forma, moldeaste un objeto. Anota los verbos sin juzgarlos. Los verbos menores sirven más que los grandes, porque un mundo motivado en el origen nace de algo real.",
  },
  2: {
    label: "Fase 02 / Desenterrar",
    body: "Todo verbo esconde una fuerza. Convierte el verbo en carne, en un objeto, y súbelo un peldaño más, hasta que deje de ser una cosa y se vuelva una condición. Si se puede fotografiar, todavía es muy concreto. Esa condición es la madre de tu mundo, y de ella sale la regla.",
  },
  3: {
    label: "Fase 03 / Saltar",
    body: "Un solo río hace un canal, no un mundo. Ahora vas a cruzar tu madre con un concepto ajeno que no escogiste. Tu proyecto vive en ese cruce. Si el cruce te incomoda, vas bien.",
  },
  4: {
    label: "Fase 04 / Construir",
    body: "Un mundo se conoce por sus objetos. Bautiza tu proyecto a partir de la regla, no del verbo, y diseña su primer objeto. Un objeto no se arma, se orienta: primero define quién lo tiene en la mano.",
  },
};

function pick<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY = "umbral_v2";
function load(): State {
  try { const r = localStorage.getItem(KEY); if (r) return { ...INITIAL, ...JSON.parse(r) }; } catch {}
  return INITIAL;
}
function save(s: State) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

// ─── Shared components ────────────────────────────────────────────────────────

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: MUTED, fontFamily: "IBM Plex Mono" }}>{children}</p>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: MUTED }}>{children}</p>;
}

function Field({ children, focus }: { children: React.ReactNode; focus?: boolean }) {
  return (
    <div className="transition-colors" style={{ border: `1px solid ${focus ? BLUE : GRID}` }}>
      {children}
    </div>
  );
}

function FieldInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="w-full bg-transparent px-3 py-2.5 outline-none"
      style={{ color: INK, border: `1px solid ${GRID}` }}
      onFocus={e => e.target.style.borderColor = BLUE}
      onBlur={e => e.target.style.borderColor = GRID}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function FieldTextarea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      className="w-full bg-transparent px-3 py-2.5 outline-none resize-none"
      style={{ color: INK, border: `1px solid ${GRID}` }}
      onFocus={e => e.target.style.borderColor = BLUE}
      onBlur={e => e.target.style.borderColor = GRID}
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// Primary action button (advance)
function PrimaryBtn({ label, enabled, onClick }: { label: string; enabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      className="w-full py-4 text-xs uppercase tracking-[0.18em] transition-all duration-200"
      style={{
        background: enabled ? BLUE : "transparent",
        color: enabled ? "#fff" : FAINT,
        border: `1px solid ${enabled ? BLUE : FAINT}`,
        cursor: enabled ? "pointer" : "not-allowed",
      }}
    >
      {label}
    </button>
  );
}

// ─── FlipCard ─────────────────────────────────────────────────────────────────

function FlipCard({ label, value, flipped, onFlip }: { label: string; value: string; flipped: boolean; onFlip: () => void }) {
  return (
    <div className="card-flip" style={{ height: 130 }}>
      <div className={`card-inner ${flipped ? "flipped" : ""}`}>
        <div
          className="card-face flex flex-col items-center justify-center cursor-pointer transition-colors"
          style={{ border: `1px solid ${GRID}`, background: PAPER }}
          onClick={!flipped ? onFlip : undefined}
        >
          <span className="text-[9px] uppercase tracking-widest mb-2" style={{ color: MUTED }}>{label}</span>
          <span className="text-2xl" style={{ color: FAINT }}>◆</span>
          <span className="text-[9px] mt-2" style={{ color: FAINT }}>voltear</span>
        </div>
        <div
          className="card-face card-back flex flex-col items-center justify-center px-3 text-center"
          style={{ border: `1px solid ${BLUE}`, background: "#EBF4F8" }}
        >
          <span className="text-[9px] uppercase tracking-widest mb-2" style={{ color: BLUE }}>{label}</span>
          <span className="text-sm font-semibold leading-snug" style={{ fontFamily: "IBM Plex Mono", color: INK }}>{value}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Intro panel (left column) ────────────────────────────────────────────────

function IntroPanel({ phase }: { phase: Phase }) {
  const intro = INTROS[phase] ?? INTROS[0];
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: BLUE }}>{intro.label}</p>
        <p
          className="leading-relaxed"
          style={{ fontFamily: "Newsreader", fontSize: "1.05rem", color: INK, opacity: 0.8 }}
        >
          {intro.body}
        </p>
      </div>
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
  const canProceed = state.verbs.length >= 3 && !!state.chosenVerb;

  return (
    <div className="space-y-5">
      <div>
        <Label>Agrega verbos</Label>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-transparent px-3 py-2.5 outline-none"
            style={{ border: `1px solid ${GRID}`, color: INK }}
            onFocus={e => e.target.style.borderColor = BLUE}
            onBlur={e => e.target.style.borderColor = GRID}
            value={input}
            placeholder="escribe un verbo..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
          />
          <button
            onClick={add}
            className="px-5 py-2 text-sm transition-colors"
            style={{ border: `1px solid ${GRID}`, color: INK }}
            onMouseOver={e => (e.currentTarget.style.borderColor = INK)}
            onMouseOut={e => (e.currentTarget.style.borderColor = GRID)}
          >+</button>
        </div>
        <Hint>ej. doblar, esperar, reparar, circular, frotar</Hint>
      </div>

      {state.verbs.length > 0 && (
        <div>
          <Label>Elige uno</Label>
          <div style={{ border: `1px solid ${GRID}` }}>
            {state.verbs.map((v, i) => (
              <button
                key={v}
                className="w-full text-left px-4 py-3 text-sm transition-colors"
                style={{
                  borderTop: i > 0 ? `1px solid ${FAINT}` : "none",
                  background: state.chosenVerb === v ? BLUE : "transparent",
                  color: state.chosenVerb === v ? "#fff" : INK,
                  fontFamily: "IBM Plex Mono",
                }}
                onClick={() => update({ chosenVerb: v })}
              >
                {state.chosenVerb === v ? "→ " : "   "}{v}
              </button>
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
  const tooConcreteBlock = !!(state.mother && !state.cantPhoto);
  const canProceed = !!(state.noun && state.mother && state.rule && state.cantPhoto);

  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 px-3 py-1.5" style={{ border: `1px solid ${BLUE}` }}>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: BLUE }}>verbo</span>
        <span className="text-sm" style={{ fontFamily: "Newsreader", color: INK }}>{state.chosenVerb}</span>
      </div>

      <div>
        <Label>Conviértelo en sustantivo</Label>
        <FieldInput value={state.noun} onChange={v => update({ noun: v })} placeholder="el sustantivo..." />
        <Hint>ej. doblar → doblez</Hint>
      </div>

      <div>
        <Label>Súbelo a condición — la madre</Label>
        <FieldInput value={state.mother} onChange={v => update({ mother: v })} placeholder="la condición madre..." />
        <Hint>ej. doblez → pliegue. Debe sonar a ley, no a acción.</Hint>
      </div>

      <div>
        <Label>¿No se puede fotografiar directamente?</Label>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
            style={{ border: `1px solid ${state.cantPhoto ? BLUE : GRID}`, background: state.cantPhoto ? BLUE : "transparent" }}
            onClick={() => update({ cantPhoto: !state.cantPhoto })}
          >
            {state.cantPhoto && <span className="text-white text-xs leading-none">✓</span>}
          </div>
          <span className="text-sm leading-snug" style={{ fontFamily: "Newsreader", color: INK }}>
            La condición existe pero no tiene imagen directa.
          </span>
        </label>
        {tooConcreteBlock && (
          <p className="text-xs mt-2 px-3 py-2" style={{ color: BLUE, border: `1px solid ${BLUE}` }}>
            Todavía es muy concreto: sube un peldaño más.
          </p>
        )}
        <Hint>ej. "pliegue" no tiene foto; "papel doblado" sí — eso es demasiado concreto.</Hint>
      </div>

      <div>
        <Label>La regla del mundo</Label>
        <div style={{ border: `1px solid ${GRID}` }}>
          <div className="px-3 py-2 text-xs" style={{ color: MUTED, borderBottom: `1px solid ${FAINT}`, fontFamily: "IBM Plex Mono", userSelect: "none" }}>
            En este mundo, todo —
          </div>
          <textarea
            className="w-full bg-transparent px-3 py-2.5 outline-none resize-none"
            style={{ color: INK }}
            rows={2}
            value={state.rule}
            onChange={e => update({ rule: e.target.value })}
            placeholder="completa la regla..."
          />
        </div>
        <Hint>ej. "es la versión de prueba de otra cosa que nunca llega"</Hint>
      </div>

      <PrimaryBtn label="Saltar →" enabled={canProceed} onClick={() => update({ phase: 2 })} />
    </div>
  );
}

// ─── Phase 3: SALTAR ─────────────────────────────────────────────────────────

function Phase3({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const draw = () => {
    const r = pick(RIVERS, state.river || undefined);
    update({ river: r, riverUsed: state.river !== "" });
  };
  const canProceed = !!state.river;

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
            : <span style={{ color: FAINT, fontSize: "1.5rem" }}>?</span>
          }
        </div>
      </div>

      {state.river && (
        <div className="py-5 text-center" style={{ border: `1px solid ${INK}` }}>
          <span className="text-[9px] uppercase tracking-widest block mb-2" style={{ color: MUTED }}>el cruce</span>
          <p style={{ fontFamily: "Newsreader", fontSize: "1.25rem" }}>
            <span style={{ color: BLUE }}>{state.mother}</span>
            <span style={{ color: FAINT, margin: "0 12px" }}>×</span>
            <span style={{ color: BLUE }}>{state.river}</span>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 py-3 text-xs uppercase tracking-widest transition-colors"
          style={{ background: BLUE, color: "#fff", border: `1px solid ${BLUE}`, opacity: state.riverUsed ? 0.4 : 1, cursor: state.riverUsed ? "not-allowed" : "pointer" }}
          onClick={draw}
          disabled={state.riverUsed}
        >
          {state.river ? "nuevo río" : "saca un río"}
        </button>
        {state.river && !state.riverUsed && (
          <button
            className="px-5 py-3 text-xs uppercase tracking-widest transition-colors"
            style={{ border: `1px solid ${GRID}`, color: MUTED }}
            onClick={draw}
          >
            otra vez
          </button>
        )}
      </div>
      {state.riverUsed && <p className="text-[11px]" style={{ color: MUTED }}>solo puedes volver a sacar una vez</p>}

      <PrimaryBtn label="Construir →" enabled={canProceed} onClick={() => update({ phase: 3 })} />
    </div>
  );
}

// ─── Phase 4: CONSTRUIR ──────────────────────────────────────────────────────

function Phase4({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  useEffect(() => {
    if (!state.userCard) update({ userCard: pick(USERS) });
    if (!state.scaleCard) update({ scaleCard: pick(SCALES) });
    if (!state.wildcardCard) update({ wildcardCard: pick(WILDCARDS) });
  }, []);

  const canProceed = !!(state.projectName && state.userFlipped && state.scaleFlipped && state.wildcardFlipped && state.objName && state.objUser && state.objPieces);

  const fields = [
    { label: "Nombre del objeto", key: "objName", ph: "¿cómo se llama?", rows: 1 },
    { label: "Usuario y qué hace con él", key: "objUser", ph: "¿quién lo usa y cómo?", rows: 2 },
    { label: "Relaciones con otros objetos", key: "objRelations", ph: "¿con qué convive?", rows: 2 },
    { label: "Tres piezas que lo componen", key: "objPieces", ph: "lista tres piezas...", rows: 2 },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <Label>Nombre del proyecto musical</Label>
        <Hint>nómbralo a partir de la regla, no del verbo</Hint>
        <div className="mt-2">
          <FieldInput value={state.projectName} onChange={v => update({ projectName: v })} placeholder="nombre del proyecto..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FlipCard label="Usuario" value={state.userCard} flipped={state.userFlipped} onFlip={() => update({ userFlipped: true })} />
        <FlipCard label="Escala" value={state.scaleCard} flipped={state.scaleFlipped} onFlip={() => update({ scaleFlipped: true })} />
        <div className="col-span-2 sm:col-span-1">
          <FlipCard label="Comodín" value={state.wildcardCard} flipped={state.wildcardFlipped} onFlip={() => update({ wildcardFlipped: true })} />
        </div>
      </div>

      <div className="space-y-4 pt-3" style={{ borderTop: `1px solid ${FAINT}` }}>
        <Label>Ficha del objeto</Label>
        {fields.map(({ label, key, ph, rows }) => (
          <div key={key}>
            <Label>{label}</Label>
            <FieldTextarea value={state[key as keyof State] as string} onChange={v => update({ [key]: v })} placeholder={ph} rows={rows} />
          </div>
        ))}
      </div>

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
      ? { label: "Salto", note: "La regla opera como forma. Este mundo tiene su propia gravedad." }
      : { label: "Decoración", note: "La regla aún no transforma el objeto. Vuelve a la condición madre." }
    : null;

  const download = async () => {
    const el = cardRef.current;
    if (!el) return;
    try {
      const { default: h2c } = await import("html2canvas");
      const canvas = await h2c(el, { scale: 2, backgroundColor: PAPER });
      const a = document.createElement("a");
      a.download = `umbral-${state.projectName || "ficha"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch { alert("No se pudo generar la imagen."); }
  };

  return (
    <div className="space-y-6">
      {/* Ficha */}
      <div ref={cardRef} className="p-5 space-y-3" style={{ border: `1px solid ${INK}`, background: PAPER }}>
        <p className="text-[10px] uppercase tracking-widest pb-2" style={{ color: MUTED, borderBottom: `1px solid ${FAINT}` }}>
          Umbral — ficha de mundo
        </p>
        {[
          { label: "Verbo", value: state.chosenVerb },
          { label: "Madre", value: state.mother },
          { label: "Regla", value: `En este mundo, todo ${state.rule}` },
          { label: "Cruce", value: `${state.mother} × ${state.river}` },
          { label: "Proyecto", value: state.projectName },
          { label: "Objeto", value: state.objName },
        ].map(({ label, value }) => (
          <div key={label} className="grid gap-2" style={{ gridTemplateColumns: "72px 1fr" }}>
            <span className="text-[10px] uppercase tracking-widest pt-0.5" style={{ color: MUTED }}>{label}</span>
            <span style={{ fontFamily: "Newsreader", fontSize: "0.95rem", color: INK }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Rúbrica */}
      <div className="space-y-3">
        <Label>Rúbrica</Label>
        <p className="text-xs leading-relaxed" style={{ fontFamily: "Newsreader", color: INK, fontSize: "0.95rem" }}>
          La pregunta es una sola: ¿la regla sigue viva en el objeto, o solo le pusiste el nombre encima? Si el objeto funcionaría igual para cualquier otro artista, es decoración. Si la regla le cambió la forma, es un salto.
        </p>
        {RUBRIC.map((q, i) => (
          <div key={i} className="p-4" style={{ border: `1px solid ${FAINT}` }}>
            <p className="text-sm mb-3 leading-snug" style={{ fontFamily: "Newsreader", color: INK }}>{q}</p>
            <div className="flex gap-3">
              {[true, false].map(val => {
                const active = state.answers[i] === val;
                return (
                  <button
                    key={String(val)}
                    className="px-5 py-2 text-xs uppercase tracking-widest transition-colors"
                    style={{ border: `1px solid ${active ? BLUE : GRID}`, background: active ? BLUE : "transparent", color: active ? "#fff" : INK }}
                    onClick={() => setAnswer(i, val)}
                  >
                    {val ? "Sí" : "No"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="px-5 py-6 text-center" style={{ border: `2px solid ${result.label === "Salto" ? BLUE : INK}` }}>
          <p className="text-4xl tracking-widest uppercase mb-2" style={{ fontFamily: "IBM Plex Mono", color: result.label === "Salto" ? BLUE : INK }}>
            {result.label}
          </p>
          <p className="text-sm leading-relaxed" style={{ fontFamily: "Newsreader", color: MUTED }}>{result.note}</p>
          {result.label === "Salto" && (
            <p className="text-xs mt-3 leading-relaxed" style={{ color: MUTED }}>
              Tu objeto terminado no es el final, es lo siguiente que vas a leer. Todo mundo crece así: cada objeto se vuelve la semilla de la próxima vuelta.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button className="w-full py-3.5 text-xs uppercase tracking-widest transition-colors" style={{ border: `1px solid ${GRID}`, color: INK }}
          onMouseOver={e => e.currentTarget.style.borderColor = INK}
          onMouseOut={e => e.currentTarget.style.borderColor = GRID}
          onClick={download}>
          Descargar ficha como imagen
        </button>
        <button className="w-full py-3.5 text-xs uppercase tracking-widest transition-colors" style={{ border: `1px solid ${BLUE}`, color: BLUE }}
          onClick={() => onRestart(state.objName)}>
          Volver a leer desde este objeto
        </button>
      </div>
    </div>
  );
}

// ─── Nav bar ─────────────────────────────────────────────────────────────────

function PhaseNav({ phase, maxReached, onGo }: { phase: Phase; maxReached: Phase; onGo: (p: Phase) => void }) {
  return (
    <div className="flex items-stretch" style={{ borderBottom: `1px solid ${FAINT}` }}>
      {PHASE_LABELS.map((label, i) => {
        const active = i === phase;
        const done = i < maxReached || (i === maxReached && i < phase);
        const reachable = i <= maxReached;
        return (
          <button
            key={label}
            disabled={!reachable}
            onClick={() => reachable ? onGo(i as Phase) : undefined}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
            style={{
              borderRight: i < PHASE_LABELS.length - 1 ? `1px solid ${FAINT}` : "none",
              borderBottom: active ? `2px solid ${BLUE}` : "2px solid transparent",
              marginBottom: -1,
              cursor: reachable ? "pointer" : "not-allowed",
              background: "transparent",
            }}
          >
            {done && !active && <span className="text-[9px]" style={{ color: BLUE }}>✓</span>}
            <span className="text-[10px] tracking-widest uppercase" style={{ color: active ? BLUE : done ? GRID : FAINT, fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState<State>(load);
  const [animKey, setAnimKey] = useState(0);
  const maxReachedRef = useRef<Phase>(state.phase);

  const update = useCallback((partial: Partial<State>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      if (partial.phase !== undefined && (partial.phase as Phase) > maxReachedRef.current) {
        maxReachedRef.current = partial.phase as Phase;
      }
      save(next);
      return next;
    });
    if (partial.phase !== undefined) setAnimKey(k => k + 1);
  }, []);

  const [maxReached, setMaxReached] = useState<Phase>(state.phase);

  useEffect(() => {
    if (state.phase > maxReached) setMaxReached(state.phase);
  }, [state.phase]);

  const goTo = (p: Phase) => {
    if (p === state.phase) return;
    setState(prev => {
      const next = { ...prev, phase: p };
      save(next);
      return next;
    });
    setAnimKey(k => k + 1);
  };

  const restart = (seed: string) => {
    const fresh: State = { ...INITIAL, verbs: seed ? [seed] : [] };
    save(fresh);
    setState(fresh);
    setMaxReached(0);
    setAnimKey(k => k + 1);
  };

  const renderPhase = () => {
    switch (state.phase) {
      case 0: return <Phase1 state={state} update={update} />;
      case 1: return <Phase2 state={state} update={update} />;
      case 2: return <Phase3 state={state} update={update} />;
      case 3: return <Phase4 state={state} update={update} />;
      case 4: return <Phase5 state={state} update={update} onRestart={restart} />;
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: PAPER }}>
      <div className="grid-paper" />

      {/* Contour decoration — right side, fixed */}
      <div
        className="hidden lg:block fixed top-0 right-0 pointer-events-none"
        style={{ width: "38vw", height: "100vh", overflow: "hidden", zIndex: 1, opacity: 0.18 }}
      >
        <img
          src="/assets/4df8b.svg"
          alt=""
          className="absolute"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left center" }}
        />
      </div>

      {/* App shell */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <div style={{ borderBottom: `1px solid ${FAINT}`, background: PAPER }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-baseline justify-between">
            <h1 className="tracking-[0.3em] uppercase text-sm" style={{ fontFamily: "IBM Plex Mono", color: INK }}>
              Umbral
            </h1>
            <span className="text-[10px] tracking-widest hidden sm:block" style={{ color: MUTED }}>
              construcción de mundos
            </span>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <PhaseNav phase={state.phase} maxReached={maxReached} onGo={goTo} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20">

            {/* Left: intro text */}
            <div className="lg:sticky lg:top-16 lg:self-start">
              <div key={`intro-${state.phase}`} className="phase-enter">
                <IntroPanel phase={state.phase} />
              </div>

              {/* Back button on desktop */}
              {state.phase > 0 && (
                <button
                  className="hidden lg:block mt-12 text-xs uppercase tracking-widest transition-colors"
                  style={{ color: MUTED, borderBottom: `1px solid ${FAINT}`, paddingBottom: 2 }}
                  onMouseOver={e => e.currentTarget.style.color = INK}
                  onMouseOut={e => e.currentTarget.style.color = MUTED}
                  onClick={() => goTo((state.phase - 1) as Phase)}
                >
                  ← {PHASE_LABELS[state.phase - 1]}
                </button>
              )}
            </div>

            {/* Right: form */}
            <div>
              <div key={animKey} className="phase-enter">
                {renderPhase()}
              </div>

              {/* Back on mobile */}
              {state.phase > 0 && (
                <button
                  className="lg:hidden mt-6 text-xs uppercase tracking-widest"
                  style={{ color: MUTED }}
                  onClick={() => goTo((state.phase - 1) as Phase)}
                >
                  ← {PHASE_LABELS[state.phase - 1]}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phase counter footer */}
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-4 flex justify-end" style={{ borderTop: `1px solid ${FAINT}` }}>
          <span className="text-[10px] tracking-widest" style={{ color: FAINT }}>
            {state.phase + 1} / {PHASE_LABELS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
