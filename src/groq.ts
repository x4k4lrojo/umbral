export interface GeneratedDecks {
  rivers: string[];
  users: string[];
  scales: string[];
  wildcards: string[];
}

const GROQ_URL = "https://api.groq.com/openai/v1";

async function getModel(key: string): Promise<string> {
  try {
    const res = await fetch(`${GROQ_URL}/models`, {
      headers: { "Authorization": `Bearer ${key}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const models: string[] = (data.data ?? []).map((m: { id: string }) => m.id);
    // Prefer capable chat models in order
    const preferred = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768"];
    for (const id of preferred) {
      if (models.includes(id)) return id;
    }
    // Fall back to first available text model
    const fallback = models.find(id => id.includes("llama") || id.includes("mixtral"));
    return fallback ?? models[0] ?? "llama-3.3-70b-versatile";
  } catch {
    return "llama-3.3-70b-versatile";
  }
}

export async function generateDecks(
  verb: string,
  noun: string,
  mother: string,
  rule: string
): Promise<GeneratedDecks> {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error("Sin clave de API (VITE_GROQ_API_KEY)");

  const model = await getModel(key);

  const prompt = `Eres asistente de un ejercicio de construcción de mundos sonoros para músicos latinoamericanos.

El usuario tiene este mundo:
- Verbo: "${verb}"
- Sustantivo: "${noun}"
- Condición madre: "${mother}"
- Regla: "En este mundo, todo ${rule}"

Genera opciones MUY específicas para ESTE mundo. Sin palabras genéricas.

Devuelve SOLO JSON válido sin texto adicional:
{"rivers":["r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","r14"],"users":["u1","u2","u3","u4","u5","u6"],"scales":["s1","s2","s3","s4","s5"],"wildcards":["w1","w2","w3","w4"]}

- rivers: 14 sustantivos concretos-abstractos (como: herrumbre, eco, pulso, quiebre) que al cruzar con "${mother}" generen territorio artístico inesperado
- users: 6 personas concretas con artículo que tendrían una relación real con "${noun}" ("la enfermera de guardia", "un cargador de mercado")
- scales: 5 restricciones de existencia específicas para este mundo
- wildcards: 4 propiedades inesperadas que sorprendan dado que el mundo trata de "${rule}"`;

  const res = await fetch(`${GROQ_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return parseDecks(data.choices?.[0]?.message?.content ?? "");
}

function parseDecks(text: string): GeneratedDecks {
  const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Sin JSON: ${text.slice(0, 100)}`);
  return JSON.parse(match[0]) as GeneratedDecks;
}
