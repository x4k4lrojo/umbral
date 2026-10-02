import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

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
    <div className="flex items-stretch">
      {PHASES.map((label, i) => {
        const active = i === phase;
        const done = i < phase;
        return (
          <div
            key={label}
            className="flex-1 flex flex-col items-center py-3 gap-0.5"
            style={{
              borderRight: i < PHASES.length - 1 ? "1px solid #3D3530" : "none",
              borderBottom: active ? "2px solid #B8650A" : "2px solid transparent",
            }}
          >
            {done && (
              <span className="text-[9px]" style={{ color: "#B8650A" }}>✓</span>
            )}
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{
                color: active ? "#B8650A" : done ? "#6B6058" : "#3D3530",
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

// ─── PhaseHeading ─────────────────────────────────────────────────────────────

function PhaseHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="leading-snug mb-6"
      style={{ fontFamily: "Newsreader", fontSize: "1.3rem", color: "#EDE5DC" }}
    >
      {children}
    </p>
  );
}

// ─── AdvanceButton ───────────────────────────────────────────────────────────

function AdvanceButton({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="pt-6 mt-2" style={{ borderTop: "1px solid #3D3530" }}>
      <button
        disabled={!enabled}
        className="w-full py-4 text-xs uppercase tracking-widest transition-colors"
        style={{
          border: "1px solid",
          borderColor: enabled ? "#B8650A" : "#3D3530",
          color: enabled ? "#1A1612" : "#4A4038",
          background: enabled ? "#B8650A" : "transparent",
          cursor: enabled ? "pointer" : "not-allowed",
        }}
        onClick={onClick}
      >
        {label}
      </button>
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
    <div className="card-flip" style={{ height: 120 }}>
      <div className={`card-inner ${flipped ? "flipped" : ""}`}>
        <div
          className="card-face border cursor-pointer flex flex-col items-center justify-center bg-[#1A1612] hover:bg-[#211D19] transition-colors"
          style={{ borderColor: "#3D3530" }}
          onClick={!flipped ? onFlip : undefined}
        >
          <span className="text-[10px] tracking-widest uppercase mb-2" style={{ color: "#4A4038" }}>{label}</span>
          <span className="text-base" style={{ color: "#3D3530" }}>◆</span>
          <span className="text-[10px] mt-2" style={{ color: "#4A4038" }}>voltear</span>
        </div>
        <div
          className="card-face card-back border flex flex-col items-center justify-center px-3 text-center"
          style={{ borderColor: "#B8650A", background: "#211D19" }}
        >
          <span className="text-[10px] tracking-widest uppercase mb-2" style={{ color: "#B8650A" }}>{label}</span>
          <span className="text-sm font-semibold" style={{ fontFamily: "IBM Plex Mono", color: "#EDE5DC", lineHeight: 1.4 }}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── FadePhase ───────────────────────────────────────────────────────────────

function FadePhase({ phase, children }: { phase: Phase; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 180ms ease",
      }}
    >
      {children}
    </div>
  );
}

// ─── Hint ────────────────────────────────────────────────────────────────────

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] mt-1.5" style={{ color: "#4A4038", fontFamily: "IBM Plex Mono" }}>
      {children}
    </p>
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

  const canProceed = state.verbs.length >= 3 && !!state.chosenVerb;

  return (
    <div>
      <PhaseHeading>
        Lee el mundo: ¿qué hiciste hoy con las manos? ¿qué hace tu entorno?
      </PhaseHeading>

      <div className="space-y-5">
        <div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-[#4A4038] bg-transparent px-3 py-2.5 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
              placeholder="escribe un verbo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVerb()}
            />
            <button
              className="border border-[#4A4038] px-4 py-2 text-xs uppercase tracking-widest text-[#EDE5DC] hover:border-[#EDE5DC] transition-colors"
              onClick={addVerb}
            >
              +
            </button>
          </div>
          <Hint>ej. doblar, esperar, reparar, circular, almacenar, frotar</Hint>
        </div>

        {state.verbs.length > 0 && (
          <div style={{ border: "1px solid #3D3530" }}>
            <p className="text-[10px] tracking-widest uppercase px-3 pt-3 pb-1" style={{ color: "#4A4038" }}>
              elige uno
            </p>
            {state.verbs.map((v) => (
              <button
                key={v}
                className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                style={{
                  borderTop: "1px solid #3D3530",
                  background: state.chosenVerb === v ? "#B8650A" : "transparent",
                  color: state.chosenVerb === v ? "#1A1612" : "#EDE5DC",
                  fontFamily: "IBM Plex Mono",
                }}
                onClick={() => update({ chosenVerb: v })}
              >
                {state.chosenVerb === v ? "→ " : "   "}{v}
              </button>
            ))}
          </div>
        )}

        {state.verbs.length < 3 && (
          <p className="text-[11px]" style={{ color: "#4A4038" }}>
            {3 - state.verbs.length} verbo{3 - state.verbs.length !== 1 ? "s" : ""} más antes de elegir
          </p>
        )}
      </div>

      <AdvanceButton label="Desenterrar →" enabled={canProceed} onClick={() => update({ phase: 1 })} />
    </div>
  );
}

// ─── Phase 2: DESENTERRAR ────────────────────────────────────────────────────

function Phase2({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const tooConcreteBlock = state.mother && !state.cantPhoto;
  const canProceed = !!(state.noun && state.mother && state.rule && state.cantPhoto);

  return (
    <div>
      <PhaseHeading>
        Convierte <em style={{ color: "#B8650A", fontStyle: "normal" }}>{state.chosenVerb}</em> en una condición de mundo.
      </PhaseHeading>

      <div className="space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#4A4038" }}>
            Conviértelo en sustantivo
          </label>
          <input
            className="w-full border border-[#4A4038] bg-transparent px-3 py-2.5 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
            value={state.noun}
            onChange={(e) => update({ noun: e.target.value })}
            placeholder="el sustantivo..."
          />
          <Hint>ej. doblar → doblez</Hint>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#4A4038" }}>
            Súbelo a condición — la madre
          </label>
          <input
            className="w-full border border-[#4A4038] bg-transparent px-3 py-2.5 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
            value={state.mother}
            onChange={(e) => update({ mother: e.target.value })}
            placeholder="la condición madre..."
          />
          <Hint>ej. doblez → pliegue. Debe sonar a ley, no a acción.</Hint>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#4A4038" }}>
            ¿No se puede fotografiar directamente?
          </label>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div
              className="w-4 h-4 border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{
                borderColor: state.cantPhoto ? "#B8650A" : "#4A4038",
                background: state.cantPhoto ? "#B8650A" : "transparent",
              }}
              onClick={() => update({ cantPhoto: !state.cantPhoto })}
            >
              {state.cantPhoto && <span className="text-[#1A1612] text-xs leading-none">✓</span>}
            </div>
            <span className="text-sm leading-snug" style={{ color: "#EDE5DC", fontFamily: "Newsreader" }}>
              La condición existe pero no tiene imagen directa: no es un objeto ni una escena.
            </span>
          </label>
          {tooConcreteBlock && (
            <p className="text-xs mt-2 px-3 py-2" style={{ color: "#B8650A", border: "1px solid #B8650A" }}>
              Todavía es muy concreto: sube un peldaño más.
            </p>
          )}
          <Hint>ej. "pliegue" no tiene foto; "papel doblado" sí. Eso es demasiado concreto.</Hint>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#4A4038" }}>
            La regla del mundo
          </label>
          <div
            style={{ border: "1px solid #4A4038" }}
            className="focus-within:outline focus-within:outline-1 focus-within:outline-[#B8650A]"
          >
            <div
              className="px-3 py-2 text-xs"
              style={{
                fontFamily: "IBM Plex Mono",
                color: "#6B6058",
                borderBottom: "1px solid #3D3530",
                userSelect: "none",
              }}
            >
              En este mundo, todo —
            </div>
            <textarea
              className="w-full bg-transparent px-3 py-2.5 text-[#EDE5DC] outline-none resize-none"
              rows={2}
              value={state.rule}
              onChange={(e) => update({ rule: e.target.value })}
              placeholder="completa la regla..."
            />
          </div>
          <Hint>ej. "es la versión de prueba de otra cosa que nunca llega"</Hint>
        </div>
      </div>

      <AdvanceButton label="Saltar →" enabled={canProceed} onClick={() => update({ phase: 2 })} />
    </div>
  );
}

// ─── Phase 3: SALTAR ─────────────────────────────────────────────────────────

function Phase3({ state, update }: { state: State; update: (s: Partial<State>) => void }) {
  const drawRiver = () => {
    const r = pick(RIVERS, state.river || undefined);
    update({ river: r, riverUsed: state.river !== "" });
  };

  const canProceed = !!state.river;

  return (
    <div>
      <PhaseHeading>
        Saca un río al azar. El cruce con tu madre es el territorio.
      </PhaseHeading>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div style={{ border: "1px solid #B8650A", padding: "10px 12px" }}>
            <span className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: "#B8650A" }}>madre</span>
            <p className="text-sm" style={{ fontFamily: "Newsreader", color: "#EDE5DC" }}>{state.mother}</p>
          </div>
          <div
            className="flex flex-col items-center justify-center"
            style={{ border: "1px solid #3D3530", padding: "10px 12px" }}
          >
            <span className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: "#4A4038" }}>río</span>
            {state.river
              ? <p className="text-sm" style={{ fontFamily: "Newsreader", color: "#B8650A" }}>{state.river}</p>
              : <span style={{ color: "#3D3530" }}>?</span>
            }
          </div>
        </div>

        {state.river && (
          <div className="text-center py-4" style={{ border: "1px solid #EDE5DC" }}>
            <span className="text-[10px] uppercase tracking-widest block mb-2" style={{ color: "#4A4038" }}>el cruce</span>
            <p style={{ fontFamily: "Newsreader", fontSize: "1.2rem" }}>
              <span style={{ color: "#B8650A" }}>{state.mother}</span>
              <span style={{ color: "#6B6058", margin: "0 10px" }}>×</span>
              <span style={{ color: "#B8650A" }}>{state.river}</span>
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="flex-1 py-3 text-xs uppercase tracking-widest transition-colors"
            style={{
              border: "1px solid #B8650A",
              color: "#1A1612",
              background: "#B8650A",
              opacity: state.riverUsed ? 0.4 : 1,
              cursor: state.riverUsed ? "not-allowed" : "pointer",
            }}
            onClick={drawRiver}
            disabled={state.riverUsed}
          >
            {state.river ? "nuevo río" : "saca un río"}
          </button>
          {state.river && !state.riverUsed && (
            <button
              className="px-5 py-3 text-xs uppercase tracking-widest transition-colors"
              style={{ border: "1px solid #4A4038", color: "#6B6058" }}
              onClick={drawRiver}
            >
              otra vez
            </button>
          )}
        </div>

        {state.riverUsed && (
          <p className="text-[11px]" style={{ color: "#4A4038" }}>solo puedes volver a sacar una vez</p>
        )}
      </div>

      <AdvanceButton label="Construir →" enabled={canProceed} onClick={() => update({ phase: 3 })} />
    </div>
  );
}

// ─── Phase 4: CONSTRUIR ──────────────────────────────────────────────────────

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

  const canProceed = !!(
    state.projectName &&
    state.userFlipped &&
    state.scaleFlipped &&
    state.wildcardFlipped &&
    state.objName &&
    state.objUser &&
    state.objPieces
  );

  return (
    <div>
      <PhaseHeading>
        Nombra el proyecto. Voltea las tres cartas. Completa la ficha del objeto.
      </PhaseHeading>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: "#4A4038" }}>
            Nombre del proyecto musical
          </label>
          <p className="text-[11px] mb-2" style={{ color: "#4A4038" }}>nómbralo a partir de la regla, no del verbo</p>
          <input
            className="w-full border border-[#4A4038] bg-transparent px-3 py-2.5 text-[#EDE5DC] outline-none focus:border-[#B8650A]"
            value={state.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
            placeholder="nombre del proyecto..."
          />
        </div>

        {/* Cards — 2 col on mobile, 3 col on wider */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FlipCard label="Usuario" value={state.userCard} flipped={state.userFlipped} onFlip={() => update({ userFlipped: true })} />
          <FlipCard label="Escala" value={state.scaleCard} flipped={state.scaleFlipped} onFlip={() => update({ scaleFlipped: true })} />
          <div className="col-span-2 sm:col-span-1">
            <FlipCard label="Comodín" value={state.wildcardCard} flipped={state.wildcardFlipped} onFlip={() => update({ wildcardFlipped: true })} />
          </div>
        </div>

        <div className="space-y-4 pt-2" style={{ borderTop: "1px solid #3D3530" }}>
          <p className="text-[10px] uppercase tracking-widest pt-2" style={{ color: "#4A4038" }}>Ficha del objeto</p>

          {[
            { label: "Nombre del objeto", key: "objName", ph: "¿cómo se llama?", rows: 1 },
            { label: "Usuario y qué hace con él", key: "objUser", ph: "¿quién lo usa y cómo?", rows: 2 },
            { label: "Relaciones con otros objetos", key: "objRelations", ph: "¿con qué convive?", rows: 2 },
            { label: "Tres piezas que lo componen", key: "objPieces", ph: "lista tres piezas...", rows: 2 },
          ].map(({ label, key, ph, rows }) => (
            <div key={key}>
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "#4A4038" }}>{label}</label>
              <textarea
                className="w-full border border-[#4A4038] bg-transparent px-3 py-2.5 text-[#EDE5DC] outline-none focus:border-[#B8650A] resize-none"
                rows={rows}
                value={(state as any)[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                placeholder={ph}
              />
            </div>
          ))}
        </div>
      </div>

      <AdvanceButton label="Probar →" enabled={canProceed} onClick={() => update({ phase: 4 })} />
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
      alert("No se pudo generar la imagen.");
    }
  };

  return (
    <div>
      <PhaseHeading>
        Revisa si el mundo tiene forma propia.
      </PhaseHeading>

      <div className="space-y-6">
        {/* Ficha */}
        <div ref={cardRef} className="p-5 space-y-3 bg-[#1A1612]" style={{ border: "1px solid #EDE5DC" }}>
          <p className="text-[10px] uppercase tracking-widest pb-2 mb-1" style={{ color: "#4A4038", borderBottom: "1px solid #3D3530" }}>
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
              <span className="text-[10px] uppercase tracking-widest pt-0.5" style={{ color: "#4A4038" }}>{label}</span>
              <span style={{ fontFamily: "Newsreader", fontSize: "0.95rem", color: "#EDE5DC" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Rúbrica */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#4A4038" }}>Rúbrica</p>
          {RUBRIC.map((q, i) => (
            <div key={i} className="p-4" style={{ border: "1px solid #3D3530" }}>
              <p className="text-sm mb-3 leading-snug" style={{ fontFamily: "Newsreader", color: "#EDE5DC" }}>{q}</p>
              <div className="flex gap-3">
                {[true, false].map((val) => {
                  const active = state.answers[i] === val;
                  return (
                    <button
                      key={String(val)}
                      className="px-5 py-2 text-xs uppercase tracking-widest transition-colors"
                      style={{
                        border: "1px solid",
                        borderColor: active ? "#B8650A" : "#4A4038",
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
            className="px-5 py-5 text-center"
            style={{ border: `2px solid ${result.label === "Salto" ? "#B8650A" : "#EDE5DC"}` }}
          >
            <p
              className="text-3xl tracking-widest uppercase mb-2"
              style={{
                fontFamily: "IBM Plex Mono",
                color: result.label === "Salto" ? "#B8650A" : "#EDE5DC",
              }}
            >
              {result.label}
            </p>
            <p className="text-sm leading-relaxed" style={{ fontFamily: "Newsreader", color: "#6B6058" }}>
              {result.note}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            className="w-full py-3.5 text-xs uppercase tracking-widest transition-colors"
            style={{ border: "1px solid #4A4038", color: "#EDE5DC" }}
            onClick={downloadCard}
          >
            Descargar ficha como imagen
          </button>
          <button
            className="w-full py-3.5 text-xs uppercase tracking-widest transition-colors"
            style={{ border: "1px solid #B8650A", color: "#B8650A" }}
            onClick={() => onRestart(state.objName)}
          >
            Volver a leer desde este objeto
          </button>
        </div>
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
    const fresh: State = { ...INITIAL_STATE, verbs: seed ? [seed] : [] };
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
      <div className="grid-paper" />

      <div className="relative z-10 min-h-screen flex flex-col items-center py-8 px-4">
        <div
          className="w-full flex flex-col"
          style={{
            maxWidth: 520,
            minHeight: "calc(100vh - 64px)",
            border: "1px solid #3D3530",
            background: "#1A1612",
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: "1px solid #3D3530" }}>
            <div className="flex items-baseline justify-between px-5 py-4">
              <h1
                className="tracking-[0.25em] uppercase"
                style={{ fontFamily: "IBM Plex Mono", color: "#EDE5DC", fontSize: "0.75rem" }}
              >
                Umbral
              </h1>
              <span className="text-[10px] tracking-widest" style={{ color: "#4A4038" }}>
                construcción de mundos
              </span>
            </div>
            <ProgressBar phase={state.phase} />
          </div>

          {/* Margin + content */}
          <div className="flex flex-1">
            <div style={{ width: 3, background: "#B8650A", flexShrink: 0, opacity: 0.5 }} />
            <div className="flex-1 px-6 py-7">
              <FadePhase phase={state.phase}>
                {renderPhase()}
              </FadePhase>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
