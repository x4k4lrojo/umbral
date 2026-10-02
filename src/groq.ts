import Groq from "groq-sdk";

export interface GeneratedDecks {
  rivers: string[];
  users: string[];
  scales: string[];
  wildcards: string[];
}

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function generateDecks(
  verb: string,
  noun: string,
  mother: string,
  rule: string
): Promise<GeneratedDecks> {
  const prompt = `Eres asistente de un ejercicio de construcción de mundos sonoros para músicos y artistas latinoamericanos.

El usuario tiene este mundo en construcción:
- Verbo de origen: "${verb}"
- Sustantivo: "${noun}"
- Condición madre: "${mother}"
- Regla del mundo: "En este mundo, todo ${rule}"

Genera opciones para continuar el ejercicio. Deben ser específicas, tensas e inesperadas — no genéricas. Deben tener fricción real con la condición madre.

Devuelve SOLO un objeto JSON válido con esta estructura exacta, sin texto adicional:
{
  "rivers": ["concepto1", "concepto2", "concepto3", "concepto4", "concepto5", "concepto6", "concepto7", "concepto8", "concepto9", "concepto10", "concepto11", "concepto12", "concepto13", "concepto14"],
  "users": ["usuario1", "usuario2", "usuario3", "usuario4", "usuario5", "usuario6"],
  "scales": ["restricción1", "restricción2", "restricción3", "restricción4", "restricción5"],
  "wildcards": ["comodín1", "comodín2", "comodín3", "comodín4"]
}

Reglas:
- rivers: 14 palabras o frases cortas (sustantivos simples) que al cruzarse con "${mother}" generen un territorio artístico fértil e inesperado
- users: 6 personas concretas y específicas que podrían usar objetos de este mundo (con artículo: "un taxista de noche", "la persona que limpia el metro")
- scales: 5 restricciones de existencia para los objetos de este mundo (cómo se consiguen, cuántos existen, dónde viven)
- wildcards: 4 propiedades inesperadas que los objetos de este mundo podrían tener`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.85,
    max_tokens: 800,
  });

  const text = response.choices[0]?.message?.content ?? "";

  // Extract JSON from response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");

  const data = JSON.parse(match[0]) as GeneratedDecks;
  return data;
}
