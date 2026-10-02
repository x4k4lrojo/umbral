export interface GeneratedDecks {
  rivers: string[];
  users: string[];
  scales: string[];
  wildcards: string[];
}

export async function generateDecks(
  verb: string,
  noun: string,
  mother: string,
  rule: string
): Promise<GeneratedDecks> {
  const prompt = `Eres asistente de un ejercicio de construcción de mundos sonoros para músicos latinoamericanos.

El usuario tiene este mundo:
- Verbo: "${verb}"
- Sustantivo: "${noun}"
- Condición madre: "${mother}"
- Regla: "En este mundo, todo ${rule}"

Genera opciones MUY específicas para ESTE mundo. Sin palabras genéricas.

Devuelve SOLO JSON válido sin texto adicional:
{"rivers":["r1","r2","r3","r4","r5","r6","r7","r8","r9","r10","r11","r12","r13","r14"],"users":["u1","u2","u3","u4","u5","u6"],"scales":["s1","s2","s3","s4","s5"],"wildcards":["w1","w2","w3","w4"]}

- rivers: 14 sustantivos que al cruzar con "${mother}" generen territorio artístico inesperado
- users: 6 personas concretas con artículo ("la enfermera de guardia", "un cargador de mercado")
- scales: 5 restricciones de existencia para objetos de este mundo
- wildcards: 4 propiedades inesperadas de los objetos de este mundo`;

  const body = JSON.stringify({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 800,
  });

  // In production (Netlify), use the serverless function proxy
  // In dev, try the Vite middleware proxy
  const endpoint = "/.netlify/functions/groq";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
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
