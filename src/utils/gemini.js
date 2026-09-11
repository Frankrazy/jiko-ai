const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function getRecipes(selectedIngredients, budget) {
  if (!API_KEY) throw new Error("Missing OpenRouter API Key in environment variables!");

  // 1. Fetch current local market prices
  const priceRes = await fetch("/prices.json");
  const priceData = await priceRes.json();

  // 2. Build prompt
  const prompt = `You are Jiko AI, a Kenyan home cooking expert.

User has in fridge: ${selectedIngredients.join(", ")}
User extra budget: KES ${budget}
Current market prices: ${JSON.stringify(priceData.prices)}

TASK: Suggest 5 Kenyan recipes.
Status rules:
- "MAKE_NOW" if user has everything (extraCost: 0)
- "ALMOST" if missing ingredients cost <= KES ${budget}
- "OVER" if missing ingredients cost > KES ${budget}

Return ONLY a valid JSON array of 5 objects with keys:
"name", "status", "extraCost", "toBuy" (array of {item, qty, cost}), "servings", "time", "ingredients", "steps".`;

  // 3. Try primary FREE model: Llama 3.3 70B Free
  try {
    return await callOpenRouter("meta-llama/llama-3.3-70b-instruct:free", prompt);
  } catch (err) {
    console.warn("Primary free model failed, trying fallback model...", err);
    // 4. Fallback to Mistral 7B Free if primary is busy
    return await callOpenRouter("mistralai/mistral-7b-instruct:free", prompt);
  }
}

async function callOpenRouter(modelName, prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jiko-ai.netlify.app",
      "X-Title": "Jiko AI"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: "You are a JSON generator. Respond ONLY with a valid raw JSON array. Do not include markdown tags like ```json or any introductory text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || `Error calling ${modelName}`);
  }

  let text = data.choices[0].message.content.trim();

  // Clean JSON response
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  return JSON.parse(text);
}