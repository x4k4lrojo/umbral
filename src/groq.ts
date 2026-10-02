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
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) throw new Error("VITE_GROQ_API_KEY no está configurada");

  const prompt = `Eres asistente de un ejercicio de construcción de mundos sonoros para músicos y artistas latinoamericanos.

El usuario tiene este mundo en construcción:
- Verbo de origen: "${verb}"
- Sustantivo: "${noun}"
- Condición madre: "${mother}"
- Regla del mundo: "En este mundo, todo ${rule}"

Genera opciones para continuar el ejercicio. Deben ser MUY específicas, tensas e inesperadas para ESTE mundo concreto — no genéricas. Deben tener fricción real con "${mother}".

Devuelve SOLO un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código:
{"rivers":["concepto1","concepto2","concepto3","concepto4","concepto5","concepto6","concepto7","concepto8","concepto9","concepto10","concepto11","concepto12","concepto13","concepto14"],"users":["usuario1","usuario2","usuario3","usuario4","usuario5","usuario6"],"scales":["restricción1","restricción2","restricción3","restricción4","restricción5"],"wildcards":["comodín1","comodín2","comodín3","comodín4"]}

Reglas de contenido:
- rivers: 14 sustantivos simples que al cruzarse con "${mother}" generen un territorio artístico inesperado y específico para este mundo
- users: 6 personas muy concretas con artículo (ej: "la enfermera del turno de noche", "un cargador de mercado")
- scales: 5 restricciones de existencia únicas para objetos de este mundo
- wildcards: 4 propiedades inesperadas que los objetos de este mundo podrían tener`;

  // Use local Vite proxy to avoid CORS — proxy injects the Authorization header
  const response = await fetch("/api/groq/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";

  // Extract JSON — strip markdown fences if present
  const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in response: ${text.slice(0, 200)}`);

  return JSON.parse(match[0]) as GeneratedDecks;
}
