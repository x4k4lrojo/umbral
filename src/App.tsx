import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 0 | 1 | 2 | 3 | 4;

interface State {
  phase: Phase;
  // Phase 1
  verbs: string[];
  chosenVerb: string;
  // Phase 2
  noun: string;
  mother: string;
  cantPhoto: boolean;
  rule: string;
  // Phase 3
  river: string;
  riverUsed: boolean;
  // Phase 4
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
  // Phase 5
  answers: [boolean | null, boolean | null, boolean | null];
}

const INITIAL_STATE: State = {
  phase: 0,
  verbs: [],
  chosenVerb: "",
  noun: "",
  mother: "",
  cantPhoto: false,
  rule: "",
  river: "",
  riverUsed: false,
  projectName: "",
  userCard: "",
  scaleCard: "",
  wildcardCard: "",
  userFlipped: false,
  scaleFlipped: false,
  wildcardFlipped: false,
  objName: "",
  objUser: "",
  objRelations: "",
  objPieces: "",
  answers: [null, null, null],
};

const PHASES = ["Leer", "Desenterrar", "Saltar", "Construir", "Probar"];

const RIVERS = [
  "duelo", "fiesta", "migración", "máquina", "barrio",
  "silencio", "fantasma", "ruido", "espíritu", "utopía",
  "enfermedad", "tránsito", "contagio", "encierro",
];

const USERS = [
  "un booker", "la abuela de un fan", "una curadora de festival",
  "un taxista", "un DJ de barrio", "una bibliotecaria",
];

const SCALES = [
  "cuesta menos de 5.000 pesos", "solo lo tienen 12 personas",
  "funciona sin internet", "se vende en la calle", "dura un solo día",
];

const WILDCARDS = [
  "se destruye al usarse", "el nombre del artista no aparece",
  "cabe en un bolsillo", "se hace con lo que hay en la casa",
];

function pick<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter((x) => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "umbral_state_v1";

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...INITIAL_STATE, ...JSON.parse(raw) };
  } catch {}
  return INITIAL_STATE;
}

function saveState(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ phase }: { phase: Phase }) {
  return (
    <div className="flex items-center gap-0 border-b border-[#2E2820]">
      {PHASES.map((label, i) => {
        const active = i === phase;
        const done = i < phase;
        return (
          <div
            key={label}
            className="flex-1 flex flex-col items-center py-3 border-r border-[#2E2820] last:border-r-0"
            style={{
              borderBottom: active ? "2px solid #B8650A" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{
                color: active ? "#B8650A" : done ? "#EDE5DC" : "#6B6058",
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── FlipCard ────────────────────────────────────────────────────────────────

function FlipCard({
  label,
  value,
  flipped,
  onFlip,
}: {
  label: string;
  value: string;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="card-flip" style={{ height: 110 }}>
      <div className={`card-inner ${flipped ? "flipped" : ""}`}>
        {/* Front */}
        <div
          className="card-face border border-[#2E2820] cursor-pointer flex flex-col items-center justify-center bg-[#1A1612] hover:bg-[#2A2218] transition-colors"
          onClick={!flipped ? onFlip : undefined}
        >
          <span className="text-[10px] tracking-widest uppercase text-[#6B6058] mb-1">{label}</span>
          <span className="text-lg" style={{ color: "#4A4038" }}>◆</span>
          <span className="text-[10px] text-[#6B6058] mt-1">voltear</span>
        </div>
        {/* Back */}
        <div
          className="card-face card-back border border-[#B8650A] flex flex-col items-center justify-center px-3 text-center"
          style={{ background: "#211D19" }}
        >
          <span className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "#B8650A" }}>{label}</span>
          <span className="text-sm font-semibold" style={{ fontFamily: "IBM Plex Mono", color: "#EDE5DC" }}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 1: LEER ───────────────────────────────────────────────────────────

function Phase1({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const [input, setInput] = useState("");

  const addVerb = () => {
    const v = input.trim();
    if (v && !state.verbs.includes(v)) {
      update({ verbs: [...state.verbs, v], chosenVerb: "" });
    }
    setInput("");
  };

  const canProceed = state.verbs.length >= 3 && state.chosenVerb;

  return (
    <div className="space-y-6">
      <p className="text-xs tracking-wide uppercase text-[#6B6058]">Fase 01 / Leer</p>
      <p className="text-base leading-relaxed" style={{ fontFamily: "Newsreader", fontSize: "1.1rem" }}>
        Lee el mundo: ¿qué hiciste hoy con las manos? ¿qué hace tu entorno?
      </p>

      <div className="flex gap-2">
        <input
          className="flex-1 border border-[#4A4038] bg-transparent px-3 py-2 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
          placeholder="escribe un verbo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addVerb()}
        />
        <button
          className="border border-[#EDE5DC] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#EDE5DC] hover:text-[#1A1612] transition-colors"
          onClick={addVerb}
        >
          Agregar
        </button>
      </div>

      {state.verbs.length > 0 && (
        <div className="border border-[#2E2820]">
          <p className="text-[10px] tracking-widest uppercase text-[#6B6058] px-3 pt-2 pb-1">
            elige uno —
          </p>
          {state.verbs.map((v) => (
            <button
              key={v}
              className="w-full text-left px-3 py-2 border-t border-[#2E2820] text-sm transition-colors"
              style={{
                background: state.chosenVerb === v ? "#B8650A" : "transparent",
                color: state.chosenVerb === v ? "#1A1612" : "#EDE5DC",
                fontFamily: "IBM Plex Mono",
              }}
              onClick={() => update({ chosenVerb: v })}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {state.verbs.length < 3 && (
        <p className="text-[11px] text-[#6B6058]">mínimo 3 verbos antes de elegir</p>
      )}

      <button
        disabled={!canProceed}
        className="w-full border py-3 text-xs uppercase tracking-widest transition-colors"
        style={{
          borderColor: canProceed ? "#B8650A" : "#EDE5DC",
          color: canProceed ? "#1A1612" : "#EDE5DC",
          background: canProceed ? "#B8650A" : "transparent",
          cursor: canProceed ? "pointer" : "not-allowed",
        }}
        onClick={() => update({ phase: 1 })}
      >
        Desenterrar →
      </button>
    </div>
  );
}

// ─── Phase 2: DESENTERRAR ────────────────────────────────────────────────────

function Phase2({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const canProceed = state.noun && state.mother && state.rule;

  return (
    <div className="space-y-5">
      <p className="text-xs tracking-wide uppercase text-[#6B6058]">Fase 02 / Desenterrar</p>

      <div className="border border-[#B8650A] px-3 py-2 inline-block">
        <span className="text-[10px] uppercase tracking-widest text-[#B8650A]">verbo elegido</span>
        <p className="text-lg mt-0.5" style={{ fontFamily: "Newsreader" }}>{state.chosenVerb}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B6058] block mb-1">
            Conviértelo en sustantivo
          </label>
          <input
            className="w-full border border-[#4A4038] bg-transparent px-3 py-2 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
            value={state.noun}
            onChange={(e) => update({ noun: e.target.value })}
            placeholder="el sustantivo..."
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B6058] block mb-1">
            Súbelo a condición (la madre)
          </label>
          <input
            className="w-full border border-[#4A4038] bg-transparent px-3 py-2 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
            value={state.mother}
            onChange={(e) => update({ mother: e.target.value })}
            placeholder="la condición madre..."
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className="w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              borderColor: state.cantPhoto ? "#B8650A" : "#2E2820",
              background: state.cantPhoto ? "#B8650A" : "transparent",
            }}
            onClick={() => update({ cantPhoto: !state.cantPhoto })}
          >
            {state.cantPhoto && <span className="text-[#1A1612] text-xs leading-none">✓</span>}
          </div>
          <span className="text-xs text-[#EDE5DC]">No se puede fotografiar directamente</span>
        </label>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#6B6058] block mb-1">
            La regla del mundo
          </label>
          <div className="border border-[#4A4038] focus-within:border-[#B8650A] flex items-start">
            <span className="px-3 py-2 text-[#6B6058] text-sm whitespace-nowrap flex-shrink-0" style={{ fontFamily: "IBM Plex Mono" }}>
              En este mundo, todo
            </span>
            <textarea
              className="flex-1 bg-transparent px-2 py-2 text-[#EDE5DC] outline-none resize-none"
              rows={2}
              value={state.rule}
              onChange={(e) => update({ rule: e.target.value })}
              placeholder="___"
            />
          </div>
        </div>
      </div>

      <button
        disabled={!canProceed}
        className="w-full border py-3 text-xs uppercase tracking-widest transition-colors"
        style={{
          borderColor: canProceed ? "#B8650A" : "#EDE5DC",
          color: canProceed ? "#1A1612" : "#EDE5DC",
          background: canProceed ? "#B8650A" : "transparent",
          cursor: canProceed ? "pointer" : "not-allowed",
        }}
        onClick={() => update({ phase: 2 })}
      >
        Saltar →
      </button>
    </div>
  );
}

// ─── Phase 3: SALTAR ─────────────────────────────────────────────────────────

function Phase3({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const drawRiver = () => {
    const r = pick(RIVERS, state.river || undefined);
    update({ river: r, riverUsed: state.river !== "" });
  };

  const canRedraw = state.river && !state.riverUsed;
  const canProceed = !!state.river;

  return (
    <div className="space-y-6">
      <p className="text-xs tracking-wide uppercase text-[#6B6058]">Fase 03 / Saltar</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-[#B8650A] px-3 py-2">
          <span className="text-[10px] uppercase tracking-widest text-[#B8650A]">madre</span>
          <p className="text-sm mt-0.5" style={{ fontFamily: "Newsreader" }}>{state.mother}</p>
        </div>
        <div className="border border-[#2E2820] px-3 py-2 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-[#6B6058]">río</span>
          {state.river ? (
            <p className="text-sm mt-0.5" style={{ fontFamily: "Newsreader", color: "#B8650A" }}>{state.river}</p>
          ) : (
            <span className="text-[#2E2820] text-lg">?</span>
          )}
        </div>
      </div>

      {state.river && (
        <div className="border border-[#EDE5DC] px-4 py-3 text-center">
          <span className="text-[10px] uppercase tracking-widest text-[#6B6058] block mb-1">el cruce</span>
          <p className="text-base" style={{ fontFamily: "Newsreader", fontSize: "1.15rem" }}>
            <span style={{ color: "#B8650A" }}>{state.mother}</span>
            <span className="mx-2 text-[#2E2820]">×</span>
            <span style={{ color: "#B8650A" }}>{state.river}</span>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 border py-3 text-xs uppercase tracking-widest transition-colors"
          style={{
            borderColor: "#B8650A",
            color: "#1A1612",
            background: "#B8650A",
          }}
          onClick={drawRiver}
          disabled={state.riverUsed}
        >
          {state.river ? "nuevo río" : "saca un río"}
        </button>
        {state.river && !state.riverUsed && (
          <button
            className="border border-[#2E2820] px-4 py-3 text-xs uppercase tracking-widest text-[#6B6058] hover:border-[#EDE5DC] hover:text-[#EDE5DC] transition-colors"
            onClick={drawRiver}
          >
            Otra vez
          </button>
        )}
      </div>

      {state.riverUsed && (
        <p className="text-[11px] text-[#6B6058]">solo puedes volver a sacar una vez</p>
      )}

      <button
        disabled={!canProceed}
        className="w-full border py-3 text-xs uppercase tracking-widest transition-colors"
        style={{
          borderColor: canProceed ? "#B8650A" : "#EDE5DC",
          color: canProceed ? "#1A1612" : "#EDE5DC",
          background: canProceed ? "#B8650A" : "transparent",
          cursor: canProceed ? "pointer" : "not-allowed",
        }}
        onClick={() => update({ phase: 3 })}
      >
        Construir →
      </button>
    </div>
  );
}

// ─── Phase 4: CONSTRUIR ───────────────────────────────────────────────────────

function Phase4({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const drawUser = () =>
    update({ userCard: pick(USERS, state.userCard || undefined), userFlipped: false });
  const drawScale = () =>
    update({ scaleCard: pick(SCALES, state.scaleCard || undefined), scaleFlipped: false });
  const drawWildcard = () =>
    update({ wildcardCard: pick(WILDCARDS, state.wildcardCard || undefined), wildcardFlipped: false });

  useEffect(() => {
    if (!state.userCard) drawUser();
    if (!state.scaleCard) drawScale();
    if (!state.wildcardCard) drawWildcard();
  }, []);

  const canProceed =
    state.projectName &&
    state.userFlipped &&
    state.scaleFlipped &&
    state.wildcardFlipped &&
    state.objName &&
    state.objUser &&
    state.objPieces;

  return (
    <div className="space-y-5">
      <p className="text-xs tracking-wide uppercase text-[#6B6058]">Fase 04 / Construir</p>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#6B6058] block mb-1">
          Nombre del proyecto musical
        </label>
        <p className="text-[10px] text-[#6B6058] mb-1">nómbralo a partir de la regla, no del verbo</p>
        <input
          className="w-full border border-[#4A4038] bg-transparent px-3 py-2 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
          value={state.projectName}
          onChange={(e) => update({ projectName: e.target.value })}
          placeholder="nombre del proyecto..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FlipCard
          label="Usuario"
          value={state.userCard}
          flipped={state.userFlipped}
          onFlip={() => update({ userFlipped: true })}
        />
        <FlipCard
          label="Escala"
          value={state.scaleCard}
          flipped={state.scaleFlipped}
          onFlip={() => update({ scaleFlipped: true })}
        />
        <FlipCard
          label="Comodín"
          value={state.wildcardCard}
          flipped={state.wildcardFlipped}
          onFlip={() => update({ wildcardFlipped: true })}
        />
      </div>

      <div className="border-t border-[#2E2820] pt-4 space-y-4">
        <p className="text-[10px] uppercase tracking-widest text-[#6B6058]">Ficha del objeto</p>

        {[
          { label: "Nombre del objeto", key: "objName", ph: "¿cómo se llama?" },
          { label: "Usuario y qué hace con él", key: "objUser", ph: "¿quién lo usa y cómo?" },
          { label: "Relaciones con otros objetos", key: "objRelations", ph: "¿con qué convive?" },
          { label: "Tres piezas que lo componen", key: "objPieces", ph: "lista tres piezas..." },
        ].map(({ label, key, ph }) => (
          <div key={key}>
            <label className="text-[10px] uppercase tracking-widest text-[#6B6058] block mb-1">{label}</label>
            <textarea
              className="w-full border border-[#4A4038] bg-transparent px-3 py-2 text-[#EDE5DC] outline-none focus:border-[#B8650A] resize-none"
              rows={2}
              value={(state as any)[key]}
              onChange={(e) => update({ [key]: e.target.value })}
              placeholder={ph}
            />
          </div>
        ))}
      </div>

      <button
        disabled={!canProceed}
        className="w-full border py-3 text-xs uppercase tracking-widest transition-colors"
        style={{
          borderColor: canProceed ? "#B8650A" : "#EDE5DC",
          color: canProceed ? "#1A1612" : "#EDE5DC",
          background: canProceed ? "#B8650A" : "transparent",
          cursor: canProceed ? "pointer" : "not-allowed",
        }}
        onClick={() => update({ phase: 4 })}
      >
        Probar →
      </button>
    </div>
  );
}

// ─── Phase 5: PROBAR ─────────────────────────────────────────────────────────

const RUBRIC = [
  "¿La regla cambia la forma del objeto?",
  "¿Funcionaría igual para cualquier otro artista?",
  "¿Alguien que lea solo la regla podría imaginar cómo suena este mundo?",
];

function Phase5({
  state,
  update,
  onRestart,
}: {
  state: State;
  update: (s: Partial<State>) => void;
  onRestart: (seed: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const setAnswer = (i: number, val: boolean) => {
    const next = [...state.answers] as [boolean | null, boolean | null, boolean | null];
    next[i] = val;
    update({ answers: next });
  };

  const allAnswered = state.answers.every((a) => a !== null);

  // Q2 expected: NO. Score: Q1 yes + Q2 no + Q3 yes = salto
  const salto =
    allAnswered &&
    state.answers[0] === true &&
    state.answers[1] === false &&
    state.answers[2] === true;

  const result = allAnswered
    ? salto
      ? { label: "Salto", note: "La regla opera como forma. Este mundo tiene su propia gravedad." }
      : { label: "Decoración", note: "La regla aún no transforma el objeto. Vuelve a la condición madre." }
    : null;

  const downloadCard = async () => {
    const el = cardRef.current;
    if (!el) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#1A1612" });
      const link = document.createElement("a");
      link.download = `umbral-${state.projectName || "ficha"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Instala html2canvas para descargar la ficha.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs tracking-wide uppercase text-[#6B6058]">Fase 05 / Probar</p>

      {/* Ficha */}
      <div ref={cardRef} className="border border-[#EDE5DC] p-5 space-y-3 bg-[#1A1612]">
        <p className="text-[10px] uppercase tracking-widest text-[#6B6058] border-b border-[#2E2820] pb-2 mb-3">
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
          <div key={label} className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#6B6058] pt-0.5">{label}</span>
            <span style={{ fontFamily: "Newsreader", fontSize: "0.95rem", color: "#EDE5DC" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Rúbrica */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-[#6B6058]">Rúbrica</p>
        {RUBRIC.map((q, i) => (
          <div key={i} className="border border-[#2E2820] p-3">
            <p className="text-sm mb-2" style={{ fontFamily: "Newsreader" }}>{q}</p>
            <div className="flex gap-3">
              {[true, false].map((val) => {
                const active = state.answers[i] === val;
                return (
                  <button
                    key={String(val)}
                    className="px-4 py-1.5 text-xs uppercase tracking-widest border transition-colors"
                    style={{
                      borderColor: active ? "#B8650A" : "#2E2820",
                      background: active ? "#B8650A" : "transparent",
                      color: active ? "#1A1612" : "#EDE5DC",
                    }}
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
        <div
          className="border-2 px-4 py-4 text-center"
          style={{ borderColor: result.label === "Salto" ? "#B8650A" : "#EDE5DC" }}
        >
          <p
            className="text-2xl tracking-widest uppercase mb-1"
            style={{
              fontFamily: "IBM Plex Mono",
              color: result.label === "Salto" ? "#B8650A" : "#EDE5DC",
            }}
          >
            {result.label}
          </p>
          <p className="text-sm" style={{ fontFamily: "Newsreader" }}>{result.note}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          className="w-full border border-[#EDE5DC] py-3 text-xs uppercase tracking-widest hover:bg-[#EDE5DC] hover:text-[#1A1612] transition-colors"
          onClick={downloadCard}
        >
          Descargar ficha como imagen
        </button>
        <button
          className="w-full border py-3 text-xs uppercase tracking-widest transition-colors"
          style={{ borderColor: "#B8650A", color: "#B8650A" }}
          onClick={() => onRestart(state.objName)}
        >
          Volver a leer desde este objeto
        </button>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState<State>(loadState);

  const update = useCallback((partial: Partial<State>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      saveState(next);
      return next;
    });
  }, []);

  const restart = (seed: string) => {
    const fresh: State = {
      ...INITIAL_STATE,
      verbs: seed ? [seed] : [],
    };
    saveState(fresh);
    setState(fresh);
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
    <div className="min-h-screen relative">
      {/* Grid paper */}
      <div className="grid-paper" />

      {/* App shell */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-[#2E2820] bg-[#1A1612]">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-baseline gap-3">
            <h1
              className="text-sm tracking-[0.2em] uppercase"
              style={{ fontFamily: "IBM Plex Mono", color: "#EDE5DC" }}
            >
              Umbral
            </h1>
            <span className="text-[10px] text-[#6B6058] tracking-widest">construcción de mundos</span>
          </div>
          <ProgressBar phase={state.phase} />
        </div>

        {/* Content */}
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
          {renderPhase()}
        </div>
      </div>
    </div>
  );
}
